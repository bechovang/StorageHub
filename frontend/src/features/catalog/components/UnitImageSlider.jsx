import { useState, useCallback } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { PLACEHOLDER_UNIT_IMAGE } from "../../../utils/formatters.js";

/**
 * Image Slider Trình chiếu ảnh kho (Hỗ trợ ảnh thật & fallback về 1 ảnh placeholder)
 */
export default function UnitImageSlider({
  photos = [],
  typeName = "Tiêu chuẩn",
  sizeM2 = 5,
}) {
  const rawPhotos = Array.isArray(photos) ? photos.filter(Boolean) : [];
  const [prevPhotos, setPrevPhotos] = useState(photos);
  const [failedUrls, setFailedUrls] = useState(new Set());
  const [currentSlide, setCurrentSlide] = useState(0);

  // Reset failedUrls khi prop photos đổi theo idiomatic React
  if (prevPhotos !== photos) {
    setPrevPhotos(photos);
    setFailedUrls(new Set());
    setCurrentSlide(0);
  }

  // Lọc bỏ những URL ảnh thật đã bị lỗi tải
  const validRealPhotos = rawPhotos.filter((url) => !failedUrls.has(url));

  // Nếu còn ảnh thật tải được thì dùng danh sách đó, ngược lại hiển thị ĐÚNG 1 TẤM ẢNH PLACEHOLDER duy nhất
  const displayPhotos =
    validRealPhotos.length > 0 ? validRealPhotos : [PLACEHOLDER_UNIT_IMAGE];
  const totalSlides = displayPhotos.length;

  const nextSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const handleKeyDown = (e) => {
    if (totalSlides <= 1) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevSlide();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      nextSlide();
    }
  };

  const handleImageError = (url) => {
    setFailedUrls((prev) => {
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  };

  return (
    <div
      className="unit-slider"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Hình ảnh không gian kho"
    >
      <div className="unit-slider__viewport">
        <div
          className="unit-slider__track"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {displayPhotos.map((src, idx) => (
            <div key={`${src}-${idx}`} className="unit-slider__slide">
              <img
                src={src}
                alt={`Kho ${typeName} ${sizeM2} m² - Hình ảnh ${idx + 1}`}
                className="unit-slider__img"
                onError={() => handleImageError(src)}
                loading={idx === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>

        {/* Nút điều hướng Trước / Kế tiếp (Chỉ hiển thị khi có từ 2 ảnh thật trở lên) */}
        {totalSlides > 1 && (
          <>
            <button
              type="button"
              className="unit-slider__nav-btn unit-slider__nav-btn--prev"
              onClick={prevSlide}
              aria-label="Ảnh trước"
            >
              <CaretLeft size={20} weight="bold" />
            </button>

            <button
              type="button"
              className="unit-slider__nav-btn unit-slider__nav-btn--next"
              onClick={nextSlide}
              aria-label="Ảnh kế tiếp"
            >
              <CaretRight size={20} weight="bold" />
            </button>
          </>
        )}

        {/* Thanh chỉ báo số ảnh và bước chuyển chuẩn Swiss Grid (Chỉ hiển thị khi có từ 2 ảnh thật trở lên) */}
        {totalSlides > 1 && (
          <div className="unit-slider__indicator" role="tablist" aria-label="Chỉ số ảnh kho">
            <span className="unit-slider__counter">
              0{currentSlide + 1} / 0{totalSlides}
            </span>
            <div className="unit-slider__steps">
              {displayPhotos.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`unit-slider__step ${idx === currentSlide ? "is-active" : ""}`}
                  onClick={() => setCurrentSlide(idx)}
                  aria-label={`Xem ảnh ${idx + 1}`}
                  role="tab"
                  aria-selected={idx === currentSlide}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
