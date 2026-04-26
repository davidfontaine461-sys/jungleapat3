/* ═══════════════════════════════════════════════════════
   JUNGLE À PAT' — v2 script
   - Header scrollé
   - Menu mobile
   - Reveal au scroll (IntersectionObserver)
   - Parallax doux sur les feuilles du hero
   - Sentier animé : apparition au scroll
   - Compteurs animés dans le hero
   - FAQ : fermer les autres à l'ouverture
   - Année auto
   ═══════════════════════════════════════════════════════ */

(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ──────────────────────────────────────────────
     Année auto dans le footer
     ────────────────────────────────────────────── */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ──────────────────────────────────────────────
     Header : classe "scrolled" quand on scrolle
     ────────────────────────────────────────────── */
  const header = document.getElementById('siteHeader');
  const trail = document.querySelector('.trail-path');

  const backToTop = document.getElementById('backToTop');

  const onScroll = () => {
    const y = window.scrollY;
    if (y > 20) header.classList.add('scrolled');
    else header.classList.remove('scrolled');

    // Apparition progressive du sentier après le hero
    if (trail) {
      if (y > window.innerHeight * 0.5) trail.classList.add('visible');
      else trail.classList.remove('visible');
    }

    // Bouton retour en haut
    if (backToTop) {
      if (y > 400) backToTop.classList.add('visible');
      else backToTop.classList.remove('visible');
    }
  };

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ──────────────────────────────────────────────
     Menu mobile
     ────────────────────────────────────────────── */
  const navToggle = document.getElementById('navToggle');
  const navMobile = document.getElementById('navMobile');

  const closeMenu = () => {
    navMobile.classList.remove('open');
    navToggle.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
    navMobile.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  const openMenu = () => {
    navMobile.classList.add('open');
    navToggle.classList.add('active');
    navToggle.setAttribute('aria-expanded', 'true');
    navMobile.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  if (navToggle && navMobile) {
    navToggle.addEventListener('click', () => {
      if (navMobile.classList.contains('open')) closeMenu();
      else openMenu();
    });

    navMobile.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMobile.classList.contains('open')) closeMenu();
    });
  }

  /* ──────────────────────────────────────────────
     Reveal au scroll avec IntersectionObserver
     ────────────────────────────────────────────── */
  const reveals = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -80px 0px'
    });

    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in-view'));
  }

  /* ──────────────────────────────────────────────
     Parallax doux sur les feuilles du hero
     Appliqué via une requestAnimationFrame pour la fluidité
     ────────────────────────────────────────────── */
  if (!prefersReducedMotion) {
    const leaves = document.querySelectorAll('.hero-leaves .leaf');
    const hero = document.querySelector('.hero');

    if (leaves.length && hero) {
      // Stocker la rotation de base de chaque feuille (depuis son style inline)
      leaves.forEach(leaf => {
        const computed = getComputedStyle(leaf);
        const transform = computed.transform;
        // On essaie d'extraire la rotation depuis la matrice CSS
        let rotation = 0;
        if (transform && transform !== 'none') {
          const values = transform.match(/matrix\(([^)]+)\)/);
          if (values) {
            const parts = values[1].split(',').map(v => parseFloat(v));
            rotation = Math.atan2(parts[1], parts[0]) * (180 / Math.PI);
          }
        }
        leaf.dataset.baseRotation = rotation;
      });

      let ticking = false;

      const updateParallax = () => {
        const rect = hero.getBoundingClientRect();

        // Pas de calcul si hors champ
        if (rect.bottom < -100 || rect.top > window.innerHeight) {
          ticking = false;
          return;
        }

        const scrollY = window.scrollY;

        leaves.forEach(leaf => {
          const speed = parseFloat(leaf.dataset.parallax) || 0.3;
          const baseRot = parseFloat(leaf.dataset.baseRotation) || 0;
          const offset = scrollY * speed;
          // On combine translation + rotation d'origine
          leaf.style.transform = `translateY(${offset}px) rotate(${baseRot}deg)`;
        });

        ticking = false;
      };

      const onParallaxScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(updateParallax);
          ticking = true;
        }
      };

      window.addEventListener('scroll', onParallaxScroll, { passive: true });
    }
  }

  /* ──────────────────────────────────────────────
     Compteurs animés (preuve sociale dans le hero)
     ────────────────────────────────────────────── */
  const counters = document.querySelectorAll('[data-count]');

  const animateCounter = (el) => {
    if (prefersReducedMotion) {
      el.textContent = el.dataset.count;
      return;
    }

    const target = parseInt(el.dataset.count, 10);
    const duration = 1400;
    const start = performance.now();

    const update = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Easing out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(update);
      else el.textContent = target;
    };

    requestAnimationFrame(update);
  };

  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(c => counterObserver.observe(c));
  } else {
    counters.forEach(c => { c.textContent = c.dataset.count; });
  }

  /* ──────────────────────────────────────────────
     FAQ : un seul élément ouvert à la fois
     ────────────────────────────────────────────── */
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        faqItems.forEach(other => {
          if (other !== item && other.open) other.open = false;
        });
      }
    });
  });

  /* ──────────────────────────────────────────────
     Smooth scroll manuel pour les ancres
     (au cas où scroll-behavior CSS poserait problème)
     ────────────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#' || href.length < 2) return;
      const target = document.querySelector(href);
      if (!target) return;

      // On laisse le comportement natif CSS si pas de reduced-motion
      // Sinon, un scrollIntoView propre
      if (prefersReducedMotion) {
        e.preventDefault();
        target.scrollIntoView({ block: 'start' });
      }
    });
  });

})();
