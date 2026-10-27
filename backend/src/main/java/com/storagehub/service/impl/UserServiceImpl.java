package com.storagehub.service.impl;

import com.storagehub.dto.user.*;
import com.storagehub.entity.ActivityLog;
import com.storagehub.entity.Facility;
import com.storagehub.entity.Role;
import com.storagehub.entity.User;
import com.storagehub.exception.EmailAlreadyExistsException;
import com.storagehub.exception.UserNotFoundException;
import com.storagehub.repository.ActivityLogRepository;
import com.storagehub.repository.FacilityRepository;
import com.storagehub.repository.RoleRepository;
import com.storagehub.repository.UserRepository;
import com.storagehub.service.LogService;
import com.storagehub.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class UserServiceImpl implements UserService {

    private static final String UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final String LOWER = "abcdefghijkmnopqrstuvwxyz";
    private static final String DIGITS = "23456789";
    private static final String SYMBOLS = "!@#$%&*";
    private static final String ALL_CHARS = UPPER + LOWER + DIGITS + SYMBOLS;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final FacilityRepository facilityRepository;
    private final PasswordEncoder passwordEncoder;
    private final LogService logService;
    private final ActivityLogRepository activityLogRepository;

    public UserServiceImpl(
            UserRepository userRepository,
            RoleRepository roleRepository,
            FacilityRepository facilityRepository,
            PasswordEncoder passwordEncoder,
            LogService logService,
            ActivityLogRepository activityLogRepository
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.facilityRepository = facilityRepository;
        this.passwordEncoder = passwordEncoder;
        this.logService = logService;
        this.activityLogRepository = activityLogRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserPageResponse listUsers(String query, Role.Name role, Integer status, int page, int pageSize) {
        int pageIndex = Math.max(0, page - 1);
        Pageable pageable = PageRequest.of(pageIndex, pageSize, Sort.by(Sort.Direction.DESC, "userId"));

        Page<User> userPage = userRepository.findUsers(query, role, status, pageable);
        List<UserDetailResponse> items = userPage.getContent().stream()
                .map(UserDetailResponse::from)
                .toList();

        return new UserPageResponse(
                items,
                page,
                pageSize,
                userPage.getTotalElements(),
                userPage.getTotalPages()
        );
    }

    @Override
    @Transactional
    public CreateUserResponse createUser(String actorEmail, CreateUserRequest request) {
        User actor = getActor(actorEmail);

        String normalizedEmail = normalizeEmail(request.email());
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new EmailAlreadyExistsException();
        }

        Role role = roleRepository.findByName(request.role())
                .orElseThrow(() -> new IllegalArgumentException("Vai trò không hợp lệ: " + request.role()));

        Facility facility = null;
        if (request.facilityId() != null) {
            facility = facilityRepository.findById(request.facilityId().intValue())
                    .orElseThrow(() -> new IllegalArgumentException("Cơ sở không tồn tại với ID: " + request.facilityId()));
        }

        String tempPassword = generateTemporaryPassword();

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(normalizedEmail);
        user.setPhone(request.phone() != null ? request.phone().trim() : null);
        user.setPasswordHash(passwordEncoder.encode(tempPassword));
        user.setRole(role);
        user.setFacility(facility);
        user.setStatus(1); // 1 = ACTIVE

        User savedUser = userRepository.save(user);

        logService.log(
                actor,
                "USER",
                savedUser.getUserId(),
                "USER_CREATED",
                null,
                role.getName().name(),
                "Tạo tài khoản người dùng: " + savedUser.getEmail()
        );

        return new CreateUserResponse(UserDetailResponse.from(savedUser), tempPassword);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetailResponse getUserDetail(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy người dùng với ID: " + userId));
        return UserDetailResponse.from(user);
    }

    @Override
    @Transactional
    public UserDetailResponse updateUserStatus(String actorEmail, Long userId, UpdateUserStatusRequest request) {
        User actor = getActor(actorEmail);
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy người dùng với ID: " + userId));

        // Anti-lockout: Admin không được tự deactivate hoặc lock chính mình
        if (actor != null && actor.getUserId().equals(target.getUserId()) && request.status() != 1) {
            throw new IllegalArgumentException("Quản trị viên không được phép tự vô hiệu hóa hoặc khóa tài khoản của chính mình.");
        }

        Integer oldStatus = target.getStatus();
        target.setStatus(request.status());
        User updatedUser = userRepository.save(target);

        logService.log(
                actor,
                "USER",
                updatedUser.getUserId(),
                "STATUS_CHANGED",
                String.valueOf(oldStatus),
                String.valueOf(request.status()),
                request.reason() != null ? request.reason() : "Thay đổi trạng thái tài khoản"
        );

        return UserDetailResponse.from(updatedUser);
    }

    @Override
    @Transactional
    public UserDetailResponse updateUserRole(String actorEmail, Long userId, UpdateUserRoleRequest request) {
        User actor = getActor(actorEmail);
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy người dùng với ID: " + userId));

        // Anti-lockout: Admin không được tự hạ vai trò của chính mình
        if (actor != null && actor.getUserId().equals(target.getUserId()) && request.role() != Role.Name.SYSTEM_ADMIN) {
            throw new IllegalArgumentException("Quản trị viên không được phép tự hạ vai trò quản trị của chính mình.");
        }

        Role newRole = roleRepository.findByName(request.role())
                .orElseThrow(() -> new IllegalArgumentException("Vai trò không hợp lệ: " + request.role()));

        Role.Name oldRole = target.getRole() != null ? target.getRole().getName() : null;
        target.setRole(newRole);
        User updatedUser = userRepository.save(target);

        logService.log(
                actor,
                "USER",
                updatedUser.getUserId(),
                "ROLE_CHANGED",
                oldRole != null ? oldRole.name() : null,
                newRole.getName().name(),
                "Cập nhật vai trò từ " + oldRole + " sang " + newRole.getName()
        );

        return UserDetailResponse.from(updatedUser);
    }

    @Override
    @Transactional
    public ResetPasswordResponse resetPassword(String actorEmail, Long userId) {
        User actor = getActor(actorEmail);
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("Không tìm thấy người dùng với ID: " + userId));

        String tempPassword = generateTemporaryPassword();
        target.setPasswordHash(passwordEncoder.encode(tempPassword));
        userRepository.save(target);

        logService.log(
                actor,
                "USER",
                target.getUserId(),
                "PASSWORD_RESET",
                null,
                null,
                "Cấp lại mật khẩu tạm bởi Admin: " + (actor != null ? actor.getEmail() : "Hệ thống")
        );

        return new ResetPasswordResponse(target.getUserId(), target.getEmail(), tempPassword);
    }

    @Override
    @Transactional(readOnly = true)
    public LoginHistoryPageResponse getLoginHistory(
            Long userId,
            String status,
            String query,
            LocalDate startDate,
            LocalDate endDate,
            int page,
            int pageSize
    ) {
        int pageIndex = Math.max(0, page - 1);
        int size = (pageSize > 0 && pageSize <= 100) ? pageSize : 25;
        Pageable pageable = PageRequest.of(pageIndex, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        LocalDateTime startDateTime = startDate != null ? startDate.atStartOfDay() : null;
        LocalDateTime endDateTime = endDate != null ? endDate.atTime(LocalTime.MAX) : null;

        Page<ActivityLog> logPage = activityLogRepository.findLoginHistory(userId, status, query, startDateTime, endDateTime, pageable);

        List<LoginHistoryItemResponse> items = logPage.getContent().stream()
                .map(LoginHistoryItemResponse::fromEntity)
                .toList();

        return new LoginHistoryPageResponse(
                items,
                page,
                size,
                logPage.getTotalElements(),
                logPage.getTotalPages()
        );
    }

    @Override
    public PermissionMatrixResponse getPermissionMatrix() {
        List<String> roles = List.of("CUSTOMER", "STAFF", "FACILITY_MANAGER", "BUSINESS_OPS", "SYSTEM_ADMIN");

        List<PermissionMatrixResponse.PermissionGroupDto> groups = List.of(
                new PermissionMatrixResponse.PermissionGroupDto(
                        "1. Phân hệ Khách hàng & Thuê kho",
                        "Các chức năng phục vụ khách tìm kiếm, đặt chỗ và quản lý hợp đồng thuê",
                        List.of(
                                new PermissionMatrixResponse.PermissionItemDto(
                                        "P-BROWSE",
                                        "Tìm kiếm & Đặt giữ chỗ ô kho",
                                        "Tra cứu danh mục kho trống theo kích thước, tầng, xem biểu giá và thanh toán tiền cọc giữ chỗ.",
                                        Map.of("CUSTOMER", true, "STAFF", false, "FACILITY_MANAGER", false, "BUSINESS_OPS", false, "SYSTEM_ADMIN", true)
                                ),
                                new PermissionMatrixResponse.PermissionItemDto(
                                        "P-RENTALS",
                                        "Quản lý hợp đồng & Thẻ nhận kho",
                                        "Xem danh sách kho đang thuê, chuỗi hợp đồng ký kết, mã nhận kho Check-in Pass và gửi yêu cầu trả kho.",
                                        Map.of("CUSTOMER", true, "STAFF", false, "FACILITY_MANAGER", false, "BUSINESS_OPS", false, "SYSTEM_ADMIN", true)
                                ),
                                new PermissionMatrixResponse.PermissionItemDto(
                                        "P-TICKET-CREATE",
                                        "Gửi yêu cầu hỗ trợ sự cố",
                                        "Tạo phiếu báo cáo sự cố kỹ thuật (khóa số, máy hút ẩm, thẻ từ) gắn trực tiếp với mã ô kho đang thuê.",
                                        Map.of("CUSTOMER", true, "STAFF", true, "FACILITY_MANAGER", true, "BUSINESS_OPS", false, "SYSTEM_ADMIN", true)
                                )
                        )
                ),
                new PermissionMatrixResponse.PermissionGroupDto(
                        "2. Phân hệ Vận hành cơ sở kho (Tân Bình Depot)",
                        "Các chức năng dành cho đội ngũ nhân viên trực tiếp quản lý cơ sở vật chất và tiếp đón khách",
                        List.of(
                                new PermissionMatrixResponse.PermissionItemDto(
                                        "P-TASKS",
                                        "Bảng phân việc vận hành (Kanban Board)",
                                        "Tiếp nhận và xử lý 5 loại thẻ công việc trong ca trực: Check-in, Checkout, Vệ sinh, Ký hợp đồng, Xử lý sự cố.",
                                        Map.of("CUSTOMER", false, "STAFF", true, "FACILITY_MANAGER", false, "BUSINESS_OPS", false, "SYSTEM_ADMIN", true)
                                ),
                                new PermissionMatrixResponse.PermissionItemDto(
                                        "P-CHECKIN-OUT",
                                        "Thực hiện thủ tục Check-in & Trả kho",
                                        "Đối chiếu mã đơn, thu tiền thuê đủ 100%, chụp ảnh lưu hợp đồng đã ký và tất toán hoàn cọc khi khách trả.",
                                        Map.of("CUSTOMER", false, "STAFF", true, "FACILITY_MANAGER", false, "BUSINESS_OPS", false, "SYSTEM_ADMIN", true)
                                ),
                                new PermissionMatrixResponse.PermissionItemDto(
                                        "P-FACILITY-VIEW",
                                        "Theo dõi tổng quan cơ sở kho",
                                        "Xem sơ đồ mặt bằng các tầng kho, tỷ lệ phòng đang khai thác, kho đang bảo trì và kho cần dọn dẹp.",
                                        Map.of("CUSTOMER", false, "STAFF", false, "FACILITY_MANAGER", true, "BUSINESS_OPS", false, "SYSTEM_ADMIN", true)
                                ),
                                new PermissionMatrixResponse.PermissionItemDto(
                                        "P-UNIT-MGMT",
                                        "Điều chỉnh trạng thái & Bảo trì ô kho",
                                        "Chuyển kho vào bảo trì, đưa kho ra khỏi khai thác (Retire) hoặc sửa trạng thái khẩn cấp kèm lý do kiểm toán.",
                                        Map.of("CUSTOMER", false, "STAFF", false, "FACILITY_MANAGER", true, "BUSINESS_OPS", false, "SYSTEM_ADMIN", true)
                                ),
                                new PermissionMatrixResponse.PermissionItemDto(
                                        "P-SHIFTS",
                                        "Phân công lịch trực nhân viên",
                                        "Lập lịch tuần cho nhân sự theo từng khu vực (Zone A, B, C) và ca trực (Sáng, Chiều, Tối), chặn trùng ca.",
                                        Map.of("CUSTOMER", false, "STAFF", false, "FACILITY_MANAGER", true, "BUSINESS_OPS", false, "SYSTEM_ADMIN", true)
                                ),
                                new PermissionMatrixResponse.PermissionItemDto(
                                        "P-ACTIVITY",
                                        "Xem nhật ký kiểm toán hoạt động",
                                        "Truy cứu toàn bộ lịch sử biến động trạng thái kho, hợp đồng và sự kiện bảo mật theo thời gian thực (chỉ đọc).",
                                        Map.of("CUSTOMER", false, "STAFF", false, "FACILITY_MANAGER", true, "BUSINESS_OPS", false, "SYSTEM_ADMIN", true)
                                )
                        )
                ),
                new PermissionMatrixResponse.PermissionGroupDto(
                        "3. Phân hệ Quản trị Kinh doanh & Biểu phí",
                        "Các chức năng thiết lập chính sách giá, phụ thu và phân tích hiệu quả kinh doanh",
                        List.of(
                                new PermissionMatrixResponse.PermissionItemDto(
                                        "P-POLICY",
                                        "Ban hành chính sách giá & Biểu phí thuê",
                                        "Chỉnh sửa giá thuê cơ bản theo cỡ kho, quy định tỷ lệ cọc %, thời gian đệm và trần phụ thu tối đa.",
                                        Map.of("CUSTOMER", false, "STAFF", false, "FACILITY_MANAGER", false, "BUSINESS_OPS", true, "SYSTEM_ADMIN", true)
                                ),
                                new PermissionMatrixResponse.PermissionItemDto(
                                        "P-REPORTS",
                                        "Báo cáo doanh thu & Dòng tiền ký quỹ",
                                        "Theo dõi 4 chỉ số tài chính cốt lõi, tách bạch tiền cọc giữ riêng Escrow và xuất báo cáo kiểm toán CSV.",
                                        Map.of("CUSTOMER", false, "STAFF", false, "FACILITY_MANAGER", false, "BUSINESS_OPS", true, "SYSTEM_ADMIN", true)
                                )
                        )
                ),
                new PermissionMatrixResponse.PermissionGroupDto(
                        "4. Phân hệ Quản trị Tài khoản & Bảo mật",
                        "Các quyền hạn cấp cao nhất nhằm đảm bảo an toàn truy cập và vận hành phần mềm",
                        List.of(
                                new PermissionMatrixResponse.PermissionItemDto(
                                        "P-USER-MGMT",
                                        "Quản trị danh sách người dùng toàn hệ thống",
                                        "Cấp tài khoản mới cho 5 vai trò, cấp phát mật khẩu tạm dùng 1 lần, đổi quyền và khóa/mở khóa tài khoản.",
                                        Map.of("CUSTOMER", false, "STAFF", false, "FACILITY_MANAGER", false, "BUSINESS_OPS", false, "SYSTEM_ADMIN", true)
                                ),
                                new PermissionMatrixResponse.PermissionItemDto(
                                        "P-LOGIN-HISTORY",
                                        "Kiểm soát lịch sử đăng nhập & Ma trận quyền",
                                        "Giám sát các lần đăng nhập thành công và thất bại, phát hiện truy cập bất thường và đối chiếu quyền truy cập.",
                                        Map.of("CUSTOMER", false, "STAFF", false, "FACILITY_MANAGER", false, "BUSINESS_OPS", false, "SYSTEM_ADMIN", true)
                                )
                        )
                )
        );

        return new PermissionMatrixResponse(roles, groups);
    }

    private User getActor(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        return userRepository.findByEmailIgnoreCase(normalizeEmail(email)).orElse(null);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String generateTemporaryPassword() {
        StringBuilder sb = new StringBuilder(10);
        sb.append(UPPER.charAt(RANDOM.nextInt(UPPER.length())));
        sb.append(LOWER.charAt(RANDOM.nextInt(LOWER.length())));
        sb.append(DIGITS.charAt(RANDOM.nextInt(DIGITS.length())));
        sb.append(SYMBOLS.charAt(RANDOM.nextInt(SYMBOLS.length())));
        for (int i = 4; i < 10; i++) {
            sb.append(ALL_CHARS.charAt(RANDOM.nextInt(ALL_CHARS.length())));
        }
        char[] chars = sb.toString().toCharArray();
        for (int i = chars.length - 1; i > 0; i--) {
            int j = RANDOM.nextInt(i + 1);
            char temp = chars[i];
            chars[i] = chars[j];
            chars[j] = temp;
        }
        return new String(chars);
    }
}
