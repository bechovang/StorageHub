-- ============================================================================
-- StorageHub — V27: bỏ ca đêm 19:00–07:00 khỏi lịch trực; thêm FULL_DAY 07–23.
-- Các ca EVENING cũ chuyển sang AFTERNOON (15–23) để không mồ côi enum.
-- ============================================================================

UPDATE staff_assignments SET shift = 'AFTERNOON' WHERE shift = 'EVENING';
