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
  const starButtons = document.querySelectorAll('.star-btn');
  const starRatingText = document.getElementById('star-rating-text');
  const reviewAlert = document.getElementById('review-alert');
  const reviewAlertText = document.getElementById('review-alert-text');
  const btnSubmit = document.getElementById('btn-submit-review');

  let currentRating = 5;

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

  // 4. Form Submit Handler
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

      // Customer submissions default to 'pending' for admin review & approval
      const payload = {
        customer_name: name,
        rating: rating,
        review_text: reviewText,
        purchased_product: product || null,
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
