/* =============================================================
   SASHA BEHAR — Portfolio
   Vanilla JS:
     - Single-page navigation via #hash
     - Nav dropdowns for Paintings / Drawings (hover, focus, touch)
     - Lightbox for artworks (click any gallery image to open)
   ============================================================= */

(function () {
  'use strict';

  /* ----- Cache DOM ----- */
  var pages    = document.querySelectorAll('.page');

  /* =====================================================
     SPA navigation
     ===================================================== */

  function showPage(id) {
    var found = false;

    pages.forEach(function (page) {
      var match = page.id === id;
      page.classList.toggle('is-active', match);
      if (match) found = true;
    });

    if (!found) {
      var home = document.getElementById('home');
      if (home) home.classList.add('is-active');
      id = 'home';
    }

    // Drive responsive header (logo size) via body[data-page]
    document.body.setAttribute('data-page', id);

    // Highlight matching nav link (also covers footer Contact button + nav links)
    document.querySelectorAll('a[data-section]').forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('data-section') === id);
    });

    // Close any open dropdown when navigating
    document.querySelectorAll('.has-dropdown.is-open').forEach(function (li) {
      li.classList.remove('is-open');
      var trigger = li.querySelector('.nav-trigger');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });

    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function handleHashChange() {
    var id = (location.hash || '#home').replace(/^#/, '');
    showPage(id);
  }

  // Any element with data-section navigates SPA-style
  document.querySelectorAll('a[data-section]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var target = link.getAttribute('data-section');
      if (!target) return;
      e.preventDefault();
      if (location.hash === '#' + target) {
        showPage(target);
      } else {
        history.pushState(null, '', '#' + target);
        showPage(target);
      }
    });
  });

  window.addEventListener('hashchange', handleHashChange);
  handleHashChange();

  /* =====================================================
     Nav dropdowns (Paintings / Drawings)
     - Hover/focus is handled in CSS.
     - On touch devices we toggle a class on click of the trigger.
     ===================================================== */

  var dropdownItems = document.querySelectorAll('.has-dropdown');

  dropdownItems.forEach(function (li) {
    var trigger = li.querySelector('.nav-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      // Close any other open dropdown
      dropdownItems.forEach(function (other) {
        if (other !== li) {
          other.classList.remove('is-open');
          var otherTrigger = other.querySelector('.nav-trigger');
          if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
        }
      });
      var isOpen = li.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', String(isOpen));
    });

    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        trigger.click();
      } else if (e.key === 'Escape') {
        li.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Click outside any dropdown closes them all
  document.addEventListener('click', function (e) {
    var inside = e.target.closest('.has-dropdown');
    if (!inside) {
      dropdownItems.forEach(function (li) {
        li.classList.remove('is-open');
        var t = li.querySelector('.nav-trigger');
        if (t) t.setAttribute('aria-expanded', 'false');
      });
    }
  });

  /* =====================================================
     LIGHTBOX
     Click any gallery figure → open in overlay.
     Supports prev/next navigation within the same gallery.
     ===================================================== */

  var lightbox  = document.getElementById('lightbox');
  var lbImg     = document.getElementById('lightbox-image');
  var lbCaption = document.getElementById('lightbox-caption');
  var lbClose   = lightbox && lightbox.querySelector('.lightbox-close');
  var lbPrev    = lightbox && lightbox.querySelector('.lightbox-prev');
  var lbNext    = lightbox && lightbox.querySelector('.lightbox-next');
  var lbInner   = lightbox && lightbox.querySelector('.lightbox-inner');

  var lbCurrentSet = [];
  var lbCurrentIdx = 0;

  // dir: 'next' | 'prev' | undefined (undefined = initial open).
  // Drives a subtle fade/slide entrance so navigation feels cinematic.
  function openLightbox(fig, dir) {
    if (!lightbox || !fig) return;
    var img = fig.querySelector('img');
    var cap = fig.querySelector('figcaption');
    if (!img) return;

    lbImg.src = img.src;
    lbImg.alt = img.alt || '';
    lbCaption.innerHTML = cap ? cap.innerHTML : '';

    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';

    // Re-trigger the appropriate entrance animation. Removing the classes and
    // forcing a reflow restarts the CSS animation every time, even when the
    // same direction class is reused for consecutive steps.
    if (lbInner) {
      lbInner.classList.remove('lb-open', 'lb-next', 'lb-prev');
      void lbInner.offsetWidth; // force reflow so the animation replays
      lbInner.classList.add(
        dir === 'next' ? 'lb-next' : dir === 'prev' ? 'lb-prev' : 'lb-open'
      );
    }
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.style.overflow = '';
    lbImg.src = '';
    lbImg.alt = '';
    lbCaption.innerHTML = '';
  }

  function showAt(idx, dir) {
    if (!lbCurrentSet.length) return;
    lbCurrentIdx = (idx + lbCurrentSet.length) % lbCurrentSet.length;
    openLightbox(lbCurrentSet[lbCurrentIdx], dir);
  }

  document.querySelectorAll('.gallery-grid figure').forEach(function (fig) {
    var img = fig.querySelector('img');
    if (!img) return;
    fig.addEventListener('click', function () {
      // Build one continuous sequence from EVERY artwork on the whole page
      // (the enclosing .page section), not just the clicked figure's row.
      // This lets the arrows/swipe move seamlessly across rows on pages like
      // Girlobouros that split works into several .gallery-grid blocks.
      // querySelectorAll returns elements in document order, which matches the
      // visual top-to-bottom, left-to-right gallery order.
      var scope = fig.closest('.page') || fig.parentElement;
      var all = Array.prototype.slice.call(
        scope.querySelectorAll('.gallery-grid figure')
      );
      lbCurrentSet = all;
      lbCurrentIdx = all.indexOf(fig);
      openLightbox(fig);
    });
  });

  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lbPrev)  lbPrev.addEventListener('click',  function () { showAt(lbCurrentIdx - 1, 'prev'); });
  if (lbNext)  lbNext.addEventListener('click',  function () { showAt(lbCurrentIdx + 1, 'next'); });

  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (!lightbox || lightbox.hidden) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')   showAt(lbCurrentIdx - 1, 'prev');
    if (e.key === 'ArrowRight')  showAt(lbCurrentIdx + 1, 'next');
  });

  /* ----- Swipe navigation (touch devices) -----
     A horizontal swipe steps through the set: swipe left → next, right → prev.
     We require the gesture to be clearly horizontal so vertical scrolls and
     taps aren't misread. */
  var touchStartX = 0, touchStartY = 0, touchTracking = false;

  if (lightbox) {
    lightbox.addEventListener('touchstart', function (e) {
      if (lightbox.hidden || e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchTracking = true;
    }, { passive: true });

    lightbox.addEventListener('touchend', function (e) {
      if (!touchTracking || lightbox.hidden) return;
      touchTracking = false;
      var t = e.changedTouches[0];
      var dx = t.clientX - touchStartX;
      var dy = t.clientY - touchStartY;
      // Must be a deliberate, mostly-horizontal swipe.
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        if (dx < 0) showAt(lbCurrentIdx + 1, 'next');   // swipe left  → next
        else        showAt(lbCurrentIdx - 1, 'prev');   // swipe right → prev
      }
    }, { passive: true });
  }

})();
