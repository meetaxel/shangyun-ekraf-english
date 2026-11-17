<script>
function previewExternalDisabled() { alert("External contact is disabled in this private demo. No message was sent."); }
  import { onMount } from "svelte";
  import {
    items,
    sellers,
    currentRole,
    activeSellerId,
    showToast,
    dialogState,
    sellerModalOpen,
    delConfirmId,
    authUser,
    theme,
    activeTab,
    orders,
  } from "../stores/store.js";
  import { img, ph, rp, normWa, waLocal } from "../data/seed.js";

  // Active Menu in Sidebar:
  // For Admin: 'admin' (HANYA Sample Seller)
  // For Seller: 'overview' | 'orders' | 'products' | 'wa'
  let currentMenu = $currentRole === "admin" ? "admin" : "overview";
  let sidebarOpen = false;
  let showNotifications = false;

  // Auto-lock menu to 'admin' whenever role is admin
  $: if ($currentRole === "admin") {
    currentMenu = "admin";
  }

  // Active seller object (Khusus mode Seller)
  $: activeSeller = $sellers.find((s) => s.id === $activeSellerId) ||
    $sellers[0] || {
      id: "s1",
      nama: "Master Chen Zhao",
      nama_toko: "Zhao Atelier Suzhou",
      no_wa: "6285738211550",
      spesialisasi: "Silk Embroidery & Fans",
    };

  // WhatsApp input for current seller
  let waInput = "";
  let waErr = "";

  $: if (activeSeller && activeSeller.no_wa) {
    waInput = waLocal(activeSeller.no_wa);
  }

  function handleSaveSellerWa() {
    const n = normWa(waInput);
    if (!n) {
      waErr = "Enter a valid Indonesian demo number, for example 081234567890.";
      return;
    }
    waErr = "";
    const success = sellers.updateWa(activeSeller.id, n);
    if (success) {
      showToast(`Demo contact number saved for ${activeSeller.nama_toko}.`);
    }
  }

  // ========================================================
  // SELLER INCOMING ORDERS (PESANAN MASUK KHUSUS GERAI INI)
  // - Filter strictly by seller_id === activeSeller.id
  // ========================================================
  $: sellerOrders = $orders.filter((o) => o.seller_id === activeSeller.id);
  $: pendingOrders = sellerOrders.filter(
    (o) => o.status === "Awaiting review",
  );
  $: processingOrders = sellerOrders.filter((o) => o.status === "In progress");
  $: completedOrders = sellerOrders.filter((o) => o.status === "Complete");
  $: sellerOrdersRevenue = sellerOrders
    .filter((o) => o.status !== "Cancelled")
    .reduce((acc, o) => acc + (Number(o.total) || 0), 0);

  let orderFilterStatus = "all"; // 'all' | 'Awaiting review' | 'In progress' | 'Complete'
  $: filteredSellerOrders =
    orderFilterStatus === "all"
      ? sellerOrders
      : sellerOrders.filter((o) => o.status === orderFilterStatus);

  function handleConfirmOrder(order) {
    orders.updateStatus(order.id, "In progress");
    showToast(
      `Demo order #${order.id} marked in progress.`,
    );
  }

  function handleCompleteOrder(order) {
    orders.updateStatus(order.id, "Complete");
    showToast(`Demo order #${order.id} marked complete.`);
  }

  function handleCancelOrder(order) {
    if (confirm(`Cancel demo order #${order.id}?`)) {
      orders.updateStatus(order.id, "Cancelled");
      showToast(`Demo order #${order.id} cancelled.`);
    }
  }

  function handleContactBuyerWa(order) {
    if (!order.buyer_wa) {
      showToast("No buyer contact number is recorded.");
      return;
    }
    const msg = `Hello ${order.buyer_name}, ${activeSeller.nama_toko} would like to confirm order #${order.id}.`;
    const url = `https://wa.me/${normWa(order.buyer_wa)}?text=${encodeURIComponent(msg)}`;
    previewExternalDisabled(url, "_blank", "noopener,noreferrer");
  }

  // ========================================================
  // SELLER PRODUCTS & METRICS
  // ========================================================
  $: sellerProducts = $items.filter((p) => p.seller_id === activeSeller.id);
  let sellerSelectedCategory = "all";
  $: filteredSellerProducts =
    sellerSelectedCategory === "all"
      ? sellerProducts
      : sellerProducts.filter((p) => p.kategori === sellerSelectedCategory);

  $: sellerTotalStok = sellerProducts.reduce(
    (acc, p) => acc + (Number(p.stok) || 0),
    0,
  );
  $: sellerCats = Array.from(
    new Set(sellerProducts.map((p) => p.kategori).filter(Boolean)),
  );
  $: sellerUnggulan = sellerProducts.filter((p) => p.unggulan).length;

  // ========================================================
  // ADMIN PLATFORM & MITRA GERAI DIRECTORY
  // - Khusus Role Admin (Hanya menampilkan daftar seller)
  // ========================================================
  let adminSellerSearch = "";
  let adminSellerSpec = "all";
  $: adminTotalStok = $items.reduce((acc, p) => acc + (Number(p.stok) || 0), 0);
  $: adminAllSpecs = Array.from(
    new Set($sellers.map((s) => s.spesialisasi).filter(Boolean)),
  );
  $: filteredAdminSellers = $sellers.filter((s) => {
    const qClean = adminSellerSearch.trim().toLowerCase();
    const matchSearch =
      !qClean ||
      (s.nama && s.nama.toLowerCase().includes(qClean)) ||
      (s.nama_toko && s.nama_toko.toLowerCase().includes(qClean)) ||
      (s.spesialisasi && s.spesialisasi.toLowerCase().includes(qClean)) ||
      (s.no_wa && s.no_wa.includes(adminSellerSearch.replace(/\D/g, "")));
    const matchSpec =
      adminSellerSpec === "all" || s.spesialisasi === adminSellerSpec;
    return matchSearch && matchSpec;
  });

  // Notifications Mock Data
  let notifications = [
    {
      id: 1,
      title: "Sample order enquiry",
      time: "10 minutes ago",
      desc: "Sample enquiry about the embroidered silk fan.",
      unread: true,
    },
    {
      id: 2,
      title: "Sample low-stock notice",
      time: "1 hour ago",
      desc: "Sample porcelain vase: 2 units remaining.",
      unread: true,
    },
    {
      id: 3,
      title: "Demo catalogue updated",
      time: "Yesterday",
      desc: "Sample pieces are available in the local collection.",
      unread: false,
    },
  ];
  $: unreadCount = notifications.filter((n) => n.unread).length;

  function markAllNotificationsRead() {
    notifications = notifications.map((n) => ({ ...n, unread: false }));
  }

  function openAddModal() {
    dialogState.set({ open: true, editId: null });
  }

  function openEditModal(id) {
    dialogState.set({ open: true, editId: id });
  }

  function openAddSellerModal() {
    sellerModalOpen.set(true);
  }

  function handleDeleteClick(id) {
    if ($delConfirmId === id) {
      items.remove(id);
      delConfirmId.set(null);
      showToast("Piece removed locally.");
    } else {
      delConfirmId.set(id);
    }
  }

  function handleImgError(e, p) {
    const t = e.currentTarget;
    if (t && !t.dataset.f) {
      t.dataset.f = "1";
      t.src = ph(p);
    }
  }

  function goToCollection() {
    activeTab.set("cat");
    if (typeof window !== "undefined") {
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      } else {
        if (window.__lenis) {
          window.__lenis.scrollTo(0, { immediate: true });
        } else {
          window.scrollTo(0, 0);
        }
      }
    }
  }

  function handleLogout() {
    const name = $authUser?.name ? $authUser.name.split(" ")[0] : "Visitor";
    authUser.logout();
    showToast(`See you, ${name}. Demo session ended.`);
    activeTab.set("cat");
    if (typeof window !== "undefined") {
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      } else {
        if (window.__lenis) {
          window.__lenis.scrollTo(0, { immediate: true });
        } else {
          window.scrollTo(0, 0);
        }
      }
    }
  }
</script>

<div class="dash-layout" data-lenis-prevent>
  <!-- Mobile Backdrop -->
  {#if sidebarOpen}
    <div
      class="sidebar-backdrop"
      on:click={() => (sidebarOpen = false)}
      role="button"
      tabindex="0"
      on:keydown={(e) => e.key === "Escape" && (sidebarOpen = false)}
    ></div>
  {/if}

  <!-- ==================== SIDEBAR (Sesuai Referensi) ==================== -->
  <aside class="dash-sidebar" data-lenis-prevent class:open={sidebarOpen}>
    <!-- Brand / Logo Area -->
    <div class="sidebar-header">
      <div class="seal" aria-hidden="true">SY</div>
      <div class="brand-info">
        <span class="brand-title">Shang Yun</span>
        <span class="brand-desc">
          {$currentRole === "admin" ? "Admin demo view" : "Atelier Dashboard"}
        </span>
      </div>
    </div>

    <!-- Navigation Menu Items -->
    <nav class="sidebar-menu">
      {#if $currentRole === "admin"}
        <button
          type="button"
          class="menu-item active"
          on:click={() => {
            currentMenu = "admin";
            sidebarOpen = false;
          }}
        >
          <svg
            class="menu-icon"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>Partner ateliers</span>
        </button>
      {:else}
        <button
          type="button"
          class="menu-item"
          class:active={currentMenu === "overview"}
          on:click={() => {
            currentMenu = "overview";
            sidebarOpen = false;
          }}
        >
          <svg
            class="menu-icon"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
          </svg>
          <span>Overview</span>
        </button>

        <button
          type="button"
          class="menu-item"
          class:active={currentMenu === "orders"}
          on:click={() => {
            currentMenu = "orders";
            sidebarOpen = false;
          }}
        >
          <svg
            class="menu-icon"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
            />
            <rect x="9" y="3" width="6" height="4" rx="1" />
            <path d="M9 14l2 2 4-4" />
          </svg>
          <span>Incoming demo orders</span>
          {#if pendingOrders.length > 0}
            <span class="menu-badge-pill">{pendingOrders.length}</span>
          {/if}
        </button>

        <button
          type="button"
          class="menu-item"
          class:active={currentMenu === "products"}
          on:click={() => {
            currentMenu = "products";
            sidebarOpen = false;
          }}
        >
          <svg
            class="menu-icon"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
            />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          <span>Pieces & inventory</span>
        </button>

        <button
          type="button"
          class="menu-item"
          class:active={currentMenu === "wa"}
          on:click={() => {
            currentMenu = "wa";
            sidebarOpen = false;
          }}
        >
          <svg
            class="menu-icon"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
            />
          </svg>
          <span>Contact settings (disabled)</span>
        </button>
      {/if}

      <div class="menu-separator"></div>

      <button
        type="button"
        class="menu-item back-link"
        on:click={goToCollection}
      >
        <svg
          class="menu-icon"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        <span>Back to collection</span>
      </button>
    </nav>

    <!-- Sidebar Bottom: Profile & Theme Switcher -->
    <div class="sidebar-bottom">
      <!-- Profile Card (Matching Elizabeth's user badge) -->
      <div class="user-card-widget">
        <div class="avatar-wrap">
          <div class="user-avatar-circle">
            {($authUser?.name || activeSeller.nama).charAt(0).toUpperCase()}
          </div>
          <span class="online-indicator" title="Local demo session"></span>
        </div>
        <div class="user-info-text">
          <span class="user-real-name"
            >{$currentRole === "admin"
              ? "Administrator"
              : $authUser?.name || activeSeller.nama}</span
          >
          <span class="user-status-label">
            {$currentRole === "admin" ? "Admin demo view" : "Artisan demo view"}
          </span>
        </div>
        <button
          class="logout-icon-btn"
          on:click={handleLogout}
          title="Leave demo session"
          aria-label="Leave demo session"
        >
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
            />
          </svg>
        </button>
      </div>

      <!-- Theme Switcher Pill [ ☀ Light | ☾ Dark ] -->
      <div
        class="theme-switch-capsule"
        role="radiogroup"
        aria-label="Appearance"
      >
        <button
          type="button"
          class="theme-pill-btn"
          class:active={$theme === "light"}
          on:click={() => theme.set("light")}
          aria-checked={$theme === "light"}
          role="radio"
        >
          <svg
            viewBox="0 0 24 24"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="4" />
            <path
              d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
            />
          </svg>
          <span>Light</span>
        </button>
        <button
          type="button"
          class="theme-pill-btn"
          class:active={$theme === "dark"}
          on:click={() => theme.set("dark")}
          aria-checked={$theme === "dark"}
          role="radio"
        >
          <svg
            viewBox="0 0 24 24"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          <span>Dark</span>
        </button>
      </div>
    </div>
  </aside>

  <!-- ==================== MAIN CONTENT AREA ==================== -->
  <div class="dash-content-area" data-lenis-prevent>
    <!-- Top Navbar in Dashboard -->
    <header class="dash-topbar">
      <div class="topbar-left">
        <!-- Mobile Drawer Hamburger Button -->
        <button
          type="button"
          class="mobile-menu-btn"
          on:click={() => (sidebarOpen = !sidebarOpen)}
          aria-label="Open sidebar"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div class="page-title-wrap">
          <h1 class="page-title">
            {#if $currentRole === "admin"}
              Partner ateliers
            {:else if currentMenu === "overview"}
              Overview
            {:else if currentMenu === "orders"}
              Incoming demo orders
            {:else if currentMenu === "products"}
              Pieces & inventory
            {:else}
              Settings WhatsApp
            {/if}
          </h1>
          <span class="page-subtitle">
            {#if $currentRole === "admin"}
              Shang Yun platform demo
            {:else}
              Atelier {activeSeller.nama_toko}
            {/if}
          </span>
        </div>
      </div>

      <div class="topbar-right">
        <!-- Toko Selector Dropdown HANYA untuk seller (jika seller ingin tes / switch antar gerai) -->
        {#if $currentRole !== "admin"}
          <div class="seller-picker">
            <label for="dash-seller-select" class="picker-label">Atelier:</label>
            <select
              id="dash-seller-select"
              bind:value={$activeSellerId}
              class="seller-select-clean"
            >
              {#each $sellers as s}
                <option value={s.id}>{s.nama_toko}</option>
              {/each}
            </select>
          </div>
        {/if}

        <!-- Notification Bell Widget -->
        <div class="notif-wrap">
          <button
            type="button"
            class="notif-btn"
            on:click={() => (showNotifications = !showNotifications)}
            title="Notifications"
            aria-label="Notifications"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {#if unreadCount > 0}
              <span class="notif-badge">{unreadCount}</span>
            {/if}
          </button>

          <!-- Notification Popover Card -->
          {#if showNotifications}
            <div class="notif-popover">
              <div class="notif-popover-header">
                <b>Notifications</b>
                <button
                  type="button"
                  class="notif-clear-btn"
                  on:click={markAllNotificationsRead}
                >
                  Mark as read
                </button>
              </div>
              <div class="notif-list">
                {#each notifications as n}
                  <div class="notif-item" class:unread={n.unread}>
                    <div class="notif-top">
                      <span class="notif-title">{n.title}</span>
                      <span class="notif-time">{n.time}</span>
                    </div>
                    <p class="notif-desc">{n.desc}</p>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>

        <!-- User Profile Pill in Topbar -->
        <div class="topbar-profile-pill">
          <div class="profile-photo-circle">
            {($authUser?.name || activeSeller.nama).charAt(0).toUpperCase()}
          </div>
          <span class="profile-name-text"
            >{$authUser?.name || activeSeller.nama}</span
          >
        </div>
      </div>
    </header>

    <!-- Main Canvas Content -->
    <main class="dash-main-scroll" data-lenis-prevent tabindex="0">
      {#if $currentRole === "admin"}
        <!-- ========================================================
             TAMPILAN ADMIN: HANYA DAFTAR SELLER (MITRA GERAI)
             ======================================================== -->
        <div class="welcome-banner-card admin-banner">
          <div class="banner-chinese-watermark" aria-hidden="true">
            <span class="watermark-calligraphy" lang="en"
              >MADE WITH CARE · GROWING TOGETHER</span
            >
          </div>
          <div class="banner-text-col">
            <span class="banner-greeting">Platform admin demo</span>
            <p class="banner-subtext">
              Explore a sample partner directory, local inventory summaries and atelier records. These are demo records, not verified businesses.
            </p>
            <div class="banner-actions-row">
              <button class="banner-btn primary" on:click={openAddSellerModal}>
                + Add a demo atelier
              </button>
              <button class="banner-btn secondary" on:click={goToCollection}>
                View collection
              </button>
            </div>
          </div>
          <div class="banner-avatar-col">
            <div class="banner-portrait-seal">
              <span class="seal-glyph" lang="en">A</span>
            </div>
          </div>
        </div>

        <!-- 4 Stat Cards Khusus Admin -->
        <div class="stats-grid-row">
          <div class="stat-card">
            <span class="stat-watermark" lang="en" aria-hidden="true">A</span>
            <div class="stat-header">
              <span class="stat-ico-badge" lang="en">A</span>
              <span class="stat-name">Partner ateliers</span>
            </div>
            <b class="stat-number">{$sellers.length}</b>
            <span class="stat-footer-text">Registered sample ateliers</span>
          </div>

          <div class="stat-card">
            <span class="stat-watermark" lang="en" aria-hidden="true">P</span>
            <div class="stat-header">
              <span class="stat-ico-badge" lang="en">P</span>
              <span class="stat-name">Total pieces</span>
            </div>
            <b class="stat-number">{$items.length}</b>
            <span class="stat-footer-text">Curated Lunar New Year pieces</span>
          </div>

          <div class="stat-card">
            <span class="stat-watermark" lang="en" aria-hidden="true">I</span>
            <div class="stat-header">
              <span class="stat-ico-badge" lang="en">I</span>
              <span class="stat-name">Stock in catalogue</span>
            </div>
            <b class="stat-number">{adminTotalStok}</b>
            <span class="stat-footer-text">Sample units available</span>
          </div>

          <div class="stat-card">
            <span class="stat-watermark" lang="en" aria-hidden="true">S</span>
            <div class="stat-header">
              <span class="stat-ico-badge" lang="en">S</span>
              <span class="stat-name">Demo partner status</span>
            </div>
            <b class="stat-number">Demo</b>
            <span class="stat-footer-text">Sample data, not verified</span>
          </div>
        </div>

        <!-- Tabel Utama: DAFTAR SELLER / MITRA GERAI PLATFORM -->
        <div class="content-card-box">
          <span class="card-corner-watermark" lang="en" aria-hidden="true"
            >A</span
          >
          <div class="card-box-header">
            <div>
              <h2 class="card-box-title">
                Partner ateliers & artisans ({filteredAdminSellers.length})
              </h2>
              <span class="card-box-sub"
                >Sample artisan directory stored only in this browser.</span
              >
            </div>
            <button class="btn sm" on:click={openAddSellerModal}>
              + Add a demo atelier
            </button>
          </div>

          <!-- Search & Filter Bar Atelier -->
          <div class="admin-seller-filter-row">
            <div class="admin-search-wrap">
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="search"
                placeholder="Search atelier, artisan or specialty..."
                bind:value={adminSellerSearch}
              />
            </div>

            <div class="admin-spec-pills">
              <button
                type="button"
                class="dash-cat-pill"
                class:active={adminSellerSpec === "all"}
                on:click={() => (adminSellerSpec = "all")}
              >
                All ({$sellers.length})
              </button>
              {#each adminAllSpecs as spec}
                {@const count = $sellers.filter(
                  (s) => s.spesialisasi === spec,
                ).length}
                <button
                  type="button"
                  class="dash-cat-pill"
                  class:active={adminSellerSpec === spec}
                  on:click={() => (adminSellerSpec = spec)}
                >
                  {spec} ({count})
                </button>
              {/each}
            </div>
          </div>

          <div class="tw">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Artisan name</th>
                  <th>Atelier name</th>
                  <th>Contact (demo)</th>
                  <th>Specialty</th>
                  <th>Pieces</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {#if filteredAdminSellers.length === 0}
                  <tr>
                    <td colspan="8" class="empty-cell">
                      No ateliers match "{adminSellerSearch}".
                    </td>
                  </tr>
                {:else}
                  {#each filteredAdminSellers as s (s.id)}
                    {@const count = $items.filter(
                      (p) => p.seller_id === s.id,
                    ).length}
                    {@const stok = $items
                      .filter((p) => p.seller_id === s.id)
                      .reduce((acc, p) => acc + (Number(p.stok) || 0), 0)}
                    <tr>
                      <td
                        style="font-family: monospace; color: var(--gold); font-weight: 600;"
                        >{s.id}</td
                      >
                      <td class="nm">
                        <div class="seller-name-cell">
                          <span class="seller-mini-avatar"
                            >{s.nama.charAt(0)}</span
                          >
                          <b>{s.nama}</b>
                        </div>
                      </td>
                      <td style="font-weight: 600; color: var(--white);"
                        >{s.nama_toko}</td
                      >
                      <td style="font-family: monospace;">
                        <a
                          href="#" on:click|preventDefault={() => previewExternalDisabled()}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="seller-wa-link"
                          title="Contact WhatsApp {s.nama_toko}"
                        >
                          +{s.no_wa} ↗
                        </a>
                      </td>
                      <td><span class="cat-pill">{s.spesialisasi}</span></td>
                      <td>
                        <b>{count} pieces</b>
                        <small
                          style="display:block; color:var(--muted); font-size:11px;"
                          >({stok} units in stock)</small
                        >
                      </td>
                      <td>
                        <span class="st-badge active">
                          <span class="st-dot"></span> Demo
                        </span>
                      </td>
                      <td class="act">
                        <a
                          href="#" on:click|preventDefault={() => previewExternalDisabled()}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="lk"
                          title="Contact (disabled)"
                        >
                          WhatsApp
                        </a>
                      </td>
                    </tr>
                  {/each}
                {/if}
              </tbody>
            </table>
          </div>
        </div>
      {:else}
        <!-- ========================================================
             TAMPILAN SELLER: OVERVIEW, PESANAN MASUK, KARYA, WA
             ======================================================== -->

        {#if currentMenu === "overview"}
          <!-- ==================== BANNER SELAMAT DATANG SELLER ==================== -->
          <div class="welcome-banner-card">
            <div class="banner-chinese-watermark" aria-hidden="true">
              <span class="watermark-calligraphy" lang="en"
                >MADE WITH CARE · PEACE & PROSPERITY</span
              >
              <svg
                class="watermark-cloud-svg"
                viewBox="0 0 160 80"
                fill="currentColor"
              >
                <path
                  d="M120 40c0-11-9-20-20-20-2 0-4 0-6 1-4-12-15-21-29-21-16 0-30 13-30 29 0 2 0 4 1 6-3-1-6-2-10-2-14 0-26 11-26 25s12 25 26 25h94c11 0 20-9 20-20s-9-20-20-20c2-1 4-2 6-3z"
                />
              </svg>
            </div>

            <div class="banner-text-col">
              <span class="banner-greeting">
                Welcome back, {$authUser?.name || activeSeller.nama}!
              </span>
              <p class="banner-subtext">
                Atelier <b>{activeSeller.nama_toko}</b> is your local demo workspace. Manage sample pieces, review demo orders and explore inventory tools.
              </p>
              <div class="banner-actions-row">
                <button class="banner-btn primary" on:click={openAddModal}>
                  + Add a sample piece
                </button>
                <button
                  class="banner-btn secondary"
                  on:click={() => (currentMenu = "orders")}
                >
                  View demo orders ({pendingOrders.length})
                </button>
              </div>
            </div>
            <div class="banner-avatar-col">
              <div class="banner-portrait-seal">
                <span class="seal-glyph" lang="en">M</span>
              </div>
            </div>
          </div>

          <!-- 4 Stat Cards Seller -->
          <div class="stats-grid-row">
            <div class="stat-card">
              <span class="stat-watermark" lang="en" aria-hidden="true">P</span
              >
              <div class="stat-header">
                <span class="stat-ico-badge" lang="en">P</span>
                <span class="stat-name">Listed pieces</span>
              </div>
              <b class="stat-number">{sellerProducts.length}</b>
              <span class="stat-footer-text">Pieces listed by this atelier</span>
            </div>

            <div class="stat-card">
              <span class="stat-watermark" lang="en" aria-hidden="true">I</span
              >
              <div class="stat-header">
                <span class="stat-ico-badge" lang="en">I</span>
                <span class="stat-name">Inventory</span>
              </div>
              <b class="stat-number">{sellerTotalStok}</b>
              <span class="stat-footer-text">Sample units in stock</span>
            </div>

            <div class="stat-card">
              <span class="stat-watermark" lang="en" aria-hidden="true">O</span
              >
              <div class="stat-header">
                <span class="stat-ico-badge" lang="en">O</span>
                <span class="stat-name">Incoming demo orders</span>
              </div>
              <b class="stat-number">{sellerOrders.length}</b>
              <span class="stat-footer-text"
                >{pendingOrders.length} need review</span
              >
            </div>

            <div class="stat-card">
              <span class="stat-watermark" lang="en" aria-hidden="true">F</span
              >
              <div class="stat-header">
                <span class="stat-ico-badge" lang="en">F</span>
                <span class="stat-name">Featured pieces</span>
              </div>
              <b class="stat-number">{sellerUnggulan}</b>
              <span class="stat-footer-text">Selected pieces</span>
            </div>
          </div>

          <!-- Ringkasan Latest demo orders Seller -->
          <div class="content-card-box">
            <span class="card-corner-watermark" lang="en" aria-hidden="true"
              >O</span
            >
            <div class="card-box-header">
              <div>
                <h2 class="card-box-title">
                  Latest demo orders ({sellerOrders.length})
                </h2>
                <span class="card-box-sub"
                  >Sample orders assigned to {activeSeller.nama_toko}.</span
                >
              </div>
              <button class="btn sm" on:click={() => (currentMenu = "orders")}>
                Manage all demo orders &rarr;
              </button>
            </div>

            {#if sellerOrders.length === 0}
              <div class="empty-orders-banner">
                <span class="empty-order-seal" lang="en">JOY</span>
                <p>
                  No sample orders are assigned to this atelier.
                </p>
              </div>
            {:else}
              <div class="tw">
                <table>
                  <thead>
                    <tr>
                      <th>Order no.</th>
                      <th>Date</th>
                      <th>Buyer name</th>
                      <th>Ordered pieces</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each sellerOrders.slice(0, 3) as o (o.id)}
                      <tr>
                        <td
                          style="font-family: monospace; color: var(--gold); font-weight:600;"
                          >#{o.id}</td
                        >
                        <td style="font-size: 12.5px; color: var(--muted);"
                          >{o.created_at}</td
                        >
                        <td class="nm"><b>{o.buyer_name}</b></td>
                        <td>
                          {#each o.items as item}
                            <div style="font-size: 13px;">
                              {item.nama}
                              <small style="color:var(--gold);"
                                >x{item.qty}</small
                              >
                            </div>
                          {/each}
                        </td>
                        <td class="pr">{rp(o.total)}</td>
                        <td>
                          <span
                            class="order-badge {o.status ===
                            'Awaiting review'
                              ? 'pending'
                              : o.status === 'In progress'
                                ? 'process'
                                : o.status === 'Complete'
                                  ? 'done'
                                  : 'cancel'}"
                          >
                            {o.status}
                          </span>
                        </td>
                        <td class="act">
                          <button
                            class="lk"
                            on:click={() => (currentMenu = "orders")}
                            >Detail</button
                          >
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {/if}
          </div>

          <!-- Tabel Pieces Toko -->
          <div class="content-card-box" style="margin-top: 24px;">
            <span class="card-corner-watermark" lang="en" aria-hidden="true"
              >Shang Yun</span
            >
            <div class="card-box-header">
              <div>
                <h2 class="card-box-title">
                  Atelier pieces ({sellerProducts.length})
                </h2>
                <span class="card-box-sub"
                  >Pieces currently listed by {activeSeller.nama_toko}.</span
                >
              </div>
              <button class="btn sm" on:click={openAddModal}>
                + Add a sample piece
              </button>
            </div>

            {#if sellerCats.length > 0}
              <div
                class="dash-category-filter-bar"
                aria-label="Filter atelier pieces by category"
              >
                <button
                  type="button"
                  class="dash-cat-pill"
                  class:active={sellerSelectedCategory === "all"}
                  on:click={() => (sellerSelectedCategory = "all")}
                >
                  All ({sellerProducts.length})
                </button>
                {#each sellerCats as cat}
                  {@const catCount = sellerProducts.filter(
                    (p) => p.kategori === cat,
                  ).length}
                  <button
                    type="button"
                    class="dash-cat-pill"
                    class:active={sellerSelectedCategory === cat}
                    on:click={() => (sellerSelectedCategory = cat)}
                  >
                    {cat} ({catCount})
                  </button>
                {/each}
              </div>
            {/if}

            <div class="tw">
              <table>
                <thead>
                  <tr>
                    <th></th>
                    <th>Piece name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Featured</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {#if filteredSellerProducts.length === 0}
                    <tr>
                      <td colspan="7" class="empty-cell">
                        {sellerProducts.length === 0
                          ? 'No pieces yet. Choose "+ Add a sample piece" to get started.'
                          : "No matching entries pieces dalam kategori ini."}
                      </td>
                    </tr>
                  {:else}
                    {#each filteredSellerProducts as p (p.id)}
                      <tr>
                        <td>
                          <img
                            class="th"
                            data-id={p.id}
                            src={img(p)}
                            alt=""
                            on:error={(e) => handleImgError(e, p)}
                          />
                        </td>
                        <td class="nm">{p.nama}</td>
                        <td><span class="cat-pill">{p.kategori}</span></td>
                        <td class="pr">{rp(p.harga)}</td>
                        <td>
                          {#if p.stok < 1}
                            <span class="st out" style="margin:0">Sold out</span>
                          {:else}
                            <b>{p.stok} unit</b>
                          {/if}
                        </td>
                        <td>
                          {#if p.unggulan}
                            <span class="mini" title="Featured piece">F</span>
                          {/if}
                        </td>
                        <td class="act">
                          <button
                            class="lk"
                            on:click={() => openEditModal(p.id)}>Edit</button
                          >
                          <button
                            class="lk del"
                            on:click={() => handleDeleteClick(p.id)}
                          >
                            {$delConfirmId === p.id ? "Yakin hapus?" : "Delete"}
                          </button>
                        </td>
                      </tr>
                    {/each}
                  {/if}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Contact settings (demo only) -->
          <div class="content-card-box" style="margin-top: 24px;">
            <span class="card-corner-watermark" lang="en" aria-hidden="true"
              >O</span
            >
            <div class="card-box-header">
              <div>
                <h2 class="card-box-title">Contact settings (demo only)</h2>
                <span class="card-box-sub"
                  >Contact settings are local-only. External messaging is disabled.</span
                >
              </div>
            </div>

            <div class="wap-grid">
              <div class="wap-field">
                <label for="wa-in-field"
                  >Atelier contact number ({activeSeller.nama_toko})</label
                >
                <input
                  id="wa-in-field"
                  type="tel"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  placeholder="085738211550"
                  autocomplete="off"
                  bind:value={waInput}
                  on:input={(e) => {
                    waInput = e.target.value.replace(/\D/g, "");
                  }}
                  on:keydown={(e) => {
                    if (
                      [
                        "Backspace",
                        "Delete",
                        "Tab",
                        "Escape",
                        "Enter",
                        "ArrowLeft",
                        "ArrowRight",
                        "Home",
                        "End",
                      ].includes(e.key) ||
                      e.ctrlKey ||
                      e.metaKey
                    )
                      return;
                    if (!/^\d$/.test(e.key)) e.preventDefault();
                  }}
                />
                {#if waErr}
                  <div class="err" role="alert">{waErr}</div>
                {/if}
              </div>
              <div class="wap-info">
                <span>Contact link (disabled):</span>
                <a
                  href="#" on:click|preventDefault={() => previewExternalDisabled()}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="wa-link-preview"
                >
                  wa.me/{activeSeller.no_wa} ↗
                </a>
                <button class="btn" on:click={handleSaveSellerWa}>
                  Save demo number
                </button>
              </div>
            </div>
          </div>
        {/if}

        {#if currentMenu === "orders"}
          <!-- ========================================================
               TAB KHUSUS: PESANAN MASUK GERAI (EKSKLUSIF PER SELLER)
               ======================================================== -->
          <div class="welcome-banner-card order-banner">
            <div class="banner-chinese-watermark" aria-hidden="true">
              <span class="watermark-calligraphy" lang="en"
                >KEEPING PROMISES · WELCOMING GUESTS</span
              >
            </div>
            <div class="banner-text-col">
              <span class="banner-greeting"
                >Demo orders for atelier {activeSeller.nama_toko}</span
              >
              <p class="banner-subtext">
                Review the sample orders assigned to this atelier. Status changes stay in this browser; no payments or messages are processed.
              </p>
            </div>
            <div class="banner-avatar-col">
              <div class="banner-portrait-seal">
                <span class="seal-glyph" lang="en">O</span>
              </div>
            </div>
          </div>

          <!-- 4 Stat Cards Orders Atelier -->
          <div class="stats-grid-row">
            <div class="stat-card">
              <span class="stat-watermark" lang="en" aria-hidden="true">O</span
              >
              <div class="stat-header">
                <span class="stat-ico-badge" lang="en">O</span>
                <span class="stat-name">Total demo orders</span>
              </div>
              <b class="stat-number">{sellerOrders.length}</b>
              <span class="stat-footer-text">Sample orders for this atelier</span>
            </div>

            <div class="stat-card">
              <span class="stat-watermark" lang="en" aria-hidden="true">R</span
              >
              <div class="stat-header">
                <span class="stat-ico-badge" lang="en">R</span>
                <span class="stat-name">Needs review</span>
              </div>
              <b class="stat-number" style="color: var(--gold);"
                >{pendingOrders.length}</b
              >
              <span class="stat-footer-text">Waiting for review</span>
            </div>

            <div class="stat-card">
              <span class="stat-watermark" lang="en" aria-hidden="true">P</span
              >
              <div class="stat-header">
                <span class="stat-ico-badge" lang="en">P</span>
                <span class="stat-name">In progress</span>
              </div>
              <b class="stat-number" style="color: #64b5f6;"
                >{processingOrders.length}</b
              >
              <span class="stat-footer-text">Being made or packed</span>
            </div>

            <div class="stat-card">
              <span class="stat-watermark" lang="en" aria-hidden="true">V</span
              >
              <div class="stat-header">
                <span class="stat-ico-badge" lang="en">V</span>
                <span class="stat-name">Demo order value</span>
              </div>
              <b class="stat-number" style="font-size: 20px;"
                >{rp(sellerOrdersRevenue)}</b
              >
              <span class="stat-footer-text"
                >{completedOrders.length} demo orders complete</span
              >
            </div>
          </div>

          <!-- DAFTAR KARTU PESANAN GERAI -->
          <div class="content-card-box">
            <span class="card-corner-watermark" lang="en" aria-hidden="true"
              >O</span
            >
            <div class="card-box-header">
              <div>
                <h2 class="card-box-title">
                  Sample orders ({filteredSellerOrders.length})
                </h2>
                <span class="card-box-sub"
                  >Sample orders assigned to {activeSeller.nama_toko}.</span
                >
              </div>
            </div>

            <!-- Filter Status Orders -->
            <div class="order-filter-status-bar">
              <button
                type="button"
                class="dash-cat-pill"
                class:active={orderFilterStatus === "all"}
                on:click={() => (orderFilterStatus = "all")}
              >
                All ({sellerOrders.length})
              </button>
              <button
                type="button"
                class="dash-cat-pill"
                class:active={orderFilterStatus === "Awaiting review"}
                on:click={() => (orderFilterStatus = "Awaiting review")}
              >
                Awaiting review ({pendingOrders.length})
              </button>
              <button
                type="button"
                class="dash-cat-pill"
                class:active={orderFilterStatus === "In progress"}
                on:click={() => (orderFilterStatus = "In progress")}
              >
                In progress ({processingOrders.length})
              </button>
              <button
                type="button"
                class="dash-cat-pill"
                class:active={orderFilterStatus === "Complete"}
                on:click={() => (orderFilterStatus = "Complete")}
              >
                Complete ({completedOrders.length})
              </button>
            </div>

            {#if filteredSellerOrders.length === 0}
              <div class="empty-orders-banner">
                <span class="empty-order-seal" lang="en">-</span>
                <p>
                  No "{orderFilterStatus}" orders for {activeSeller.nama_toko}.
                </p>
              </div>
            {:else}
              <div class="orders-cards-stack">
                {#each filteredSellerOrders as o (o.id)}
                  <div class="order-detail-card">
                    <!-- Order Top Row -->
                    <div class="order-card-top">
                      <div class="order-id-group">
                        <span class="order-seal-icon" lang="en">O</span>
                        <div>
                          <b class="order-id-code">#{o.id}</b>
                          <span class="order-timestamp">{o.created_at}</span>
                        </div>
                      </div>
                      <span
                        class="order-badge {o.status === 'Awaiting review'
                          ? 'pending'
                          : o.status === 'In progress'
                            ? 'process'
                            : o.status === 'Complete'
                              ? 'done'
                              : 'cancel'}"
                      >
                        {o.status}
                      </span>
                    </div>

                    <!-- Customer Info Box -->
                    <div class="order-buyer-box">
                      <div class="buyer-info-col">
                        <div class="buyer-meta">
                          <span class="buyer-label">Buyer:</span>
                          <b class="buyer-name-text">{o.buyer_name}</b>
                          {#if o.buyer_email}
                            <span class="buyer-email-text"
                              >({o.buyer_email})</span
                            >
                          {/if}
                        </div>
                        {#if o.note}
                          <div class="buyer-note-wrap">
                            <span class="note-label">Buyer note:</span>
                            <span class="note-quote">"{o.note}"</span>
                          </div>
                        {/if}
                      </div>

                      <div class="buyer-action-col">
                        {#if o.buyer_wa}
                          <button
                            type="button"
                            class="buyer-wa-btn"
                            on:click={() => handleContactBuyerWa(o)}
                            title="Contact buyer (disabled)"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              width="15"
                              height="15"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                            >
                              <path
                                d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                              />
                            </svg>
                            <span>Contact +{o.buyer_wa}</span>
                          </button>
                        {/if}
                      </div>
                    </div>

                    <!-- Ordered Items List -->
                    <div class="order-items-wrapper">
                      <div class="items-mini-list">
                        {#each o.items as it}
                          <div class="item-mini-row">
                            <div class="item-mini-info">
                              <span class="item-bullet">❖</span>
                              <span class="item-name-bold">{it.nama}</span>
                              <span class="item-qty-tag">x{it.qty} unit</span>
                            </div>
                            <span class="item-subtotal-price"
                              >{rp(
                                (Number(it.harga) || 0) * (Number(it.qty) || 1),
                              )}</span
                            >
                          </div>
                        {/each}
                      </div>
                    </div>

                    <!-- Order Card Bottom Actions -->
                    <div class="order-card-footer">
                      <div class="order-total-display">
                        <span>Total demo orders:</span>
                        <b class="gold-price-total">{rp(o.total)}</b>
                      </div>

                      <div class="order-action-buttons">
                        {#if o.status === "Awaiting review"}
                          <button
                            type="button"
                            class="order-act-btn btn-confirm"
                            on:click={() => handleConfirmOrder(o)}
                          >
                            Mark in progress
                          </button>
                        {:else if o.status === "In progress"}
                          <button
                            type="button"
                            class="order-act-btn btn-complete"
                            on:click={() => handleCompleteOrder(o)}
                          >
                            Mark complete & dispatched
                          </button>
                        {/if}

                        {#if o.status !== "Complete" && o.status !== "Cancelled"}
                          <button
                            type="button"
                            class="order-act-btn btn-cancel"
                            on:click={() => handleCancelOrder(o)}
                          >
                            Cancel
                          </button>
                        {/if}
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}

        {#if currentMenu === "products"}
          <!-- ==================== TAB KELOLA KARYA & STOK ==================== -->
          <div class="content-card-box">
            <span class="card-corner-watermark" lang="en" aria-hidden="true"
              >Shang Yun</span
            >
            <div class="card-box-header">
              <div>
                <h2 class="card-box-title">
                  Pieces & inventory Atelier ({sellerProducts.length})
                </h2>
                <span class="card-box-sub"
                  >Pieces currently listed by {activeSeller.nama_toko}.</span
                >
              </div>
              <button class="btn sm" on:click={openAddModal}>
                + Add a sample piece
              </button>
            </div>

            {#if sellerCats.length > 0}
              <div
                class="dash-category-filter-bar"
                aria-label="Filter atelier pieces by category"
              >
                <button
                  type="button"
                  class="dash-cat-pill"
                  class:active={sellerSelectedCategory === "all"}
                  on:click={() => (sellerSelectedCategory = "all")}
                >
                  All ({sellerProducts.length})
                </button>
                {#each sellerCats as cat}
                  {@const catCount = sellerProducts.filter(
                    (p) => p.kategori === cat,
                  ).length}
                  <button
                    type="button"
                    class="dash-cat-pill"
                    class:active={sellerSelectedCategory === cat}
                    on:click={() => (sellerSelectedCategory = cat)}
                  >
                    {cat} ({catCount})
                  </button>
                {/each}
              </div>
            {/if}

            <div class="tw">
              <table>
                <thead>
                  <tr>
                    <th></th>
                    <th>Piece name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Featured</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {#if filteredSellerProducts.length === 0}
                    <tr>
                      <td colspan="7" class="empty-cell">
                        {sellerProducts.length === 0
                          ? 'No pieces yet. Choose "+ Add a sample piece" to get started.'
                          : "No matching entries pieces dalam kategori ini."}
                      </td>
                    </tr>
                  {:else}
                    {#each filteredSellerProducts as p (p.id)}
                      <tr>
                        <td>
                          <img
                            class="th"
                            data-id={p.id}
                            src={img(p)}
                            alt=""
                            on:error={(e) => handleImgError(e, p)}
                          />
                        </td>
                        <td class="nm">{p.nama}</td>
                        <td><span class="cat-pill">{p.kategori}</span></td>
                        <td class="pr">{rp(p.harga)}</td>
                        <td>
                          {#if p.stok < 1}
                            <span class="st out" style="margin:0">Sold out</span>
                          {:else}
                            <b>{p.stok} unit</b>
                          {/if}
                        </td>
                        <td>
                          {#if p.unggulan}
                            <span class="mini" title="Featured piece">F</span>
                          {/if}
                        </td>
                        <td class="act">
                          <button
                            class="lk"
                            on:click={() => openEditModal(p.id)}>Edit</button
                          >
                          <button
                            class="lk del"
                            on:click={() => handleDeleteClick(p.id)}
                          >
                            {$delConfirmId === p.id ? "Yakin hapus?" : "Delete"}
                          </button>
                        </td>
                      </tr>
                    {/each}
                  {/if}
                </tbody>
              </table>
            </div>
          </div>
        {/if}

        {#if currentMenu === "wa"}
          <!-- ==================== TAB PENGATURAN WHATSAPP ==================== -->
          <div class="content-card-box">
            <span class="card-corner-watermark" lang="en" aria-hidden="true"
              >O</span
            >
            <div class="card-box-header">
              <div>
                <h2 class="card-box-title">Contact settings (demo only)</h2>
                <span class="card-box-sub"
                  >Contact settings are local-only. External messaging is disabled.</span
                >
              </div>
            </div>

            <div class="wap-grid">
              <div class="wap-field">
                <label for="wa-in-field"
                  >Atelier contact number ({activeSeller.nama_toko})</label
                >
                <input
                  id="wa-in-field"
                  type="tel"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  placeholder="085738211550"
                  autocomplete="off"
                  bind:value={waInput}
                  on:input={(e) => {
                    waInput = e.target.value.replace(/\D/g, "");
                  }}
                  on:keydown={(e) => {
                    if (
                      [
                        "Backspace",
                        "Delete",
                        "Tab",
                        "Escape",
                        "Enter",
                        "ArrowLeft",
                        "ArrowRight",
                        "Home",
                        "End",
                      ].includes(e.key) ||
                      e.ctrlKey ||
                      e.metaKey
                    )
                      return;
                    if (!/^\d$/.test(e.key)) e.preventDefault();
                  }}
                />
                {#if waErr}
                  <div class="err" role="alert">{waErr}</div>
                {/if}
              </div>
              <div class="wap-info">
                <span>Contact link (disabled):</span>
                <a
                  href="#" on:click|preventDefault={() => previewExternalDisabled()}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="wa-link-preview"
                >
                  wa.me/{activeSeller.no_wa} ↗
                </a>
                <button class="btn" on:click={handleSaveSellerWa}>
                  Save demo number
                </button>
              </div>
            </div>
          </div>
        {/if}
      {/if}
    </main>
  </div>
</div>

<style>
  /* ========================================================
     DASHBOARD LAYOUT (SIDEBAR + TOPBAR + MAIN)
     - Sesuai Referensi Gambar Elizabeth Addams Dashboard
     ======================================================== */
  .dash-layout {
    display: flex;
    width: 100%;
    height: 100vh;
    height: 100dvh;
    background: var(--bg-primary);
    color: var(--white);
    position: relative;
    font-family: Jost, system-ui, sans-serif;
    overflow: hidden;
  }

  /* SIDEBAR */
  .dash-sidebar {
    width: 260px;
    height: 100%;
    max-height: 100vh;
    max-height: 100dvh;
    background: var(--bg-secondary);
    border-right: 1px solid var(--card-stat-border);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 24px 16px;
    flex-shrink: 0;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
    transition:
      transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
      background-color 0.32s ease;
    z-index: 50;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 6px 8px 24px;
    border-bottom: 1px solid var(--line);
    margin-bottom: 20px;
  }

  .seal {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--red);
    color: #ffffff;
    display: grid;
    place-items: center;
    font:
      400 20px "Ma Shan Zheng",
      serif;
    line-height: 1;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.28);
  }

  .brand-info {
    display: flex;
    flex-direction: column;
    line-height: 1.15;
  }

  .brand-title {
    font:
      600 20px "Cormorant Garamond",
      Georgia,
      serif;
    letter-spacing: 0.04em;
    color: var(--white);
  }

  .brand-desc {
    font-size: 12px;
    color: var(--muted);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  /* SIDEBAR MENU */
  .sidebar-menu {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 11px 14px;
    background: transparent;
    border: 0;
    border-radius: 12px;
    color: var(--muted);
    font-family: inherit;
    font-size: 13.5px;
    font-weight: 500;
    cursor: pointer;
    text-align: left;
    transition: all 0.22s ease;
  }

  .menu-item:hover {
    color: var(--white);
    background: var(--pill-bg);
  }

  /* Active Pill Item (Matches the warm camel active pill in Elizabeth's dashboard!) */
  .menu-item.active {
    background: var(--pill-active-bg);
    color: var(--pill-active-text);
    box-shadow: var(--pill-active-shadow);
    font-weight: 600;
  }

  .menu-icon {
    flex-shrink: 0;
    opacity: 0.85;
  }

  .menu-item.active .menu-icon {
    opacity: 1;
  }

  .menu-separator {
    height: 1px;
    background: var(--line);
    margin: 12px 6px;
  }

  .back-link {
    color: var(--muted);
    font-size: 13px;
  }

  .back-link:hover {
    color: var(--gold);
  }

  /* SIDEBAR BOTTOM WIDGETS */
  .sidebar-bottom {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding-top: 18px;
    border-top: 1px solid var(--line);
  }

  .user-card-widget {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--bg-card);
    border: 1px solid var(--card-stat-border);
    padding: 8px 10px;
    border-radius: 14px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .avatar-wrap {
    position: relative;
  }

  .user-avatar-circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--pill-active-bg);
    color: var(--pill-active-text);
    font-weight: 600;
    font-size: 13px;
    display: grid;
    place-items: center;
  }

  .online-indicator {
    position: absolute;
    bottom: -1px;
    right: -1px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #10b981;
    border: 2px solid var(--bg-card);
  }

  .user-info-text {
    display: flex;
    flex-direction: column;
    line-height: 1.15;
    flex: 1;
    overflow: hidden;
  }

  .user-real-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--white);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-status-label {
    font-size: 12px;
    color: var(--muted);
  }

  .logout-icon-btn {
    background: transparent;
    border: 0;
    color: var(--muted);
    cursor: pointer;
    padding: 4px;
    border-radius: 6px;
    transition:
      color 0.2s,
      background 0.2s;
  }

  .logout-icon-btn:hover {
    color: #e0735f;
    background: rgba(224, 115, 95, 0.12);
  }

  /* Theme Switcher Pill in Sidebar */
  .theme-switch-capsule {
    display: flex;
    background: var(--pill-bg);
    border: 1px solid var(--pill-border);
    padding: 3px;
    border-radius: 20px;
    gap: 3px;
  }

  .theme-pill-btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background: transparent;
    border: 0;
    color: var(--muted);
    font-size: 12px;
    font-weight: 500;
    padding: 5px 8px;
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .theme-pill-btn.active {
    background: var(--pill-active-bg);
    color: var(--pill-active-text);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    font-weight: 600;
  }

  /* ==================== CONTENT CANVAS & TOPBAR ==================== */
  .dash-content-area {
    flex: 1 1 0%;
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    height: 100%;
    max-height: 100vh;
    max-height: 100dvh;
    overflow: hidden;
    position: relative;
  }

  /* TOPBAR */
  .dash-topbar {
    height: 64px;
    padding: 0 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    background: var(--bg-glass);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--card-stat-border);
    flex-shrink: 0;
    z-index: 20;
  }

  .topbar-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .mobile-menu-btn {
    display: none;
    background: transparent;
    border: 0;
    color: var(--white);
    padding: 6px;
    border-radius: 8px;
    cursor: pointer;
  }

  .page-title-wrap {
    display: flex;
    flex-direction: column;
  }

  .page-title {
    font:
      600 20px "Cormorant Garamond",
      Georgia,
      serif;
    margin: 0;
    color: var(--white);
    line-height: 1.1;
  }

  .page-subtitle {
    font-size: 12.5px;
    color: var(--muted);
  }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .seller-picker {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
    color: var(--muted);
  }

  .seller-select-clean {
    background: var(--bg-card);
    border: 1px solid var(--card-stat-border);
    color: var(--white);
    padding: 5px 10px;
    border-radius: 8px;
    font-size: 12.5px;
    cursor: pointer;
  }

  /* Notification Bell */
  .notif-wrap {
    position: relative;
  }

  .notif-btn {
    position: relative;
    background: var(--bg-card);
    border: 1px solid var(--card-stat-border);
    color: var(--white);
    width: 34px;
    height: 34px;
    border-radius: 10px;
    display: grid;
    place-items: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .notif-btn:hover {
    border-color: var(--brass);
    color: var(--gold);
  }

  .notif-badge {
    position: absolute;
    top: -3px;
    right: -3px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--red);
    color: #ffffff;
    font-size: 9.5px;
    font-weight: 600;
    display: grid;
    place-items: center;
  }

  .notif-popover {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    width: 300px;
    background: var(--bg-card);
    border: 1px solid var(--card-stat-border);
    border-radius: 14px;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.25);
    padding: 14px;
    z-index: 100;
  }

  .notif-popover-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--line);
    font-size: 13px;
  }

  .notif-clear-btn {
    background: transparent;
    border: 0;
    font-size: 11px;
    color: var(--gold);
    cursor: pointer;
  }

  .notif-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;
    max-height: 240px;
    overflow-y: auto;
  }

  .notif-item {
    padding: 8px 10px;
    border-radius: 8px;
    background: var(--pill-bg);
    font-size: 12px;
  }

  .notif-item.unread {
    border-left: 3px solid var(--gold);
  }

  .notif-top {
    display: flex;
    justify-content: space-between;
    margin-bottom: 3px;
  }

  .notif-title {
    font-weight: 600;
    color: var(--white);
  }

  .notif-time {
    color: var(--muted);
    font-size: 10.5px;
  }

  .notif-desc {
    margin: 0;
    color: var(--muted);
    line-height: 1.35;
  }

  .topbar-profile-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--bg-card);
    border: 1px solid var(--card-stat-border);
    padding: 4px 10px 4px 5px;
    border-radius: 20px;
  }

  .profile-photo-circle {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--pill-active-bg);
    color: var(--pill-active-text);
    font-weight: 600;
    font-size: 12px;
    display: grid;
    place-items: center;
  }

  .profile-name-text {
    font-size: 12.5px;
    font-weight: 500;
    color: var(--white);
  }

  /* MAIN SCROLL CONTAINER */
  .dash-main-scroll {
    flex: 1 1 0%;
    min-height: 0;
    height: 100%;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
    padding: 24px 28px 64px;
    outline: none;
    scroll-behavior: smooth;
  }

  .dash-main-scroll::-webkit-scrollbar,
  .dash-sidebar::-webkit-scrollbar {
    width: 7px;
  }
  .dash-main-scroll::-webkit-scrollbar-track,
  .dash-sidebar::-webkit-scrollbar-track {
    background: transparent;
  }
  .dash-main-scroll::-webkit-scrollbar-thumb,
  .dash-sidebar::-webkit-scrollbar-thumb {
    background: rgba(224, 181, 98, 0.28);
    border-radius: 4px;
  }
  .dash-main-scroll::-webkit-scrollbar-thumb:hover,
  .dash-sidebar::-webkit-scrollbar-thumb:hover {
    background: var(--gold);
  }

  /* ==================== WELCOME BANNER CARD ==================== */
  .welcome-banner-card {
    position: relative;
    overflow: hidden;
    background: var(--dash-banner);
    color: #ffffff;
    border-radius: 20px;
    padding: 30px 34px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
    margin-bottom: 24px;
    border: 1px solid var(--card-stat-border);
  }

  /* Chinese Calligraphy & Cloud Watermark Background */
  .banner-chinese-watermark {
    position: absolute;
    right: 120px;
    bottom: -16px;
    pointer-events: none;
    user-select: none;
    display: flex;
    align-items: center;
    gap: 24px;
    opacity: 0.065;
    z-index: 1;
  }

  :global([data-theme="light"]) .banner-chinese-watermark {
    opacity: 0.09;
  }

  .watermark-calligraphy {
    font:
      400 68px/1 "Ma Shan Zheng",
      serif;
    letter-spacing: 0.14em;
    white-space: nowrap;
    color: #ffffff;
  }

  .watermark-cloud-svg {
    width: 140px;
    height: 70px;
    color: #ffffff;
    flex-shrink: 0;
  }

  .banner-text-col {
    position: relative;
    z-index: 2;
    max-width: 520px;
  }

  .banner-greeting {
    display: block;
    font:
      600 clamp(22px, 3vw, 28px) "Cormorant Garamond",
      Georgia,
      serif;
    line-height: 1.15;
    margin-bottom: 8px;
  }

  .banner-subtext {
    margin: 0 0 18px;
    font-size: 14px;
    opacity: 0.92;
    line-height: 1.6;
    max-width: 480px; /* Resolves LINE LENGTH TOO LONG */
  }

  .banner-actions-row {
    position: relative;
    z-index: 2;
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .banner-btn {
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    padding: 8px 18px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .banner-btn.primary {
    background: #ffffff;
    border: 1px solid #ffffff;
    color: #24140e;
    font-weight: 600;
  }

  .banner-btn.primary:hover {
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-1px);
  }

  .banner-btn.secondary {
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.35);
    color: #ffffff;
  }

  .banner-btn.secondary:hover {
    background: rgba(255, 255, 255, 0.25);
  }

  .banner-avatar-col {
    position: relative;
    z-index: 2;
    flex-shrink: 0;
  }

  .banner-portrait-seal {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.18);
    border: 2px solid rgba(255, 255, 255, 0.4);
    display: grid;
    place-items: center;
  }

  .seal-glyph {
    font:
      400 36px "Ma Shan Zheng",
      serif;
    color: #ffffff;
    line-height: 1;
  }

  /* ==================== 4 STAT CARDS ==================== */
  .stats-grid-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .stat-card {
    position: relative;
    overflow: hidden;
    background: var(--bg-card);
    border: 1px solid var(--card-stat-border);
    border-radius: 16px;
    padding: 22px 24px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
  }

  /* Stat Card Chinese Calligraphy Watermark */
  .stat-watermark {
    position: absolute;
    right: 8px;
    bottom: -10px;
    font:
      400 80px/1 "Ma Shan Zheng",
      serif;
    color: var(--gold);
    opacity: 0.055;
    pointer-events: none;
    user-select: none;
    transition:
      opacity 0.25s ease,
      transform 0.25s ease;
  }

  .stat-card:hover .stat-watermark {
    opacity: 0.11;
    transform: scale(1.06) rotate(-2deg);
  }

  .stat-header {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .stat-ico-badge {
    width: 26px;
    height: 26px;
    border-radius: 7px;
    background: rgba(168, 32, 26, 0.1);
    color: var(--red);
    font:
      400 15px "Ma Shan Zheng",
      serif;
    display: grid;
    place-items: center;
  }

  .stat-name {
    font-size: 13.5px;
    color: var(--muted);
    font-weight: 500;
  }

  .stat-number {
    position: relative;
    z-index: 2;
    display: block;
    font:
      600 38px/1 "Cormorant Garamond",
      Georgia,
      serif;
    color: var(--gold);
    margin-bottom: 4px;
  }

  .stat-footer-text {
    position: relative;
    z-index: 2;
    font-size: 13px; /* Resolves TINY BODY TEXT */
    color: var(--muted);
  }

  /* ==================== CONTENT CARD BOX & TABLES ==================== */
  .content-card-box {
    position: relative;
    overflow: hidden;
    background: var(--bg-card);
    border: 1px solid var(--card-stat-border);
    border-radius: 18px;
    padding: 24px 28px;
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.12);
  }

  /* Traditional Corner Motif for Content Box */
  .card-corner-watermark {
    position: absolute;
    right: 20px;
    top: 10px;
    font:
      400 64px/1 "Ma Shan Zheng",
      serif;
    color: var(--gold);
    opacity: 0.04;
    pointer-events: none;
    user-select: none;
  }

  /* Eliminates NESTED CARDS error by removing inner box styling from .tw */
  .content-card-box .tw {
    background: transparent;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    padding: 0;
    margin-bottom: 0;
  }

  .card-box-header {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 14px;
    margin-bottom: 20px;
  }

  .card-box-title {
    font:
      600 24px "Cormorant Garamond",
      Georgia,
      serif;
    margin: 0 0 4px;
    color: var(--white);
  }

  .card-box-sub {
    font-size: 13.5px;
    color: var(--muted);
  }

  .dash-category-filter-bar {
    position: relative;
    z-index: 2;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--line);
  }

  .dash-cat-pill {
    background: var(--bg-secondary);
    border: 1px solid var(--line);
    color: var(--muted);
    font-size: 12px;
    padding: 4px 12px;
    border-radius: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .dash-cat-pill:hover {
    border-color: var(--gold);
    color: var(--gold);
  }

  .dash-cat-pill.active {
    background: rgba(224, 181, 98, 0.15);
    border-color: var(--gold);
    color: var(--gold);
    font-weight: 500;
  }

  .empty-cell {
    text-align: center;
    padding: 36px 12px;
    color: var(--muted);
    font-size: 13.5px;
  }

  .cat-pill {
    display: inline-block;
    font-size: 12px; /* Sized up from 11px */
    padding: 3px 9px;
    border-radius: 10px;
    background: var(--pill-bg);
    border: 1px solid rgba(185, 152, 92, 0.22);
    color: var(--muted);
  }

  /* WHATSAPP FORM */
  .wap-grid {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    align-items: flex-end;
  }

  .wap-field label {
    font-size: 13.5px;
    color: var(--muted);
    margin-bottom: 6px;
    display: block;
  }

  .wap-field input {
    width: 100%;
    padding: 10px 14px;
    border-radius: 10px;
    border: 1px solid var(--card-stat-border);
    background: var(--bg-secondary);
    color: var(--white);
    font:
      600 20px "Cormorant Garamond",
      serif;
  }

  .wap-info {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .wa-link-preview {
    font-family: monospace;
    font-size: 13.5px;
    color: var(--gold);
    text-decoration: underline;
  }

  /* ========================================================
     MENU BADGE & ORDER BADGES
     ======================================================== */
  .menu-badge-pill {
    background: var(--red);
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    padding: 1px 7px;
    border-radius: 10px;
    margin-left: auto;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  }

  .order-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
  }

  .order-badge.pending {
    background: rgba(224, 181, 98, 0.15);
    border: 1px solid rgba(224, 181, 98, 0.4);
    color: var(--gold);
  }

  .order-badge.process {
    background: rgba(100, 181, 246, 0.15);
    border: 1px solid rgba(100, 181, 246, 0.4);
    color: #64b5f6;
  }

  .order-badge.done {
    background: rgba(76, 175, 80, 0.15);
    border: 1px solid rgba(76, 175, 80, 0.4);
    color: #81c784;
  }

  .order-badge.cancel {
    background: rgba(244, 67, 54, 0.15);
    border: 1px solid rgba(244, 67, 54, 0.4);
    color: #e57373;
  }

  /* ========================================================
     ADMIN VIEW ENHANCEMENTS
     ======================================================== */
  .admin-banner {
    background: linear-gradient(
      135deg,
      rgba(38, 18, 14, 0.95) 0%,
      rgba(18, 8, 6, 0.98) 100%
    );
    border-color: rgba(224, 181, 98, 0.4);
  }

  .admin-seller-filter-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 20px;
  }

  .admin-search-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--bg-secondary);
    border: 1px solid var(--card-stat-border);
    padding: 8px 14px;
    border-radius: 12px;
    flex: 1;
    min-width: 260px;
  }

  .admin-search-wrap svg {
    color: var(--muted);
    flex-shrink: 0;
  }

  .admin-search-wrap input {
    background: none;
    border: none;
    color: var(--white);
    font-size: 13.5px;
    width: 100%;
    outline: none;
    font-family: inherit;
  }

  .admin-spec-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .seller-name-cell {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .seller-mini-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(224, 181, 98, 0.18);
    color: var(--gold);
    border: 1px solid rgba(224, 181, 98, 0.4);
    display: grid;
    place-items: center;
    font-weight: 700;
    font-size: 13px;
  }

  .seller-wa-link {
    color: #25d366;
    text-decoration: none;
    font-weight: 500;
    transition: opacity 0.2s;
  }
  .seller-wa-link:hover {
    text-decoration: underline;
    opacity: 0.85;
  }

  .st-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .st-badge.active {
    background: rgba(76, 175, 80, 0.12);
    color: #81c784;
    border: 1px solid rgba(76, 175, 80, 0.3);
  }

  .st-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #81c784;
  }

  /* ========================================================
     ORDERS VIEW (PESANAN MASUK PER SELLER)
     ======================================================== */
  .order-banner {
    background: linear-gradient(
      135deg,
      rgba(28, 14, 12, 0.95) 0%,
      rgba(14, 7, 5, 0.98) 100%
    );
    border-color: rgba(224, 181, 98, 0.3);
  }

  .order-filter-status-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
  }

  .empty-orders-banner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 16px;
    text-align: center;
    color: var(--muted);
    font-size: 14px;
  }

  .empty-order-seal {
    font:
      400 48px "Ma Shan Zheng",
      serif;
    color: var(--gold);
    opacity: 0.4;
    margin-bottom: 12px;
  }

  .orders-cards-stack {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .order-detail-card {
    background: var(--bg-secondary);
    border: 1px solid var(--card-stat-border);
    border-radius: 16px;
    padding: 20px;
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease;
  }

  .order-detail-card:hover {
    border-color: rgba(224, 181, 98, 0.35);
  }

  .order-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 14px;
    border-bottom: 1px solid var(--line);
    margin-bottom: 14px;
  }

  .order-id-group {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .order-seal-icon {
    width: 32px;
    height: 32px;
    background: var(--red);
    color: #ffffff;
    border-radius: 6px;
    display: grid;
    place-items: center;
    font:
      400 16px "Ma Shan Zheng",
      serif;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  }

  .order-id-code {
    font-family: monospace;
    font-size: 16px;
    color: var(--gold);
    letter-spacing: 0.04em;
    display: block;
  }

  .order-timestamp {
    font-size: 12px;
    color: var(--muted);
    display: block;
  }

  .order-buyer-box {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    background: rgba(0, 0, 0, 0.15);
    border: 1px solid rgba(224, 181, 98, 0.1);
    padding: 12px 16px;
    border-radius: 12px;
    margin-bottom: 16px;
  }

  .buyer-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13.5px;
    flex-wrap: wrap;
  }

  .buyer-label {
    color: var(--muted);
  }

  .buyer-name-text {
    color: var(--white);
  }

  .buyer-email-text {
    color: var(--muted);
    font-size: 12.5px;
  }

  .buyer-note-wrap {
    margin-top: 6px;
    font-size: 13px;
  }

  .note-label {
    color: var(--gold);
    font-weight: 500;
  }

  .note-quote {
    color: #d1c5b8;
    font-style: italic;
  }

  .buyer-wa-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(37, 211, 102, 0.14);
    border: 1px solid rgba(37, 211, 102, 0.45);
    color: #25d366;
    padding: 7px 14px;
    border-radius: 8px;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .buyer-wa-btn:hover {
    background: #25d366;
    color: #ffffff;
  }

  .order-items-wrapper {
    padding: 6px 0 16px;
    border-bottom: 1px dashed var(--line);
  }

  .items-mini-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .item-mini-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13.5px;
  }

  .item-mini-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .item-bullet {
    color: var(--gold);
    font-size: 11px;
  }

  .item-name-bold {
    font-weight: 500;
    color: var(--white);
  }

  .item-qty-tag {
    color: var(--gold);
    font-size: 12px;
    background: rgba(224, 181, 98, 0.1);
    padding: 1px 6px;
    border-radius: 4px;
  }

  .item-subtotal-price {
    font-weight: 600;
    color: var(--white);
    font-family: inherit;
  }

  .order-card-footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding-top: 14px;
  }

  .order-total-display {
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-size: 14px;
  }

  .gold-price-total {
    font:
      600 20px "Cormorant Garamond",
      serif;
    color: var(--gold);
  }

  .order-action-buttons {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .order-act-btn {
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .order-act-btn.btn-confirm {
    background: var(--gold);
    color: #120705;
    border: 1px solid var(--gold);
  }
  .order-act-btn.btn-confirm:hover {
    background: #f0c978;
  }

  .order-act-btn.btn-complete {
    background: #2e7d32;
    color: #ffffff;
    border: 1px solid #2e7d32;
  }
  .order-act-btn.btn-complete:hover {
    background: #388e3c;
  }

  .order-act-btn.btn-cancel {
    background: transparent;
    color: var(--muted);
    border: 1px solid var(--card-stat-border);
  }
  .order-act-btn.btn-cancel:hover {
    color: #e57373;
    border-color: #e57373;
  }

  /* RESPONSIVE */
  @media (max-width: 900px) {
    .dash-sidebar {
      position: fixed;
      top: 0;
      bottom: 0;
      left: 0;
      transform: translateX(-100%);
    }

    .dash-sidebar.open {
      transform: translateX(0);
    }

    .sidebar-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 45;
    }

    .mobile-menu-btn {
      display: inline-flex;
    }

    .dash-topbar {
      padding: 0 16px;
    }

    .dash-main-scroll {
      padding: 16px;
    }

    .wap-grid {
      grid-template-columns: 1fr;
    }

    .banner-avatar-col {
      display: none;
    }
  }

  @media (max-width: 600px) {
    .profile-name-text {
      display: none;
    }

    .picker-label {
      display: none;
    }
  }
</style>
