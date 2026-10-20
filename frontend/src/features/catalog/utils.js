export function getCapacityHint(sizeM2) {
  const size = Number(sizeM2) || 0;
  if (size <= 2) {
    return {
      title: "Phù hợp lưu trữ cá nhân hoặc ít đồ đạc",
      detail:
        "Sức chứa tương đương 10 - 15 thùng carton tiêu chuẩn, 1 xe máy hoặc 4 - 5 vali lớn cùng các vật dụng cá nhân theo mùa.",
    };
  }
  if (size <= 5) {
    return {
      title: "Phù hợp đồ đạc căn hộ 1 phòng ngủ",
      detail:
        "Sức chứa tương đương 20 - 30 thùng đồ, tủ lạnh mini, máy giặt, bàn ghế làm việc, đệm giường và đồ dùng gia đình cần bảo quản.",
    };
  }
  return {
    title: "Phù hợp chuyển nhà 2-3 phòng ngủ hoặc kho hàng",
    detail:
      "Không gian rộng rãi chứa trọn vẹn nội thất căn hộ gia đình, tủ lớn, sofa, giường ngủ hoặc 3-4 pallet hàng hóa kinh doanh.",
  };
}

export function isUnitAvailable(u) {
  const rawStatus =
    typeof u.availability === "object"
      ? u.availability?.status
      : u.availability;
  const availableDate =
    typeof u.availability === "object"
      ? u.availability?.availableFromDate
      : u.availableFrom;
  const isUnavailable =
    rawStatus === "AVAILABLE_SOON" ||
    rawStatus === "soon" ||
    rawStatus === "PREPARING" ||
    rawStatus === "RENTED" ||
    Boolean(availableDate);
  return !isUnavailable;
}

export function sortUnitsWithAvailableFirst(items, sort) {
  return [...items].sort((a, b) => {
    const aAvail = isUnitAvailable(a);
    const bAvail = isUnitAvailable(b);
    if (aAvail !== bAvail) {
      return aAvail ? -1 : 1; // Kho còn trống luôn lên đầu
    }
    const aPrice = a.baseMonthlyRent ?? a.monthlyPrice ?? 0;
    const bPrice = b.baseMonthlyRent ?? b.monthlyPrice ?? 0;
    return sort === "price-desc" ? bPrice - aPrice : aPrice - bPrice;
  });
}
