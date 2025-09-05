-- =====================================================
-- adminRestu - Complete Supabase Database Schema
-- =====================================================
-- This schema supports all requirements for Admin, Kitchen, and Cashier roles
-- Includes authentication, user management, and restaurant operations

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS AND TYPES
-- =====================================================

-- User roles
CREATE TYPE user_role AS ENUM ('admin', 'cashier', 'kitchen', 'inventory_manager');

-- Order types and statuses
CREATE TYPE order_type AS ENUM ('dine_in', 'takeout');
CREATE TYPE order_status AS ENUM ('pending', 'preparing', 'ready', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('unpaid', 'paid', 'refunded');
CREATE TYPE payment_method AS ENUM ('cash', 'gcash', 'card');

-- Stock movement types
CREATE TYPE movement_type AS ENUM ('in', 'out', 'adjustment', 'spoilage');
CREATE TYPE alert_type AS ENUM ('low_stock', 'out_of_stock', 'expiry_warning');

-- Discount types
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed_amount');

-- =====================================================
-- CORE TABLES
-- =====================================================

-- User profiles table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  username character varying NOT NULL UNIQUE,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  role user_role NOT NULL DEFAULT 'cashier',
  phone character varying,
  email character varying,
  avatar_url character varying,
  is_active boolean DEFAULT true,
  last_login timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  avatar_file bytea,
  avatar_filename character varying,
  avatar_mime_type character varying,
  avatar_size integer,
  avatar_alt_text character varying,
  avatar_uploaded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id)
);

-- Menu categories
CREATE TABLE public.menu_categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL UNIQUE,
  description text,
  image_url character varying,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  image_file bytea,
  image_filename character varying,
  image_mime_type character varying,
  image_size integer,
  image_alt_text character varying,
  image_uploaded_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  CONSTRAINT menu_categories_pkey PRIMARY KEY (id),
  CONSTRAINT menu_categories_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profiles(id),
  CONSTRAINT menu_categories_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_profiles(id)
);

-- Ingredients
CREATE TABLE public.ingredients (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL UNIQUE,
  description text,
  unit character varying NOT NULL DEFAULT 'pieces',
  current_stock numeric NOT NULL DEFAULT 0,
  min_stock_threshold numeric NOT NULL DEFAULT 0,
  max_stock_threshold numeric,
  cost_per_unit numeric,
  supplier character varying,
  category character varying,
  storage_location character varying,
  expiry_date date,
  is_active boolean DEFAULT true,
  created_by uuid,
  updated_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ingredients_pkey PRIMARY KEY (id),
  CONSTRAINT ingredients_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profiles(id),
  CONSTRAINT ingredients_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_profiles(id)
);

-- Menu items
CREATE TABLE public.menu_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  description text,
  price numeric NOT NULL,
  category_id uuid,
  image_url character varying,
  prep_time integer NOT NULL DEFAULT 0,
  is_available boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  popularity integer DEFAULT 0,
  calories integer,
  allergens text[],
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  image_file bytea,
  image_filename character varying,
  image_mime_type character varying,
  image_size integer,
  image_alt_text character varying,
  image_uploaded_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  CONSTRAINT menu_items_pkey PRIMARY KEY (id),
  CONSTRAINT menu_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profiles(id),
  CONSTRAINT menu_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.menu_categories(id),
  CONSTRAINT menu_items_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_profiles(id)
);

-- Menu item ingredients (many-to-many relationship)
CREATE TABLE public.menu_item_ingredients (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  menu_item_id uuid NOT NULL,
  ingredient_id uuid NOT NULL,
  quantity_required numeric NOT NULL,
  unit character varying NOT NULL,
  is_optional boolean DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT menu_item_ingredients_pkey PRIMARY KEY (id),
  CONSTRAINT menu_item_ingredients_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id),
  CONSTRAINT menu_item_ingredients_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profiles(id),
  CONSTRAINT menu_item_ingredients_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id)
);

-- Orders
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_number character varying NOT NULL UNIQUE,
  customer_name character varying,
  customer_phone character varying,
  order_type order_type NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  payment_method payment_method,
  subtotal numeric NOT NULL DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  tax_amount numeric DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  special_instructions text,
  table_number character varying,
  estimated_prep_time integer,
  actual_prep_time integer,
  created_by uuid NOT NULL,
  updated_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profiles(id),
  CONSTRAINT orders_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_profiles(id)
);

-- Order items
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  menu_item_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  customizations text,
  special_instructions text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_items_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(id)
);

-- Order status history
CREATE TABLE public.order_status_history (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  status character varying NOT NULL,
  notes text,
  updated_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_status_history_pkey PRIMARY KEY (id),
  CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_status_history_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.user_profiles(id)
);

-- Stock movements
CREATE TABLE public.stock_movements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  ingredient_id uuid NOT NULL,
  movement_type movement_type NOT NULL,
  quantity numeric NOT NULL,
  reason character varying,
  reference_number character varying,
  notes text,
  performed_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT stock_movements_pkey PRIMARY KEY (id),
  CONSTRAINT stock_movements_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id),
  CONSTRAINT stock_movements_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.user_profiles(id)
);

-- Stock alerts
CREATE TABLE public.stock_alerts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  ingredient_id uuid NOT NULL,
  alert_type alert_type NOT NULL,
  current_stock numeric NOT NULL,
  threshold_value numeric NOT NULL,
  message text NOT NULL,
  is_resolved boolean DEFAULT false,
  resolved_by uuid,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT stock_alerts_pkey PRIMARY KEY (id),
  CONSTRAINT stock_alerts_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.user_profiles(id),
  CONSTRAINT stock_alerts_ingredient_id_fkey FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id)
);

-- Discounts
CREATE TABLE public.discounts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  code character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  description text,
  discount_type discount_type NOT NULL,
  discount_value numeric NOT NULL,
  minimum_order_amount numeric DEFAULT 0,
  maximum_discount_amount numeric,
  is_active boolean DEFAULT true,
  valid_from timestamp with time zone DEFAULT now(),
  valid_until timestamp with time zone,
  usage_limit integer,
  used_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT discounts_pkey PRIMARY KEY (id),
  CONSTRAINT discounts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_profiles(id)
);

-- Order discounts
CREATE TABLE public.order_discounts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  discount_id uuid NOT NULL,
  discount_amount numeric NOT NULL,
  applied_at timestamp with time zone DEFAULT now(),
  CONSTRAINT order_discounts_pkey PRIMARY KEY (id),
  CONSTRAINT order_discounts_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id),
  CONSTRAINT order_discounts_discount_id_fkey FOREIGN KEY (discount_id) REFERENCES public.discounts(id)
);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
    order_num text;
    counter integer;
BEGIN
    -- Get current date in YYYYMMDD format
    order_num := to_char(CURRENT_DATE, 'YYYYMMDD');
    
    -- Get count of orders for today
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 9) AS integer)), 0) + 1
    INTO counter
    FROM orders
    WHERE order_number LIKE order_num || '%';
    
    -- Format as YYYYMMDD-XXX
    order_num := order_num || '-' || LPAD(counter::text, 3, '0');
    
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order numbers
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS trigger AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_number();

-- Function to update stock levels
CREATE OR REPLACE FUNCTION update_stock_level()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update ingredient stock based on movement type
        IF NEW.movement_type = 'in' THEN
            UPDATE ingredients 
            SET current_stock = current_stock + NEW.quantity,
                updated_at = now()
            WHERE id = NEW.ingredient_id;
        ELSIF NEW.movement_type = 'out' OR NEW.movement_type = 'spoilage' THEN
            UPDATE ingredients 
            SET current_stock = current_stock - NEW.quantity,
                updated_at = now()
            WHERE id = NEW.ingredient_id;
        ELSIF NEW.movement_type = 'adjustment' THEN
            UPDATE ingredients 
            SET current_stock = NEW.quantity,
                updated_at = now()
            WHERE id = NEW.ingredient_id;
        END IF;
        
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_stock_level
    AFTER INSERT ON stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_level();

-- Function to check stock alerts
CREATE OR REPLACE FUNCTION check_stock_alerts()
RETURNS trigger AS $$
DECLARE
    alert_msg text;
BEGIN
    -- Check for low stock
    IF NEW.current_stock <= NEW.min_stock_threshold AND NEW.current_stock > 0 THEN
        alert_msg := 'Low stock alert: ' || NEW.name || ' has ' || NEW.current_stock || ' ' || NEW.unit || ' remaining.';
        
        INSERT INTO stock_alerts (ingredient_id, alert_type, current_stock, threshold_value, message)
        VALUES (NEW.id, 'low_stock', NEW.current_stock, NEW.min_stock_threshold, alert_msg);
    END IF;
    
    -- Check for out of stock
    IF NEW.current_stock <= 0 THEN
        alert_msg := 'Out of stock: ' || NEW.name || ' is completely out of stock.';
        
        INSERT INTO stock_alerts (ingredient_id, alert_type, current_stock, threshold_value, message)
        VALUES (NEW.id, 'out_of_stock', NEW.current_stock, 0, alert_msg);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_stock_alerts
    AFTER UPDATE ON ingredients
    FOR EACH ROW
    EXECUTE FUNCTION check_stock_alerts();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_discounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for orders
CREATE POLICY "Users can view orders they created" ON public.orders
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Kitchen can view all orders" ON public.orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'kitchen')
        )
    );

CREATE POLICY "Cashiers can create orders" ON public.orders
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'cashier')
        )
    );

-- RLS Policies for menu items
CREATE POLICY "Everyone can view active menu items" ON public.menu_items
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage menu items" ON public.menu_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for ingredients
CREATE POLICY "Everyone can view ingredients" ON public.ingredients
    FOR SELECT USING (true);

CREATE POLICY "Inventory managers can manage ingredients" ON public.ingredients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'inventory_manager')
        )
    );

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_username ON public.user_profiles(username);
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);

-- Orders indexes
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);
CREATE INDEX idx_orders_created_by ON public.orders(created_by);

-- Menu items indexes
CREATE INDEX idx_menu_items_category ON public.menu_items(category_id);
CREATE INDEX idx_menu_items_available ON public.menu_items(is_available);
CREATE INDEX idx_menu_items_featured ON public.menu_items(is_featured);

-- Ingredients indexes
CREATE INDEX idx_ingredients_category ON public.ingredients(category);
CREATE INDEX idx_ingredients_stock ON public.ingredients(current_stock);
CREATE INDEX idx_ingredients_active ON public.ingredients(is_active);

-- Stock movements indexes
CREATE INDEX idx_stock_movements_ingredient ON public.stock_movements(ingredient_id);
CREATE INDEX idx_stock_movements_date ON public.stock_movements(created_at);
CREATE INDEX idx_stock_movements_type ON public.stock_movements(movement_type);

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Insert sample menu categories
INSERT INTO public.menu_categories (name, description, sort_order) VALUES
('Main Dishes', 'Hearty main course meals', 1),
('Appetizers', 'Light starters and snacks', 2),
('Beverages', 'Drinks and refreshments', 3),
('Desserts', 'Sweet treats and desserts', 4);

-- Insert sample ingredients
INSERT INTO public.ingredients (name, description, unit, current_stock, min_stock_threshold, cost_per_unit, category) VALUES
('Rice', 'White jasmine rice', 'kg', 50, 10, 45.00, 'Grains'),
('Chicken', 'Fresh chicken breast', 'kg', 25, 5, 180.00, 'Meat'),
('Beef', 'Fresh beef sirloin', 'kg', 15, 3, 350.00, 'Meat'),
('Pork', 'Fresh pork belly', 'kg', 20, 4, 280.00, 'Meat'),
('Onions', 'Fresh white onions', 'kg', 10, 2, 60.00, 'Vegetables'),
('Garlic', 'Fresh garlic cloves', 'kg', 5, 1, 120.00, 'Vegetables'),
('Tomatoes', 'Fresh red tomatoes', 'kg', 8, 2, 80.00, 'Vegetables'),
('Cooking Oil', 'Vegetable cooking oil', 'liter', 20, 5, 85.00, 'Cooking Essentials'),
('Salt', 'Table salt', 'kg', 10, 2, 25.00, 'Seasonings'),
('Black Pepper', 'Ground black pepper', 'kg', 2, 0.5, 200.00, 'Seasonings');

-- Insert sample menu items
INSERT INTO public.menu_items (name, description, price, category_id, prep_time, calories) VALUES
('Adobo', 'Classic Filipino chicken adobo with soy sauce and vinegar', 120.00, (SELECT id FROM menu_categories WHERE name = 'Main Dishes'), 30, 350),
('Sinigang', 'Sour soup with pork and vegetables', 150.00, (SELECT id FROM menu_categories WHERE name = 'Main Dishes'), 45, 280),
('Lechon Kawali', 'Crispy fried pork belly', 200.00, (SELECT id FROM menu_categories WHERE name = 'Main Dishes'), 60, 450),
('Lumpia', 'Fresh spring rolls with vegetables', 80.00, (SELECT id FROM menu_categories WHERE name = 'Appetizers'), 15, 120),
('Calamari', 'Crispy fried squid rings', 100.00, (SELECT id FROM menu_categories WHERE name = 'Appetizers'), 20, 180),
('Coke', 'Refreshing cola drink', 25.00, (SELECT id FROM menu_categories WHERE name = 'Beverages'), 0, 140),
('Iced Tea', 'Sweet iced tea', 20.00, (SELECT id FROM menu_categories WHERE name = 'Beverages'), 0, 80),
('Halo-Halo', 'Traditional Filipino dessert with mixed ingredients', 60.00, (SELECT id FROM menu_categories WHERE name = 'Desserts'), 10, 200);

-- Insert sample menu item ingredients
INSERT INTO public.menu_item_ingredients (menu_item_id, ingredient_id, quantity_required, unit) VALUES
-- Adobo ingredients
((SELECT id FROM menu_items WHERE name = 'Adobo'), (SELECT id FROM ingredients WHERE name = 'Chicken'), 0.3, 'kg'),
((SELECT id FROM menu_items WHERE name = 'Adobo'), (SELECT id FROM ingredients WHERE name = 'Onions'), 0.1, 'kg'),
((SELECT id FROM menu_items WHERE name = 'Adobo'), (SELECT id FROM ingredients WHERE name = 'Garlic'), 0.05, 'kg'),
((SELECT id FROM menu_items WHERE name = 'Adobo'), (SELECT id FROM ingredients WHERE name = 'Cooking Oil'), 0.02, 'liter'),
-- Sinigang ingredients
((SELECT id FROM menu_items WHERE name = 'Sinigang'), (SELECT id FROM ingredients WHERE name = 'Pork'), 0.25, 'kg'),
((SELECT id FROM menu_items WHERE name = 'Sinigang'), (SELECT id FROM ingredients WHERE name = 'Tomatoes'), 0.15, 'kg'),
((SELECT id FROM menu_items WHERE name = 'Sinigang'), (SELECT id FROM ingredients WHERE name = 'Onions'), 0.1, 'kg'),
-- Lechon Kawali ingredients
((SELECT id FROM menu_items WHERE name = 'Lechon Kawali'), (SELECT id FROM ingredients WHERE name = 'Pork'), 0.4, 'kg'),
((SELECT id FROM menu_items WHERE name = 'Lechon Kawali'), (SELECT id FROM ingredients WHERE name = 'Cooking Oil'), 0.1, 'liter'),
((SELECT id FROM menu_items WHERE name = 'Lechon Kawali'), (SELECT id FROM ingredients WHERE name = 'Salt'), 0.01, 'kg');

-- Insert sample discounts
INSERT INTO public.discounts (code, name, description, discount_type, discount_value, minimum_order_amount, is_active) VALUES
('WELCOME10', 'Welcome Discount', '10% off for new customers', 'percentage', 10, 100, true),
('CASH5', 'Cash Payment Discount', '5% off for cash payments', 'percentage', 5, 50, true),
('FIXED20', 'Fixed Amount Discount', '20 pesos off orders above 200', 'fixed_amount', 20, 200, true);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for order summary with customer info
CREATE VIEW order_summary AS
SELECT 
    o.id,
    o.order_number,
    o.customer_name,
    o.customer_phone,
    o.order_type,
    o.status,
    o.payment_status,
    o.payment_method,
    o.subtotal,
    o.discount_amount,
    o.tax_amount,
    o.total_amount,
    o.table_number,
    o.created_at,
    o.estimated_prep_time,
    o.actual_prep_time,
    u.first_name || ' ' || u.last_name as created_by_name
FROM orders o
LEFT JOIN user_profiles u ON o.created_by = u.id;

-- View for low stock ingredients
CREATE VIEW low_stock_ingredients AS
SELECT 
    i.id,
    i.name,
    i.current_stock,
    i.min_stock_threshold,
    i.unit,
    i.category,
    CASE 
        WHEN i.current_stock <= 0 THEN 'Out of Stock'
        WHEN i.current_stock <= i.min_stock_threshold THEN 'Low Stock'
        ELSE 'In Stock'
    END as stock_status
FROM ingredients i
WHERE i.current_stock <= i.min_stock_threshold OR i.current_stock <= 0;

-- View for menu items with availability
CREATE VIEW menu_items_available AS
SELECT 
    mi.id,
    mi.name,
    mi.description,
    mi.price,
    mi.prep_time,
    mi.calories,
    mi.is_available,
    mi.is_featured,
    mc.name as category_name,
    CASE 
        WHEN mi.is_available = false THEN false
        WHEN EXISTS (
            SELECT 1 FROM menu_item_ingredients mii
            JOIN ingredients i ON mii.ingredient_id = i.id
            WHERE mii.menu_item_id = mi.id 
            AND i.current_stock < mii.quantity_required
        ) THEN false
        ELSE true
    END as actually_available
FROM menu_items mi
LEFT JOIN menu_categories mc ON mi.category_id = mc.id
WHERE mi.is_active = true;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

-- This completes the database schema setup
-- You can now:
-- 1. Run this script in your Supabase SQL editor
-- 2. Set up Row Level Security policies as needed
-- 3. Create your first admin user through the application
-- 4. Start using the restaurant management system

SELECT 'Database schema setup completed successfully!' as status;
