/**
 * Lớp kiểm tra dữ liệu đầu vào (Validation) cho các tính năng xác thực: Đăng nhập và Đăng ký.
 * Khớp chuẩn với các ràng buộc (Constraints) của Backend (RegisterRequest, LoginRequest).
 */
export class AuthValidator {
    static EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    // Số điện thoại Việt Nam 10 số (đầu 0 hoặc +84 kèm 3, 5, 7, 8, 9)
    static PHONE_REGEX = /^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/;

    /**
     * Validate Họ và tên
     * @param {string} fullName
     * @returns {string|null} Thông báo lỗi hoặc null nếu hợp lệ
     */
    static validateFullName(fullName) {
        if (!fullName || !fullName.trim()) {
            return "Họ và tên không được để trống.";
        }
        if (fullName.trim().length > 100) {
            return "Họ và tên không được vượt quá 100 ký tự.";
        }
        return null;
    }

    /**
     * Validate Email
     * @param {string} email
     * @returns {string|null} Thông báo lỗi hoặc null nếu hợp lệ
     */
    static validateEmail(email) {
        if (!email || !email.trim()) {
            return "Email không được để trống.";
        }
        const trimmedEmail = email.trim();
        if (!this.EMAIL_REGEX.test(trimmedEmail)) {
            return "Địa chỉ email không đúng định dạng (Ví dụ: example@storagehub.vn).";
        }
        return null;
    }

    /**
     * Validate Số điện thoại
     * @param {string} phone
     * @returns {string|null} Thông báo lỗi hoặc null nếu hợp lệ
     */
    static validatePhone(phone) {
        if (!phone || !phone.trim()) {
            return "Số điện thoại không được để trống.";
        }
        const cleanPhone = phone.trim().replace(/[\s.-]/g, "");
        if (!this.PHONE_REGEX.test(cleanPhone)) {
            return "Số điện thoại không hợp lệ (Ví dụ: 0901234567 hoặc +84901234567).";
        }
        if (cleanPhone.length > 20) {
            return "Số điện thoại không được vượt quá 20 ký tự.";
        }
        return null;
    }

    /**
     * Validate Mật khẩu
     * @param {string} password
     * @param {number} minLength
     * @returns {string|null} Thông báo lỗi hoặc null nếu hợp lệ
     */
    static validatePassword(password, minLength = 6) {
        if (!password) {
            return "Mật khẩu không được để trống.";
        }
        if (password.length < minLength) {
            return `Mật khẩu phải chứa ít nhất ${minLength} ký tự.`;
        }
        return null;
    }

    /**
     * Validate Xác nhận mật khẩu
     * @param {string} password
     * @param {string} confirmPassword
     * @returns {string|null} Thông báo lỗi hoặc null nếu hợp lệ
     */
    static validateConfirmPassword(password, confirmPassword) {
        if (!confirmPassword) {
            return "Vui lòng nhập lại mật khẩu xác nhận.";
        }
        if (password !== confirmPassword) {
            return "Mật khẩu xác nhận không khớp.";
        }
        return null;
    }

    /**
     * Validate Điều khoản dịch vụ
     * @param {boolean} agreeTerms
     * @returns {string|null} Thông báo lỗi hoặc null nếu hợp lệ
     */
    static validateAgreeTerms(agreeTerms) {
        if (!agreeTerms) {
            return "Bạn phải đồng ý với Điều khoản dịch vụ để tiếp tục.";
        }
        return null;
    }

    /**
     * Validate toàn bộ form Đăng nhập
     * @param {{ email?: string, password?: string }} data
     * @returns {{ isValid: boolean, errors: Record<string, string>, firstError: string | null }}
     */
    static validateLogin(data = {}) {
        const errors = {};

        const emailError = this.validateEmail(data.email);
        if (emailError) errors.email = emailError;

        if (!data.password) {
            errors.password = "Mật khẩu không được để trống.";
        }

        const errorKeys = Object.keys(errors);
        return {
            isValid: errorKeys.length === 0,
            errors,
            firstError: errorKeys.length > 0 ? errors[errorKeys[0]] : null,
        };
    }

    /**
     * Validate toàn bộ form Đăng ký
     * @param {{ fullName?: string, phone?: string, email?: string, password?: string, confirmPassword?: string, agreeTerms?: boolean }} data
     * @returns {{ isValid: boolean, errors: Record<string, string>, firstError: string | null }}
     */
    static validateRegister(data = {}) {
        const errors = {};

        const fullNameError = this.validateFullName(data.fullName);
        if (fullNameError) errors.fullName = fullNameError;

        const phoneError = this.validatePhone(data.phone);
        if (phoneError) errors.phone = phoneError;

        const emailError = this.validateEmail(data.email);
        if (emailError) errors.email = emailError;

        const passwordError = this.validatePassword(data.password, 6);
        if (passwordError) errors.password = passwordError;

        const confirmPasswordError = this.validateConfirmPassword(data.password, data.confirmPassword);
        if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;

        const agreeTermsError = this.validateAgreeTerms(data.agreeTerms);
        if (agreeTermsError) errors.agreeTerms = agreeTermsError;

        const errorKeys = Object.keys(errors);
        return {
            isValid: errorKeys.length === 0,
            errors,
            firstError: errorKeys.length > 0 ? errors[errorKeys[0]] : null,
        };
    }
}

export default AuthValidator;
