/**
 * ZIVELLE — Customer Review Submission Controller (js/review.js)
 * Handles client-side star rating interaction, validation, and direct submission
 */

(function () {
  'use strict';

  // 1. Supabase Client Reference (reuses window.supabaseClient or initializes with direct key)
  const SUPABASE_URL = 'https://aekbgnrqnijeklpylrrs.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_YhbsxCmaj5SPYk8iITRn_A_r_VzcZJ5';

  let client = window.supabaseClient;
  if (!client && typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    try {
      client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
      console.warn('[Zivelle Review] Could not initialize Supabase client:', e);
    }
  }

  // 2. DOM Elements
  const reviewForm = document.getElementById('customer-review-form');
  const reviewFormCard = document.getElementById('review-form-card');
  const reviewSuccessCard = document.getElementById('review-success-card');
  const reviewNameInput = document.getElementById('review-name');
  const reviewProductInput = document.getElementById('review-product');
  const reviewTextInput = document.getElementById('review-text');
  const reviewRatingInput = document.getElementById('review-rating');
  const reviewPhotoFileInput = document.getElementById('review-photo-file');
  const reviewPhotoDropzone = document.getElementById('review-photo-dropzone');
  const reviewPhotoPrompt = document.getElementById('review-photo-prompt');
  const reviewPhotoPreviewWrap = document.getElementById('review-photo-preview-wrap');
  const reviewPhotoPreview = document.getElementById('review-photo-preview');
  const reviewPhotoFilename = document.getElementById('review-photo-filename');
  const btnRemoveReviewPhoto = document.getElementById('btn-remove-review-photo');
  const starButtons = document.querySelectorAll('.star-btn');
  const starRatingText = document.getElementById('star-rating-text');
  const reviewAlert = document.getElementById('review-alert');
  const reviewAlertText = document.getElementById('review-alert-text');
  const btnSubmit = document.getElementById('btn-submit-review');

  let currentRating = 5;
  let selectedReviewPhotoFile = null;

  const RATING_LABELS = {
    1: '1 Star — Poor Experience',
    2: '2 Stars — Fair',
    3: '3 Stars — Good',
    4: '4 Stars — Very Good',
    5: '5 Stars — Exceptional'
  };

  // 3. Interactive Star Rating Controller
  function setRating(rating) {
    currentRating = rating;
    if (reviewRatingInput) reviewRatingInput.value = rating;

    starButtons.forEach((btn) => {
      const starValue = parseInt(btn.getAttribute('data-value'), 10);
      if (starValue <= rating) {
        btn.classList.add('is-active');
      } else {
        btn.classList.remove('is-active');
      }
      btn.classList.remove('is-hovered');
    });

    if (starRatingText) {
      starRatingText.textContent = RATING_LABELS[rating] || `${rating} Stars`;
    }
  }

  function previewRating(rating) {
    starButtons.forEach((btn) => {
      const starValue = parseInt(btn.getAttribute('data-value'), 10);
      if (starValue <= rating) {
        btn.classList.add('is-hovered');
      } else {
        btn.classList.remove('is-hovered');
      }
    });

    if (starRatingText) {
      starRatingText.textContent = RATING_LABELS[rating] || `${rating} Stars`;
    }
  }

  function clearHoverPreview() {
    starButtons.forEach((btn) => btn.classList.remove('is-hovered'));
    if (starRatingText) {
      starRatingText.textContent = RATING_LABELS[currentRating] || `${currentRating} Stars`;
    }
  }

  starButtons.forEach((btn) => {
    const val = parseInt(btn.getAttribute('data-value'), 10);

    btn.addEventListener('click', () => setRating(val));
    btn.addEventListener('mouseenter', () => previewRating(val));
    btn.addEventListener('focus', () => previewRating(val));
    btn.addEventListener('mouseleave', clearHoverPreview);
    btn.addEventListener('blur', clearHoverPreview);
  });

  // Initialize with 5 stars
  setRating(5);

  // 4. Photo Upload Handling
  function handleReviewPhotoSelect(file) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('Please select a valid image file (PNG, JPG, WebP, etc.).');
      return;
    }

    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      showError('Photo exceeds 5MB size limit. Please choose a smaller photo.');
      return;
    }

    selectedReviewPhotoFile = file;
    const previewUrl = URL.createObjectURL(file);
    if (reviewPhotoPreview) reviewPhotoPreview.src = previewUrl;
    if (reviewPhotoFilename) reviewPhotoFilename.textContent = file.name;
    if (reviewPhotoPrompt) reviewPhotoPrompt.style.display = 'none';
    if (reviewPhotoPreviewWrap) reviewPhotoPreviewWrap.style.display = 'flex';
  }

  function clearReviewPhoto() {
    selectedReviewPhotoFile = null;
    if (reviewPhotoFileInput) reviewPhotoFileInput.value = '';
    if (reviewPhotoPrompt) reviewPhotoPrompt.style.display = 'flex';
    if (reviewPhotoPreviewWrap) reviewPhotoPreviewWrap.style.display = 'none';
  }

  reviewPhotoDropzone?.addEventListener('click', (e) => {
    if (e.target.closest('#btn-remove-review-photo')) return;
    reviewPhotoFileInput?.click();
  });

  btnRemoveReviewPhoto?.addEventListener('click', (e) => {
    e.stopPropagation();
    clearReviewPhoto();
  });

  reviewPhotoFileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (file) handleReviewPhotoSelect(file);
  });

  // 5. Form Submit Handler
  reviewForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = (reviewNameInput?.value || '').trim();
    const product = (reviewProductInput?.value || '').trim();
    const reviewText = (reviewTextInput?.value || '').trim();
    const rating = parseInt(reviewRatingInput?.value, 10) || currentRating || 5;

    // Reset error state
    if (reviewAlert) reviewAlert.style.display = 'none';

    // Validation
    if (!name) {
      showError('Please enter your name.');
      reviewNameInput?.focus();
      return;
    }

    if (!reviewText) {
      showError('Please share your thoughts in the review text.');
      reviewTextInput?.focus();
      return;
    }

    if (rating < 1 || rating > 5) {
      showError('Please select a star rating between 1 and 5.');
      return;
    }

    setLoading(true);

    try {
      if (!client) {
        throw new Error('Database connection is currently unavailable. Please try again later.');
      }

      let uploadedPhotoUrl = null;

      // If customer attached a photo, upload it to Supabase Storage
      if (selectedReviewPhotoFile) {
        setLoading(true, 'Uploading photo...');
        const fileExt = selectedReviewPhotoFile.name.split('.').pop().toLowerCase() || 'jpg';
        const cleanName = selectedReviewPhotoFile.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .slice(0, 24);
        const fileName = `review_${Date.now()}_${cleanName}.${fileExt}`;
        const storagePath = `reviews/${fileName}`;

        const { error: uploadError } = await client.storage
          .from('product-images')
          .upload(storagePath, selectedReviewPhotoFile, {
            cacheControl: '3600',
            upsert: true
          });

        if (!uploadError) {
          const { data: { publicUrl } } = client.storage
            .from('product-images')
            .getPublicUrl(storagePath);
          uploadedPhotoUrl = publicUrl;
        } else {
          console.warn('[Zivelle Review] Photo upload notice:', uploadError.message);
        }
      }

      // Customer submissions default to 'pending' for admin review & approval
      const payload = {
        customer_name: name,
        rating: rating,
        review_text: reviewText,
        purchased_product: product || null,
        photo_url: uploadedPhotoUrl,
        status: 'pending'
      };

      const { data, error } = await client
        .from('reviews')
        .insert([payload]);

      if (error) {
        throw error;
      }

      // Success: Hide form and show thank-you card
      if (reviewFormCard) reviewFormCard.style.display = 'none';
      if (reviewSuccessCard) reviewSuccessCard.style.display = 'block';

      // Scroll to top of card smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      console.error('[Zivelle Review] Submission error:', err);
      showError(err.message || 'Unable to submit your review at this time. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  });

  function showError(msg) {
    if (reviewAlertText) reviewAlertText.textContent = msg;
    if (reviewAlert) reviewAlert.style.display = 'flex';
  }

  function setLoading(isLoading) {
    if (!btnSubmit) return;
    const btnText = btnSubmit.querySelector('.btn-text');
    const spinner = btnSubmit.querySelector('.btn-spinner');

    if (isLoading) {
      btnSubmit.disabled = true;
      if (btnText) btnText.textContent = 'Submitting Feedback...';
      if (spinner) spinner.style.display = 'inline-block';
    } else {
      btnSubmit.disabled = false;
      if (btnText) btnText.textContent = 'Submit Review';
      if (spinner) spinner.style.display = 'none';
    }
  }
})();
