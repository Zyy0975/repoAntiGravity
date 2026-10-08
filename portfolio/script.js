/* =========================================================
   ANTI-GRAVITASI PORTFOLIO — script.js
   Vanilla JavaScript, ES6+, tanpa dependensi eksternal.
   ========================================================= */

(() => {
  'use strict';

  /* =========================================================
     0. KONSTANTA & KONFIGURASI
     ========================================================= */
  const CONFIG = {
    email: 'ghozimaulana1234@gmail.com',
    whatsapp: '6289527276666', // format internasional tanpa "+"
    phoneLocal: '089527276666',
    typingLines: [
      'html & css — clean & modern',
      'javascript es6 — interaktif',
      'php & mysql — full stack',
      'tailwind — tanpa bobot ✦'
    ],
    typingSpeed: 58,   // ms per karakter saat mengetik
    deletingSpeed: 32, // ms per karakter saat menghapus
    pauseTime: 1600    // jeda sebelum menghapus
  };

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* Cek dukungan browser untuk prefers-reduced-motion */
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = window.matchMedia('(hover: none)').matches;

  /* =========================================================
     1. UTILITAS
     ========================================================= */

  /** Menunda eksekusi fungsi (throttle-friendly). */
  function debounce(fn, wait = 120) {
    let timer;
    return function debounced(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  /** Batasi frekuensi pemanggilan fungsi (requestAnimationFrame based). */
  function rafThrottle(fn) {
    let ticking = false;
    return function throttled(...args) {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        fn.apply(this, args);
        ticking = false;
      });
    };
  }

  /** Menampilkan toast notifikasi ringan. */
  function showToast(message) {
    const toast = $('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 3200);
  }

  /* =========================================================
     2. STARFIELD — Canvas partikel bintang dengan twinkle
     ========================================================= */
  function initStarfield() {
    const canvas = $('#starfield');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let stars = [];
    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let rafId = null;
    const pointer = { x: 0, y: 0 };

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      // Skala kepadatan bintang mengikuti ukuran layar & perangkat
      const density = Math.min(260, Math.floor((width * height) / 9000));
      stars = Array.from({ length: density }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.4 + 0.25,
        baseAlpha: Math.random() * 0.6 + 0.25,
        alpha: 0,
        twinkleSpeed: Math.random() * 0.02 + 0.004,
        phase: Math.random() * Math.PI * 2,
        drift: Math.random() * 0.16 + 0.03,
        hue: Math.random() > 0.78 ? '157,124,255' : (Math.random() > 0.5 ? '61,245,255' : '255,255,255'),
        depth: Math.random() * 0.6 + 0.4
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      for (const s of stars) {
        // Twinkle halus
        s.alpha = s.baseAlpha + Math.sin(s.phase) * 0.32;
        s.phase += s.twinkleSpeed;

        // Pergerakan sangat lambat ke atas + sedikit parallax mouse
        s.y -= s.drift;
        if (s.y < -2) {
          s.y = height + 2;
          s.x = Math.random() * width;
        }

        const px = s.x + pointer.x * s.depth;
        const py = s.y + pointer.y * s.depth;

        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.hue}, ${Math.max(0, s.alpha).toFixed(3)})`;
        ctx.fill();

        // Halo kecil pada bintang brightest
        if (s.r > 1.1) {
          ctx.beginPath();
          ctx.arc(px, py, s.r * 3.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${s.hue}, ${(Math.max(0, s.alpha) * 0.09).toFixed(3)})`;
          ctx.fill();
        }
      }

      rafId = requestAnimationFrame(draw);
    }

    function start() {
      if (rafId === null && !prefersReducedMotion) draw();
      else if (prefersReducedMotion) draw(); // gambar satu frame statis
    }
    function stop() {
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
    }

    // Parallax lembut mengikuti mouse (desktop)
    if (!isTouchDevice) {
      window.addEventListener('mousemove', rafThrottle((e) => {
        pointer.x = (e.clientX / width - 0.5) * -14;
        pointer.y = (e.clientY / height - 0.5) * -14;
      }), { passive: true });
    }

    resize();
    start();

    window.addEventListener('resize', debounce(() => { resize(); }, 200));

    // Hemat resource saat tab tidak aktif
    document.addEventListener('visibilitychange', () => {
      document.hidden ? stop() : start();
    });
  }

  /* =========================================================
     3. SCROLL REVEAL — elemen muncul saat masuk viewport
     ========================================================= */
  function initReveal() {
    const targets = $$('.reveal');
    if (!targets.length) return;

    // Terapkan delay dari atribut data-delay
    targets.forEach((el) => {
      const delay = el.dataset.delay;
      if (delay) el.style.setProperty('--d', delay + 'ms');
    });

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Berhenti mengamati elemen yang sudah tampil (hemat resource)
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    targets.forEach((el) => observer.observe(el));
  }

  /* =========================================================
     4. HEADER — sticky state + progress bar
     ========================================================= */
  function initHeader() {
    const header = $('#site-header');
    const progress = $('#scroll-progress');

    function onScroll() {
      const y = window.scrollY;

      if (header) header.classList.toggle('scrolled', y > 24);

      if (progress) {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const pct = docHeight > 0 ? (y / docHeight) * 100 : 0;
        progress.style.width = pct.toFixed(2) + '%';
      }

      // Sembunyikan/show FAB back-to-top
      const fabTop = $('#fab-top');
      if (fabTop) {
        fabTop.classList.toggle('is-hidden', y < 420);
      }
    }

    window.addEventListener('scroll', rafThrottle(onScroll), { passive: true });
    onScroll();
  }

  /* =========================================================
     5. NAVIGASI — smooth scroll, active section, mobile menu
     ========================================================= */
  function initNav() {
    const toggle = $('#menu-toggle');
    const menu   = $('#mobile-menu');

    function closeMenu() {
      if (!menu || !toggle) return;
      toggle.setAttribute('aria-expanded', 'false');
      menu.style.maxHeight = '0px';
      menu.style.opacity = '0';
      document.body.style.overflow = '';
    }

    function openMenu() {
      if (!menu || !toggle) return;
      toggle.setAttribute('aria-expanded', 'true');
      menu.style.maxHeight = menu.scrollHeight + 'px';
      menu.style.opacity = '1';
      document.body.style.overflow = 'hidden';
    }

    if (toggle) {
      toggle.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-expanded') === 'true';
        open ? closeMenu() : openMenu();
      });
    }

    // Smooth scroll untuk semua anchor internal
    $$('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;

        e.preventDefault();
        closeMenu();

        const headerH = ($('#site-header')?.offsetHeight) || 74;
        const top = target.getBoundingClientRect().top + window.scrollY - headerH - 12;
        window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        history.replaceState(null, '', id);
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });

    window.addEventListener('resize', debounce(() => {
      if (window.innerWidth >= 768) closeMenu();
    }, 150));

    // Highlight section aktif
    const sections = $$('section[id]');
    const navLinks = $$('.nav-link, .m-link');
    if (!sections.length || !navLinks.length) return;

    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach((link) => {
          link.classList.toggle('is-active', link.dataset.nav === id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach((s) => spy.observe(s));
  }

  /* =========================================================
     6. PARALLAX — mouse & scroll untuk elemen data-depth
     ========================================================= */
  function initParallax() {
    const layers = $$('[data-depth]');
    if (!layers.length || prefersReducedMotion) return;

    let mouseX = 0, mouseY = 0;
    let scrollY = window.scrollY;
    let tx = 0, ty = 0;

    // Target mouse ternormalisasi (-1..1)
    if (!isTouchDevice) {
      window.addEventListener('mousemove', rafThrottle((e) => {
        tx = (e.clientX / window.innerWidth - 0.5) * 2;
        ty = (e.clientY / window.innerHeight - 0.5) * 2;
      }), { passive: true });
    }

    window.addEventListener('scroll', rafThrottle(() => { scrollY = window.scrollY; }), { passive: true });

    // Interpolasi halus (easing) untuk gerak "tanpa bobot"
    function loop() {
      mouseX += (tx - mouseX) * 0.075;
      mouseY += (ty - mouseY) * 0.075;

      layers.forEach((layer) => {
        const depth = parseFloat(layer.dataset.depth) || 20;
        const rx = mouseX * depth * 0.5;
        const ry = mouseY * depth * 0.5;
        const dy = scrollY * depth * 0.08;
        layer.style.transform =
          `translate3d(${rx.toFixed(2)}px, ${(ry + dy).toFixed(2)}px, 0)`;
      });

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* =========================================================
     7. TYPEWRITER EFFECT
     ========================================================= */
  function initTyping() {
    const el = $('#typed');
    if (!el) return;

    if (prefersReducedMotion) {
      el.textContent = CONFIG.typingLines[0];
      return;
    }

    let lineIdx = 0;
    let charIdx = 0;
    let deleting = false;

    function tick() {
      const line = CONFIG.typingLines[lineIdx];

      charIdx += deleting ? -1 : 1;
      el.textContent = line.slice(0, charIdx);

      let delay = deleting ? CONFIG.deletingSpeed : CONFIG.typingSpeed;

      if (!deleting && charIdx === line.length) {
        deleting = true;
        delay = CONFIG.pauseTime;
      } else if (deleting && charIdx === 0) {
        deleting = false;
        lineIdx = (lineIdx + 1) % CONFIG.typingLines.length;
        delay = 320;
      }

      setTimeout(tick, delay);
    }
    setTimeout(tick, 600);
  }

  /* =========================================================
     8. COUNTER ANIMATION
     ========================================================= */
  function initCounters() {
    const counters = $$('.counter');
    if (!counters.length) return;

    const run = (el) => {
      const target = parseInt(el.dataset.target, 10) || 0;
      const duration = 1400;
      const start = performance.now();

      function frame(now) {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = Math.round(eased * target);
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    };

    if (!('IntersectionObserver' in window)) {
      counters.forEach(run);
      return;
    }

    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { run(entry.target); o.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });

    counters.forEach((el) => obs.observe(el));
  }

  /* =========================================================
     9. CARD TILT 3D — efek "melayang" saat hover
     ========================================================= */
  function initTilt() {
    const cards = $$('.tilt');
    if (!cards.length || isTouchDevice || prefersReducedMotion) return;

    cards.forEach((card) => {
      const max = 9; // derajat maksimal

      card.addEventListener('mousemove', rafThrottle((e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const px = x / rect.width - 0.5;
        const py = y / rect.height - 0.5;

        card.style.transform =
          `perspective(900px) rotateY(${(px * max).toFixed(2)}deg) rotateX(${(-py * max).toFixed(2)}deg) translateY(-10px)`;
      }));

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* =========================================================
     10. CURSOR AURA (desktop)
     ========================================================= */
  function initCursorAura() {
    if (isTouchDevice || prefersReducedMotion) return;

    const aura = $('#cursor-aura');
    const dot  = $('#cursor-dot');
    if (!aura || !dot) return;

    let ax = 0, ay = 0, tx = 0, ty = 0;

    window.addEventListener('mousemove', rafThrottle((e) => {
      tx = e.clientX;
      ty = e.clientY;
      dot.style.left = tx + 'px';
      dot.style.top = ty + 'px';
    }), { passive: true });

    (function follow() {
      ax += (tx - ax) * 0.14;
      ay += (ty - ay) * 0.14;
      aura.style.left = ax + 'px';
      aura.style.top = ay + 'px';
      requestAnimationFrame(follow);
    })();

    // Sembunyikan saat keluar jendela
    document.addEventListener('mouseleave', () => {
      aura.style.opacity = '0';
      dot.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
      aura.style.opacity = '1';
      dot.style.opacity = '1';
    });
  }

  /* =========================================================
     11. FORM KONTAK — validasi + buka aplikasi email
     ========================================================= */
  function initContactForm() {
    const form = $('#contact-form');
    if (!form) return;

    const fields = $$('.field', form);
    const btn = $('#submit');

    function validateField(wrap) {
      const input = $('input, textarea', wrap);
      const errEl = $('.err', wrap);
      if (!input || !errEl) return true;

      const val = input.value.trim();
      let ok = true;

      if (input.required && !val) {
        errEl.textContent = 'Kolom ini wajib diisi.';
        ok = false;
      } else if (input.type === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) {
        errEl.textContent = 'Format email tidak valid.';
        ok = false;
      } else if (input.id === 'message' && val && val.length < 10) {
        errEl.textContent = 'Pesan minimal 10 karakter.';
        ok = false;
      }

      wrap.classList.toggle('invalid', !ok);
      return ok;
    }

    fields.forEach((wrap) => {
      const input = $('input, textarea', wrap);
      if (!input) return;
      input.addEventListener('blur', () => validateField(wrap));
      input.addEventListener('input', () => {
        if (wrap.classList.contains('invalid')) validateField(wrap);
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const results = fields.map(validateField);
      const valid = results.every(Boolean);

      if (!valid) {
        showToast('⚠ Mohon lengkapi form dengan benar.');
        const firstInvalid = $('.field.invalid input, .field.invalid textarea', form);
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const get = (sel) => ($(sel, form)?.value || '').trim();
      const name    = get('#name');
      const email   = get('#email');
      const message = get('#message');

      const subject = `Portfolio — Pesan dari ${name}`;
      const body =
        `Halo Ghozy,\n\n` +
        `Ada pesan baru melalui portofoliomu.\n\n` +
        `---------------------------------------\n` +
        `Nama    : ${name}\n` +
        `Email   : ${email}\n` +
        `---------------------------------------\n\n` +
        `${message}\n\n` +
        `— Dikirim dari https://ghozymaulana.dev/`;

      const mailto =
        `mailto:${CONFIG.email}` +
        `?subject=${encodeURIComponent(subject)}` +
        `&body=${encodeURIComponent(body)}`;

      if (btn) {
        btn.disabled = true;
        btn.dataset.originalText = btn.textContent.trim();
        btn.textContent = 'Mengalihkan…';
      }

      window.location.href = mailto;

      showToast('✓ Aplikasi email Anda terbuka. Terima kasih!');
      form.reset();
      fields.forEach((w) => w.classList.remove('invalid'));

      setTimeout(() => {
        if (btn) {
          btn.disabled = false;
          btn.textContent = btn.dataset.originalText || 'Kirim Pesan';
        }
      }, 2500);
    });
  }

  /* =========================================================
     12. TOMBOL AKSI MELAYANG (FAB)
     ========================================================= */
  function initFABs() {
    // Tombol back-to-top
    const top = $('#fab-top');
    if (top) {
      top.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      });
    }

    // WhatsApp — buka chat baru
    const wa = $('#fab-wa');
    if (wa) {
      const url =
        `https://wa.me/${CONFIG.whatsapp}` +
        `?text=${encodeURIComponent('Halo Ghozy! Saya melihat portofoliomu dan ingin berdiskusi.')}`;
      wa.href = url;
      wa.target = '_blank';
      wa.rel = 'noopener noreferrer';
      wa.addEventListener('click', () => showToast('Membuka WhatsApp…'));
    }

    // Email
    const mail = $('#fab-mail');
    if (mail) {
      mail.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent('Halo Ghozy!')}`;
      mail.addEventListener('click', () => showToast('Membuka aplikasi email…'));
    }

    // Telepon (mobile)
    const tel = $('#fab-tel');
    if (tel) tel.href = `tel:+${CONFIG.whatsapp}`;

    // Tombol kontak di section kontak
    $$('[data-contact="email"]').forEach((b) => {
      b.addEventListener('click', () => showToast('Membuka aplikasi email…'));
    });
    $$('[data-contact="wa"]').forEach((b) => {
      b.addEventListener('click', () => showToast('Membuka WhatsApp…'));
    });
  }

  /* =========================================================
     13. TAHUN FOOTER
     ========================================================= */
  function initYear() {
    const el = $('#year');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* =========================================================
     14. INISIALISASI
     ========================================================= */
  function init() {
    initStarfield();
    initReveal();
    initHeader();
    initNav();
    initParallax();
    initTyping();
    initCounters();
    initTilt();
    initCursorAura();
    initContactForm();
    initFABs();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Ekspos API minimal untuk debugging
  window.AntiGravity = Object.freeze({ config: CONFIG, init });
})();
