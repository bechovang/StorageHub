import React from "react";
import AppShell from "../AppShell/AppShell.jsx";
import { WarningCircle, ArrowClockwise, House } from "@phosphor-icons/react";

/**
 * Global React Error Boundary preventing white-screen unmounts on unexpected render errors.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled render error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <AppShell>
          <div
            style={{
              maxWidth: 640,
              margin: "4rem auto",
              padding: "2rem",
              border: "2px solid var(--color-ink, #000)",
              boxShadow: "var(--shadow-hard, 4px 4px 0px #000)",
              background: "#ffffff",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                marginBottom: "1rem",
              }}
            >
              <WarningCircle size={28} weight="fill" color="var(--color-error, #dc2626)" />
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  margin: 0,
                  fontFamily: "var(--font-heading)",
                  letterSpacing: "-0.02em",
                }}
              >
                Đã xảy ra lỗi hiển thị giao diện
              </h2>
            </div>
            <p
              style={{
                color: "var(--color-muted, #4b5563)",
                marginBottom: "1.5rem",
                fontSize: "0.9rem",
                lineHeight: 1.5,
              }}
            >
              Một lỗi kết xuất ngoài ý muốn đã xảy ra (
              <code style={{ fontFamily: "var(--font-mono)", fontSize: "0.85em" }}>
                {this.state.error?.message || "Lỗi không xác định"}
              </code>
              ). Hệ thống đã chặn sự cố để giữ nguyên thanh điều hướng. Bạn có thể nhấn thử lại hoặc tải lại trang.
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  background: "var(--color-ink, #000)",
                  color: "#fff",
                  fontWeight: 600,
                  border: "2px solid var(--color-ink, #000)",
                  cursor: "pointer",
                }}
              >
                <ArrowClockwise size={16} weight="bold" />
                <span>Tải lại trang</span>
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 1rem",
                  background: "transparent",
                  color: "var(--color-ink, #000)",
                  fontWeight: 600,
                  border: "2px solid var(--color-ink, #000)",
                  cursor: "pointer",
                }}
              >
                <span>Thử lại giao diện</span>
              </button>
            </div>
          </div>
        </AppShell>
      );
    }
    return this.props.children;
  }
}
