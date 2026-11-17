<script>
  import { onMount } from 'svelte';

  let isOut = false;
  let isMounted = true;

  onMount(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('ld');
    }

    const t0 = Date.now();
    const minWait = 2400; // Allow full circle stroke and progress bar animation to complete

    const finish = () => {
      isOut = true;
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('ld');
      }
      setTimeout(() => {
        isMounted = false;
      }, 1600);
    };

    const elapsed = Date.now() - t0;
    const remaining = Math.max(0, minWait - elapsed);
    const timer = setTimeout(finish, remaining);

    return () => {
      clearTimeout(timer);
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('ld');
      }
    };
  });
</script>

{#if isMounted}
  <div
    id="loader"
    class:out={isOut}
    role="status"
    aria-live="polite"
    aria-label="Loading Shang Yun"
  >
    <div class="lh l"></div>
    <div class="lh r"></div>
    <div class="lc">
      <div class="lr">
        <svg viewBox="0 0 124 124" width="124" height="124" fill="none" aria-hidden="true">
          <circle cx="62" cy="62" r="54" fill="none" stroke="#b9985c" stroke-width="1" />
        </svg>
        <span class="seal" lang="en" aria-hidden="true">SY</span>
      </div>
      <div class="ln">Shang Yun</div>
      <div class="lz" lang="en" aria-hidden="true">Shang Yun</div>
      <div class="lb" aria-hidden="true"><i></i></div>
    </div>
  </div>
{/if}

<style>
  :global(html.ld) {
    overflow: hidden !important;
  }

  #loader {
    position: fixed;
    inset: 0;
    z-index: 99999;
    display: grid;
    place-items: center;
    overflow: hidden;
    pointer-events: auto;
    background: transparent;
  }

  #loader.out {
    pointer-events: none;
    background: transparent;
  }

  .lh {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 50.2%;
    background: radial-gradient(120% 90% at 50% 40%, #1a0d0a, #0c0605 70%);
    transition: transform 1.05s cubic-bezier(0.77, 0, 0.18, 1) 0.4s;
    will-change: transform;
  }

  .lh.l {
    left: 0;
    border-right: 1px solid rgba(185, 152, 92, 0.45);
  }

  .lh.r {
    right: 0;
    border-left: 1px solid rgba(185, 152, 92, 0.45);
  }

  #loader.out .lh.l {
    transform: translateX(-101%);
  }

  #loader.out .lh.r {
    transform: translateX(101%);
  }

  .lc {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: opacity 0.5s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  }

  #loader.out .lc {
    opacity: 0;
    transform: translateY(-10px);
  }

  .lr {
    position: relative;
    width: 124px;
    height: 124px;
    display: grid;
    place-items: center;
    opacity: 0;
    animation: lfade 0.9s 0.1s forwards;
  }

  .lr svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }

  .lr circle {
    fill: none;
    stroke: var(--brass, #b9985c);
    stroke-width: 1;
    stroke-dasharray: 340;
    stroke-dashoffset: 340;
    animation: ldraw 1.5s 0.2s cubic-bezier(0.5, 0, 0.2, 1) forwards;
  }

  .lr .seal {
    width: 58px;
    height: 58px;
    font-size: 34px;
    outline-offset: -7px;
    background: var(--red, #b8292c);
    border: 1px solid var(--red, #b8292c);
    color: #ffffff;
    display: grid;
    place-items: center;
    font-family: 'Ma Shan Zheng', serif;
    line-height: 1;
    outline: 1px solid rgba(246, 239, 226, 0.35);
    border-radius: 2px;
  }

  .ln {
    margin-top: 34px;
    font: 500 clamp(24px, 5vw, 32px) / 1 'Cormorant Garamond', Georgia, serif;
    letter-spacing: 0.5em;
    margin-right: -0.5em;
    color: var(--white, #f6efe2);
    opacity: 0;
    animation: lfade 0.9s 0.7s forwards;
  }

  .lz {
    margin-top: 12px;
    font: 400 15px 'Ma Shan Zheng', serif;
    letter-spacing: 0.6em;
    margin-right: -0.6em;
    color: var(--brass, #b9985c);
    opacity: 0;
    animation: lfade 0.9s 0.95s forwards;
  }

  .lb {
    margin-top: 34px;
    width: 132px;
    height: 1px;
    background: rgba(185, 152, 92, 0.25);
    overflow: hidden;
    opacity: 0;
    animation: lfade 0.6s 1s forwards;
  }

  .lb i {
    display: block;
    height: 100%;
    width: 100%;
    background: var(--brass, #b9985c);
    transform: scaleX(0);
    transform-origin: left;
    animation: lbar 1.7s 1s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  @keyframes lfade {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  @keyframes ldraw {
    to {
      stroke-dashoffset: 0;
    }
  }

  @keyframes lbar {
    to {
      transform: scaleX(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    #loader * {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
    .lr circle {
      stroke-dashoffset: 0;
    }
    .lb i {
      transform: none;
    }
    .lh {
      transition-duration: 0.01s !important;
      transition-delay: 0s !important;
    }
  }
</style>
