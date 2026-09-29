/**
 * Lớp kiểm tra dữ liệu đầu vào (Validation) cho quy trình Thanh toán.
 * Khớp chuẩn với các ràng buộc của Backend (CreatePaymentRequest, ConfirmPaymentRequest).
 */
export class PaymentValidator {
  static CARD_NUMBER_REGEX = /^\d{13,19}$/;
  static EXPIRY_REGEX = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
  static CVC_REGEX = /^\d{3,4}$/;
  static MOMO_PHONE_REGEX = /^(?:\+84|0)?(?:3|5|7|8|9)\d{8}$/;
  static OTP_REGEX = /^\d{6}$/;

  /**
   * Validate Số thẻ ngân hàng
   * @param {string} number
   * @returns {string|null}
   */
  static validateCardNumber(number) {
    if (!number || !number.trim()) {
      return "Số thẻ không được để trống.";
    }
    const cleanNumber = number.replace(/[\s-]/g, "");
    if (!this.CARD_NUMBER_REGEX.test(cleanNumber)) {
      return "Số thẻ không hợp lệ (yêu cầu từ 13 đến 19 chữ số).";
    }
    return null;
  }

  /**
   * Validate Ngày hết hạn thẻ (MM/YY)
   * @param {string} expiry
   * @returns {string|null}
   */
  static validateExpiry(expiry) {
    if (!expiry || !expiry.trim()) {
      return "Ngày hết hạn không được để trống.";
    }
    const clean = expiry.trim().replace(/\s/g, "");
    const match = clean.match(this.EXPIRY_REGEX);
    if (!match) {
      return "Định dạng hết hạn phải là MM/YY (ví dụ: 12/28).";
    }

    const month = parseInt(match[1], 10);
    const year = parseInt("20" + match[2], 10);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return "Thẻ đã hết hạn sử dụng.";
    }
    return null;
  }

  /**
   * Validate Mã bảo mật CVC/CVV (3 hoặc 4 chữ số)
   * @param {string} cvc
   * @returns {string|null}
   */
  static validateCvc(cvc) {
    if (!cvc || !cvc.trim()) {
      return "Mã CVC/CVV không được để trống.";
    }
    if (!this.CVC_REGEX.test(cvc.trim())) {
      return "Mã CVC/CVV phải gồm 3 hoặc 4 chữ số.";
    }
    return null;
  }

  /**
   * Validate Số điện thoại MoMo
   * @param {string} phone
   * @returns {string|null}
   */
  static validateMomoPhone(phone) {
    if (!phone || !phone.trim()) {
      return "Số điện thoại MoMo không được để trống.";
    }
    const cleanPhone = phone.trim().replace(/[\s.-]/g, "");
    if (!this.MOMO_PHONE_REGEX.test(cleanPhone)) {
      return "Số điện thoại MoMo không đúng định dạng Việt Nam (10 số).";
    }
    return null;
  }

  /**
   * Validate Mã OTP MoMo (6 chữ số)
   * @param {string} otp
   * @returns {string|null}
   */
  static validateOtp(otp) {
    if (!otp || !otp.trim()) {
      return "Vui lòng nhập mã xác thực OTP.";
    }
    if (!this.OTP_REGEX.test(otp.trim())) {
      return "Mã OTP phải đúng 6 chữ số.";
    }
    return null;
  }

  /**
   * Validate toàn bộ form thẻ tín dụng / ghi nợ
   * @param {Object} card { number, expiry, cvc }
   * @returns {{ isValid: boolean, errors: Object, firstError: string|null }}
   */
  static validateCardForm({ number, expiry, cvc }) {
    const errors = {};
    const numberErr = this.validateCardNumber(number);
    if (numberErr) errors.number = numberErr;

    const expiryErr = this.validateExpiry(expiry);
    if (expiryErr) errors.expiry = expiryErr;

    const cvcErr = this.validateCvc(cvc);
    if (cvcErr) errors.cvc = cvcErr;

    const errorKeys = Object.keys(errors);
    return {
      isValid: errorKeys.length === 0,
      errors,
      firstError: errorKeys.length > 0 ? errors[errorKeys[0]] : null,
    };
  }

  /**
   * Validate form MoMo
   * @param {Object} data { momoPhone }
   * @returns {{ isValid: boolean, errors: Object, firstError: string|null }}
   */
  static validateMomoForm({ momoPhone }) {
    const errors = {};
    const phoneErr = this.validateMomoPhone(momoPhone);
    if (phoneErr) errors.momoPhone = phoneErr;

    const errorKeys = Object.keys(errors);
    return {
      isValid: errorKeys.length === 0,
      errors,
      firstError: errorKeys.length > 0 ? errors[errorKeys[0]] : null,
    };
  }
}

export default PaymentValidator;
