/**
 * ZIVELLE — Luxury Jewelry Ecommerce
 * Main JavaScript (Section 1: Navbar & Hero)
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // -------------------------------------------------------------------------
  // 1. DOM Elements
  // -------------------------------------------------------------------------
  const siteHeader = document.querySelector('.site-header');
  const hamburgerBtn = document.querySelector('.hamburger-btn');
  const mobileDrawer = document.querySelector('.mobile-drawer');
  const drawerBackdrop = document.querySelector('.drawer-backdrop');
  const drawerCloseBtn = document.querySelector('.drawer-close-btn');
  const drawerLinks = document.querySelectorAll('.drawer-nav-link');
  const navLinks = document.querySelectorAll('.nav-link');
  const heroVideo = document.querySelector('.hero-video');
  const scrollIndicator = document.querySelector('.scroll-indicator');

  // -------------------------------------------------------------------------
  // 2. Navbar Background Transition on Scroll
  // -------------------------------------------------------------------------
  const SCROLL_THRESHOLD = 80;
  let isTicking = false;

  function updateNavbarOnScroll() {
    const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;

    if (currentScrollY > SCROLL_THRESHOLD) {
      if (!siteHeader.classList.contains('scrolled')) {
        siteHeader.classList.add('scrolled');
      }
    } else {
      if (siteHeader.classList.contains('scrolled')) {
        siteHeader.classList.remove('scrolled');
      }
    }
    isTicking = false;
  }

  window.addEventListener('scroll', () => {
    if (!isTicking) {
      window.requestAnimationFrame(updateNavbarOnScroll);
      isTicking = true;
    }
  }, { passive: true });

  // Initial check on load
  updateNavbarOnScroll();

  // -------------------------------------------------------------------------
  // 3. Mobile Navigation Drawer
  // -------------------------------------------------------------------------
  function openMobileMenu() {
    if (!mobileDrawer) return;
    hamburgerBtn?.classList.add('active');
    hamburgerBtn?.setAttribute('aria-expanded', 'true');
    mobileDrawer.classList.add('active');
    mobileDrawer.setAttribute('aria-hidden', 'false');
    drawerBackdrop?.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  function closeMobileMenu() {
    if (!mobileDrawer) return;
    hamburgerBtn?.classList.remove('active');
    hamburgerBtn?.setAttribute('aria-expanded', 'false');
    mobileDrawer.classList.remove('active');
    mobileDrawer.setAttribute('aria-hidden', 'true');
    drawerBackdrop?.classList.remove('active');
    document.body.style.overflow = '';
  }

  hamburgerBtn?.addEventListener('click', () => {
    const isExpanded = hamburgerBtn.classList.contains('active');
    if (isExpanded) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  drawerCloseBtn?.addEventListener('click', closeMobileMenu);
  drawerBackdrop?.addEventListener('click', closeMobileMenu);

  // Close mobile drawer when clicking any link
  drawerLinks.forEach((link) => {
    link.addEventListener('click', () => {
      closeMobileMenu();
    });
  });

  // Close mobile drawer on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileDrawer?.classList.contains('active')) {
      closeMobileMenu();
    }
  });

  // -------------------------------------------------------------------------
  // 4. Smooth Anchor Navigation with Header Offset
  // -------------------------------------------------------------------------
  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#') return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const headerHeight = siteHeader ? siteHeader.offsetHeight : 0;
        const targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - (headerHeight - 10);

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // -------------------------------------------------------------------------
  // 5. Video Autoplay Reliability
  // -------------------------------------------------------------------------
  if (heroVideo) {
    // Attempt playback in case browser suspended autoplay
    const playPromise = heroVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback or retry on first user interaction
        const startVideoOnInteraction = () => {
          heroVideo.play().catch(() => {});
          window.removeEventListener('touchstart', startVideoOnInteraction);
          window.removeEventListener('click', startVideoOnInteraction);
        };
        window.addEventListener('touchstart', startVideoOnInteraction, { once: true, passive: true });
        window.addEventListener('click', startVideoOnInteraction, { once: true });
      });
    }
  }

  // -------------------------------------------------------------------------
  // 6. Active Nav Link on Scroll (Section Highlight)
  // -------------------------------------------------------------------------
  const sections = document.querySelectorAll('section[id], footer[id]');

  function highlightActiveNavLink() {
    const scrollY = window.pageYOffset + 120;

    sections.forEach((section) => {
      const sectionHeight = section.offsetHeight;
      const sectionTop = section.offsetTop;
      const sectionId = section.getAttribute('id');

      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        navLinks.forEach((link) => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', highlightActiveNavLink, { passive: true });

  // =========================================================================
  // ===== SECTION 2 & 3: SHOP, CART DRAWER & WHATSAPP CHECKOUT =====
  // =========================================================================

  // WhatsApp Order Phone Configuration
  const WHATSAPP_NUMBER = "923325567320"; // Zivelle brand WhatsApp number

  // In-Memory Cart State
  const cart = [];

  // DOM Elements
  const cartBtn = document.getElementById('cart-btn');
  const cartBadge = document.getElementById('cart-count');
  const cartDrawer = document.getElementById('cart-drawer');
  const cartBackdrop = document.getElementById('cart-backdrop');
  const cartDrawerCloseBtn = document.getElementById('cart-drawer-close');
  const cartDrawerCount = document.getElementById('cart-drawer-count');
  const cartItemsList = document.getElementById('cart-items-list');
  const cartEmptyState = document.getElementById('cart-empty-state');
  const cartSubtotalEl = document.getElementById('cart-subtotal');
  const btnWhatsappCheckout = document.getElementById('btn-whatsapp-checkout');
  const btnContinueShopping = document.getElementById('btn-continue-shopping');
  const toastContainer = document.getElementById('toast-container');
  const filterPills = document.querySelectorAll('.filter-pill');
  const productCards = document.querySelectorAll('.product-card');
  const productsGrid = document.getElementById('products-grid');

  // -------------------------------------------------------------------------
  // A. Category Filter Logic
  // -------------------------------------------------------------------------
  filterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      const targetCategory = pill.getAttribute('data-filter');

      // Update active filter pill
      filterPills.forEach((p) => {
        p.classList.remove('active');
        p.setAttribute('aria-selected', 'false');
      });
      pill.classList.add('active');
      pill.setAttribute('aria-selected', 'true');

      // Filter product cards with smooth transition
      if (productsGrid) {
        productsGrid.style.opacity = '0.3';
      }

      setTimeout(() => {
        const visibleCards = [];

        productCards.forEach((card) => {
          const cardCategory = card.getAttribute('data-category');
          if (targetCategory === 'all' || cardCategory === targetCategory) {
            card.classList.remove('hidden');
            card.classList.remove('is-visible');
            card.style.transitionDelay = '0ms';
            visibleCards.push(card);
          } else {
            card.classList.add('hidden');
            card.classList.remove('is-visible');
          }
        });

        if (productsGrid) {
          productsGrid.style.opacity = '1';
        }

        // Stagger entrance of visible cards
        requestAnimationFrame(() => {
          visibleCards.forEach((card, idx) => {
            card.style.transitionDelay = `${idx * 160}ms`;
            requestAnimationFrame(() => {
              card.classList.add('is-visible');
            });
          });
        });
      }, 140);
    });
  });

  // -------------------------------------------------------------------------
  // B. Product Variant Selection (Size / Length)
  // -------------------------------------------------------------------------
  document.querySelectorAll('.product-variants').forEach((variantGroup) => {
    const pills = variantGroup.querySelectorAll('.variant-pill');
    pills.forEach((pill) => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        pills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
      });
    });
  });

  // -------------------------------------------------------------------------
  // C. Add to Cart Handler
  // -------------------------------------------------------------------------
  document.querySelectorAll('.btn-add-cart').forEach((btn) => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const card = this.closest('.product-card');
      if (!card) return;

      const id = card.getAttribute('data-id') || 'prod';
      const name = card.getAttribute('data-name') || 'Jewelry Piece';
      const priceStr = card.getAttribute('data-price') || 'Rs. 0';
      const unitPrice = parseInt(priceStr.replace(/[^0-9]/g, ''), 10) || 0;
      const image = card.querySelector('.product-img')?.getAttribute('src') || 'images/products/placeholder-1.jpg';

      // Get selected variant if exists
      const activeVariantPill = card.querySelector('.variant-pill.active');
      const variant = activeVariantPill ? activeVariantPill.getAttribute('data-variant') : null;

      // Add to in-memory cart
      addItemToCart({ id, name, priceStr, unitPrice, variant, image });

      // Trigger temporary button feedback
      const originalText = this.querySelector('span')?.textContent || 'Add to Cart';
      if (this.querySelector('span')) {
        this.querySelector('span').textContent = 'Added';
        this.style.backgroundColor = 'var(--color-gold)';
        this.style.borderColor = 'var(--color-gold)';
        setTimeout(() => {
          this.querySelector('span').textContent = originalText;
          this.style.backgroundColor = '';
          this.style.borderColor = '';
        }, 1000);
      }

      // Show toast notification
      showToast(name, variant, priceStr);
    });
  });

  function addItemToCart(item) {
    const existingIndex = cart.findIndex(
      (cartItem) => cartItem.id === item.id && cartItem.variant === item.variant
    );

    if (existingIndex > -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({ ...item, quantity: 1 });
    }

    updateCartBadge();
    renderCartDrawer();
  }

  function updateCartBadge() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartBadge) {
      cartBadge.textContent = totalCount;
      cartBadge.style.transform = 'scale(1.35)';
      setTimeout(() => {
        cartBadge.style.transform = '';
      }, 250);
    }
  }

  // -------------------------------------------------------------------------
  // D. Cart Drawer Open / Close Controls
  // -------------------------------------------------------------------------
  function openCartDrawer() {
    if (!cartDrawer) return;
    renderCartDrawer();
    cartDrawer.classList.add('active');
    cartDrawer.setAttribute('aria-hidden', 'false');
    cartBackdrop?.classList.add('active');
    cartBtn?.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeCartDrawer() {
    if (!cartDrawer) return;
    cartDrawer.classList.remove('active');
    cartDrawer.setAttribute('aria-hidden', 'true');
    cartBackdrop?.classList.remove('active');
    cartBtn?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  cartBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    openCartDrawer();
  });

  cartDrawerCloseBtn?.addEventListener('click', closeCartDrawer);
  cartBackdrop?.addEventListener('click', closeCartDrawer);
  btnContinueShopping?.addEventListener('click', closeCartDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartDrawer?.classList.contains('active')) {
      closeCartDrawer();
    }
  });

  // -------------------------------------------------------------------------
  // E. Render Cart Drawer UI & Subtotal
  // -------------------------------------------------------------------------
  const checkoutForm = document.getElementById('cart-checkout-form');
  const nameInput = document.getElementById('customer-name');
  const phoneInput = document.getElementById('customer-phone');
  const altPhoneInput = document.getElementById('customer-alt-phone');
  const addressInput = document.getElementById('customer-address');

  function renderCartDrawer() {
    if (!cartDrawer) return;

    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

    // Update Drawer Header Count
    if (cartDrawerCount) {
      cartDrawerCount.textContent = `${totalCount} ${totalCount === 1 ? 'item' : 'items'}`;
    }

    // Update Subtotal Display
    if (cartSubtotalEl) {
      cartSubtotalEl.textContent = `Rs. ${subtotal.toLocaleString()}`;
    }

    // Toggle Empty State vs Items List & Delivery Form
    if (cart.length === 0) {
      cartEmptyState?.classList.add('active');
      checkoutForm?.classList.add('hidden');
      if (cartItemsList) cartItemsList.innerHTML = '';
      if (btnWhatsappCheckout) btnWhatsappCheckout.disabled = true;
    } else {
      cartEmptyState?.classList.remove('active');
      checkoutForm?.classList.remove('hidden');
      if (btnWhatsappCheckout) btnWhatsappCheckout.disabled = false;

      if (cartItemsList) {
        cartItemsList.innerHTML = cart.map((item, index) => {
          const itemTotal = item.unitPrice * item.quantity;
          const variantDisplay = item.variant ? `<span class="cart-item-variant">${item.variant}</span>` : '';

          return `
            <div class="cart-item" data-index="${index}">
              <img src="${item.image}" alt="${item.name}" class="cart-item-thumb" loading="lazy">
              <div class="cart-item-info">
                <h4 class="cart-item-name" title="${item.name}">${item.name}</h4>
                ${variantDisplay}
                <span class="cart-item-price">Rs. ${itemTotal.toLocaleString()}</span>
              </div>
              <div class="cart-item-actions">
                <button type="button" class="btn-cart-remove" data-index="${index}" aria-label="Remove ${item.name} from bag" title="Remove item">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
                <div class="cart-stepper">
                  <button type="button" class="stepper-btn stepper-btn-minus" data-index="${index}" aria-label="Decrease quantity">&minus;</button>
                  <span class="stepper-val">${item.quantity}</span>
                  <button type="button" class="stepper-btn stepper-btn-plus" data-index="${index}" aria-label="Increase quantity">&plus;</button>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  }

  // -------------------------------------------------------------------------
  // F. Stepper and Remove Actions (Event Delegation)
  // -------------------------------------------------------------------------
  cartItemsList?.addEventListener('click', (e) => {
    const plusBtn = e.target.closest('.stepper-btn-plus');
    const minusBtn = e.target.closest('.stepper-btn-minus');
    const removeBtn = e.target.closest('.btn-cart-remove');

    if (plusBtn) {
      const index = parseInt(plusBtn.getAttribute('data-index'), 10);
      if (cart[index]) {
        cart[index].quantity += 1;
        updateCartBadge();
        renderCartDrawer();
      }
      return;
    }

    if (minusBtn) {
      const index = parseInt(minusBtn.getAttribute('data-index'), 10);
      if (cart[index]) {
        if (cart[index].quantity > 1) {
          cart[index].quantity -= 1;
        } else {
          cart.splice(index, 1);
        }
        updateCartBadge();
        renderCartDrawer();
      }
      return;
    }

    if (removeBtn) {
      const index = parseInt(removeBtn.getAttribute('data-index'), 10);
      if (cart[index]) {
        cart.splice(index, 1);
        updateCartBadge();
        renderCartDrawer();
      }
      return;
    }
  });

  // -------------------------------------------------------------------------
  // G. Checkout Form Validation
  // -------------------------------------------------------------------------
  function validateCheckoutForm() {
    let isValid = true;
    let firstInvalidEl = null;

    const nameVal = nameInput ? nameInput.value.trim() : '';
    const phoneVal = phoneInput ? phoneInput.value.trim() : '';
    const addressVal = addressInput ? addressInput.value.trim() : '';

    // Validate Full Name
    if (!nameVal) {
      nameInput?.classList.add('has-error');
      isValid = false;
      if (!firstInvalidEl) firstInvalidEl = nameInput;
    } else {
      nameInput?.classList.remove('has-error');
    }

    // Validate Phone Number
    const cleanPhone = phoneVal.replace(/[\s\-\+]/g, '');
    if (!phoneVal || cleanPhone.length < 8) {
      phoneInput?.classList.add('has-error');
      isValid = false;
      if (!firstInvalidEl) firstInvalidEl = phoneInput;
    } else {
      phoneInput?.classList.remove('has-error');
    }

    // Validate Delivery Address
    if (!addressVal) {
      addressInput?.classList.add('has-error');
      isValid = false;
      if (!firstInvalidEl) firstInvalidEl = addressInput;
    } else {
      addressInput?.classList.remove('has-error');
    }

    if (firstInvalidEl) {
      firstInvalidEl.focus();
    }

    return isValid;
  }

  // Clear validation errors on input
  [nameInput, phoneInput, addressInput].forEach((input) => {
    input?.addEventListener('input', () => {
      if (input.value.trim()) {
        input.classList.remove('has-error');
      }
    });
  });

  // -------------------------------------------------------------------------
  // H. WhatsApp Checkout Order Generator with Customer Details
  // -------------------------------------------------------------------------
  btnWhatsappCheckout?.addEventListener('click', () => {
    if (cart.length === 0) return;

    // Validate delivery details before proceeding
    if (!validateCheckoutForm()) {
      return;
    }

    const nameVal = nameInput.value.trim();
    const phoneVal = phoneInput.value.trim();
    const altPhoneVal = altPhoneInput ? altPhoneInput.value.trim() : '';
    const addressVal = addressInput.value.trim();
    const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

    // Build formatted item lines
    const itemLines = cart.map((item, idx) => {
      const variantText = item.variant ? ` (${item.variant})` : '';
      const itemPriceTotal = (item.unitPrice * item.quantity).toLocaleString();
      return `${idx + 1}. ${item.name}${variantText} x${item.quantity} - Rs. ${itemPriceTotal}`;
    }).join('\n');

    // Build optional alternate number line
    const altPhoneLine = altPhoneVal ? `\nAlternate: ${altPhoneVal}` : '';

    const orderMessage = 
`Hi Zivelle! I'd like to order:

Name: ${nameVal}
Contact: ${phoneVal}${altPhoneLine}
Address: ${addressVal}

Order:
${itemLines}

Subtotal: Rs. ${subtotal.toLocaleString()}

Please let me know the next steps for payment.`;

    const encodedMessage = encodeURIComponent(orderMessage);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  });

  // -------------------------------------------------------------------------
  // H. Luxury Toast Notification Engine
  // -------------------------------------------------------------------------
  function showToast(name, variant, price) {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'alert');

    const variantText = variant ? ` &bull; ${variant}` : '';

    toast.innerHTML = `
      <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <div class="toast-content">
        <div class="toast-title">Added to Bag</div>
        <div class="toast-subtitle">${name}${variantText} (${price})</div>
      </div>
    `;

    toastContainer.appendChild(toast);

    // Trigger entrance animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Auto remove after 3.2 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode === toastContainer) {
          toastContainer.removeChild(toast);
        }
      }, 400);
    }, 3200);
  }

  // =========================================================================
  // ===== SECTION 4: REVIEWS DATA & RENDERING =====
  // =========================================================================
  const reviewsData = [
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

  function renderReviews() {
    const reviewsGrid = document.getElementById('reviews-grid');
    if (!reviewsGrid) return;

    const starSvg = `
      <svg class="star-icon" viewBox="0 0 24 24" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
      </svg>
    `;

    reviewsGrid.innerHTML = reviewsData.map((review) => {
      const stars = Array(review.rating).fill(starSvg).join('');
      const productBadge = review.product 
        ? `<span class="review-product-tag">Purchased: ${review.product}</span>` 
        : '';

      return `
        <article class="review-card">
          <div class="review-rating" aria-label="${review.rating} out of 5 stars">
            ${stars}
          </div>
          <blockquote class="review-quote">${review.quote}</blockquote>
          <div class="review-author-wrap">
            <div class="review-author-row">
              <span class="review-author-name">— ${review.name}</span>
              <span class="verified-badge">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span>Verified Buyer</span>
              </span>
            </div>
            ${productBadge}
          </div>
        </article>
      `;
    }).join('');
  }

  // =========================================================================
  // ===== PARALLAX EFFECT & SHOWCASE REVEAL =====
  // =========================================================================
  const parallaxShowcase = document.getElementById('parallax-showcase');
  const parallaxBgLayer = document.getElementById('parallax-bg-layer');

  // A. Reveal Animation Observer
  if (parallaxShowcase && 'IntersectionObserver' in window) {
    const showcaseObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    showcaseObserver.observe(parallaxShowcase);
  } else if (parallaxShowcase) {
    parallaxShowcase.classList.add('is-revealed');
  }

  // B. Smooth 60fps Hardware-Accelerated Parallax Scroll
  function updateParallax() {
    if (!parallaxShowcase || !parallaxBgLayer) return;

    const rect = parallaxShowcase.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Calculate when section is in or near viewport
    if (rect.bottom >= -100 && rect.top <= windowHeight + 100) {
      const sectionCenter = rect.top + rect.height / 2;
      const viewportCenter = windowHeight / 2;
      const offset = sectionCenter - viewportCenter;

      // 0.32 gives a noticeably deep, elegant luxury parallax motion
      const translateY = offset * 0.32;

      parallaxBgLayer.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0)`;
    }
  }

  // =========================================================================
  // ===== SCROLL ANIMATIONS =====
  // =========================================================================
  // 1. Site-Wide Base Scroll Animations (.fade-slide-up)
  function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.fade-slide-up');

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.12,
        rootMargin: '0px 0px -30px 0px'
      });

      animatedElements.forEach((el) => observer.observe(el));
    } else {
      animatedElements.forEach((el) => el.classList.add('is-visible'));
    }
  }

  // 2. Individual Card Scroll Observer (Product Grid & Reviews Grid)
  function initCardObservers() {
    const cards = document.querySelectorAll('.product-card, .review-card');

    if ('IntersectionObserver' in window) {
      const cardObserver = new IntersectionObserver((entries, obs) => {
        const intersectingEntries = entries.filter((entry) => entry.isIntersecting);
        intersectingEntries.forEach((entry, batchIdx) => {
          const card = entry.target;
          // Apply stagger only across cards that cross into the viewport in the same scroll batch
          card.style.transitionDelay = `${batchIdx * 160}ms`;
          card.classList.add('is-visible');
          obs.unobserve(card);
        });
      }, {
        threshold: 0.15,
        rootMargin: '0px 0px -80px 0px'
      });

      cards.forEach((card) => {
        if (!card.classList.contains('hidden')) {
          cardObserver.observe(card);
        }
      });
    } else {
      cards.forEach((card) => card.classList.add('is-visible'));
    }
  }

  // Consolidated Scroll & Resize Listener for 60fps Performance
  let isScrollTicking = false;

  function onScrollOrResize() {
    updateParallax();
    isScrollTicking = false;
  }

  window.addEventListener('scroll', () => {
    if (!isScrollTicking) {
      window.requestAnimationFrame(onScrollOrResize);
      isScrollTicking = true;
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (!isScrollTicking) {
      window.requestAnimationFrame(onScrollOrResize);
      isScrollTicking = true;
    }
  }, { passive: true });

  // Initial Renders & Animations
  renderReviews();
  renderCartDrawer();
  initScrollAnimations();
  initCardObservers();
  onScrollOrResize();
});




