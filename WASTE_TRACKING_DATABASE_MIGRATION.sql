-- Waste, Spillage & Spoilage Feature - Database Migration
-- PostgreSQL / Supabase
-- Created: November 13, 2025

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. CREATE WASTE_CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS waste_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  
  category_name VARCHAR(100) NOT NULL,
  category_type VARCHAR(50) NOT NULL, -- 'prep', 'cooking', 'storage', 'holding', 'other'
  target_waste_percentage DECIMAL(5, 2) DEFAULT 5.00, -- e.g., 5% expected waste
  description TEXT,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_category_per_restaurant UNIQUE(restaurant_id, category_name)
);

CREATE INDEX idx_waste_categories_restaurant_id ON waste_categories(restaurant_id);
CREATE INDEX idx_waste_categories_is_active ON waste_categories(is_active) WHERE is_active = true;

-- ============================================================================
-- 2. CREATE WASTE_LOGS TABLE (Main waste tracking table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS waste_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  
  -- Waste Details
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  waste_type VARCHAR(50) NOT NULL, -- 'spoilage', 'spillage', 'other'
  quantity_wasted DECIMAL(10, 3) NOT NULL CHECK (quantity_wasted > 0),
  unit VARCHAR(50) NOT NULL, -- 'kg', 'L', 'pieces', 'g', 'ml', etc.
  
  -- Reason & Description
  reason VARCHAR(255) NOT NULL, -- 'expired', 'damaged_container', 'dropped', 'discolored', 'odor', 'other'
  description TEXT,
  notes TEXT,
  
  -- Reporting Information
  reported_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_by_name VARCHAR(255) NOT NULL,
  timestamp_reported TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Manager Resolution
  reported_to_manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  manager_notes TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Cost & Batch Information
  estimated_cost DECIMAL(10, 2), -- Calculated from ingredient.cost_per_unit * quantity_wasted
  batch_id VARCHAR(100), -- If part of a batch spoilage event
  
  -- Kitchen Location & Shift
  location_in_kitchen VARCHAR(100), -- 'Fridge', 'Freezer', 'Dry Storage', 'Prep Area', etc.
  shift VARCHAR(50) DEFAULT 'morning', -- 'morning', 'afternoon', 'night'
  
  -- Waste Category (optional association)
  waste_category_id UUID REFERENCES waste_categories(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for fast queries
CREATE INDEX idx_waste_logs_restaurant_id ON waste_logs(restaurant_id);
CREATE INDEX idx_waste_logs_ingredient_id ON waste_logs(ingredient_id);
CREATE INDEX idx_waste_logs_timestamp_reported ON waste_logs(timestamp_reported DESC);
CREATE INDEX idx_waste_logs_waste_type ON waste_logs(waste_type);
CREATE INDEX idx_waste_logs_reason ON waste_logs(reason);
CREATE INDEX idx_waste_logs_shift ON waste_logs(shift);
CREATE INDEX idx_waste_logs_is_resolved ON waste_logs(is_resolved) WHERE is_resolved = false;
CREATE INDEX idx_waste_logs_reported_by ON waste_logs(reported_by_user_id);
CREATE INDEX idx_waste_logs_batch_id ON waste_logs(batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX idx_waste_logs_created_date ON waste_logs(DATE(created_at));

-- ============================================================================
-- 3. CREATE WASTE_STATISTICS TABLE (Materialized view table for performance)
-- ============================================================================
CREATE TABLE IF NOT EXISTS waste_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  
  -- Date for aggregation
  date_recorded DATE NOT NULL,
  
  -- Quantities
  total_waste_quantity DECIMAL(12, 3) DEFAULT 0,
  total_waste_cost DECIMAL(12, 2) DEFAULT 0,
  waste_count INTEGER DEFAULT 0,
  
  -- Breakdowns
  spoilage_quantity DECIMAL(12, 3) DEFAULT 0,
  spoilage_cost DECIMAL(12, 2) DEFAULT 0,
  spillage_quantity DECIMAL(12, 3) DEFAULT 0,
  spillage_cost DECIMAL(12, 2) DEFAULT 0,
  other_quantity DECIMAL(12, 3) DEFAULT 0,
  other_cost DECIMAL(12, 2) DEFAULT 0,
  
  -- Top wastes
  top_wasted_ingredient_id UUID,
  top_wasted_ingredient_name VARCHAR(255),
  top_waste_quantity DECIMAL(10, 3),
  
  -- Shift breakdown
  morning_waste_quantity DECIMAL(10, 3) DEFAULT 0,
  afternoon_waste_quantity DECIMAL(10, 3) DEFAULT 0,
  night_waste_quantity DECIMAL(10, 3) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_date_per_restaurant UNIQUE(restaurant_id, date_recorded)
);

CREATE INDEX idx_waste_statistics_restaurant_id ON waste_statistics(restaurant_id);
CREATE INDEX idx_waste_statistics_date ON waste_statistics(date_recorded DESC);

-- ============================================================================
-- 4. CREATE VIEWS FOR EASY QUERYING
-- ============================================================================

-- View: Recent Waste Reports (last 30 days)
CREATE OR REPLACE VIEW recent_waste_reports AS
SELECT 
  wl.id,
  wl.restaurant_id,
  wl.ingredient_id,
  i.name AS ingredient_name,
  wl.waste_type,
  wl.quantity_wasted,
  wl.unit,
  wl.reason,
  wl.reported_by_name,
  wl.timestamp_reported,
  wl.estimated_cost,
  wl.location_in_kitchen,
  wl.shift,
  wl.is_resolved,
  wl.manager_notes
FROM waste_logs wl
LEFT JOIN ingredients i ON wl.ingredient_id = i.id
WHERE wl.timestamp_reported > NOW() - INTERVAL '30 days'
ORDER BY wl.timestamp_reported DESC;

-- View: Unresolved Waste Reports
CREATE OR REPLACE VIEW unresolved_waste_reports AS
SELECT 
  wl.*,
  i.name AS ingredient_name,
  i.current_stock,
  i.unit AS ingredient_unit,
  i.cost_per_unit
FROM waste_logs wl
LEFT JOIN ingredients i ON wl.ingredient_id = i.id
WHERE wl.is_resolved = false
ORDER BY wl.timestamp_reported DESC;

-- View: Daily Waste Summary
CREATE OR REPLACE VIEW daily_waste_summary AS
SELECT 
  restaurant_id,
  DATE(timestamp_reported) AS date,
  COUNT(*) as report_count,
  SUM(quantity_wasted) as total_quantity,
  SUM(estimated_cost) as total_cost,
  COUNT(DISTINCT ingredient_id) as unique_ingredients,
  ARRAY_AGG(DISTINCT waste_type) as waste_types,
  ARRAY_AGG(DISTINCT reason) as reasons
FROM waste_logs
GROUP BY restaurant_id, DATE(timestamp_reported)
ORDER BY DATE(timestamp_reported) DESC;

-- ============================================================================
-- 5. CREATE TRIGGERS FOR AUTOMATIC INVENTORY MOVEMENT
-- ============================================================================

-- Trigger function: Create inventory movement when waste is logged
CREATE OR REPLACE FUNCTION create_waste_inventory_movement()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into inventory_movements table to deduct from current_stock
  INSERT INTO inventory_movements (
    ingredient_id,
    movement_type,
    quantity_moved,
    reference_id,
    reference_type,
    notes,
    created_by,
    restaurant_id
  ) VALUES (
    NEW.ingredient_id,
    'spoilage',
    NEW.quantity_wasted,
    NEW.id,
    'waste_log',
    CONCAT('Waste report: ', NEW.waste_type, ' - ', NEW.reason, '. ', COALESCE(NEW.description, '')),
    NEW.reported_by_user_id,
    NEW.restaurant_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF NOT EXISTS trigger_waste_inventory_movement ON waste_logs;
CREATE TRIGGER trigger_waste_inventory_movement
AFTER INSERT ON waste_logs
FOR EACH ROW
EXECUTE FUNCTION create_waste_inventory_movement();

-- ============================================================================
-- 6. CREATE FUNCTION TO CALCULATE WASTE STATISTICS
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_daily_waste_statistics(p_restaurant_id UUID, p_date DATE)
RETURNS TABLE (
  total_quantity DECIMAL,
  total_cost DECIMAL,
  waste_count BIGINT,
  spoilage_qty DECIMAL,
  spillage_qty DECIMAL,
  top_ingredient TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(wl.quantity_wasted), 0) as total_quantity,
    COALESCE(SUM(wl.estimated_cost), 0) as total_cost,
    COUNT(*) as waste_count,
    COALESCE(SUM(CASE WHEN wl.waste_type = 'spoilage' THEN wl.quantity_wasted ELSE 0 END), 0) as spoilage_qty,
    COALESCE(SUM(CASE WHEN wl.waste_type = 'spillage' THEN wl.quantity_wasted ELSE 0 END), 0) as spillage_qty,
    MAX(i.name) as top_ingredient
  FROM waste_logs wl
  LEFT JOIN ingredients i ON wl.ingredient_id = i.id
  WHERE wl.restaurant_id = p_restaurant_id
    AND DATE(wl.timestamp_reported) = p_date;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. CREATE FUNCTION TO UPDATE WASTE STATISTICS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_waste_statistics()
RETURNS TRIGGER AS $$
DECLARE
  v_date DATE;
  v_total_qty DECIMAL;
  v_total_cost DECIMAL;
  v_count INTEGER;
BEGIN
  v_date := DATE(NEW.timestamp_reported);
  
  -- Calculate totals for the day
  SELECT 
    COALESCE(SUM(quantity_wasted), 0),
    COALESCE(SUM(estimated_cost), 0),
    COUNT(*)
  INTO v_total_qty, v_total_cost, v_count
  FROM waste_logs
  WHERE restaurant_id = NEW.restaurant_id
    AND DATE(timestamp_reported) = v_date;
  
  -- Update or insert into waste_statistics
  INSERT INTO waste_statistics (
    restaurant_id,
    date_recorded,
    total_waste_quantity,
    total_waste_cost,
    waste_count,
    spoilage_quantity,
    spillage_quantity,
    created_at,
    updated_at
  ) VALUES (
    NEW.restaurant_id,
    v_date,
    v_total_qty,
    v_total_cost,
    v_count,
    (SELECT COALESCE(SUM(quantity_wasted), 0) FROM waste_logs WHERE restaurant_id = NEW.restaurant_id AND DATE(timestamp_reported) = v_date AND waste_type = 'spoilage'),
    (SELECT COALESCE(SUM(quantity_wasted), 0) FROM waste_logs WHERE restaurant_id = NEW.restaurant_id AND DATE(timestamp_reported) = v_date AND waste_type = 'spillage'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  ON CONFLICT (restaurant_id, date_recorded) DO UPDATE SET
    total_waste_quantity = v_total_qty,
    total_waste_cost = v_total_cost,
    waste_count = v_count,
    spoilage_quantity = (SELECT COALESCE(SUM(quantity_wasted), 0) FROM waste_logs WHERE restaurant_id = NEW.restaurant_id AND DATE(timestamp_reported) = v_date AND waste_type = 'spoilage'),
    spillage_quantity = (SELECT COALESCE(SUM(quantity_wasted), 0) FROM waste_logs WHERE restaurant_id = NEW.restaurant_id AND DATE(timestamp_reported) = v_date AND waste_type = 'spillage'),
    updated_at = CURRENT_TIMESTAMP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for statistics update
DROP TRIGGER IF NOT EXISTS trigger_update_waste_statistics ON waste_logs;
CREATE TRIGGER trigger_update_waste_statistics
AFTER INSERT ON waste_logs
FOR EACH ROW
EXECUTE FUNCTION update_waste_statistics();

-- ============================================================================
-- 8. CREATE STORED PROCEDURE FOR WASTE REPORTS
-- ============================================================================

CREATE OR REPLACE FUNCTION report_waste(
  p_restaurant_id UUID,
  p_ingredient_id UUID,
  p_waste_type VARCHAR,
  p_quantity_wasted DECIMAL,
  p_unit VARCHAR,
  p_reason VARCHAR,
  p_description TEXT,
  p_reported_by_user_id UUID,
  p_reported_by_name VARCHAR,
  p_location_in_kitchen VARCHAR,
  p_shift VARCHAR DEFAULT 'morning'
)
RETURNS TABLE (
  waste_log_id UUID,
  success BOOLEAN,
  message VARCHAR
) AS $$
DECLARE
  v_ingredient_cost DECIMAL;
  v_estimated_cost DECIMAL;
  v_waste_log_id UUID;
BEGIN
  -- Get ingredient cost per unit
  SELECT cost_per_unit INTO v_ingredient_cost
  FROM ingredients
  WHERE id = p_ingredient_id;
  
  -- Calculate estimated cost
  v_estimated_cost := p_quantity_wasted * v_ingredient_cost;
  
  -- Insert waste log
  INSERT INTO waste_logs (
    restaurant_id,
    ingredient_id,
    waste_type,
    quantity_wasted,
    unit,
    reason,
    description,
    reported_by_user_id,
    reported_by_name,
    location_in_kitchen,
    shift,
    estimated_cost,
    created_at,
    updated_at
  ) VALUES (
    p_restaurant_id,
    p_ingredient_id,
    p_waste_type,
    p_quantity_wasted,
    p_unit,
    p_reason,
    p_description,
    p_reported_by_user_id,
    p_reported_by_name,
    p_location_in_kitchen,
    p_shift,
    v_estimated_cost,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
  RETURNING waste_logs.id INTO v_waste_log_id;
  
  RETURN QUERY SELECT 
    v_waste_log_id,
    TRUE,
    'Waste reported successfully'::VARCHAR;
  
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT 
    NULL::UUID,
    FALSE,
    CONCAT('Error reporting waste: ', SQLERRM)::VARCHAR;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. CREATE AUDIT LOG TABLE (for compliance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS waste_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  waste_log_id UUID NOT NULL REFERENCES waste_logs(id) ON DELETE CASCADE,
  
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'resolved', 'deleted'
  action_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_by_name VARCHAR(255),
  action_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  old_values JSONB,
  new_values JSONB,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_waste_audit_log_waste_log_id ON waste_audit_log(waste_log_id);
CREATE INDEX idx_waste_audit_log_action ON waste_audit_log(action);
CREATE INDEX idx_waste_audit_log_timestamp ON waste_audit_log(action_timestamp DESC);

-- ============================================================================
-- 10. INSERT DEFAULT WASTE CATEGORIES
-- ============================================================================

INSERT INTO waste_categories (restaurant_id, category_name, category_type, target_waste_percentage, description)
SELECT 
  id,
  'Vegetable Prep',
  'prep',
  8.5,
  'Waste from peeling, trimming, and preparing vegetables'
FROM restaurants
WHERE NOT EXISTS (
  SELECT 1 FROM waste_categories WHERE category_name = 'Vegetable Prep'
)
ON CONFLICT DO NOTHING;

INSERT INTO waste_categories (restaurant_id, category_name, category_type, target_waste_percentage, description)
SELECT 
  id,
  'Meat Processing',
  'prep',
  12.0,
  'Waste from butchering, trimming, and processing meat'
FROM restaurants
WHERE NOT EXISTS (
  SELECT 1 FROM waste_categories WHERE category_name = 'Meat Processing'
)
ON CONFLICT DO NOTHING;

INSERT INTO waste_categories (restaurant_id, category_name, category_type, target_waste_percentage, description)
SELECT 
  id,
  'Storage & Spoilage',
  'storage',
  5.0,
  'Waste from expired or spoiled ingredients in storage'
FROM restaurants
WHERE NOT EXISTS (
  SELECT 1 FROM waste_categories WHERE category_name = 'Storage & Spoilage'
)
ON CONFLICT DO NOTHING;

INSERT INTO waste_categories (restaurant_id, category_name, category_type, target_waste_percentage, description)
SELECT 
  id,
  'Cooking Accidents',
  'cooking',
  2.0,
  'Waste from overcooking, burning, or accidental spillage'
FROM restaurants
WHERE NOT EXISTS (
  SELECT 1 FROM waste_categories WHERE category_name = 'Cooking Accidents'
)
ON CONFLICT DO NOTHING;

INSERT INTO waste_categories (restaurant_id, category_name, category_type, target_waste_percentage, description)
SELECT 
  id,
  'Plate Returns',
  'other',
  3.0,
  'Waste from returned/uneaten food'
FROM restaurants
WHERE NOT EXISTS (
  SELECT 1 FROM waste_categories WHERE category_name = 'Plate Returns'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 11. ENABLE ROW LEVEL SECURITY (if using Supabase)
-- ============================================================================

-- Enable RLS on waste_logs
ALTER TABLE waste_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see waste logs from their restaurant
CREATE POLICY waste_logs_read_policy ON waste_logs
FOR SELECT USING (
  restaurant_id IN (
    SELECT restaurant_id FROM staff_assignments WHERE user_id = auth.uid()
  )
);

-- Policy: Users can insert waste logs
CREATE POLICY waste_logs_insert_policy ON waste_logs
FOR INSERT WITH CHECK (
  restaurant_id IN (
    SELECT restaurant_id FROM staff_assignments WHERE user_id = auth.uid()
  )
);

-- Policy: Managers can update/resolve waste logs
CREATE POLICY waste_logs_update_policy ON waste_logs
FOR UPDATE USING (
  restaurant_id IN (
    SELECT restaurant_id FROM staff_assignments WHERE user_id = auth.uid()
  ) AND
  EXISTS (
    SELECT 1 FROM staff_assignments 
    WHERE user_id = auth.uid() AND role IN ('manager', 'admin')
  )
);

-- Enable RLS on waste_categories
ALTER TABLE waste_categories ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see categories from their restaurant
CREATE POLICY waste_categories_read_policy ON waste_categories
FOR SELECT USING (
  restaurant_id IN (
    SELECT restaurant_id FROM staff_assignments WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary of created objects:
-- Tables:
--   - waste_categories (waste category definitions)
--   - waste_logs (main waste tracking table)
--   - waste_statistics (aggregated daily statistics)
--   - waste_audit_log (compliance audit trail)
--
-- Views:
--   - recent_waste_reports (last 30 days)
--   - unresolved_waste_reports (pending manager action)
--   - daily_waste_summary (daily aggregates)
--
-- Triggers:
--   - trigger_waste_inventory_movement (auto-deduct from inventory)
--   - trigger_update_waste_statistics (auto-update daily stats)
--
-- Functions:
--   - create_waste_inventory_movement()
--   - calculate_daily_waste_statistics()
--   - update_waste_statistics()
--   - report_waste() (main procedure)
--
-- RLS Policies:
--   - Row-level security enabled for restaurant isolation
--
-- Default Data:
--   - 5 default waste categories inserted
