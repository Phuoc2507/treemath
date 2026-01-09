-- Update get_leaderboard_masked with parameter validation
CREATE OR REPLACE FUNCTION public.get_leaderboard_masked(p_tree_number integer DEFAULT NULL::integer, p_limit integer DEFAULT 10)
 RETURNS TABLE(id uuid, measurement_id uuid, tree_number integer, accuracy_score numeric, created_at timestamp with time zone, user_name text, user_class text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    l.id,
    l.measurement_id,
    l.tree_number,
    l.accuracy_score,
    l.created_at,
    CASE
      WHEN l.user_name IS NULL OR btrim(l.user_name) = '' THEN 'Ẩn danh'
      ELSE left(btrim(l.user_name), 1) || '••'
    END AS user_name,
    CASE
      WHEN l.user_class IS NULL OR btrim(l.user_class) = '' THEN ''
      WHEN length(btrim(l.user_class)) >= 2 THEN left(btrim(l.user_class), 2) || '•'
      ELSE left(btrim(l.user_class), 1) || '••'
    END AS user_class
  FROM public.leaderboard l
  WHERE (p_tree_number IS NULL OR (p_tree_number > 0 AND l.tree_number = p_tree_number))
  ORDER BY l.accuracy_score DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 100);
$function$;

-- Update get_measurements_masked with parameter validation
CREATE OR REPLACE FUNCTION public.get_measurements_masked(p_tree_id integer DEFAULT NULL::integer, p_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, tree_id integer, measured_circumference numeric, measured_height numeric, calculated_height numeric, calculated_diameter numeric, accuracy_score numeric, biomass_kg numeric, co2_absorbed_kg numeric, created_at timestamp with time zone, user_name text, user_class text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    m.id,
    m.tree_id,
    m.measured_circumference,
    m.measured_height,
    m.calculated_height,
    m.calculated_diameter,
    m.accuracy_score,
    m.biomass_kg,
    m.co2_absorbed_kg,
    m.created_at,
    CASE
      WHEN m.user_name IS NULL OR btrim(m.user_name) = '' THEN 'Ẩn danh'
      ELSE left(btrim(m.user_name), 1) || '••'
    END AS user_name,
    CASE
      WHEN m.user_class IS NULL OR btrim(m.user_class) = '' THEN ''
      WHEN length(btrim(m.user_class)) >= 2 THEN left(btrim(m.user_class), 2) || '•'
      ELSE left(btrim(m.user_class), 1) || '••'
    END AS user_class
  FROM public.measurements m
  WHERE (p_tree_id IS NULL OR (p_tree_id > 0 AND m.tree_id = p_tree_id))
  ORDER BY m.created_at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 100);
$function$;

-- Add comment documenting these as security-critical functions
COMMENT ON FUNCTION public.get_leaderboard_masked IS 'SECURITY-CRITICAL: Returns privacy-masked leaderboard data. Parameters validated: p_tree_number must be positive, p_limit clamped to 1-100.';
COMMENT ON FUNCTION public.get_measurements_masked IS 'SECURITY-CRITICAL: Returns privacy-masked measurement data. Parameters validated: p_tree_id must be positive, p_limit clamped to 1-100.';