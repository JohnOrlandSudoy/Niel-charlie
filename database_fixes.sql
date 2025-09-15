-- Database fixes for automatic menu item availability based on ingredient stock
-- Run these commands in your Supabase SQL editor

-- 1. Create a function to check if a menu item is available based on ingredients
CREATE OR REPLACE FUNCTION check_menu_item_availability(menu_item_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    missing_ingredients_count INTEGER;
BEGIN
    -- Count ingredients that are missing (current_stock < quantity_required)
    -- Only count non-optional ingredients
    SELECT COUNT(*)
    INTO missing_ingredients_count
    FROM menu_item_ingredients mii
    JOIN ingredients i ON mii.ingredient_id = i.id
    WHERE mii.menu_item_id = menu_item_uuid
      AND mii.is_optional = false
      AND i.current_stock < mii.quantity_required;
    
    -- Return true if no missing ingredients, false otherwise
    RETURN missing_ingredients_count = 0;
END;
$$ LANGUAGE plpgsql;

-- 2. Create a function to update all menu items availability
CREATE OR REPLACE FUNCTION update_all_menu_items_availability()
RETURNS VOID AS $$
BEGIN
    -- Update all menu items based on ingredient availability
    UPDATE menu_items 
    SET is_available = check_menu_item_availability(id),
        updated_at = NOW()
    WHERE is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 3. Create a trigger function to automatically update menu item availability
-- when ingredient stock changes
CREATE OR REPLACE FUNCTION trigger_update_menu_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- Update availability for all menu items that use this ingredient
    UPDATE menu_items 
    SET is_available = check_menu_item_availability(id),
        updated_at = NOW()
    WHERE id IN (
        SELECT DISTINCT menu_item_id 
        FROM menu_item_ingredients 
        WHERE ingredient_id = COALESCE(NEW.id, OLD.id)
    )
    AND is_active = true;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 4. Create triggers to automatically update menu availability
-- Trigger when ingredient stock is updated
CREATE OR REPLACE TRIGGER trigger_ingredient_stock_update
    AFTER UPDATE OF current_stock ON ingredients
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_menu_availability();

-- Trigger when menu item ingredients are added/updated/deleted
CREATE OR REPLACE TRIGGER trigger_menu_item_ingredients_change
    AFTER INSERT OR UPDATE OR DELETE ON menu_item_ingredients
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_menu_availability();

-- 5. Initial update - run this once to set correct availability for all items
SELECT update_all_menu_items_availability();

-- 6. Create a view for easy monitoring of menu item availability
CREATE OR REPLACE VIEW menu_items_with_availability AS
SELECT 
    mi.*,
    check_menu_item_availability(mi.id) as calculated_availability,
    CASE 
        WHEN mi.is_available != check_menu_item_availability(mi.id) 
        THEN 'MISMATCH' 
        ELSE 'OK' 
    END as availability_status,
    (
        SELECT COUNT(*)
        FROM menu_item_ingredients mii
        JOIN ingredients i ON mii.ingredient_id = i.id
        WHERE mii.menu_item_id = mi.id
          AND mii.is_optional = false
          AND i.current_stock < mii.quantity_required
    ) as missing_ingredients_count
FROM menu_items mi
WHERE mi.is_active = true;

-- 7. Create a function to manually refresh availability (for admin use)
CREATE OR REPLACE FUNCTION refresh_menu_availability()
RETURNS TABLE(
    menu_item_name VARCHAR,
    old_availability BOOLEAN,
    new_availability BOOLEAN,
    missing_ingredients_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH updated_items AS (
        UPDATE menu_items 
        SET is_available = check_menu_item_availability(id),
            updated_at = NOW()
        WHERE is_active = true
        RETURNING 
            id,
            name,
            is_available as new_availability
    )
    SELECT 
        ui.name::VARCHAR,
        mi.is_available as old_availability,
        ui.new_availability,
        (
            SELECT COUNT(*)
            FROM menu_item_ingredients mii
            JOIN ingredients i ON mii.ingredient_id = i.id
            WHERE mii.menu_item_id = ui.id
              AND mii.is_optional = false
              AND i.current_stock < mii.quantity_required
        )::INTEGER as missing_ingredients_count
    FROM updated_items ui
    JOIN menu_items mi ON ui.id = mi.id
    WHERE mi.is_available != ui.new_availability;
END;
$$ LANGUAGE plpgsql;

-- 8. Grant necessary permissions (adjust as needed for your setup)
-- GRANT EXECUTE ON FUNCTION check_menu_item_availability(UUID) TO authenticated;
-- GRANT EXECUTE ON FUNCTION update_all_menu_items_availability() TO authenticated;
-- GRANT EXECUTE ON FUNCTION refresh_menu_availability() TO authenticated;
-- GRANT SELECT ON menu_items_with_availability TO authenticated;

-- 9. Test the functions
-- Test individual item availability
-- SELECT name, is_available, check_menu_item_availability(id) as calculated 
-- FROM menu_items 
-- WHERE name LIKE '%CHICKEN PASTIL%';

-- Test the view
-- SELECT name, is_available, calculated_availability, availability_status, missing_ingredients_count
-- FROM menu_items_with_availability
-- WHERE availability_status = 'MISMATCH';

-- Test manual refresh
-- SELECT * FROM refresh_menu_availability();
