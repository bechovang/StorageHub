const TOKEN_KEY = "storagehub_token";

export const tokenStorage = {
    get: () => localStorage.getItem(TOKEN_KEY),
    set: (token) => localStorage.setItem(TOKEN_KEY, token),
    clear: () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("storagehub_user");
        localStorage.removeItem("storagehub_expires_at");
    }
};

export async function apiClient(endpoint, options = {}) {
    const token = tokenStorage.get();

    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    // Tự động đính kèm Bearer token nếu đã đăng nhập
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
        ...options,
        headers,
    });

    // Nếu token hết hạn (401) ở các endpoint cần quyền
    if (response.status === 401 && !endpoint.includes("/auth/login")) {
        tokenStorage.clear();
        window.location.href = "/login";
        throw new Error("Phiên đăng nhập đã hết hạn");
    }

    return response;
}