/**
 * ZIVELLE — Supabase Client & Data Layer
 * Handles live database queries for products and reviews with resilient fallback
 */

(function () {
  'use strict';

  const SUPABASE_URL = 'https://aekbgnrqnijeklpylrrs.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_YhbsxCmaj5SPYk8iITRn_A_r_VzcZJ5';

  // 1. Storage Access Detection & Safe Memory Storage Fallback
  let isStorageAccessible = false;
  const memoryStore = {};
  const safeMemoryStorage = {
    getItem: (key) => memoryStore[key] || null,
    setItem: (key, value) => { memoryStore[key] = String(value); },
    removeItem: (key) => { delete memoryStore[key]; }
  };

  try {
    const testKey = '__zivelle_storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    isStorageAccessible = true;
  } catch (e) {
    console.warn('[Zivelle] Tracking Prevention or browser privacy settings restricted localStorage. Using in-memory storage fallback.');
    isStorageAccessible = false;
  }

  // 2. Initialize Single Shared Supabase Client Instance
  if (!window.supabaseClient) {
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
      try {
        const clientOptions = {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: isStorageAccessible ? window.localStorage : safeMemoryStorage
          }
        };
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, clientOptions);
      } catch (err) {
        console.warn('[Zivelle] Could not initialize Supabase JS client with options, using basic initialization:', err);
        try {
          window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } catch (err2) {
          console.warn('[Zivelle] Basic client initialization also failed:', err2);
        }
      }
    }
  }

  const client = window.supabaseClient;

  /**
   * Deduce variant label / type based on category and option text
   */
  function deduceVariantMeta(category, variants) {
    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return { variantType: null, variantLabels: [], defaultVariant: null };
    }

    const catLower = (category || '').toLowerCase();
    let variantType = 'Option:';
    if (catLower.includes('chain') || catLower.includes('necklace')) {
      variantType = 'Length:';
    } else if (catLower.includes('ring')) {
      variantType = 'Size:';
    } else if (catLower.includes('bracelet')) {
      variantType = 'Size:';
    }

    const variantLabels = variants.map((v) => {
      if (typeof v === 'object' && v !== null) {
        return v.label || v.name || String(v.value || '');
      }
      return String(v);
    });

    const variantValues = variants.map((v) => {
      if (typeof v === 'object' && v !== null) {
        return v.value || v.name || String(v);
      }
      return String(v);
    });

    return {
      variantType,
      variantValues,
      variantLabels,
      defaultVariant: variantValues[0] || null
    };
  }

  /**
   * Normalize database product record to standard storefront schema
   */
  function normalizeDbProduct(p, idx) {
    const rawPrice = parseFloat(p.price) || 0;
    const rawVariants = Array.isArray(p.variants) 
      ? p.variants 
      : (typeof p.variants === 'string' ? JSON.parse(p.variants || '[]') : []);

    const meta = deduceVariantMeta(p.category, rawVariants);
    const catLower = (p.category || 'chains').toLowerCase().trim();
    const catLabel = p.category ? (p.category.charAt(0).toUpperCase() + p.category.slice(1)) : 'Jewelry';

    return {
      id: p.id || `db-prod-${idx}`,
      name: p.name || 'Handcrafted Jewelry Piece',
      category: catLower,
      categoryLabel: catLabel,
      price: rawPrice,
      priceFormatted: `Rs. ${rawPrice.toLocaleString()}`,
      image: p.image_url || 'images/products/placeholder-1.jpg',
      badge: p.badge || null,
      featured: p.featured === true || idx < 4,
      variantType: meta.variantType,
      variants: meta.variantValues || rawVariants,
      variantLabels: meta.variantLabels || rawVariants,
      defaultVariant: meta.defaultVariant,
      inStock: p.in_stock !== false,
      dateAdded: p.created_at || new Date().toISOString()
    };
  }

  /**
   * Fetch all active products from Supabase
   */
  async function fetchProducts() {
    if (!client) {
      console.info('Supabase client unavailable. Using fallback products catalog.');
      return window.PRODUCTS_DATA || [];
    }

    try {
      const { data, error } = await client
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase products fetch warning:', error.message);
        return window.PRODUCTS_DATA || [];
      }

      if (data && data.length > 0) {
        return data.map((item, idx) => normalizeDbProduct(item, idx));
      }

      // If database table is empty, fall back gracefully to local default data
      return window.PRODUCTS_DATA || [];
    } catch (err) {
      console.warn('Failed to fetch products from Supabase:', err);
      return window.PRODUCTS_DATA || [];
    }
  }

  /**
   * Fetch all customer reviews from Supabase
   */
  async function fetchReviews() {
    const fallbackReviews = [
      {
        name: "Ayesha K.",
        product: "Celestial Tennis Bracelet",
        rating: 5,
        quote: "The tennis bracelet is breathtaking in person! The moissanites sparkle with such fiery brilliance, and the gold finish has a warm, heirloom quality. Truly obsessed."
      },
      {
        name: "Maham R.",
        product: "Lustre Baroque Pearl Chain",
        rating: 5,
        quote: "The baroque pearls have the most magnificent luster I've ever seen. You can immediately feel the weight and quality. The packaging felt like receiving a royal gift."
      },
      {
        name: "Fatima S.",
        product: "Aura Solitaire Moissanite Ring",
        rating: 5,
        quote: "I ordered the Aura ring for my anniversary and it completely exceeded my expectations. The bezel setting is so sleek and comfortable for daily wear."
      },
      {
        name: "Hiba M.",
        product: "Étoile Cascade Drop Earrings",
        rating: 5,
        quote: "Wore these to a family wedding and received compliments all evening. They catch the light effortlessly without feeling heavy on the ears."
      },
      {
        name: "Noor Z.",
        product: "Aurelia Herringbone Snake Chain",
        rating: 5,
        quote: "Silky smooth chain that lays flat against the collarbone. Exceptional craftsmanship and the WhatsApp concierge was so kind and helpful!"
      },
      {
        name: "Sarah T.",
        product: "Solis 18k Cuff Bangle",
        rating: 5,
        quote: "The clean lines and bespoke polish of the Solis bangle make it my go-to everyday luxury staple. Arrived quickly in pristine custom packaging."
      }
    ];

    if (!client) {
      return fallbackReviews;
    }

    try {
      const { data, error } = await client
        .from('reviews')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Supabase reviews fetch warning:', error.message);
        return fallbackReviews;
      }

      if (data && data.length > 0) {
        const approved = data.filter((r) => (r.status || 'approved') === 'approved');
        if (approved.length > 0) {
          return approved.map((r) => ({
            name: r.customer_name || 'Verified Client',
            rating: parseInt(r.rating, 10) || 5,
            quote: r.review_text || '',
            product: r.purchased_product || null
          }));
        }
      }

      return fallbackReviews;
    } catch (err) {
      console.warn('Failed to fetch reviews from Supabase:', err);
      return fallbackReviews;
    }
  }

  // Export ZivelleDB API on window
  window.ZivelleDB = {
    client,
    fetchProducts,
    fetchReviews,
    normalizeDbProduct
  };
})();
