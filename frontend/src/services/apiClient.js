const TOKEN_KEY = "storagehub_token";

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("storagehub_user");
    localStorage.removeItem("storagehub_expires_at");
  },
};

function isPublicPathname(pathname = "") {
  return (
    pathname === "/" ||
    pathname === "/browse" ||
    pathname.startsWith("/units/") && !pathname.endsWith("/book") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password"
  );
}

export async function apiClient(endpoint, options = {}) {
  const token = tokenStorage.get();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (response.status === 401 && !endpoint.includes("/auth/")) {
    const hadSession = Boolean(token);
    tokenStorage.clear();
    const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
    if (hadSession && !isPublicPathname(currentPath)) {
      window.location.href = "/login";
      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
  }

  return response;
}

/**
 * An toàn parse JSON từ Response, tránh lỗi 'Unexpected end of JSON input'
 * khi máy chủ trả về nội dung rỗng.
 */
export async function safeParseJson(response) {
  try {
    const text = await response.text();
    if (!text || !text.trim()) {
      return {};
    }
    return JSON.parse(text);
  } catch {
    return {
      message:
        response.status >= 500
          ? "Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại."
          : `Máy chủ phản hồi mã trạng thái ${response.status}`,
    };
  }
}
