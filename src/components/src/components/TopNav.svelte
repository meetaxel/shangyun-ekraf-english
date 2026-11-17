<script>
  import { onMount, onDestroy } from 'svelte';
  import { 
    activeTab, 
    delConfirmId, 
    authUser, 
    authModalOpen, 
    authModalTab, 
    showToast, 
    theme,
    cartCount,
    cartOpen
  } from '../stores/store.js';

  let isOver = true;

  function checkNavOver() {
    if (typeof window === 'undefined') return;
    if ($activeTab !== 'cat') {
      isOver = false;
      return;
    }
    const hero = document.getElementById('hero');
    if (hero) {
      isOver = hero.getBoundingClientRect().bottom > 72;
    } else {
      isOver = false;
    }
  }

  function selectTab(tab) {
    activeTab.set(tab);
    delConfirmId.set(null);
    if (typeof window !== 'undefined') {
      if (tab === 'dash') {
        window.location.href = '/dashboard';
        return;
      }
      if (window.location.pathname !== '/') {
        window.location.href = '/';
        return;
      }
      if (window.location.pathname !== '/') {
        window.location.href = '/';
        return;
      }
      if (window.__lenis) {
        window.__lenis.scrollTo(0, { immediate: false });
      } else {
        window.scrollTo(0, 0);
      }
      setTimeout(checkNavOver, 50);
    }
  }

  function openAuth(mode = 'in') {
    authModalTab.set(mode);
    authModalOpen.set(true);
  }

  function handleLogout() {
    const name = $authUser?.name ? $authUser.name.split(' ')[0] : 'Visitor';
    authUser.logout();
    showToast(`See you, ${name}. Demo session ended.`);
    activeTab.set('cat');
    if (typeof window !== 'undefined') {
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      } else {
        if (window.__lenis) {
          window.__lenis.scrollTo(0, { immediate: true });
        } else {
          window.scrollTo(0, 0);
        }
      }
    }
  }

  onMount(() => {
    checkNavOver();
    window.addEventListener('scroll', checkNavOver, { passive: true });
    window.addEventListener('resize', checkNavOver);

    let lenisTimer = null;
    if (typeof window !== 'undefined') {
      lenisTimer = setInterval(() => {
        if (window.__lenis) {
          window.__lenis.on('scroll', checkNavOver);
          clearInterval(lenisTimer);
        }
      }, 100);
    }
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', checkNavOver);
      window.removeEventListener('resize', checkNavOver);
    }
  });

  $: if ($activeTab) {
    setTimeout(checkNavOver, 20);
  }
</script>

<nav class="top" class:over={isOver}>
  <!-- Left: Seal & Brand Name -->
  <div 
    class="mark" 
    on:click={() => selectTab('cat')} 
    role="button" 
    tabindex="0" 
    on:keydown={(e) => e.key === 'Enter' && selectTab('cat')}
    title="Shang Yun Shang Yun"
  >
    <span class="seal" aria-hidden="true">SY</span>
    <span class="brand-name">Shang Yun</span>
  </div>

  <!-- Right: Clean Links & Theme Switch (Mirip Tampilan Asli) -->
  <button 
    id="t-cat" 
    class="nav-link"
    aria-selected={$activeTab === 'cat'} 
    on:click={() => selectTab('cat')}
  >
    Collection
  </button>

  {#if $authUser && ($authUser.role === 'admin' || $authUser.role === 'seller')}
    <button 
      id="t-dash" 
      class="nav-link"
      aria-selected={$activeTab === 'dash'} 
      on:click={() => selectTab('dash')}
    >
      Dashboard
    </button>
  {/if}

  {#if $authUser}
    <button 
      id="t-user" 
      class="nav-link user-link"
      on:click={handleLogout}
      title="Click to leave demo"
    >
      Leave demo
    </button>
  {:else}
    <button 
      id="t-signin" 
      class="nav-link"
      on:click={() => openAuth('in')}
    >
      Demo views
    </button>
  {/if}

  {#if (!$authUser || $authUser.role === 'pembeli') && $cartCount > 0}
    <button 
      class="nav-cart-btn" 
      type="button" 
      on:click={() => cartOpen.set(true)}
      title="Shopping basket ({$cartCount} pieces)"
      aria-label="Shopping basket ({$cartCount} item)"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      <span class="nav-cart-badge">{$cartCount}</span>
    </button>
  {/if}

  <!-- Toggle Switch Mode Gelap / Terang -->
  <button 
    class="theme-switch" 
    type="button"
    role="switch" 
    aria-checked={$theme === 'dark'} 
    on:click={theme.toggle}
    title={$theme === 'dark' ? 'Dark mode (switch to light)' : 'Light mode (switch to dark)'}
    aria-label="Switch light or dark appearance"
  >
    <span class="switch-track" class:dark={$theme === 'dark'}>
      <span class="switch-thumb">
        {#if $theme === 'dark'}
          <svg class="switch-ico" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        {:else}
          <svg class="switch-ico" viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.2">
            <circle cx="12" cy="12" r="4.5" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        {/if}
      </span>
    </span>
  </button>
</nav>

<style>
  nav.top {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    gap: 24px;
    padding: calc(14px + env(safe-area-inset-top, 0px)) 32px 22px;
    background: linear-gradient(rgba(12, 6, 5, 0.75), transparent);
    transition: background 0.3s ease;
  }

  .mark {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-right: auto;
    font: 500 22px "Cormorant Garamond", Georgia, serif;
    letter-spacing: 0.06em;
    color: var(--white);
    cursor: pointer;
    user-select: none;
    transition: color 0.3s ease;
  }

  .seal {
    width: 34px;
    height: 34px;
    border: 1px solid var(--red);
    background: var(--red);
    color: #ffffff;
    display: grid;
    place-items: center;
    font: 400 20px "Ma Shan Zheng", serif;
    line-height: 1;
    outline: 1px solid rgba(246, 239, 226, 0.35);
    outline-offset: -5px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  }

  .nav-link {
    background: none;
    border: 0;
    color: var(--muted);
    font: inherit;
    font-size: 15px;
    padding: 4px 0;
    cursor: pointer;
    border-bottom: 1px solid transparent;
    transition: color 0.2s ease, border-color 0.2s ease;
  }

  .nav-link:hover {
    color: var(--white);
    border-color: var(--brass);
  }

  .nav-link[aria-selected="true"] {
    color: var(--white);
    border-color: var(--brass);
  }

  .user-link {
    font-size: 14px;
  }

  .nav-cart-btn {
    position: relative;
    background: var(--pill-bg);
    border: 1px solid var(--card-stat-border);
    color: var(--gold);
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .nav-cart-btn:hover {
    background: rgba(212, 175, 55, 0.15);
    border-color: var(--gold);
  }

  .nav-cart-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: var(--red);
    color: #ffffff;
    font-size: 9.5px;
    font-weight: 700;
    min-width: 16px;
    height: 16px;
    border-radius: 8px;
    display: grid;
    place-items: center;
    padding: 0 3px;
  }

  /* Compact Theme Switch Toggle (Bukan jejer dua tombol) */
  .theme-switch {
    background: transparent;
    border: 0;
    padding: 0;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    outline: none;
    margin-left: 2px;
  }

  .switch-track {
    width: 36px;
    height: 20px;
    background: rgba(90, 56, 37, 0.2);
    border: 1px solid rgba(138, 90, 54, 0.35);
    border-radius: 999px;
    padding: 2px;
    display: flex;
    align-items: center;
    transition: background-color 0.25s ease, border-color 0.25s ease;
  }

  .switch-track.dark {
    background: rgba(246, 239, 226, 0.12);
    border-color: rgba(185, 152, 92, 0.4);
  }

  .switch-thumb {
    width: 14px;
    height: 14px;
    background: #b88a44;
    color: #ffffff;
    border-radius: 50%;
    display: grid;
    place-items: center;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
    transform: translateX(0);
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.25s ease, color 0.25s ease;
  }

  .switch-track.dark .switch-thumb {
    transform: translateX(16px);
    background: #d4af37;
    color: #0c0605;
  }

  .switch-ico {
    display: block;
  }

  /* State Saat Berada di Atas Hero (Parchment terang) */
  nav.top.over {
    background: linear-gradient(rgba(214, 200, 164, 0.92), transparent);
  }

  nav.top.over .mark {
    color: #24140e;
  }

  nav.top.over .nav-link {
    color: #5a4a38;
  }

  nav.top.over .nav-link:hover {
    color: #24140e;
    border-color: var(--red);
  }

  nav.top.over .nav-link[aria-selected="true"] {
    color: #24140e;
    border-color: var(--red);
  }

  nav.top.over .switch-track {
    background: rgba(90, 56, 37, 0.15);
    border-color: rgba(90, 56, 37, 0.35);
  }

  @media (max-width: 620px) {
    nav.top {
      padding-inline: 18px;
      gap: 16px;
    }

    .brand-name {
      font-size: 19px;
    }

    .nav-link {
      font-size: 14px;
    }
  }
</style>
