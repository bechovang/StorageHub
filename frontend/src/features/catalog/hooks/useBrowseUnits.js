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
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [selectedFacility, setSelectedFacility] = useState("");

  // State bộ lọc đang có hiệu lực (active filters) sau khi bấm Tìm kiếm
  const [activeFilters, setActiveFilters] = useState({
    typeId: "",
    sizeM2: "",
    startDate: "",
    facilityId: "",
  });

  // Thứ tự sắp xếp
  const [sortOrder, setSortOrder] = useState("price-asc");

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

  // Hàm thực thi tìm kiếm
  const fetchUnits = async (filters, sort) => {
    setLoading(true);
    try {
      const data = await searchUnits({
        typeId: filters.typeId,
        sizeM2: filters.sizeM2,
        startDate: filters.startDate,
        facilityId: filters.facilityId,
        sort,
      });
      const sorted = sortUnitsWithAvailableFirst(data.items || [], sort);
      setUnits(sorted);
    } catch {
      setUnits([]);
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
          startDate: activeFilters.startDate,
          facilityId: activeFilters.facilityId,
          sort: sortOrder,
        });
        if (!ignore) {
          const sorted = sortUnitsWithAvailableFirst(data.items || [], sortOrder);
          setUnits(sorted);
        }
      } catch {
        if (!ignore) {
          setUnits([]);
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

  // Xử lý submit form tìm kiếm
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newFilters = {
      typeId: selectedType,
      sizeM2: selectedSize,
      startDate,
      facilityId: selectedFacility,
    };
    setActiveFilters(newFilters);
    fetchUnits(newFilters, sortOrder);
  };

  // Xử lý đổi thứ tự sắp xếp: Giữ nguyên kho trống ở đầu và áp dụng thứ tự giá
  const handleSortChange = (e) => {
    const newSort = e.target.value;
    setSortOrder(newSort);
    setUnits((prev) => sortUnitsWithAvailableFirst(prev, newSort));
    fetchUnits(activeFilters, newSort);
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
    }
    setActiveFilters(updated);
    fetchUnits(updated, sortOrder);
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
    navigate(`/units/${unit.id}/book`);
  };

  // Lấy tên loại kho đang được lọc để hiển thị trên chip
  const activeTypeName = (filterOptions.types || filterOptions.unitTypes || []).find(
    (t) => String(t.id) === String(activeFilters.typeId),
  )?.name;

  // Lấy tên cơ sở đang được lọc để hiển thị trên chip
  const activeFacilityName = filterOptions.facilities?.find(
    (f) => String(f.id) === String(activeFilters.facilityId),
  )?.name;

  return {
    navigate,
    filterOptions,
    selectedType,
    setSelectedType,
    selectedSize,
    setSelectedSize,
    startDate,
    setStartDate,
    selectedFacility,
    setSelectedFacility,
    activeFilters,
    sortOrder,
    units,
    loading,
    selectedUnitForDrawer,
    setSelectedUnitForDrawer,
    handleSearchSubmit,
    handleSortChange,
    handleRemoveFilter,
    handleOpenDrawer,
    handleViewDetails,
    handleBook,
    activeTypeName,
    activeFacilityName,
  };
}
