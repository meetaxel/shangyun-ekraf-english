<script>
  import { onMount, onDestroy } from 'svelte';
  import Lenis from 'lenis';
  import { authModalOpen, dialogState, sellerModalOpen, activeTab } from '../stores/store.js';

  let lenisInstance = null;
  let rafId = null;

  // Pause or destroy Lenis when on dashboard or when any modal overlay is active
  $: if (lenisInstance) {
    if ($activeTab === 'dash' || (typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard'))) {
      lenisInstance.destroy();
      lenisInstance = null;
    } else if ($authModalOpen || $dialogState.open || $sellerModalOpen) {
      lenisInstance.stop();
    } else {
      lenisInstance.start();
    }
  }

  function handleAnchorClick(e) {
    const a = e.target.closest('a[href^="#"]');
    if (!a || !lenisInstance) return;
    const href = a.getAttribute('href');
    if (href === '#' || !href) return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      lenisInstance.scrollTo(target, { offset: -60, duration: 1.4 });
    }
  }

  onMount(() => {
    if (typeof window === 'undefined') return;

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Do NOT run Lenis on dashboard or login routes
    if (window.location.pathname.startsWith('/dashboard') || window.location.pathname.startsWith('/login') || $activeTab === 'dash') {
      return;
    }

    try {
      lenisInstance = new Lenis({
        duration: 1.25,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.8,
        infinite: false
      });

      function raf(time) {
        if (lenisInstance) {
          lenisInstance.raf(time);
          rafId = requestAnimationFrame(raf);
        }
      }

      rafId = requestAnimationFrame(raf);

      // Make available on window for other components
      window.__lenis = lenisInstance;

      document.addEventListener('click', handleAnchorClick);
    } catch (e) {
      console.warn('Lenis initialization skipped:', e);
    }
  });

  onDestroy(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('click', handleAnchorClick);
    }
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    if (lenisInstance) {
      lenisInstance.destroy();
      lenisInstance = null;
    }
  });
</script>

<style>
  :global(html.lenis, html.lenis body) {
    height: auto;
  }
  :global(.lenis.lenis-smooth) {
    scroll-behavior: auto !important;
  }
  :global(.lenis.lenis-smooth [data-lenis-prevent]) {
    overscroll-behavior: contain;
  }
  :global(.lenis.lenis-stopped) {
    overflow: hidden;
  }
</style>
