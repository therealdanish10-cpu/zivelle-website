/**
 * ZIVELLE — Shared Products Catalog Data
 * Central single source of truth for products across index.html and shop.html
 */

const PRODUCTS_DATA = [
  {
    id: 'prod-1',
    name: 'Lustre Baroque Pearl Chain',
    category: 'chains',
    categoryLabel: 'Chains',
    price: 4800,
    priceFormatted: 'Rs. 4,800',
    image: 'images/products/placeholder-1.jpg',
    badge: 'Bestseller',
    featured: true,
    variantType: 'Length:',
    variants: ['16 inch', '18 inch', '20 inch'],
    variantLabels: ['16"', '18"', '20"'],
    defaultVariant: '16 inch',
    dateAdded: '2026-01-10'
  },
  {
    id: 'prod-2',
    name: 'Aura Solitaire Moissanite Ring',
    category: 'rings',
    categoryLabel: 'Rings',
    price: 6500,
    priceFormatted: 'Rs. 6,500',
    image: 'images/products/placeholder-2.jpg',
    badge: 'Signature',
    featured: true,
    variantType: 'Size:',
    variants: ['US 6', 'US 7', 'US 8'],
    variantLabels: ['US 6', 'US 7', 'US 8'],
    defaultVariant: 'US 6',
    dateAdded: '2026-01-15'
  },
  {
    id: 'prod-3',
    name: 'Celestial Tennis Bracelet',
    category: 'bracelets',
    categoryLabel: 'Bracelets',
    price: 5200,
    priceFormatted: 'Rs. 5,200',
    image: 'images/products/placeholder-3.jpg',
    badge: 'New',
    featured: true,
    variantType: 'Wrist:',
    variants: ['6.5 inch', '7.0 inch', '7.5 inch'],
    variantLabels: ['6.5"', '7.0"', '7.5"'],
    defaultVariant: '6.5 inch',
    dateAdded: '2026-02-01'
  },
  {
    id: 'prod-4',
    name: 'Étoile Cascade Drop Earrings',
    category: 'earrings',
    categoryLabel: 'Earrings',
    price: 3900,
    priceFormatted: 'Rs. 3,900',
    image: 'images/products/placeholder-4.jpg',
    badge: null,
    featured: true,
    variantType: null,
    variants: [],
    variantLabels: [],
    defaultVariant: null,
    dateAdded: '2026-01-20'
  },
  {
    id: 'prod-5',
    name: 'Aurelia Herringbone Snake Chain',
    category: 'chains',
    categoryLabel: 'Chains',
    price: 4200,
    priceFormatted: 'Rs. 4,200',
    image: 'images/products/placeholder-5.jpg',
    badge: 'Popular',
    featured: false,
    variantType: 'Length:',
    variants: ['16 inch', '18 inch'],
    variantLabels: ['16"', '18"'],
    defaultVariant: '16 inch',
    dateAdded: '2026-01-25'
  },
  {
    id: 'prod-6',
    name: 'Vermeil Twisted Band Ring',
    category: 'rings',
    categoryLabel: 'Rings',
    price: 3200,
    priceFormatted: 'Rs. 3,200',
    image: 'images/products/placeholder-6.jpg',
    badge: null,
    featured: false,
    variantType: 'Size:',
    variants: ['US 5', 'US 6', 'US 7', 'US 8'],
    variantLabels: ['US 5', 'US 6', 'US 7', 'US 8'],
    defaultVariant: 'US 5',
    dateAdded: '2026-01-05'
  },
  {
    id: 'prod-7',
    name: 'Pearl Blossom Huggie Hoops',
    category: 'earrings',
    categoryLabel: 'Earrings',
    price: 3600,
    priceFormatted: 'Rs. 3,600',
    image: 'images/products/placeholder-7.jpg',
    badge: 'New',
    featured: false,
    variantType: null,
    variants: [],
    variantLabels: [],
    defaultVariant: null,
    dateAdded: '2026-02-10'
  },
  {
    id: 'prod-8',
    name: 'Solis 18k Cuff Bangle',
    category: 'bracelets',
    categoryLabel: 'Bracelets',
    price: 5800,
    priceFormatted: 'Rs. 5,800',
    image: 'images/products/placeholder-8.jpg',
    badge: 'Signature',
    featured: false,
    variantType: 'Size:',
    variants: ['Small', 'Medium'],
    variantLabels: ['Small', 'Medium'],
    defaultVariant: 'Small',
    dateAdded: '2026-01-18'
  }
];

/**
 * Helper to render standardized product card HTML markup
 * @param {Object} product - Product data object
 * @param {number} delayMs - Optional stagger animation delay
 * @returns {string} HTML string
 */
function renderProductCardMarkup(product, delayMs = 0) {
  const badgeHtml = product.badge
    ? `<span class="product-badge">${product.badge}</span>`
    : '';

  let variantsHtml = '';
  if (product.variants && product.variants.length > 0) {
    const pills = product.variants.map((v, idx) => {
      const activeClass = idx === 0 ? 'active' : '';
      const label = product.variantLabels[idx] || v;
      return `<button type="button" class="variant-pill ${activeClass}" data-variant="${v}">${label}</button>`;
    }).join('');

    variantsHtml = `
      <div class="product-variants" aria-label="${product.variantType} selection">
        <span class="variant-label">${product.variantType}</span>
        <div class="variant-pills">
          ${pills}
        </div>
      </div>
    `;
  } else {
    variantsHtml = `
      <div class="product-variants product-variants-empty" aria-hidden="true">
        <span class="variant-label">&nbsp;</span>
      </div>
    `;
  }

  const delayStyle = delayMs > 0 ? `style="transition-delay: ${delayMs}ms;"` : '';

  return `
    <article class="product-card is-visible" data-category="${product.category}" data-id="${product.id}" data-name="${product.name}" data-price="${product.priceFormatted}" ${delayStyle}>
      <div class="product-image-wrap">
        <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy">
        ${badgeHtml}
      </div>
      <div class="product-info">
        <span class="product-category-label">${product.categoryLabel}</span>
        <h3 class="product-title">${product.name}</h3>
        <div class="product-price">${product.priceFormatted}</div>
        ${variantsHtml}
        <button type="button" class="btn-add-cart" aria-label="Add ${product.name} to cart">
          <svg class="cart-icon-btn" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
          <span>Add to Cart</span>
        </button>
      </div>
    </article>
  `;
}

/**
 * Render loading skeleton placeholders
 */
function renderSkeletonCardsMarkup(count = 4) {
  return Array(count).fill(0).map(() => `
    <div class="product-card-skeleton" aria-hidden="true">
      <div class="skeleton-img"></div>
      <div class="skeleton-info">
        <div class="skeleton-line short"></div>
        <div class="skeleton-line title"></div>
        <div class="skeleton-line price"></div>
        <div class="skeleton-line btn"></div>
      </div>
    </div>
  `).join('');
}

// Global window assignment
if (typeof window !== 'undefined') {
  window.PRODUCTS_DATA = PRODUCTS_DATA;
  window.renderProductCardMarkup = renderProductCardMarkup;
  window.renderSkeletonCardsMarkup = renderSkeletonCardsMarkup;
}
