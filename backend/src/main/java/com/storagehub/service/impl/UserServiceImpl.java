package com.storagehub.service.impl;

import com.storagehub.dto.user.*;
import com.storagehub.entity.Facility;
import com.storagehub.entity.Role;
import com.storagehub.entity.User;
import com.storagehub.exception.EmailAlreadyExistsException;
import com.storagehub.exception.UserNotFoundException;
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
import java.util.List;
import java.util.Locale;

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

    public UserServiceImpl(
            UserRepository userRepository,
            RoleRepository roleRepository,
            FacilityRepository facilityRepository,
            PasswordEncoder passwordEncoder,
            LogService logService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.facilityRepository = facilityRepository;
        this.passwordEncoder = passwordEncoder;
        this.logService = logService;
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
