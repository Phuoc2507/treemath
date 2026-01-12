-- Thêm cột số thứ tự trong cơ sở
ALTER TABLE public.master_trees ADD COLUMN tree_number_in_campus integer;

-- Cập nhật số thứ tự cho từng cơ sở
-- Cơ sở 1: giữ nguyên (1-17)
UPDATE public.master_trees SET tree_number_in_campus = tree_number WHERE campus_id = 1;

-- Cơ sở 2: tree_number 18-24 → tree_number_in_campus 1-7
UPDATE public.master_trees SET tree_number_in_campus = tree_number - 17 WHERE campus_id = 2;

-- Cơ sở 3: tree_number 25-29 → tree_number_in_campus 1-5
UPDATE public.master_trees SET tree_number_in_campus = tree_number - 24 WHERE campus_id = 3;

-- Xóa dữ liệu đo của cơ sở 1
DELETE FROM public.leaderboard WHERE campus_id = 1;
DELETE FROM public.measurements WHERE campus_id = 1;