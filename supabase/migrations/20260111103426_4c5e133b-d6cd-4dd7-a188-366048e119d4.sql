-- Drop the old tree_number check constraint
ALTER TABLE master_trees DROP CONSTRAINT master_trees_tree_number_check;

-- Add new constraint allowing tree_number 1-100
ALTER TABLE master_trees ADD CONSTRAINT master_trees_tree_number_check CHECK (tree_number >= 1 AND tree_number <= 100);

-- Add campus_id column to master_trees
ALTER TABLE master_trees ADD COLUMN campus_id integer DEFAULT 1;

-- Update existing trees to campus 1
UPDATE master_trees SET campus_id = 1 WHERE campus_id IS NULL;

-- Insert Campus 2 trees (7 trees, tree_number 18-24)
INSERT INTO master_trees (tree_number, actual_height, actual_diameter, species, campus_id, location_description) VALUES
(18, 7.47, 22.92, 'Chưa xác định', 2, 'Cơ sở 2 - Cây 1'),
(19, 8.52, 29.28, 'Chưa xác định', 2, 'Cơ sở 2 - Cây 2'),
(20, 7.39, 22.34, 'Chưa xác định', 2, 'Cơ sở 2 - Cây 3'),
(21, 8.05, 24.83, 'Chưa xác định', 2, 'Cơ sở 2 - Cây 4'),
(22, 8.82, 29.28, 'Chưa xác định', 2, 'Cơ sở 2 - Cây 5'),
(23, 7.31, 22.92, 'Chưa xác định', 2, 'Cơ sở 2 - Cây 6'),
(24, 7.60, 26.10, 'Chưa xác định', 2, 'Cơ sở 2 - Cây 7');

-- Insert Campus 3 trees (5 trees, tree_number 25-29)
INSERT INTO master_trees (tree_number, actual_height, actual_diameter, species, campus_id, location_description) VALUES
(25, 8.31, 18.46, 'Chưa xác định', 3, 'Cơ sở 3 - Cây 1'),
(26, 7.55, 21.96, 'Chưa xác định', 3, 'Cơ sở 3 - Cây 2'),
(27, 5.53, 22.91, 'Chưa xác định', 3, 'Cơ sở 3 - Cây 3'),
(28, 7.26, 24.50, 'Chưa xác định', 3, 'Cơ sở 3 - Cây 4'),
(29, 6.28, 22.28, 'Chưa xác định', 3, 'Cơ sở 3 - Cây 5');

-- Add campus_id column to measurements
ALTER TABLE measurements ADD COLUMN campus_id integer DEFAULT 1;

-- Add campus_id column to leaderboard
ALTER TABLE leaderboard ADD COLUMN campus_id integer DEFAULT 1;