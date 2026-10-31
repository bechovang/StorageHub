package com.storagehub.service;

import com.storagehub.dto.contract.ContractAddendumResponse;
import com.storagehub.dto.contract.ContractAddendumSignRequest;
import com.storagehub.dto.contract.ContractChainItemResponse;
import com.storagehub.dto.contract.ContractChainResponse;
import com.storagehub.dto.contract.ContractDetailResponse;
import com.storagehub.dto.quote.QuoteResponse;
import com.storagehub.exception.ContractAddendumInvalidStateException;
import com.storagehub.exception.ContractAddendumNotFoundException;
import com.storagehub.entity.Contract;
import com.storagehub.entity.ContractAddendum;
import com.storagehub.entity.Extension;
import com.storagehub.entity.RentalPolicy;
import com.storagehub.entity.Reservation;
import com.storagehub.entity.Role;
import com.storagehub.entity.Unit;
import com.storagehub.entity.User;
import com.storagehub.exception.ContractNotFoundException;
import com.storagehub.exception.InvalidCredentialsException;
import com.storagehub.exception.ReservationNotFoundException;
import com.storagehub.repository.ContractAddendumRepository;
import com.storagehub.repository.ContractRepository;
import com.storagehub.repository.RentalPolicyRepository;
import com.storagehub.repository.ReservationRepository;
import com.storagehub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * Service quản lý hợp đồng (Contract) theo AD-6.
 * Độc quyền sinh hợp đồng tự động khi Deposit thành công (FR-10),
 * duy trì chuỗi hợp đồng và cơ chế Superseded khi re-draft (FR-13).
 * Toàn bộ hợp đồng là read-only.
 */
@Service
@RequiredArgsConstructor
public class ContractService {

    private final ContractRepository contractRepository;
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final RentalPolicyRepository rentalPolicyRepository;
    private final PricingEngine pricingEngine;
    private final LogService logService;
    private final ContractAddendumRepository contractAddendumRepository;

    private static final ZoneId ICT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    /**
     * Auto-draft contract (FR-10): Sinh tự động khi Deposit thành công.
     * Khóa phiên bản policy đang hoạt động, snapshot toàn bộ điều khoản.
     * Nếu đã có bản hợp đồng trước đó, bản cũ chuyển thành SUPERSEDED (FR-13).
     */
    @Transactional
    public Contract autoDraftContract(Reservation reservation) {
        RentalPolicy activePolicy = rentalPolicyRepository.findByStatus(1)
                .orElseThrow(() -> new IllegalStateException("Hệ thống chưa có chính sách giá hiệu lực"));

        Unit unit = reservation.getUnit();
        LocalDate startDate = reservation.getStartDate();
        LocalDate endDate = reservation.getEndDate();

        int durationDays = (int) ChronoUnit.DAYS.between(startDate, endDate) + 1;
        if (durationDays < 1) {
            durationDays = 1;
        }

        QuoteResponse quote = pricingEngine.calculateQuote(unit, startDate, endDate);
        String code = generateContractCode();

        String contentSnapshot = buildContractContentSnapshot(
                code,
                reservation,
                unit,
                activePolicy.getVersion(),
                startDate,
                endDate,
                durationDays,
                quote
        );

        // Kiểm tra xem đã có bản contract nào đang là latest của reservation này không
        Optional<Contract> existingLatestOpt = contractRepository.findByReservation_ReservationIdAndIsLatestTrue(reservation.getReservationId());
        Contract previousContract = null;

        if (existingLatestOpt.isPresent()) {
            previousContract = existingLatestOpt.get();
            previousContract.setStatus(Contract.Status.SUPERSEDED);
            previousContract.setIsLatest(false);
            contractRepository.save(previousContract);
        }

        Contract newContract = new Contract();
        newContract.setCode(code);
        newContract.setReservation(reservation);
        newContract.setPolicy(activePolicy);
        newContract.setContentSnapshot(contentSnapshot);
        newContract.setStatus(Contract.Status.DRAFT);
        newContract.setIsLatest(true);
        if (previousContract != null) {
            newContract.setSupersedes(previousContract);
        }

        return contractRepository.save(newContract);
    }

    /**
     * US-10 (FR-36): no-show — đóng hợp đồng của reservation hết hạn.
     * Chỉ đóng bản isLatest đang DRAFT/PRINTED; trả contract đã đóng
     * hoặc null nếu không có bản nào cần xử lý.
     */
    @Transactional
    public Contract closeForNoShow(User actor, Reservation reservation) {
        Contract latest = contractRepository
                .findByReservation_ReservationIdAndIsLatestTrue(reservation.getReservationId())
                .orElse(null);
        if (latest == null
                || (latest.getStatus() != Contract.Status.DRAFT
                    && latest.getStatus() != Contract.Status.PRINTED)) {
            return null;
        }
        Contract.Status from = latest.getStatus();
        latest.setStatus(Contract.Status.CLOSED);
        contractRepository.save(latest);
        logService.log(actor, "CONTRACT", latest.getContractId(),
                "STATUS_CHANGED", from.name(), "CLOSED",
                "No-show expiry — " + reservation.getCode());
        return latest;
    }

    /**
     * US-15 (FR-11): staff chụp ảnh bản ký tại quầy và đính kèm — bản isLatest
     * DRAFT/PRINTED → SIGNED. Action CONTRACT_SIGNED theo FR-11; đây là điều
     * kiện để cấp Access Code (nút trao code vô hiệu đến khi có ảnh ký).
     */
    @Transactional
    public Contract signContractAtCheckIn(User actor, Reservation reservation, String signedPhotoUrl) {
        Contract latest = contractRepository
                .findByReservation_ReservationIdAndIsLatestTrue(reservation.getReservationId())
                .orElseThrow(() -> new IllegalStateException(
                        "Không tìm thấy hợp đồng hiện hành của " + reservation.getCode()));

        if (latest.getStatus() != Contract.Status.DRAFT
                && latest.getStatus() != Contract.Status.PRINTED) {
            throw new IllegalStateException(
                    "Hợp đồng " + latest.getCode() + " ở trạng thái "
                            + latest.getStatus() + " — không thể ký tại quầy.");
        }

        Contract.Status from = latest.getStatus();
        latest.setStatus(Contract.Status.SIGNED);
        latest.setSignedPhotoUrl(signedPhotoUrl);
        contractRepository.save(latest);

        logService.log(actor, "CONTRACT", latest.getContractId(),
                "CONTRACT_SIGNED", from.name(), "SIGNED",
                "Signed photo uploaded at desk — " + reservation.getCode());
        return latest;
    }

    /**
     * Re-draft hợp đồng khi có sai sót ở bản nháp (FR-10).
     * Bản cũ chuyển sang SUPERSEDED, bản mới sinh ra trỏ về bản cũ trong chuỗi (FR-13).
     */
    @Transactional
    public ContractDetailResponse reDraftContract(String email, Long reservationId) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(InvalidCredentialsException::new);

        Reservation reservation = reservationRepository.findWithDetailsById(reservationId)
                .orElseThrow(() -> new ReservationNotFoundException("Reservation not found."));

        boolean isOwner = reservation.getCustomer().getUserId().equals(user.getUserId());
        boolean isStaffOrAdmin = user.getRole().getName() != Role.Name.CUSTOMER;

        if (!isOwner && !isStaffOrAdmin) {
            throw new ReservationNotFoundException("Reservation not found.");
        }

        Contract contract = autoDraftContract(reservation);
        return mapToDetailResponse(contract);
    }

    /**
     * Lấy chuỗi hợp đồng trên Rental Detail (FR-13) — gốc + phụ lục + bản superseded.
     */
    @Transactional(readOnly = true)
    public List<ContractChainItemResponse> listContractsByReservation(String email, Long reservationId) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(InvalidCredentialsException::new);

        Reservation reservation = reservationRepository.findWithDetailsById(reservationId)
                .orElseThrow(() -> new ReservationNotFoundException("Reservation not found."));

        boolean isOwner = reservation.getCustomer().getUserId().equals(user.getUserId());
        boolean isStaffOrAdmin = user.getRole().getName() != Role.Name.CUSTOMER;

        if (!isOwner && !isStaffOrAdmin) {
            throw new ReservationNotFoundException("Reservation not found.");
        }

        List<Contract> contracts = contractRepository.findByReservation_ReservationIdOrderByCreatedAtAsc(reservationId);
        List<ContractChainItemResponse> chain = new java.util.ArrayList<>(contracts.stream()
                .map(this::mapToChainItem)
                .toList());

        if (contractAddendumRepository != null) {
            List<ContractAddendum> addendums = contractAddendumRepository.findByContract_Reservation_ReservationIdOrderByCreatedAtAsc(reservationId);
            for (ContractAddendum a : addendums) {
                chain.add(new ContractChainItemResponse(
                        a.getAddendumId(),
                        a.getCode(),
                        "ADDENDUM",
                        a.getStatus() != null ? a.getStatus().name() : "AWAITING_SIGNATURE",
                        false,
                        a.getSignedPhotoUrl(),
                        a.getSignatureDueDate()
                ));
            }
        }

        return chain;
    }

    /**
     * Lấy chi tiết 1 bản hợp đồng — contentSnapshot để FE render print view (FR-11).
     */
    @Transactional(readOnly = true)
    public ContractDetailResponse getContract(String email, Long contractId) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(InvalidCredentialsException::new);

        Contract contract = contractRepository.findWithDetailsById(contractId)
                .orElseThrow(() -> new ContractNotFoundException("Không tìm thấy hợp đồng này."));

        boolean isOwner = contract.getReservation().getCustomer().getUserId().equals(user.getUserId());
        boolean isStaffOrAdmin = user.getRole().getName() != Role.Name.CUSTOMER;

        if (!isOwner && !isStaffOrAdmin) {
            throw new ContractNotFoundException("Không tìm thấy hợp đồng này.");
        }

        return mapToDetailResponse(contract);
    }

    private ContractChainItemResponse mapToChainItem(Contract contract) {
        return new ContractChainItemResponse(
                contract.getContractId(),
                contract.getCode(),
                "ORIGINAL",
                contract.getStatus().name(),
                Boolean.TRUE.equals(contract.getIsLatest()),
                contract.getSignedPhotoUrl(),
                null
        );
    }

    private ContractDetailResponse mapToDetailResponse(Contract contract) {
        return new ContractDetailResponse(
                contract.getContractId(),
                contract.getCode(),
                "ORIGINAL",
                contract.getStatus().name(),
                Boolean.TRUE.equals(contract.getIsLatest()),
                contract.getSignedPhotoUrl(),
                null,
                contract.getReservation().getReservationId(),
                contract.getPolicy() != null ? contract.getPolicy().getVersion() : "v3",
                contract.getContentSnapshot(),
                contract.getCreatedAt()
        );
    }

    private synchronized String generateContractCode() {
        int year = LocalDate.now(ICT_ZONE).getYear();
        long count = contractRepository.count() + 1;
        String code = String.format("CT-%d-%04d", year, count);
        while (contractRepository.existsByCode(code)) {
            count++;
            code = String.format("CT-%d-%04d", year, count);
        }
        return code;
    }

    private String buildContractContentSnapshot(
            String contractCode,
            Reservation reservation,
            Unit unit,
            String policyVersion,
            LocalDate startDate,
            LocalDate endDate,
            int durationDays,
            QuoteResponse quote
    ) {
        String facilityName = (unit.getZone() != null && unit.getZone().getFacility() != null)
                ? unit.getZone().getFacility().getName()
                : "Tân Bình Depot";
        String zoneCode = (unit.getZone() != null) ? unit.getZone().getCode() : "A";
        String customerName = reservation.getCustomer() != null ? reservation.getCustomer().getFullName() : "N/A";
        String customerPhone = (reservation.getCustomer() != null && reservation.getCustomer().getPhone() != null)
                ? reservation.getCustomer().getPhone()
                : "N/A";
        String customerEmail = reservation.getCustomer() != null ? reservation.getCustomer().getEmail() : "N/A";

        long dailyRent = quote.totalRent() / durationDays;
        String formattedDailyRent = String.format(Locale.GERMANY, "%,d ₫", dailyRent);
        String formattedTotalRent = String.format(Locale.GERMANY, "%,d ₫", quote.totalRent());
        String formattedDeposit = String.format(Locale.GERMANY, "%,d ₫", quote.depositAmount());

        return String.format("""
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                Độc lập - Tự do - Hạnh phúc
                ---
                HỢP ĐỒNG THUÊ KHO LƯU TRỮ TỰ QUẢN (STORAGEHUB)
                Số: %s
                Mã tham chiếu đặt chỗ: %s
                Phiên bản chính sách giá: %s
                Ngày lập: %s

                BÊN CHO THUÊ (BÊN A): CÔNG TY CỔ PHẦN LOGISTICS STORAGEHUB
                - Cơ sở vận hành: %s
                - Phân khu: Khu %s - Tầng %d
                - Hotline hỗ trợ kỹ thuật: 1900 6868
                - Email tiếp nhận yêu cầu: support@storagehub.vn

                BÊN THUÊ (BÊN B):
                - Họ và tên khách hàng: %s
                - Số điện thoại đăng ký: %s
                - Địa chỉ thư điện tử: %s

                ĐIỀU 1. ĐỐI TƯỢNG HỢP ĐỒNG
                1. Bên A đồng ý cho Bên B thuê đơn vị kho lưu trữ tự quản mã số: %s.
                2. Loại kho: %s, Diện tích tiêu chuẩn: %.1f m².
                3. Phương thức mở cửa & an ninh: %s (Kiểm soát kỹ thuật số 24/7).

                ĐIỀU 2. THỜI HẠN THUÊ
                1. Thời hạn thuê: %d ngày cam kết.
                2. Ngày bắt đầu hiệu lực (Check-in): %s.
                3. Ngày kết thúc hợp đồng dự kiến: %s.

                ĐIỀU 3. GIÁ CẢ VÀ QUY ĐỊNH THANH TOÁN
                1. Đơn giá thuê ngày: %s / ngày.
                2. Tổng giá trị hợp đồng thuê: %s (Thanh toán 100%% tại quầy lúc làm thủ tục Check-in).
                3. Tiền đặt cọc bảo đảm (10%%): %s (Đã thanh toán lúc đặt chỗ, có hoàn lại 100%% khi thanh lý hợp đồng nếu kho nguyên vẹn).

                ĐIỀU 4. TRÁCH NHIỆM VẬN HÀNH VÀ BÀN GIAO
                1. Khách hàng xuất trình mã Check-in Pass và giấy tờ tùy thân hợp lệ tại quầy depot để nhận kho.
                2. Sau khi ký xác nhận bản hợp đồng in ra tại quầy, nhân viên Bên A sẽ cấp mã PIN số hóa để truy cập kho.
                3. Nghiêm cấm lưu trữ chất nguy hại, chất nổ, vũ khí hoặc hàng cấm theo quy định pháp luật hiện hành.
                4. Hợp đồng này được sinh tự động và lưu trữ bất biến (read-only), làm căn cứ pháp lý duy nhất giữa hai bên.

                ĐẠI DIỆN BÊN A                                   ĐẠI DIỆN BÊN B
                (Ký, đóng dấu và ghi rõ họ tên)                  (Ký và ghi rõ họ tên)
                """,
                contractCode,
                reservation.getCode(),
                policyVersion,
                LocalDate.now(ICT_ZONE),
                facilityName,
                zoneCode,
                unit.getFloor() != null ? unit.getFloor() : 1,
                customerName,
                customerPhone,
                customerEmail,
                unit.getCode(),
                unit.getType() != null ? unit.getType().getName() : "Standard",
                unit.getSizeM2() != null ? unit.getSizeM2().doubleValue() : 5.0,
                unit.getAccessType() != null ? unit.getAccessType() : "PIN 24/7",
                durationDays,
                startDate,
                endDate,
                formattedDailyRent,
                formattedTotalRent,
                formattedDeposit
        );
    }

    /**
     * US-18 (FR-12): phí gia hạn đã trả → sinh ngay addendum giấy CT-...-A{n}
     * AWAITING_SIGNATURE, hẹn ký tại quầy 7 ngày. contentSnapshot bám shape seed
     * demo (change/extension_fee/deposit_topup/deposit_held/policy) — bản in tại
     * quầy US-19 đọc từ đây. Addendum không đụng is_latest của contract gốc.
     */
    @Transactional
    public ContractAddendum createAddendumForExtension(
            User actor,
            Reservation reservation,
            Extension extension,
            long depositTopUp,
            long newDepositHeld
    ) {
        Contract contract = contractRepository
                .findByReservation_ReservationIdAndIsLatestTrue(reservation.getReservationId())
                .orElseThrow(() -> new IllegalStateException(
                        "Không tìm thấy hợp đồng đang hiệu lực cho " + reservation.getCode()));

        RentalPolicy activePolicy = rentalPolicyRepository.findByStatus(1)
                .orElseThrow(() -> new IllegalStateException("Hệ thống chưa có chính sách giá hiệu lực"));

        long sequence = contractAddendumRepository
                .countByContract_ContractId(contract.getContractId()) + 1;
        String addendumCode = contract.getCode() + "-A" + sequence;

        String snapshot = String.format(Locale.ROOT,
                "{\"change\":\"extend %s -> %s\",\"extension_fee\":%d,"
                        + "\"deposit_topup\":%d,\"deposit_held\":%d,\"policy\":\"%s\"}",
                extension.getOldEndDate(),
                extension.getNewEndDate(),
                extension.getExtensionFee().longValueExact(),
                depositTopUp,
                newDepositHeld,
                activePolicy.getVersion()
        );

        ContractAddendum addendum = new ContractAddendum();
        addendum.setContract(contract);
        addendum.setExtension(extension);
        addendum.setCode(addendumCode);
        addendum.setContentSnapshot(snapshot);
        addendum.setSignatureDueDate(LocalDate.now(ICT_ZONE).plusDays(7));
        addendum.setStatus(ContractAddendum.Status.AWAITING_SIGNATURE);
        ContractAddendum saved = contractAddendumRepository.save(addendum);

        logService.log(actor, "ADDENDUM", saved.getAddendumId(), "CREATED",
                null, "AWAITING_SIGNATURE",
                "Addendum " + addendumCode + " — hạn ký tại quầy " + saved.getSignatureDueDate());
        return saved;
    }

    /**
     * US-19 (FR-12): Ký phụ lục hợp đồng tại quầy (Snap-back photo ritual).
     * - signedPhotoUrl là bắt buộc (400 nếu thiếu).
     * - Hạn ký là 7 ngày: nếu hôm nay > signatureDueDate -> chuyển EXPIRED (409).
     * - Status phải là AWAITING_SIGNATURE -> chuyển SIGNED (409 nếu đã ký/hủy).
     */
    @Transactional
    public ContractAddendumResponse signAddendum(
            String email,
            Long addendumId,
            ContractAddendumSignRequest request
    ) {
        User actor = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(InvalidCredentialsException::new);

        if (request == null || request.signedPhotoUrl() == null || request.signedPhotoUrl().isBlank()) {
            throw new IllegalArgumentException("Ảnh chụp bản ký phụ lục (signedPhotoUrl) là bắt buộc.");
        }

        ContractAddendum addendum = contractAddendumRepository.findById(addendumId)
                .orElseThrow(() -> new ContractAddendumNotFoundException(
                        "Không tìm thấy phụ lục hợp đồng #" + addendumId));

        if (addendum.getStatus() == ContractAddendum.Status.SIGNED) {
            throw new ContractAddendumInvalidStateException(
                    "Phụ lục " + addendum.getCode() + " đã được ký trước đó.");
        }
        if (addendum.getStatus() == ContractAddendum.Status.VOIDED) {
            throw new ContractAddendumInvalidStateException(
                    "Phụ lục " + addendum.getCode() + " đã bị hủy (VOIDED).");
        }
        if (addendum.getStatus() == ContractAddendum.Status.EXPIRED) {
            throw new ContractAddendumInvalidStateException(
                    "Phụ lục " + addendum.getCode() + " đã quá hạn ký 7 ngày (EXPIRED).");
        }

        // Kiểm tra thời hạn 7 ngày
        LocalDate today = LocalDate.now(ICT_ZONE);
        if (addendum.getSignatureDueDate() != null && today.isAfter(addendum.getSignatureDueDate())) {
            addendum.setStatus(ContractAddendum.Status.EXPIRED);
            contractAddendumRepository.save(addendum);
            logService.log(actor, "CONTRACT_ADDENDUM", addendum.getAddendumId(),
                    "EXPIRED", ContractAddendum.Status.AWAITING_SIGNATURE.name(), "EXPIRED",
                    "Addendum " + addendum.getCode() + " hết hạn ký 7 ngày (" + addendum.getSignatureDueDate() + ")");
            throw new ContractAddendumInvalidStateException(
                    "Phụ lục " + addendum.getCode() + " đã quá hạn ký 7 ngày ("
                            + addendum.getSignatureDueDate() + "). Trạng thái chuyển sang EXPIRED.");
        }

        addendum.setStatus(ContractAddendum.Status.SIGNED);
        addendum.setSignedPhotoUrl(request.signedPhotoUrl());
        ContractAddendum saved = contractAddendumRepository.save(addendum);

        String noteSuffix = request.notes() != null && !request.notes().isBlank()
                ? " — " + request.notes() : "";
        logService.log(actor, "CONTRACT_ADDENDUM", saved.getAddendumId(),
                "ADDENDUM_SIGNED", ContractAddendum.Status.AWAITING_SIGNATURE.name(), "SIGNED",
                "Ký phụ lục tại quầy thành công: " + saved.getCode() + noteSuffix);

        return mapToAddendumResponse(saved);
    }

    /**
     * US-19 (FR-13): Lấy chuỗi hợp đồng gốc + toàn bộ phụ lục theo thứ tự thời gian.
     */
    @Transactional(readOnly = true)
    public ContractChainResponse getContractChain(String email, Long contractId) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(InvalidCredentialsException::new);

        Contract contract = contractRepository.findWithDetailsById(contractId)
                .orElseThrow(() -> new ContractNotFoundException("Không tìm thấy hợp đồng này."));

        boolean isOwner = contract.getReservation().getCustomer().getUserId().equals(user.getUserId());
        boolean isStaffOrAdmin = user.getRole().getName() != Role.Name.CUSTOMER;

        if (!isOwner && !isStaffOrAdmin) {
            throw new ContractNotFoundException("Không tìm thấy hợp đồng này.");
        }

        ContractDetailResponse contractDetail = mapToDetailResponse(contract);
        List<ContractAddendum> addendums = contractAddendumRepository
                .findByContract_ContractIdOrderByCreatedAtAsc(contractId);

        List<ContractAddendumResponse> addendumResponses = addendums.stream()
                .map(this::mapToAddendumResponse)
                .toList();

        return new ContractChainResponse(contractDetail, addendumResponses);
    }

    public ContractAddendumResponse mapToAddendumResponse(ContractAddendum addendum) {
        Long extensionId = addendum.getExtension() != null
                ? addendum.getExtension().getExtensionId() : null;
        return new ContractAddendumResponse(
                addendum.getAddendumId(),
                addendum.getContract().getContractId(),
                extensionId,
                addendum.getCode(),
                addendum.getContentSnapshot(),
                addendum.getSignedPhotoUrl(),
                addendum.getSignatureDueDate(),
                addendum.getStatus() != null ? addendum.getStatus().name() : null,
                addendum.getCreatedAt()
        );
    }
}
