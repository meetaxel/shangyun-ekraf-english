<script>
  import { onMount, onDestroy } from 'svelte';
  import { activeTab } from '../stores/store.js';

  let ticking = false;

  function runParallax() {
    if (typeof window === 'undefined') return;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (calm) return;

    if ($activeTab !== 'cat') return;

    const vh = window.innerHeight;
    const hero = document.getElementById('hero');
    if (hero) {
      const hr = hero.getBoundingClientRect();
      if (hr.bottom > 0) {
        const hs = document.querySelectorAll('[data-h]');
        for (let i = 0; i < hs.length; i++) {
          const el = hs[i];
          const factor = parseFloat(el.dataset.h) || 0;
          el.style.transform = `translate3d(0, ${-hr.top * factor}px, 0)`;
        }
      }
    }

    const cs = document.querySelectorAll('[data-c]');
    for (let i = 0; i < cs.length; i++) {
      const el = cs[i];
      if (!el.parentElement) continue;
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      const factor = parseFloat(el.dataset.c) || 0;
      const y = (r.top + r.height / 2 - vh / 2) * factor;
      el.style.transform = `translate3d(0, ${-y}px, 0)`;
    }
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        runParallax();
      });
    }
  }

  onMount(() => {
    runParallax();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    }
  });

  $: if ($activeTab === 'cat') {
    if (typeof window !== 'undefined') {
      setTimeout(runParallax, 50);
    }
  }
</script>
