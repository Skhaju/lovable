
-- ============ AUTH: profiles + roles ============
CREATE TYPE public.app_role AS ENUM ('admin', 'staff');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'staff',
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Auto-create profile + default staff role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'staff');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============ MASTER DATA ============
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write categories" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER categories_touch BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(5,2) NOT NULL DEFAULT 5,
  type TEXT NOT NULL DEFAULT 'veg',
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.items TO authenticated;
GRANT ALL ON public.items TO service_role;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read items" ON public.items FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write items" ON public.items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER items_touch BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.dining_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  capacity INT NOT NULL DEFAULT 2,
  status TEXT NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dining_tables TO authenticated;
GRANT ALL ON public.dining_tables TO service_role;
ALTER TABLE public.dining_tables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read tables" ON public.dining_tables FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write tables" ON public.dining_tables FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER tables_touch BEFORE UPDATE ON public.dining_tables FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ SETTINGS (single row keyed by 'default') ============
CREATE TABLE public.settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  restaurant_name TEXT NOT NULL DEFAULT 'Adapt Restaurant',
  phone TEXT,
  email TEXT,
  gst_number TEXT,
  address TEXT,
  currency_symbol TEXT NOT NULL DEFAULT '₹',
  printer_size TEXT NOT NULL DEFAULT '80mm',
  bill_footer TEXT,
  tax_enabled BOOLEAN NOT NULL DEFAULT true,
  show_gst BOOLEAN NOT NULL DEFAULT true,
  logo_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read settings" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth write settings" ON public.settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER settings_touch BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
INSERT INTO public.settings (id) VALUES ('default') ON CONFLICT DO NOTHING;

-- ============ ORDERS / BILLS / PAYMENTS ============
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE DEFAULT ('ORD-' || to_char(now(),'YYMMDDHH24MISS')),
  table_id UUID REFERENCES public.dining_tables(id) ON DELETE SET NULL,
  table_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth orders all" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  qty INT NOT NULL DEFAULT 1,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth order_items all" ON public.order_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  mode TEXT NOT NULL DEFAULT 'cash',
  status TEXT NOT NULL DEFAULT 'paid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth payments all" ON public.payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ SEED ============
INSERT INTO public.categories (name, sort_order) VALUES
  ('Starters',1),('Main Course',2),('Breads',3),('Rice & Biryani',4),('Beverages',5),('Desserts',6);

INSERT INTO public.dining_tables (name, capacity) VALUES
  ('T-01',2),('T-02',4),('T-03',4),('T-04',6),('T-05',2),('T-06',4),
  ('T-07',8),('T-08',4),('T-09',2),('T-10',6);

WITH c AS (SELECT id, name FROM public.categories)
INSERT INTO public.items (category_id, name, price, type)
SELECT c.id, v.name, v.price, v.type FROM c JOIN (VALUES
  ('Starters','Paneer Tikka',240,'veg'),
  ('Starters','Chicken 65',280,'nonveg'),
  ('Main Course','Butter Chicken',320,'nonveg'),
  ('Main Course','Paneer Butter Masala',280,'veg'),
  ('Main Course','Dal Makhani',220,'veg'),
  ('Breads','Butter Naan',60,'veg'),
  ('Breads','Garlic Naan',80,'veg'),
  ('Rice & Biryani','Chicken Biryani',290,'nonveg'),
  ('Rice & Biryani','Veg Biryani',220,'veg'),
  ('Beverages','Masala Chai',40,'veg'),
  ('Beverages','Fresh Lime Soda',80,'veg'),
  ('Desserts','Gulab Jamun',90,'veg')
) AS v(cat,name,price,type) ON v.cat = c.name;
