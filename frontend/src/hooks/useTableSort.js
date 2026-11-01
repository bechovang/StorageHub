import { useState, useMemo } from "react";

/**
 * Hook quản lý sắp xếp (sort) 3 trạng thái cho bảng dữ liệu:
 * Trạng thái 1: Tăng dần (asc)
 * Trạng thái 2: Giảm dần (desc)
 * Trạng thái 3: Hủy sắp xếp (null - trở về thứ tự ban đầu)
 *
 * Hỗ trợ so sánh thông minh:
 * - Số / Giá tiền: So sánh giá trị số
 * - Chuỗi ký tự: So sánh tự nhiên tiếng Việt (Hỗ trợ Natural Number sort: "S-1", "S-2", "S-10")
 * - Null / Undefined: Đẩy xuống cuối danh sách
 */
export function useTableSort(items = [], defaultKey = null, defaultDirection = null) {
  const [sortConfig, setSortConfig] = useState({
    key: defaultKey,
    direction: defaultDirection, // 'asc' | 'desc' | null
  });

  const requestSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key !== key) {
        return { key, direction: "asc" };
      }
      if (prev.direction === "asc") {
        return { key, direction: "desc" };
      }
      return { key: null, direction: null };
    });
  };

  const sortedItems = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction || !Array.isArray(items)) {
      return items;
    }

    const { key, direction } = sortConfig;
    const factor = direction === "asc" ? 1 : -1;

    return [...items].sort((a, b) => {
      const valA = a?.[key];
      const valB = b?.[key];

      // Đẩy giá trị rỗng/null xuống cuối
      if (valA == null && valB == null) return 0;
      if (valA == null || valA === "") return 1;
      if (valB == null || valB === "") return -1;

      // So sánh số học thuần túy
      if (typeof valA === "number" && typeof valB === "number") {
        return (valA - valB) * factor;
      }

      // Kiểm tra chuỗi số
      const numA = Number(valA);
      const numB = Number(valB);
      if (
        !isNaN(numA) &&
        !isNaN(numB) &&
        typeof valA !== "boolean" &&
        typeof valB !== "boolean"
      ) {
        return (numA - numB) * factor;
      }

      // So sánh chuỗi với locale tiếng Việt và natural collation
      return (
        String(valA).localeCompare(String(valB), "vi", {
          numeric: true,
          sensitivity: "base",
        }) * factor
      );
    });
  }, [items, sortConfig]);

  const resetSort = () => {
    setSortConfig({ key: null, direction: null });
  };

  return {
    sortedItems,
    sortConfig,
    requestSort,
    resetSort,
  };
}
