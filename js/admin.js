/**
 * ZIVELLE — Admin Portal Controller (js/admin.js)
 * Manages Supabase Auth, Products CRUD, Reviews CRUD, and UI Modals
 */

(function () {
  'use strict';

  // 1. Reuse Single Shared Supabase Client instance (avoid duplicate GoTrueClient instances)
  const supabase = window.supabaseClient || (window.ZivelleDB && window.ZivelleDB.client);

  // ---------------------------------------------------------------------------
  // 1. DOM Elements
  // ---------------------------------------------------------------------------
  // Views
  const authView = document.getElementById('admin-auth-view');
  const dashboardView = document.getElementById('admin-dashboard-view');

  // Auth Elements
  const loginForm = document.getElementById('admin-login-form');
  const loginEmailInput = document.getElementById('login-email');
  const loginPasswordInput = document.getElementById('login-password');
  const loginSubmitBtn = document.getElementById('btn-login-submit');
  const loginErrorAlert = document.getElementById('login-error-alert');
  const loginErrorText = document.getElementById('login-error-text');
  const adminUserEmailEl = document.getElementById('admin-user-email');
  const btnSignOut = document.getElementById('btn-admin-signout');

  // Tabs
  const tabBtnProducts = document.getElementById('tab-btn-products');
  const tabBtnReviews = document.getElementById('tab-btn-reviews');
  const tabBtnPending = document.getElementById('tab-btn-pending');
  const panelProducts = document.getElementById('panel-products');
  const panelReviews = document.getElementById('panel-reviews');
  const panelPending = document.getElementById('panel-pending');
  const tabProductsBadge = document.getElementById('tab-products-badge');
  const tabReviewsBadge = document.getElementById('tab-reviews-badge');
  const tabPendingBadge = document.getElementById('tab-pending-badge');

  // Products Elements
  const productSearchInput = document.getElementById('product-search-input');
  const productCategoryFilter = document.getElementById('product-category-filter');
  const btnOpenAddProduct = document.getElementById('btn-open-add-product');
  const productsTableBody = document.getElementById('products-table-body');

  // Product Modal
  const productModalBackdrop = document.getElementById('product-modal-backdrop');
  const productModalTitle = document.getElementById('product-modal-title');
  const productForm = document.getElementById('admin-product-form');
  const productFormId = document.getElementById('product-form-id');
  const productNameInput = document.getElementById('product-name');
  const productCategoryInput = document.getElementById('product-category');
  const productPriceInput = document.getElementById('product-price');
  const productBadgeSelect = document.getElementById('product-badge');
  const productImageFileInput = document.getElementById('product-image-file');
  const productImageDropzone = document.getElementById('product-image-dropzone');
  const productCurrentImageUrlInput = document.getElementById('product-current-image-url');
  const dropzonePrompt = document.getElementById('dropzone-prompt');
  const dropzonePreviewWrap = document.getElementById('dropzone-preview-wrap');
  const productImagePreview = document.getElementById('product-image-preview');
  const dropzoneFilename = document.getElementById('dropzone-filename');
  const dropzoneFilesize = document.getElementById('dropzone-filesize');
  const btnChangePhoto = document.getElementById('btn-change-photo');
  const uploadProgressWrap = document.getElementById('upload-progress-wrap');
  const uploadProgressText = document.getElementById('upload-progress-text');
  const productVariantsInput = document.getElementById('product-variants');
  const productInStockCheckbox = document.getElementById('product-in-stock');
  const btnCloseProductModal = document.getElementById('btn-close-product-modal');
  const btnCancelProductModal = document.getElementById('btn-cancel-product-modal');
  const btnSaveProduct = document.getElementById('btn-save-product');

  // Reviews Elements
  const reviewSearchInput = document.getElementById('review-search-input');
  const btnOpenAddReview = document.getElementById('btn-open-add-review');
  const reviewsTableBody = document.getElementById('reviews-table-body');
  const pendingSearchInput = document.getElementById('pending-search-input');
  const pendingReviewsTableBody = document.getElementById('pending-reviews-table-body');

  // Review Modal
  const reviewModalBackdrop = document.getElementById('review-modal-backdrop');
  const reviewModalTitle = document.getElementById('review-modal-title');
  const reviewForm = document.getElementById('admin-review-form');
  const reviewFormId = document.getElementById('review-form-id');
  const reviewCustomerNameInput = document.getElementById('review-customer-name');
  const reviewRatingSelect = document.getElementById('review-rating');
  const reviewPurchasedProductInput = document.getElementById('review-purchased-product');
  const reviewTextInput = document.getElementById('review-text');
  const btnCloseReviewModal = document.getElementById('btn-close-review-modal');
  const btnCancelReviewModal = document.getElementById('btn-cancel-review-modal');
  const btnSaveReview = document.getElementById('btn-save-review');

  // Delete Confirmation Modal
  const deleteModalBackdrop = document.getElementById('delete-modal-backdrop');
  const deleteModalMessage = document.getElementById('delete-modal-message');
  const btnCloseDeleteModal = document.getElementById('btn-close-delete-modal');
  const btnCancelDelete = document.getElementById('btn-cancel-delete');
  const btnConfirmDelete = document.getElementById('btn-confirm-delete');

  // Toast Container
  const toastContainer = document.getElementById('admin-toast-container');

  // Active Cache
  let productsCache = [];
  let reviewsCache = [];
  let pendingDeleteAction = null;

  // ---------------------------------------------------------------------------
  // 2. Toast Notifications
  // ---------------------------------------------------------------------------
  function showToast(message, type = 'success') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;
    toast.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        ${type === 'success' 
          ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>'
          : '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>'
        }
      </svg>
      <span>${message}</span>
    `;

    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // ---------------------------------------------------------------------------
  // 3. Supabase Authentication Controller
  // ---------------------------------------------------------------------------
  async function checkAuthSession() {
    // 1. Immediately ensure login view is active so the page is never blank
    showLogin();

    if (!supabase || !supabase.auth) {
      console.warn('[Zivelle Admin] Supabase auth client is unavailable.');
      return;
    }

    try {
      // 2. Race getSession with a 3.5s timeout fallback (guards against storage blocking hangs)
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AUTH_SESSION_TIMEOUT')), 3500)
      );

      const result = await Promise.race([sessionPromise, timeoutPromise]);
      if (result && result.error) throw result.error;

      const session = result && result.data ? result.data.session : null;
      if (session && session.user) {
        showDashboard(session.user);
      } else {
        showLogin();
      }
    } catch (err) {
      if (err && err.message === 'AUTH_SESSION_TIMEOUT') {
        console.warn('[Zivelle Admin] Storage access or auth check timed out (Tracking Prevention restriction active). Defaulting to login view.');
      } else {
        console.warn('[Zivelle Admin] Session check notice:', err);
      }
      showLogin();
    }
  }

  function showDashboard(user) {
    if (authView) authView.style.display = 'none';
    if (dashboardView) dashboardView.style.display = 'flex';
    if (adminUserEmailEl && user) {
      adminUserEmailEl.textContent = user.email || 'Admin';
    }
    loadProducts();
    loadReviews();
  }

  function showLogin() {
    if (dashboardView) dashboardView.style.display = 'none';
    if (authView) authView.style.display = 'flex';
    if (loginErrorAlert) loginErrorAlert.style.display = 'none';
  }

  // Handle Login Form Submission
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginEmailInput?.value.trim();
    const password = loginPasswordInput?.value;

    if (!email || !password) {
      displayLoginError('Please enter both email and password.');
      return;
    }

    setButtonLoading(loginSubmitBtn, true, 'Signing In...');
    if (loginErrorAlert) loginErrorAlert.style.display = 'none';

    try {
      if (!supabase) throw new Error('Supabase client is not initialized.');

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) {
        throw error;
      }

      if (data && data.user) {
        showToast('Welcome back, Admin!');
        showDashboard(data.user);
      }
    } catch (err) {
      console.error('Login error:', err);
      let msg = 'Invalid email or password.';
      if (err.message && err.message.includes('Email not confirmed')) {
        msg = 'Please confirm your email address in Supabase before signing in.';
      }
      displayLoginError(msg);
    } finally {
      setButtonLoading(loginSubmitBtn, false, 'Sign In to Dashboard');
    }
  });

  function displayLoginError(message) {
    if (loginErrorText) loginErrorText.textContent = message;
    if (loginErrorAlert) loginErrorAlert.style.display = 'flex';
  }

  // Handle Sign Out
  btnSignOut?.addEventListener('click', async () => {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
      showToast('You have signed out.');
      showLogin();
    } catch (err) {
      console.error('Sign out error:', err);
      showLogin();
    }
  });

  // Listen to Auth State Changes
  if (supabase) {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        showDashboard(session.user);
      } else if (event === 'SIGNED_OUT') {
        showLogin();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 4. Tab Navigation Controller
  // ---------------------------------------------------------------------------
  tabBtnProducts?.addEventListener('click', () => switchTab('products'));
  tabBtnReviews?.addEventListener('click', () => switchTab('reviews'));
  tabBtnPending?.addEventListener('click', () => switchTab('pending'));

  function switchTab(tabName) {
    tabBtnProducts?.classList.toggle('active', tabName === 'products');
    tabBtnReviews?.classList.toggle('active', tabName === 'reviews');
    tabBtnPending?.classList.toggle('active', tabName === 'pending');

    if (panelProducts) panelProducts.style.display = tabName === 'products' ? 'block' : 'none';
    if (panelReviews) panelReviews.style.display = tabName === 'reviews' ? 'block' : 'none';
    if (panelPending) panelPending.style.display = tabName === 'pending' ? 'block' : 'none';
  }

  // ---------------------------------------------------------------------------
  // 5. Products Management Controller
  // ---------------------------------------------------------------------------
  async function loadProducts() {
    if (!productsTableBody) return;
    productsTableBody.innerHTML = `<tr><td colspan="8" class="table-loading-cell">Fetching products from Supabase...</td></tr>`;

    try {
      if (!supabase) {
        productsCache = window.PRODUCTS_DATA || [];
        renderProductsTable();
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      productsCache = data || [];
      updateAdminCategoryFilterOptions();
      renderProductsTable();
    } catch (err) {
      console.warn('Error loading products from Supabase:', err);
      productsCache = window.PRODUCTS_DATA || [];
      updateAdminCategoryFilterOptions();
      renderProductsTable();
      showToast('Loaded local fallback products. Run supabase-schema.sql to sync tables.', 'error');
    }
  }

  function updateAdminCategoryFilterOptions() {
    if (!productCategoryFilter) return;
    const currentVal = (productCategoryFilter.value || 'all').toLowerCase();
    const categories = new Set();
    productsCache.forEach((p) => {
      if (p.category) {
        categories.add(String(p.category).trim());
      }
    });

    let optionsHtml = '<option value="all">All Categories</option>';
    categories.forEach((cat) => {
      const isSelected = currentVal === cat.toLowerCase() ? 'selected' : '';
      optionsHtml += `<option value="${escapeHtml(cat.toLowerCase())}" ${isSelected}>${escapeHtml(cat)}</option>`;
    });
    productCategoryFilter.innerHTML = optionsHtml;
  }

  function renderProductsTable() {
    if (!productsTableBody) return;

    if (tabProductsBadge) {
      tabProductsBadge.textContent = productsCache.length;
    }

    const searchTerm = (productSearchInput?.value || '').toLowerCase().trim();
    const categoryFilter = (productCategoryFilter?.value || 'all').toLowerCase();

    const filtered = productsCache.filter((p) => {
      const matchSearch = !searchTerm || 
        (p.name && p.name.toLowerCase().includes(searchTerm)) ||
        (p.category && p.category.toLowerCase().includes(searchTerm)) ||
        (p.badge && p.badge.toLowerCase().includes(searchTerm));
      
      const matchCategory = categoryFilter === 'all' || 
        (p.category && p.category.toLowerCase() === categoryFilter);

      return matchSearch && matchCategory;
    });

    if (filtered.length === 0) {
      productsTableBody.innerHTML = `
        <tr>
          <td colspan="8" class="table-loading-cell">No products found matching your search.</td>
        </tr>
      `;
      return;
    }

    productsTableBody.innerHTML = filtered.map((product) => {
      const priceNum = parseFloat(product.price) || 0;
      const badgeHtml = product.badge 
        ? `<span class="badge-tag">${product.badge}</span>` 
        : '<span style="color:#aaa;">—</span>';
      
      const inStock = product.in_stock !== false;
      const stockHtml = inStock 
        ? `<span class="stock-tag in-stock">In Stock</span>` 
        : `<span class="stock-tag out-of-stock">Out of Stock</span>`;

      let variantsArr = [];
      if (Array.isArray(product.variants)) {
        variantsArr = product.variants;
      } else if (typeof product.variants === 'string') {
        try { variantsArr = JSON.parse(product.variants); } catch (e) { variantsArr = []; }
      }
      const variantsText = variantsArr.length > 0 ? variantsArr.join(', ') : '—';
      const imageUrl = product.image_url || product.image || 'images/products/placeholder-1.jpg';

      return `
        <tr data-id="${product.id}">
          <td>
            <img src="${imageUrl}" alt="${product.name}" class="table-img-thumb" onerror="this.src='images/products/placeholder-1.jpg'">
          </td>
          <td>
            <div class="table-product-title">${product.name}</div>
          </td>
          <td>
            <span class="category-tag">${product.category || 'Chains'}</span>
          </td>
          <td>
            <strong>Rs. ${priceNum.toLocaleString()}</strong>
          </td>
          <td>${badgeHtml}</td>
          <td>
            <small style="color: #666; max-width: 140px; display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${variantsText}
            </small>
          </td>
          <td>${stockHtml}</td>
          <td>
            <div class="table-actions">
              <button type="button" class="btn-table-action btn-table-edit" onclick="window.ZivelleAdmin.editProduct('${product.id}')">Edit</button>
              <button type="button" class="btn-table-action btn-table-delete" onclick="window.ZivelleAdmin.deleteProductPrompt('${product.id}', '${escapeHtml(product.name)}')">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Product Filters Listeners
  productSearchInput?.addEventListener('input', renderProductsTable);
  productCategoryFilter?.addEventListener('change', renderProductsTable);

  // ---------------------------------------------------------------------------
  // Photo Upload & Dropzone Controller
  // ---------------------------------------------------------------------------
  let selectedProductFile = null;

  function handleProductPhotoSelect(file) {
    if (!file) return;

    // 1. Client-side file type validation
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP, etc.).', 'error');
      return;
    }

    // 2. Client-side file size validation (5MB max limit)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      showToast('Image exceeds 5MB size limit. Please choose a smaller photo.', 'error');
      return;
    }

    selectedProductFile = file;

    // 3. Live local image preview
    const previewUrl = URL.createObjectURL(file);
    if (productImagePreview) productImagePreview.src = previewUrl;
    if (dropzoneFilename) dropzoneFilename.textContent = file.name;
    if (dropzoneFilesize) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      dropzoneFilesize.textContent = `${sizeMb} MB • Ready to upload`;
    }
    if (dropzonePrompt) dropzonePrompt.style.display = 'none';
    if (dropzonePreviewWrap) dropzonePreviewWrap.style.display = 'flex';
  }

  // Dropzone click & drag-and-drop listeners
  productImageDropzone?.addEventListener('click', (e) => {
    productImageFileInput?.click();
  });

  productImageDropzone?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      productImageFileInput?.click();
    }
  });

  btnChangePhoto?.addEventListener('click', (e) => {
    e.stopPropagation();
    productImageFileInput?.click();
  });

  productImageFileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) handleProductPhotoSelect(file);
  });

  ['dragenter', 'dragover'].forEach((eventName) => {
    productImageDropzone?.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      productImageDropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'dragend', 'drop'].forEach((eventName) => {
    productImageDropzone?.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      productImageDropzone.classList.remove('dragover');
    });
  });

  productImageDropzone?.addEventListener('drop', (e) => {
    const file = e.dataTransfer?.files?.[0];
    if (file) handleProductPhotoSelect(file);
  });

  // Open Product Modal
  btnOpenAddProduct?.addEventListener('click', () => {
    openProductModal(null);
  });

  function openProductModal(product = null) {
    if (!productModalBackdrop) return;
    selectedProductFile = null;
    if (productImageFileInput) productImageFileInput.value = '';
    if (uploadProgressWrap) uploadProgressWrap.style.display = 'none';

    if (product) {
      if (productModalTitle) productModalTitle.textContent = 'Edit Product';
      if (productFormId) productFormId.value = product.id;
      if (productNameInput) productNameInput.value = product.name || '';
      if (productCategoryInput) {
        productCategoryInput.value = (product.category || '').trim();
      }
      if (productPriceInput) productPriceInput.value = parseFloat(product.price) || '';
      if (productBadgeSelect) productBadgeSelect.value = product.badge || '';
      
      const existingImg = product.image_url || product.image || '';
      if (productCurrentImageUrlInput) productCurrentImageUrlInput.value = existingImg;

      if (existingImg) {
        if (productImagePreview) productImagePreview.src = existingImg;
        if (dropzoneFilename) dropzoneFilename.textContent = 'Current Product Image';
        if (dropzoneFilesize) dropzoneFilesize.textContent = 'Existing photo on file';
        if (dropzonePrompt) dropzonePrompt.style.display = 'none';
        if (dropzonePreviewWrap) dropzonePreviewWrap.style.display = 'flex';
      } else {
        if (dropzonePrompt) dropzonePrompt.style.display = 'flex';
        if (dropzonePreviewWrap) dropzonePreviewWrap.style.display = 'none';
      }

      let variantsArr = [];
      if (Array.isArray(product.variants)) {
        variantsArr = product.variants;
      } else if (typeof product.variants === 'string') {
        try { variantsArr = JSON.parse(product.variants); } catch (e) { variantsArr = []; }
      }
      if (productVariantsInput) productVariantsInput.value = variantsArr.join(', ');
      if (productInStockCheckbox) productInStockCheckbox.checked = product.in_stock !== false;
    } else {
      if (productModalTitle) productModalTitle.textContent = 'Add New Product';
      productForm?.reset();
      if (productFormId) productFormId.value = '';
      if (productCategoryInput) productCategoryInput.value = '';
      if (productCurrentImageUrlInput) productCurrentImageUrlInput.value = '';
      if (productInStockCheckbox) productInStockCheckbox.checked = true;
      if (dropzonePrompt) dropzonePrompt.style.display = 'flex';
      if (dropzonePreviewWrap) dropzonePreviewWrap.style.display = 'none';
    }

    productModalBackdrop.style.display = 'flex';
  }

  function closeProductModal() {
    if (productModalBackdrop) productModalBackdrop.style.display = 'none';
    selectedProductFile = null;
    if (uploadProgressWrap) uploadProgressWrap.style.display = 'none';
  }

  btnCloseProductModal?.addEventListener('click', closeProductModal);
  btnCancelProductModal?.addEventListener('click', closeProductModal);

  // Save Product (Upload Photo to Supabase Storage -> Insert / Update Database)
  productForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = (productNameInput?.value || '').trim();
    const category = (productCategoryInput?.value || '').trim();
    const price = parseFloat(productPriceInput?.value);
    const badge = productBadgeSelect?.value || null;
    const existingImageUrl = productCurrentImageUrlInput?.value.trim();
    const variantsRaw = productVariantsInput?.value.trim();
    const inStock = productInStockCheckbox?.checked !== false;
    const existingId = productFormId?.value;

    if (!name || isNaN(price) || !category) {
      showToast('Please fill out all required fields (Name, Category, and Price).', 'error');
      return;
    }

    if (!selectedProductFile && !existingImageUrl) {
      showToast('Please select a product photo to upload.', 'error');
      return;
    }

    setButtonLoading(btnSaveProduct, true, 'Saving Product...');

    try {
      if (!supabase) throw new Error('Supabase client is not available.');

      let finalImageUrl = existingImageUrl;

      // 1. If a new photo is selected, upload it directly to Supabase Storage
      if (selectedProductFile) {
        if (uploadProgressWrap) uploadProgressWrap.style.display = 'flex';
        if (uploadProgressText) uploadProgressText.textContent = 'Uploading photo to Supabase Storage...';

        const fileExt = selectedProductFile.name.split('.').pop().toLowerCase() || 'jpg';
        const cleanName = selectedProductFile.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .slice(0, 30);
        const fileName = `${Date.now()}_${cleanName}.${fileExt}`;
        const storagePath = `products/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(storagePath, selectedProductFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          throw new Error(`Photo upload failed: ${uploadError.message}. Ensure 'product-images' bucket is created in Supabase Storage.`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(storagePath);

        finalImageUrl = publicUrl;
      }

      // 2. Parse variants into array of strings
      const variantsArray = variantsRaw 
        ? variantsRaw.split(',').map((v) => v.trim()).filter((v) => v.length > 0)
        : [];

      const payload = {
        name,
        category,
        price,
        badge,
        image_url: finalImageUrl || 'images/products/placeholder-1.jpg',
        variants: variantsArray,
        in_stock: inStock
      };

      if (existingId) {
        // UPDATE
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', existingId);

        if (error) throw error;
        showToast('Product updated successfully!');
      } else {
        // INSERT
        const { error } = await supabase
          .from('products')
          .insert([payload]);

        if (error) throw error;
        showToast('New product created successfully!');
      }

      closeProductModal();
      await loadProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      showToast(err.message || 'Failed to save product to database.', 'error');
    } finally {
      setButtonLoading(btnSaveProduct, false, 'Save Product');
      if (uploadProgressWrap) uploadProgressWrap.style.display = 'none';
    }
  });

  // ---------------------------------------------------------------------------
  // 6. Reviews Management Controller
  // ---------------------------------------------------------------------------
  async function loadReviews() {
    if (reviewsTableBody) {
      reviewsTableBody.innerHTML = `<tr><td colspan="5" class="table-loading-cell">Fetching approved reviews...</td></tr>`;
    }
    if (pendingReviewsTableBody) {
      pendingReviewsTableBody.innerHTML = `<tr><td colspan="6" class="table-loading-cell">Fetching pending reviews...</td></tr>`;
    }

    try {
      if (!supabase) {
        reviewsCache = [];
        renderApprovedReviewsTable();
        renderPendingReviewsTable();
        return;
      }

      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      reviewsCache = data || [];
      renderApprovedReviewsTable();
      renderPendingReviewsTable();
    } catch (err) {
      console.warn('Error loading reviews from Supabase:', err);
      reviewsCache = [];
      renderApprovedReviewsTable();
      renderPendingReviewsTable();
      showToast('Loaded local reviews fallback.', 'error');
    }
  }

  // A. Approved Reviews Table (Shown in "Approved Reviews" tab)
  function renderApprovedReviewsTable() {
    if (!reviewsTableBody) return;

    const approvedReviews = reviewsCache.filter((r) => (r.status || 'approved') === 'approved');

    if (tabReviewsBadge) {
      tabReviewsBadge.textContent = approvedReviews.length;
    }

    const searchTerm = (reviewSearchInput?.value || '').toLowerCase().trim();

    const filtered = approvedReviews.filter((r) => {
      const name = (r.customer_name || r.name || '').toLowerCase();
      const prod = (r.purchased_product || r.product || '').toLowerCase();
      const quote = (r.review_text || r.quote || '').toLowerCase();
      return !searchTerm || name.includes(searchTerm) || prod.includes(searchTerm) || quote.includes(searchTerm);
    });

    if (filtered.length === 0) {
      reviewsTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="table-loading-cell">No approved customer reviews found.</td>
        </tr>
      `;
      return;
    }

    reviewsTableBody.innerHTML = filtered.map((review) => {
      const customerName = review.customer_name || review.name || 'Verified Client';
      const rating = parseInt(review.rating, 10) || 5;
      const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
      const text = review.review_text || review.quote || '';
      const prod = review.purchased_product || review.product || '—';

      return `
        <tr data-id="${review.id}">
          <td>
            <strong>${customerName}</strong>
          </td>
          <td>
            <span class="table-rating-stars" aria-label="${rating} stars">${stars}</span>
          </td>
          <td>
            <div class="table-review-quote" title="${escapeHtml(text)}">"${text}"</div>
          </td>
          <td>
            <span style="color: #666; font-size: 0.825rem;">${prod}</span>
          </td>
          <td>
            <div class="table-actions">
              <button type="button" class="btn-table-action btn-table-edit" onclick="window.ZivelleAdmin.editReview('${review.id}')">Edit</button>
              <button type="button" class="btn-table-action btn-table-delete" onclick="window.ZivelleAdmin.deleteReviewPrompt('${review.id}', '${escapeHtml(customerName)}')">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // B. Pending Reviews Table (Shown in new "Pending Reviews" tab)
  function renderPendingReviewsTable() {
    if (!pendingReviewsTableBody) return;

    const pendingReviews = reviewsCache.filter((r) => r.status === 'pending');

    if (tabPendingBadge) {
      tabPendingBadge.textContent = pendingReviews.length;
    }

    const searchTerm = (pendingSearchInput?.value || '').toLowerCase().trim();

    const filtered = pendingReviews.filter((r) => {
      const name = (r.customer_name || r.name || '').toLowerCase();
      const prod = (r.purchased_product || r.product || '').toLowerCase();
      const quote = (r.review_text || r.quote || '').toLowerCase();
      return !searchTerm || name.includes(searchTerm) || prod.includes(searchTerm) || quote.includes(searchTerm);
    });

    if (filtered.length === 0) {
      pendingReviewsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="table-loading-cell">No pending reviews awaiting approval. All customer feedback is published.</td>
        </tr>
      `;
      return;
    }

    pendingReviewsTableBody.innerHTML = filtered.map((review) => {
      const customerName = review.customer_name || review.name || 'Verified Client';
      const rating = parseInt(review.rating, 10) || 5;
      const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
      const text = review.review_text || review.quote || '';
      const prod = review.purchased_product || review.product || '—';
      
      let dateDisplay = 'Recently';
      if (review.created_at) {
        try {
          const d = new Date(review.created_at);
          dateDisplay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch (e) {
          dateDisplay = 'Recently';
        }
      }

      return `
        <tr data-id="${review.id}">
          <td>
            <strong>${customerName}</strong>
          </td>
          <td>
            <span class="table-rating-stars" aria-label="${rating} stars">${stars}</span>
          </td>
          <td>
            <div class="table-review-quote" title="${escapeHtml(text)}">"${text}"</div>
          </td>
          <td>
            <span style="color: #666; font-size: 0.825rem;">${prod}</span>
          </td>
          <td>
            <span style="color: #666; font-size: 0.8rem;">${dateDisplay}</span>
          </td>
          <td>
            <div class="table-actions">
              <button type="button" class="btn-table-action btn-table-approve" onclick="window.ZivelleAdmin.approveReview('${review.id}')">Approve</button>
              <button type="button" class="btn-table-action btn-table-delete" onclick="window.ZivelleAdmin.deleteReviewPrompt('${review.id}', '${escapeHtml(customerName)}')">Reject</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Reviews Search Listeners
  reviewSearchInput?.addEventListener('input', renderApprovedReviewsTable);
  pendingSearchInput?.addEventListener('input', renderPendingReviewsTable);

  // Open Review Modal
  btnOpenAddReview?.addEventListener('click', () => {
    openReviewModal(null);
  });

  function openReviewModal(review = null) {
    if (!reviewModalBackdrop) return;

    if (review) {
      if (reviewModalTitle) reviewModalTitle.textContent = 'Edit Review';
      if (reviewFormId) reviewFormId.value = review.id;
      if (reviewCustomerNameInput) reviewCustomerNameInput.value = review.customer_name || review.name || '';
      if (reviewRatingSelect) reviewRatingSelect.value = String(review.rating || 5);
      if (reviewPurchasedProductInput) reviewPurchasedProductInput.value = review.purchased_product || review.product || '';
      if (reviewTextInput) reviewTextInput.value = review.review_text || review.quote || '';
    } else {
      if (reviewModalTitle) reviewModalTitle.textContent = 'Add New Review';
      reviewForm?.reset();
      if (reviewFormId) reviewFormId.value = '';
      if (reviewRatingSelect) reviewRatingSelect.value = '5';
    }

    reviewModalBackdrop.style.display = 'flex';
  }

  function closeReviewModal() {
    if (reviewModalBackdrop) reviewModalBackdrop.style.display = 'none';
  }

  btnCloseReviewModal?.addEventListener('click', closeReviewModal);
  btnCancelReviewModal?.addEventListener('click', closeReviewModal);

  // Save Review (Insert / Update)
  reviewForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const customerName = reviewCustomerNameInput?.value.trim();
    const rating = parseInt(reviewRatingSelect?.value, 10);
    const purchasedProduct = reviewPurchasedProductInput?.value.trim() || null;
    const reviewText = reviewTextInput?.value.trim();
    const existingId = reviewFormId?.value;

    if (!customerName || isNaN(rating) || !reviewText) {
      alert('Please fill out Customer Name, Rating, and Review Content.');
      return;
    }

    const payload = {
      customer_name: customerName,
      rating,
      review_text: reviewText,
      purchased_product: purchasedProduct
    };

    setButtonLoading(btnSaveReview, true, 'Saving...');

    try {
      if (!supabase) throw new Error('Supabase client is not available.');

      if (existingId) {
        // UPDATE
        const { error } = await supabase
          .from('reviews')
          .update(payload)
          .eq('id', existingId);

        if (error) throw error;
        showToast('Review updated successfully!');
      } else {
        // INSERT
        const { error } = await supabase
          .from('reviews')
          .insert([payload]);

        if (error) throw error;
        showToast('New review created successfully!');
      }

      closeReviewModal();
      await loadReviews();
    } catch (err) {
      console.error('Error saving review:', err);
      showToast(err.message || 'Failed to save review to database.', 'error');
    } finally {
      setButtonLoading(btnSaveReview, false, 'Save Review');
    }
  });

  // ---------------------------------------------------------------------------
  // 7. Delete Confirmation Controller
  // ---------------------------------------------------------------------------
  function openDeleteModal(message, onConfirm) {
    if (!deleteModalBackdrop) return;
    if (deleteModalMessage) deleteModalMessage.textContent = message;
    pendingDeleteAction = onConfirm;
    deleteModalBackdrop.style.display = 'flex';
  }

  function closeDeleteModal() {
    if (deleteModalBackdrop) deleteModalBackdrop.style.display = 'none';
    pendingDeleteAction = null;
  }

  btnCloseDeleteModal?.addEventListener('click', closeDeleteModal);
  btnCancelDelete?.addEventListener('click', closeDeleteModal);

  btnConfirmDelete?.addEventListener('click', async () => {
    if (typeof pendingDeleteAction === 'function') {
      setButtonLoading(btnConfirmDelete, true, 'Deleting...');
      try {
        await pendingDeleteAction();
      } finally {
        setButtonLoading(btnConfirmDelete, false, 'Yes, Delete');
        closeDeleteModal();
      }
    }
  });

  // ---------------------------------------------------------------------------
  // 8. Helper Utilities
  // ---------------------------------------------------------------------------
  function setButtonLoading(btn, isLoading, text) {
    if (!btn) return;
    const btnText = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.btn-spinner');
    if (isLoading) {
      btn.disabled = true;
      if (btnText) btnText.textContent = text;
      if (spinner) spinner.style.display = 'inline-block';
    } else {
      btn.disabled = false;
      if (btnText) btnText.textContent = text;
      if (spinner) spinner.style.display = 'none';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ---------------------------------------------------------------------------
  // 9. Global Window Bindings for Inline Handlers
  // ---------------------------------------------------------------------------
  window.ZivelleAdmin = {
    editProduct: (id) => {
      const prod = productsCache.find((p) => String(p.id) === String(id));
      if (prod) openProductModal(prod);
    },
    deleteProductPrompt: (id, name) => {
      openDeleteModal(`Are you sure you want to delete "${name}"? This action cannot be undone.`, async () => {
        if (!supabase) return;
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
          showToast(error.message || 'Failed to delete product', 'error');
        } else {
          showToast(`Deleted "${name}"`);
          await loadProducts();
        }
      });
    },
    editReview: (id) => {
      const review = reviewsCache.find((r) => String(r.id) === String(id));
      if (review) openReviewModal(review);
    },
    approveReview: async (id) => {
      if (!supabase) return;
      try {
        const { error } = await supabase
          .from('reviews')
          .update({ status: 'approved' })
          .eq('id', id);

        if (error) throw error;

        showToast('Review approved and published to storefront!');
        await loadReviews();
      } catch (err) {
        console.error('Error approving review:', err);
        showToast(err.message || 'Failed to approve review', 'error');
      }
    },
    deleteReviewPrompt: (id, name) => {
      openDeleteModal(`Are you sure you want to delete the review from "${name}"? This cannot be undone.`, async () => {
        if (!supabase) return;
        const { error } = await supabase.from('reviews').delete().eq('id', id);
        if (error) {
          showToast(error.message || 'Failed to delete review', 'error');
        } else {
          showToast(`Deleted review from "${name}"`);
          await loadReviews();
        }
      });
    }
  };

  // ---------------------------------------------------------------------------
  // 10. Initialization
  // ---------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    checkAuthSession();
  });

})();
