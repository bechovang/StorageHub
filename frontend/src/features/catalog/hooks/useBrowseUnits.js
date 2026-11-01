import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { getUnitFilterOptions, searchUnits } from "../../../services/unitService.js";
import { sortUnitsWithAvailableFirst } from "../utils.js";

export function useBrowseUnits() {
  const navigate = useNavigate();

  // Danh mục dữ liệu cho dropdown filter
  const [filterOptions, setFilterOptions] = useState({
    types: [],
    sizesM2: [],
    facilities: [],
  });

  // State các giá trị trong form bộ lọc
  const [selectedType, setSelectedType] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedFacility, setSelectedFacility] = useState("");
  // Tìm theo mã kho (vd: "S-7") — BE match contains, bỏ qua hoa/thường + dấu gạch
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState("");

  // State bộ lọc đang có hiệu lực (active filters) sau khi bấm Tìm kiếm
  const [activeFilters, setActiveFilters] = useState({
    typeId: "",
    sizeM2: "",
    facilityId: "",
    query: "",
  });

  // Thứ tự sắp xếp
  const [sortOrder, setSortOrder] = useState("price-asc");

  // Phân trang danh sách kho (40 kho chia đều 12 kho / trang)
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const [total, setTotal] = useState(0);

  // Kết quả tìm kiếm kho
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quản lý Drawer xem chi tiết kho
  const [selectedUnitForDrawer, setSelectedUnitForDrawer] = useState(null);

  // Tải danh mục loại kho và kích thước khi trang khởi tạo
  useEffect(() => {
    async function loadOptions() {
      try {
        const options = await getUnitFilterOptions();
        setFilterOptions(options);
      } catch (err) {
        console.error("Failed to fetch unit filter options:", err);
      }
    }
    loadOptions();
  }, []);

  // Hàm thực thi tìm kiếm kèm phân trang
  const fetchUnits = async (filters, sort, targetPage = 1) => {
    setLoading(true);
    setSearchError("");
    try {
      const data = await searchUnits({
        typeId: filters.typeId,
        sizeM2: filters.sizeM2,
        facilityId: filters.facilityId,
        query: filters.query,
        sort,
        page: targetPage,
        pageSize,
      });
      const sorted = sortUnitsWithAvailableFirst(data.items || [], sort);
      setUnits(sorted);
      setPage(data.page || targetPage);
      setTotal(Number(data.total ?? sorted.length));
    } catch (err) {
      setSearchError(err.message || "Không thể tải danh sách kho.");
      setUnits([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Tải danh sách kho mặc định ban đầu
  useEffect(() => {
    let ignore = false;
    async function loadInitialUnits() {
      try {
        const data = await searchUnits({
          typeId: activeFilters.typeId,
          sizeM2: activeFilters.sizeM2,
          facilityId: activeFilters.facilityId,
          query: activeFilters.query,
          sort: sortOrder,
          page: 1,
          pageSize,
        });
        if (!ignore) {
          const sorted = sortUnitsWithAvailableFirst(data.items || [], sortOrder);
          setUnits(sorted);
          setPage(data.page || 1);
          setTotal(Number(data.total ?? sorted.length));
        }
      } catch (err) {
        if (!ignore) {
          setSearchError(err.message || "Không thể tải danh sách kho.");
          setUnits([]);
          setTotal(0);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    loadInitialUnits();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Xử lý chuyển trang
  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    const maxPage = Math.max(1, Math.ceil(total / pageSize));
    if (newPage > maxPage) return;
    setPage(newPage);
    fetchUnits(activeFilters, sortOrder, newPage);
    window.scrollTo({ top: 380, behavior: "smooth" });
  };

  // Xử lý submit form tìm kiếm (reset về trang 1)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newFilters = {
      typeId: selectedType,
      sizeM2: selectedSize,
      facilityId: selectedFacility,
      query: searchQuery,
    };
    setActiveFilters(newFilters);
    setPage(1);
    fetchUnits(newFilters, sortOrder, 1);
  };

  // Xử lý đổi thứ tự sắp xếp
  const handleSortChange = (e) => {
    const newSort = e.target.value;
    setSortOrder(newSort);
    fetchUnits(activeFilters, newSort, 1);
  };

  // Đặt lại toàn bộ bộ lọc
  const handleResetFilters = () => {
    setSelectedType("");
    setSelectedSize("");
    setSelectedFacility("");
    setSearchQuery("");
    const reset = {
      typeId: "",
      sizeM2: "",
      facilityId: "",
      query: "",
    };
    setActiveFilters(reset);
    setPage(1);
    fetchUnits(reset, sortOrder, 1);
  };

  // Xóa từng bộ lọc riêng lẻ từ chip
  const handleRemoveFilter = (filterKey) => {
    const updated = { ...activeFilters };
    if (filterKey === "typeId") {
      updated.typeId = "";
      setSelectedType("");
    } else if (filterKey === "sizeM2") {
      updated.sizeM2 = "";
      setSelectedSize("");
    } else if (filterKey === "facilityId") {
      updated.facilityId = "";
      setSelectedFacility("");
    } else if (filterKey === "query") {
      updated.query = "";
      setSearchQuery("");
    }
    setActiveFilters(updated);
    setPage(1);
    fetchUnits(updated, sortOrder, 1);
  };

  // Mở Drawer xem nhanh tóm tắt gói kho
  const handleOpenDrawer = (unit) => {
    setSelectedUnitForDrawer(unit);
  };

  // Điều hướng đến trang chi tiết kho (Unit Detail)
  const handleViewDetails = (unit) => {
    navigate(`/units/${unit.id}`);
  };

  const handleBook = (unit) => {
    navigate(`/units/${unit.id}`);
  };

  // Lấy tên loại kho đang được lọc để hiển thị trên chip
  const activeTypeName = (filterOptions.types || filterOptions.unitTypes || []).find(
    (t) => String(t.id) === String(activeFilters.typeId),
  )?.name;

  // Lấy tên cơ sở đang được lọc để hiển thị trên chip
  const activeFacilityName = filterOptions.facilities?.find(
    (f) => String(f.id) === String(activeFilters.facilityId),
  )?.name;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    navigate,
    filterOptions,
    selectedType,
    setSelectedType,
    selectedSize,
    setSelectedSize,
    selectedFacility,
    setSelectedFacility,
    searchQuery,
    setSearchQuery,
    searchError,
    activeFilters,
    sortOrder,
    units,
    loading,
    page,
    pageSize,
    total,
    totalPages,
    handlePageChange,
    selectedUnitForDrawer,
    setSelectedUnitForDrawer,
    handleSearchSubmit,
    handleSortChange,
    handleRemoveFilter,
    handleResetFilters,
    handleOpenDrawer,
    handleViewDetails,
    handleBook,
    activeTypeName,
    activeFacilityName,
  };
}
