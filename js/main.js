/* Islam Mahrous — site behaviour (language toggle, menu, reveal animations, parallax, contact form). */
(function () {
  'use strict';

  var I18N = window.I18N;
  var root = document.documentElement;
  var WHATSAPP = 'https://wa.me/201095556779';
  var PROFILE_PDF = {
    ar: 'downloads/Islam-Mahrous-Executive-Profile-2026-AR.pdf',
    en: 'downloads/Islam-Mahrous-Executive-Profile-2026-EN.pdf'
  };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Language ---------- */
  var langButtons = document.querySelectorAll('[data-lang]');
  // The markup ships with Arabic active, so the two buttons hold the active / inactive class sets.
  var activeClass = document.querySelector('[data-lang="ar"]').className;
  var inactiveClass = document.querySelector('[data-lang="en"]').className;

  function setLang(lang) {
    var dict = I18N[lang];
    root.setAttribute('lang', lang);
    root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var value = dict[el.getAttribute('data-i18n')];
      if (value != null) el.textContent = value;
    });
    document.querySelectorAll('[data-i18n-alt]').forEach(function (el) {
      var value = dict[el.getAttribute('data-i18n-alt')];
      if (value != null) el.setAttribute('alt', value);
    });

    langButtons.forEach(function (btn) {
      var on = btn.getAttribute('data-lang') === lang;
      btn.className = on ? activeClass : inactiveClass;
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    document.querySelectorAll('[data-flip-rtl]').forEach(function (el) {
      el.classList.toggle('-scale-x-100', lang === 'ar');
    });

    var pdf = document.querySelector('[data-profile-pdf]');
    if (pdf) {
      pdf.setAttribute('href', PROFILE_PDF[lang]);
      pdf.setAttribute('download', PROFILE_PDF[lang].split('/').pop());
    }

    try { localStorage.setItem('im-lang', lang); } catch (e) {}
  }

  langButtons.forEach(function (btn) {
    btn.addEventListener('click', function () { setLang(btn.getAttribute('data-lang')); });
  });

  var saved = 'ar';
  try {
    var stored = localStorage.getItem('im-lang');
    if (stored === 'ar' || stored === 'en') saved = stored;
  } catch (e) {}
  setLang(saved);

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector('[data-menu-toggle]');
  var menu = document.getElementById('mobile-menu');
  if (toggle && menu) {
    var setMenu = function (open) {
      menu.hidden = !open;
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.querySelector('[data-icon="menu"]').classList.toggle('hidden', open);
      toggle.querySelector('[data-icon="close"]').classList.toggle('hidden', !open);
    };
    toggle.addEventListener('click', function () { setMenu(menu.hidden); });
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
  }

  /* ---------- Reveal on scroll (mirrors framer-motion whileInView, once, margin -80px) ---------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  revealEls.forEach(function (el) {
    var siblings = Array.prototype.filter.call(el.parentElement.children, function (c) {
      return c.hasAttribute('data-reveal');
    });
    var index = siblings.indexOf(el);
    var inHero = !!el.closest('#top');
    var delay = el.getAttribute('data-reveal') === '40' ? 0.2 : Math.min(index * (inHero ? 0.1 : 0.05), 0.5);
    el.style.transitionDelay = delay + 's';
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '-80px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Hero background parallax (0 → 120px over the hero's height) ---------- */
  var hero = document.getElementById('top');
  var layer = document.querySelector('[data-parallax]');
  if (hero && layer && !reduceMotion) {
    var ticking = false;
    var update = function () {
      ticking = false;
      var rect = hero.getBoundingClientRect();
      var progress = Math.min(Math.max(-rect.top / rect.height, 0), 1);
      layer.style.transform = 'translate3d(0,' + (progress * 120).toFixed(2) + 'px,0)';
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------- Contact form → WhatsApp ---------- */
  var form = document.querySelector('[data-contact-form]');
  if (form) {
    var sent = form.querySelector('[data-form-sent]');
    var markError = function (name, hasError) {
      var field = form.elements[name];
      var label = field.closest('label');
      var star = label.querySelector('[data-error]');
      if (hasError && !star) {
        star = document.createElement('span');
        star.className = 'mt-1 block text-xs text-destructive';
        star.setAttribute('data-error', '');
        star.textContent = '*';
        label.appendChild(star);
      } else if (!hasError && star) {
        star.remove();
      }
      field.setAttribute('aria-invalid', hasError ? 'true' : 'false');
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim();
      var email = form.elements.email.value.trim();
      var company = form.elements.company.value.trim();
      var message = form.elements.message.value.trim();

      var errors = {
        name: !name || name.length > 120,
        email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200,
        message: !message || message.length > 2000
      };
      markError('name', errors.name);
      markError('email', errors.email);
      markError('message', errors.message);
      if (errors.name || errors.email || errors.message) return;

      var text = 'Name: ' + name + '%0AEmail: ' + email +
        (company ? '%0ACompany: ' + company : '') + '%0A%0A' + encodeURIComponent(message);
      window.open(WHATSAPP + '?text=' + text, '_blank', 'noopener,noreferrer');
      sent.hidden = false;
      form.reset();
    });
  }

  /* ---------- Footer year ---------- */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
