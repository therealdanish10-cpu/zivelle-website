-- =============================================================================
-- ZIVELLE — LUXURY JEWELRY ECOMMERCE
-- Supabase Database Schema & Initial Seed Data
-- =============================================================================
-- Instructions:
-- Run this entire script in your Supabase Project SQL Editor:
-- Project URL: https://aekbgnrqnijeklpylrrs.supabase.co
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Create Tables
-- -----------------------------------------------------------------------------

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- Chains, Bracelets, Rings, Earrings
    price NUMERIC NOT NULL,
    image_url TEXT NOT NULL, -- Primary thumbnail image
    image_urls JSONB DEFAULT '[]'::jsonb, -- Array of all product photo URLs
    badge TEXT, -- Bestseller, Signature, New, Popular, or NULL
    variants JSONB DEFAULT '[]'::jsonb, -- e.g. ["16\"", "18\"", "20\""] or rich variant objects
    in_stock BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    purchased_product TEXT,
    photo_url TEXT, -- Optional customer attached photo URL
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Migrations for Existing Database
-- -----------------------------------------------------------------------------

-- 1. Add image_urls column to products and backfill from image_url
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;

UPDATE public.products 
SET image_urls = jsonb_build_array(image_url) 
WHERE (image_urls IS NULL OR image_urls = '[]'::jsonb) AND image_url IS NOT NULL AND image_url <> '';

-- 2. Add status & photo_url columns to reviews and approve existing admin reviews
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' 
CHECK (status IN ('pending', 'approved'));

ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

UPDATE public.reviews 
SET status = 'approved' 
WHERE status IS NULL OR status = 'pending';

-- -----------------------------------------------------------------------------
-- 2. Enable Row Level Security (RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 3. RLS Policies: Public Access (Storefront & Customer Review Submission)
-- -----------------------------------------------------------------------------

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Allow public select on products" ON public.products;
DROP POLICY IF EXISTS "Allow public select on reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow public insert on reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow authenticated insert on products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated update on products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated delete on products" ON public.products;
DROP POLICY IF EXISTS "Allow authenticated select on reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow authenticated insert on reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow authenticated update on reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow authenticated delete on reviews" ON public.reviews;

-- Public can read all active products
CREATE POLICY "Allow public select on products"
ON public.products FOR SELECT
TO anon, authenticated
USING (true);

-- Public Storefront can ONLY read approved reviews (pending reviews remain hidden)
CREATE POLICY "Allow public select on reviews"
ON public.reviews FOR SELECT
TO anon, authenticated
USING (status = 'approved');

-- Customers can submit (INSERT) new pending reviews without logging in
CREATE POLICY "Allow public insert on reviews"
ON public.reviews FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- 4. RLS Policies: Authenticated Admin Access (Admin Panel & Approval)
-- -----------------------------------------------------------------------------
CREATE POLICY "Allow authenticated insert on products"
ON public.products FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on products"
ON public.products FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on products"
ON public.products FOR DELETE
TO authenticated
USING (true);

-- Authenticated admins can view ALL reviews (including pending awaiting approval)
CREATE POLICY "Allow authenticated select on reviews"
ON public.reviews FOR SELECT
TO authenticated
USING (true);

-- Authenticated admins can approve/update any review
CREATE POLICY "Allow authenticated update on reviews"
ON public.reviews FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Authenticated admins can reject/delete any review
CREATE POLICY "Allow authenticated delete on reviews"
ON public.reviews FOR DELETE
TO authenticated
USING (true);

-- -----------------------------------------------------------------------------
-- 5. Seed Data: 8 Existing Products
-- -----------------------------------------------------------------------------
INSERT INTO public.products (name, category, price, image_url, badge, variants, in_stock, created_at)
VALUES
(
    'Lustre Baroque Pearl Chain',
    'Chains',
    4800,
    'images/products/placeholder-1.jpg',
    'Bestseller',
    '["16\"", "18\"", "20\""]'::jsonb,
    true,
    '2026-01-10 10:00:00+00'
),
(
    'Aura Solitaire Moissanite Ring',
    'Rings',
    6500,
    'images/products/placeholder-2.jpg',
    'Signature',
    '["US 6", "US 7", "US 8"]'::jsonb,
    true,
    '2026-01-15 10:00:00+00'
),
(
    'Celestial Tennis Bracelet',
    'Bracelets',
    5200,
    'images/products/placeholder-3.jpg',
    'New',
    '["6.5\"", "7.0\"", "7.5\""]'::jsonb,
    true,
    '2026-02-01 10:00:00+00'
),
(
    'Étoile Cascade Drop Earrings',
    'Earrings',
    3900,
    'images/products/placeholder-4.jpg',
    NULL,
    '[]'::jsonb,
    true,
    '2026-01-20 10:00:00+00'
),
(
    'Aurelia Herringbone Snake Chain',
    'Chains',
    4200,
    'images/products/placeholder-5.jpg',
    'Popular',
    '["16\"", "18\""]'::jsonb,
    true,
    '2026-01-25 10:00:00+00'
),
(
    'Vermeil Twisted Band Ring',
    'Rings',
    3200,
    'images/products/placeholder-6.jpg',
    NULL,
    '["US 5", "US 6", "US 7", "US 8"]'::jsonb,
    true,
    '2026-01-05 10:00:00+00'
),
(
    'Pearl Blossom Huggie Hoops',
    'Earrings',
    3600,
    'images/products/placeholder-7.jpg',
    'New',
    '[]'::jsonb,
    true,
    '2026-02-10 10:00:00+00'
),
(
    'Solis 18k Cuff Bangle',
    'Bracelets',
    5800,
    'images/products/placeholder-8.jpg',
    'Signature',
    '["Small", "Medium"]'::jsonb,
    true,
    '2026-01-18 10:00:00+00'
)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 6. Seed Data: 6 Existing Customer Reviews
-- -----------------------------------------------------------------------------
INSERT INTO public.reviews (customer_name, rating, review_text, purchased_product, created_at)
VALUES
(
    'Ayesha K.',
    5,
    'The tennis bracelet is breathtaking in person! The moissanites sparkle with such fiery brilliance, and the gold finish has a warm, heirloom quality. Truly obsessed.',
    'Celestial Tennis Bracelet',
    '2026-02-02 12:00:00+00'
),
(
    'Maham R.',
    5,
    'The baroque pearls have the most magnificent luster I''ve ever seen. You can immediately feel the weight and quality. The packaging felt like receiving a royal gift.',
    'Lustre Baroque Pearl Chain',
    '2026-02-04 14:30:00+00'
),
(
    'Fatima S.',
    5,
    'I ordered the Aura ring for my anniversary and it completely exceeded my expectations. The bezel setting is so sleek and comfortable for daily wear.',
    'Aura Solitaire Moissanite Ring',
    '2026-02-06 16:00:00+00'
),
(
    'Hiba M.',
    5,
    'Wore these to a family wedding and received compliments all evening. They catch the light effortlessly without feeling heavy on the ears.',
    'Étoile Cascade Drop Earrings',
    '2026-02-08 11:15:00+00'
),
(
    'Noor Z.',
    5,
    'Silky smooth chain that lays flat against the collarbone. Exceptional craftsmanship and the WhatsApp concierge was so kind and helpful!',
    'Aurelia Herringbone Snake Chain',
    '2026-02-10 09:45:00+00'
),
(
    'Sarah T.',
    5,
    'The clean lines and bespoke polish of the Solis bangle make it my go-to everyday luxury staple. Arrived quickly in pristine custom packaging.',
    'Solis 18k Cuff Bangle',
    '2026-02-12 15:20:00+00'
)
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------------------------------
-- 7. Supabase Storage: product-images Bucket & Policies
-- -----------------------------------------------------------------------------
-- Note: You can also create this bucket in the Supabase Dashboard:
-- 1. Go to "Storage" in the left sidebar
-- 2. Click "New bucket" -> Name: "product-images"
-- 3. Toggle "Public bucket" to ON
-- 4. Click "Save"
-- -----------------------------------------------------------------------------

-- Create bucket via SQL (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

-- Storage RLS Policies for product-images bucket
DROP POLICY IF EXISTS "Public View Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Admin Upload Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Admin Update Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Admin Delete Product Images" ON storage.objects;

-- 1. Allow Public SELECT (viewing images on the storefront)
CREATE POLICY "Public View Product Images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');

-- 2. Allow Authenticated Users to INSERT (upload images via Admin Panel)
CREATE POLICY "Authenticated Admin Upload Product Images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- 3. Allow Authenticated Users to UPDATE images
CREATE POLICY "Authenticated Admin Update Product Images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'product-images');

-- 4. Allow Authenticated Users to DELETE images
CREATE POLICY "Authenticated Admin Delete Product Images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

