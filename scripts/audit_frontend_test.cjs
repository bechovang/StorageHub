/**
 * Audit Script: Kiểm tra tự động các vi phạm API Fallback & Dead-code trên Frontend
 */
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const authContextPath = path.join(rootDir, 'frontend/src/context/AuthContext.jsx');
const usePaymentPath = path.join(rootDir, 'frontend/src/features/booking/hooks/usePayment.js');

console.log("==================================================================");
console.log("🔍 CHẠY AUDIT FRONTEND: KẾT NỐI API & RỦI RO FALLBACK / DEAD CODE");
console.log("==================================================================\n");

let passedCount = 0;
let failedCount = 0;

function report(testName, passed, detail) {
  if (passed) {
    console.log(`[PASS] ${testName}`);
    if (detail) console.log(`       → ${detail}`);
    passedCount++;
  } else {
    console.log(`[FAIL] ${testName}`);
    if (detail) console.log(`       → ${detail}`);
    failedCount++;
  }
}

// 1. Kiểm tra AuthContext.jsx: Mock JWT Token fallback khi offline
const authContent = fs.readFileSync(authContextPath, 'utf8');

const hasDevGuardForLogin = /import\.meta\.env\.DEV\s*&&\s*isOffline/.test(authContent) ||
  /if\s*\(\s*import\.meta\.env\.DEV\s*&&\s*isOffline\s*&&\s*DEMO_ACCOUNTS/.test(authContent);

report(
  "AuthContext: Giới hạn mock JWT login fallback chỉ trong môi trường DEV (import.meta.env.DEV)",
  hasDevGuardForLogin,
  hasDevGuardForLogin
    ? "Đã bọc guard DEV, production không tự sinh token giả."
    : "RỦI RO: Không có kiểm tra import.meta.env.DEV. Khi offline ở Production vẫn tự sinh mock_jwt_token_<ROLE>!"
);

// 2. Kiểm tra AuthContext.jsx: forgot-password fake success
const hasFakeForgotPassword502 = /if\s*\(\s*res\.status\s*===\s*502[\s\S]*?message:\s*"Nếu email này tồn tại/m.test(authContent);
const hasFakeForgotPasswordCatch = /err\.name\s*===\s*"TypeError"[\s\S]*?message:\s*"Nếu email này tồn tại/m.test(authContent);

report(
  "AuthContext: Bỏ thông báo thành công giả khi forgot-password gặp lỗi 502/mất mạng",
  !hasFakeForgotPassword502 && !hasFakeForgotPasswordCatch,
  (!hasFakeForgotPassword502 && !hasFakeForgotPasswordCatch)
    ? "Đã loại bỏ hoàn toàn thông báo giả, ném lỗi chính xác khi server gặp sự cố."
    : "RỦI RO: Vẫn trả thông báo thành công giả khi backend trả 502/503/504 hoặc rớt mạng."
);

// 3. Kiểm tra usePayment.js: Dead code handleSimulateVNPaySuccess
const paymentContent = fs.readFileSync(usePaymentPath, 'utf8');
const hasSimulateVNPay = /handleSimulateVNPaySuccess/.test(paymentContent);

report(
  "usePayment: Loại bỏ dead code handleSimulateVNPaySuccess & REC-VNPAY giả lập",
  !hasSimulateVNPay,
  !hasSimulateVNPay
    ? "Đã dọn dẹp sạch sẽ dead code VNPay."
    : "RỦI RO: Vẫn còn hàm handleSimulateVNPaySuccess tạo biên lai giả REC-VNPAY."
);

// 4. Kiểm tra usePayment.js: Hardcode reservation unit S-3 và cọc 103500
const hasHardcodedS3 = /code:\s*detail\.unit\?\.code\s*\|\|\s*"S-3"/.test(paymentContent);
const hasHardcodedDeposit = /depositAmount:\s*detail\.depositAmount\s*\|\|\s*103500/.test(paymentContent);

report(
  "usePayment: Loại bỏ hardcode fallback kho S-3 & cọc 103.500đ",
  !hasHardcodedS3 && !hasHardcodedDeposit,
  (!hasHardcodedS3 && !hasHardcodedDeposit)
    ? "Đã dùng dữ liệu thật hoặc null an toàn khi detail thiếu trường."
    : "RỦI RO: Vẫn tự động gán kho S-3 và cọc 103.500đ khi dữ liệu rỗng."
);

console.log("\n------------------------------------------------------------------");
console.log(`TỔNG KẾT: ${passedCount} tiêu chí ĐẠT, ${failedCount} tiêu chí CHƯA ĐẠT.`);
console.log("==================================================================\n");

process.exit(failedCount > 0 ? 1 : 0);
