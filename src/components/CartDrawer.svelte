<script>
function previewExternalDisabled() { alert("External contact is disabled in this private demo. No message was sent."); }
  import { cart, cartOpen, cartCount, cartTotal, authUser, showToast, orders, sellers } from '../stores/store.js';
  import { img, ph, rp } from '../data/seed.js';

  let hasAnimatedBounce = false;

  // Keranjang belanja HANYA untuk pembeli (guest atau akun pembeli).
  // Seller dan admin TIDAK menggunakan keranjang belanja.
  $: isSellerOrAdmin = Boolean($authUser && ($authUser.role === 'seller' || $authUser.role === 'admin'));

  // Jika sedang login sebagai seller atau admin, pastikan drawer tertutup dan tidak muncul
  $: if (isSellerOrAdmin && $cartOpen) {
    cartOpen.set(false);
  }

  // Trigger brief bounce animation whenever cartCount increases
  $: if ($cartCount > 0 && !isSellerOrAdmin) {
    hasAnimatedBounce = true;
    setTimeout(() => {
      hasAnimatedBounce = false;
    }, 450);
  }

  function closeCart() {
    cartOpen.set(false);
  }

  function handleImgError(e, p) {
    const t = e.currentTarget;
    if (t && !t.dataset.f) {
      t.dataset.f = '1';
      t.src = ph(p);
    }
  }

  // Group cart items strictly by seller atelier
  $: groupedCart = $cart.reduce((groups, item) => {
    const sId = item.seller_id || 's1';
    if (!groups[sId]) {
      const foundSeller = $sellers.find((s) => s.id === sId);
      groups[sId] = {
        seller_id: sId,
        seller_toko: item.seller_toko || foundSeller?.nama_toko || 'Zhao Atelier Suzhou',
        seller_wa: item.seller_wa || foundSeller?.no_wa || '6285738211550',
        items: [],
        total: 0,
        count: 0
      };
    }
    groups[sId].items.push(item);
    groups[sId].total += (Number(item.harga) || 0) * (Number(item.qty) || 0);
    groups[sId].count += (Number(item.qty) || 0);
    return groups;
  }, {});

  $: sellerGroups = Object.values(groupedCart);

  // Checkout specific seller group
  function handleCheckoutGroup(group) {
    showToast('Private demo only. Your basket is unchanged and no order or message was sent.');
  }

  function handleCheckoutAll() {
    if (sellerGroups.length === 0) return;
    // Checkout first group
    handleCheckoutGroup(sellerGroups[0]);
  }
</script>

{#if !isSellerOrAdmin}
<!-- ========================================================
     FLOATING CART BUTTON DI POJOK BAWAH
     - Muncul otomatis ketika si user sudah pencet tambah pesanan (cartCount > 0)
     - Dilengkapi badge hitungan item & micro-animation
     ======================================================== -->
{#if $cartCount > 0}
  <aside class="floating-cart-container" aria-label="Open shopping basket">
    <button 
      type="button" 
      class="floating-cart-btn" 
      class:bouncing={hasAnimatedBounce}
      on:click={() => cartOpen.set(true)}
      title="Open basket ({$cartCount} pieces)"
      aria-haspopup="dialog"
      aria-expanded={$cartOpen}
    >
      <!-- Cart Icon with Chinese Seal Element -->
      <svg class="cart-svg-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      <span class="mini-seal-badge" lang="en" aria-hidden="true">B</span>

      <!-- Badge Hitungan Item -->
      <span class="cart-counter-badge" aria-label="{$cartCount} items in basket">
        {$cartCount}
      </span>

      <!-- Floating Tooltip Label (Desktop) -->
      <span class="floating-tooltip-pill">
        Keranjang ({rp($cartTotal)})
      </span>
    </button>
  </aside>
{/if}

<!-- ========================================================
     CART DRAWER SLIDE PANEL (MODAL KERANJANG)
     ======================================================== -->
{#if $cartOpen}
  <!-- Backdrop Blur -->
  <div 
    class="cart-backdrop" 
    on:click={closeCart}
    role="button"
    tabindex="0"
    on:keydown={(e) => e.key === 'Escape' && closeCart()}
    aria-label="Close basket"
  ></div>

  <!-- Sliding Drawer Content -->
  <div class="cart-drawer-panel" role="dialog" aria-modal="true" aria-labelledby="cart-title">
    <!-- Subtle Background Watermark -->
    <span class="drawer-bg-watermark" lang="en" aria-hidden="true">Shang Yun</span>

    <!-- Drawer Header -->
    <div class="drawer-header">
      <div class="header-left">
        <span class="seal-icon" lang="en">B</span>
        <div class="title-wrap">
          <h2 id="cart-title" class="drawer-title">Shopping basket</h2>
          <span class="drawer-subtitle">{$cartCount} pieces kriya dipilih</span>
        </div>
      </div>
      <button 
        type="button" 
        class="close-drawer-btn" 
        on:click={closeCart}
        aria-label="Close basket"
      >
        &times;
      </button>
    </div>

    <!-- Drawer Body / Item List -->
    <div class="drawer-body">
      {#if $cart.length === 0}
        <div class="empty-cart-view">
          <span class="empty-seal" lang="en">-</span>
          <p class="empty-title">Your basket is empty</p>
          <p class="empty-desc">Explore the collection and add a piece you like.</p>
          <button type="button" class="btn-browse" on:click={closeCart}>
            Browse the collection
          </button>
        </div>
      {:else}
        {#each sellerGroups as group (group.seller_id)}
          <div class="atelier-cart-group">
            <div class="atelier-group-header">
              <div class="atelier-info">
                <span class="atelier-seal-mini" lang="en">A</span>
                <span class="atelier-title-text">{group.seller_toko}</span>
              </div>
              <span class="atelier-count-badge">{group.count} pieces · {rp(group.total)}</span>
            </div>

            <div class="cart-items-list">
              {#each group.items as item (item.id)}
                <div class="cart-item-card">
                  <div class="item-thumb-wrap">
                    <img 
                      class="item-img" 
                      src={img(item)} 
                      alt={item.nama}
                      on:error={(e) => handleImgError(e, item)}
                    />
                  </div>

                  <div class="item-details">
                    <div class="item-head">
                      <h3 class="item-name">{item.nama}</h3>
                      <button 
                        type="button" 
                        class="item-del-btn" 
                        on:click={() => cart.removeItem(item.id)}
                        title="Remove piece from basket"
                        aria-label="Delete {item.nama}"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>

                    <span class="item-seller">{group.seller_toko}</span>
                    <span class="item-price-unit">{rp(item.harga)} / unit</span>

                    <!-- Stepper Kuantitas & Subtotal Item -->
                    <div class="item-bottom-row">
                      <div class="stepper-wrap">
                        <button 
                          type="button" 
                          class="step-btn" 
                          on:click={() => cart.updateQty(item.id, item.qty - 1)}
                          title="Decrease quantity"
                          aria-label="Decrease quantity"
                        >
                          &minus;
                        </button>
                        <span class="qty-display">{item.qty}</span>
                        <button 
                          type="button" 
                          class="step-btn" 
                          disabled={item.qty >= item.maxStock}
                          on:click={() => cart.updateQty(item.id, item.qty + 1)}
                          title={item.qty >= item.maxStock ? 'Stock limit reached' : 'Increase quantity'}
                          aria-label="Increase quantity"
                        >
                          &#43;
                        </button>
                      </div>

                      <b class="item-subtotal">{rp(item.harga * item.qty)}</b>
                    </div>
                  </div>
                </div>
              {/each}
            </div>

            {#if sellerGroups.length > 1}
              <button 
                type="button" 
                class="checkout-atelier-btn" 
                on:click={() => handleCheckoutGroup(group)}
              >
                <svg class="wa-btn-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                <span>Preview basket for {group.seller_toko}</span>
              </button>
            {/if}
          </div>
        {/each}
      {/if}
    </div>

    <!-- Drawer Footer (Checkout via WhatsApp) -->
    {#if $cart.length > 0}
      <div class="drawer-footer">
        <div class="summary-breakdown">
          <div class="summary-line">
            <span>Total Item:</span>
            <b>{$cartCount} pieces ({sellerGroups.length} ateliers)</b>
          </div>
          <div class="summary-line grand-total">
            <span>Estimated total:</span>
            <b class="gold-price">{rp($cartTotal)}</b>
          </div>
        </div>

        {#if sellerGroups.length > 1}
          <p class="wa-checkout-note">Local basket preview only. No seller is contacted and no order is submitted.</p>
        {:else}
          <p class="wa-checkout-note">Local basket preview only. No seller is contacted and no order is submitted.</p>
        {/if}

        <div class="footer-actions">
          <button 
            type="button" 
            class="checkout-wa-btn" 
            on:click={handleCheckoutAll}
          >
            <svg class="wa-btn-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            <span>
              {sellerGroups.length > 1 
                ? `Preview basket for ${sellerGroups[0]?.seller_toko}` 
                : 'Preview order (no message sent)'}
            </span>
          </button>

          <div class="footer-sub-links">
            <button type="button" class="link-clear-cart" on:click={cart.clearCart}>
              Clear basket
            </button>
            <button type="button" class="link-continue-shop" on:click={closeCart}>
              Continue browsing &rarr;
            </button>
          </div>
        </div>
      </div>
    {/if}
  </div>
{/if}
{/if}

<style>
  /* ========================================================
     FLOATING CART BUTTON DI POJOK BAWAH
     ======================================================== */
  .floating-cart-container {
    position: fixed;
    bottom: 28px;
    right: 28px;
    z-index: 95;
    animation: cartPopIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .floating-cart-btn {
    position: relative;
    width: 62px;
    height: 62px;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #cf3336 0%, #8f1712 70%, #5a0c09 100%);
    border: 2px solid var(--gold);
    color: #ffffff;
    display: grid;
    place-items: center;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45), 0 2px 6px rgba(0, 0, 0, 0.25);
    transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease;
  }

  .floating-cart-btn:hover {
    transform: translateY(-3px) scale(1.06);
    box-shadow: 0 14px 32px rgba(0, 0, 0, 0.55), 0 0 0 4px rgba(212, 175, 55, 0.25);
  }

  .floating-cart-btn.bouncing {
    animation: cartBouncePulse 0.45s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .cart-svg-icon {
    flex-shrink: 0;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

  .mini-seal-badge {
    position: absolute;
    bottom: 8px;
    right: 12px;
    font: 400 10px "Ma Shan Zheng", serif;
    color: var(--gold);
    line-height: 1;
    opacity: 0.9;
  }

  .cart-counter-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: var(--gold);
    color: #0c0605;
    font: 700 12px/1 Jost, system-ui, sans-serif;
    min-width: 24px;
    height: 24px;
    border-radius: 12px;
    padding: 0 5px;
    display: grid;
    place-items: center;
    border: 2px solid #0c0605;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  }

  /* Tooltip Pill on Hover */
  .floating-tooltip-pill {
    position: absolute;
    right: calc(100% + 14px);
    top: 50%;
    transform: translateY(-50%) translateX(6px);
    background: var(--bg-card);
    border: 1px solid var(--card-stat-border);
    color: var(--white);
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease, transform 0.2s ease;
  }

  .floating-cart-btn:hover .floating-tooltip-pill {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }

  /* ========================================================
     CART DRAWER MODAL & BACKDROP
     ======================================================== */
  .cart-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    backdrop-filter: blur(5px);
    z-index: 100;
    animation: fadeIn 0.25s ease forwards;
  }

  .cart-drawer-panel {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    width: 440px;
    max-width: 100vw;
    background: var(--bg-card);
    border-left: 1px solid var(--card-stat-border);
    box-shadow: -10px 0 35px rgba(0, 0, 0, 0.5);
    z-index: 101;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .drawer-bg-watermark {
    position: absolute;
    right: 20px;
    bottom: 120px;
    font: 400 120px/1 "Ma Shan Zheng", serif;
    color: var(--gold);
    opacity: 0.035;
    pointer-events: none;
    user-select: none;
  }

  /* HEADER */
  .drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 24px;
    border-bottom: 1px solid var(--line);
    background: var(--bg-secondary);
    flex-shrink: 0;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .seal-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--red);
    color: #ffffff;
    display: grid;
    place-items: center;
    font: 400 20px "Ma Shan Zheng", serif;
    line-height: 1;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.28);
  }

  .title-wrap {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }

  .drawer-title {
    font: 600 22px "Cormorant Garamond", Georgia, serif;
    margin: 0;
    color: var(--white);
  }

  .drawer-subtitle {
    font-size: 12.5px;
    color: var(--muted);
  }

  .close-drawer-btn {
    background: transparent;
    border: 0;
    color: var(--muted);
    font-size: 28px;
    line-height: 1;
    cursor: pointer;
    padding: 4px;
    border-radius: 8px;
    transition: color 0.2s ease;
  }

  .close-drawer-btn:hover {
    color: var(--white);
  }

  /* BODY */
  .drawer-body {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
  }

  /* EMPTY STATE */
  .empty-cart-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    min-height: 280px;
    padding: 30px 16px;
  }

  .empty-seal {
    font: 400 64px "Ma Shan Zheng", serif;
    color: var(--muted);
    opacity: 0.35;
    margin-bottom: 12px;
  }

  .empty-title {
    font: 600 22px "Cormorant Garamond", serif;
    color: var(--white);
    margin: 0 0 6px;
  }

  .empty-desc {
    font-size: 13.5px;
    color: var(--muted);
    max-width: 280px;
    line-height: 1.5;
    margin: 0 0 20px;
  }

  .btn-browse {
    background: var(--pill-bg);
    border: 1px solid var(--brass);
    color: var(--white);
    padding: 8px 20px;
    border-radius: 10px;
    font-size: 13.5px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-browse:hover {
    background: var(--brass);
    color: #ffffff;
  }

  /* ATELIER CART GROUPS */
  .atelier-cart-group {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--card-stat-border);
    border-radius: 16px;
    padding: 16px;
    margin-bottom: 20px;
  }

  .atelier-group-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 12px;
    margin-bottom: 14px;
    border-bottom: 1px dashed var(--line);
  }

  .atelier-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .atelier-seal-mini {
    width: 22px;
    height: 22px;
    background: var(--red);
    color: #ffffff;
    border-radius: 4px;
    display: grid;
    place-items: center;
    font: 400 12px 'Ma Shan Zheng', serif;
    line-height: 1;
  }

  .atelier-title-text {
    font-weight: 600;
    font-size: 14px;
    color: var(--white);
    letter-spacing: 0.02em;
  }

  .atelier-count-badge {
    font-size: 12px;
    color: var(--gold);
    background: rgba(212, 175, 55, 0.12);
    padding: 3px 8px;
    border-radius: 20px;
    font-weight: 500;
  }

  .checkout-atelier-btn {
    width: 100%;
    margin-top: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: rgba(37, 211, 102, 0.12);
    border: 1px solid rgba(37, 211, 102, 0.4);
    color: #25d366;
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .checkout-atelier-btn:hover {
    background: #25d366;
    color: #ffffff;
  }

  /* CART ITEMS LIST */
  .cart-items-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .cart-item-card {
    display: flex;
    gap: 14px;
    padding: 14px;
    border-radius: 14px;
    background: var(--bg-secondary);
    border: 1px solid var(--card-stat-border);
    transition: border-color 0.2s ease;
  }

  .cart-item-card:hover {
    border-color: rgba(185, 152, 92, 0.4);
  }

  .item-thumb-wrap {
    width: 60px;
    height: 72px;
    flex-shrink: 0;
    border-radius: 8px;
    overflow: hidden;
    background: #000000;
  }

  .item-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .item-details {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .item-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
  }

  .item-name {
    font: 600 17px "Cormorant Garamond", Georgia, serif;
    color: var(--white);
    margin: 0;
    line-height: 1.2;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .item-del-btn {
    background: transparent;
    border: 0;
    color: var(--muted);
    cursor: pointer;
    padding: 2px;
    border-radius: 4px;
    line-height: 1;
    transition: color 0.2s;
  }

  .item-del-btn:hover {
    color: #e0735f;
  }

  .item-seller {
    font-size: 11px;
    color: var(--brass);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-top: 2px;
  }

  .item-price-unit {
    font-size: 12.5px;
    color: var(--muted);
    margin-top: 2px;
  }

  .item-bottom-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
  }

  /* Stepper */
  .stepper-wrap {
    display: inline-flex;
    align-items: center;
    background: var(--pill-bg);
    border: 1px solid var(--card-stat-border);
    border-radius: 8px;
    overflow: hidden;
  }

  .step-btn {
    width: 26px;
    height: 26px;
    background: transparent;
    border: 0;
    color: var(--white);
    cursor: pointer;
    font-size: 14px;
    display: grid;
    place-items: center;
    transition: background 0.2s;
  }

  .step-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.12);
  }

  .step-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .qty-display {
    min-width: 22px;
    text-align: center;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--white);
  }

  .item-subtotal {
    font: 600 17px "Cormorant Garamond", Georgia, serif;
    color: var(--gold);
  }

  /* FOOTER */
  .drawer-footer {
    padding: 20px 24px;
    border-top: 1px solid var(--line);
    background: var(--bg-secondary);
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .summary-breakdown {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .summary-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13.5px;
    color: var(--muted);
  }

  .summary-line.grand-total {
    font-size: 15px;
    padding-top: 6px;
    border-top: 1px dashed var(--line);
    color: var(--white);
  }

  .gold-price {
    font: 600 24px "Cormorant Garamond", Georgia, serif;
    color: var(--gold);
  }

  .wa-checkout-note {
    font-size: 11.5px;
    color: var(--muted);
    line-height: 1.45;
    margin: 0;
  }

  .checkout-wa-btn {
    width: 100%;
    background: var(--red);
    border: 1px solid var(--red);
    color: #ffffff;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    padding: 12px 18px;
    border-radius: 12px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
    transition: all 0.2s ease;
  }

  .checkout-wa-btn:hover {
    background: var(--red-hover);
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
  }

  .wa-btn-icon {
    flex-shrink: 0;
  }

  .footer-sub-links {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 2px;
  }

  .link-clear-cart {
    background: transparent;
    border: 0;
    color: var(--muted);
    font-size: 12px;
    cursor: pointer;
    text-decoration: underline;
    transition: color 0.2s;
  }

  .link-clear-cart:hover {
    color: #e0735f;
  }

  .link-continue-shop {
    background: transparent;
    border: 0;
    color: var(--gold);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .link-continue-shop:hover {
    opacity: 0.8;
  }

  /* ANIMATIONS */
  @keyframes cartPopIn {
    0% {
      transform: scale(0.6) translateY(20px);
      opacity: 0;
    }
    70% {
      transform: scale(1.08) translateY(-2px);
      opacity: 1;
    }
    100% {
      transform: scale(1) translateY(0);
      opacity: 1;
    }
  }

  @keyframes cartBouncePulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.22); }
  }

  @keyframes slideInRight {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* RESPONSIVE */
  @media (max-width: 600px) {
    .floating-cart-container {
      bottom: 20px;
      right: 18px;
    }

    .floating-cart-btn {
      width: 54px;
      height: 54px;
    }

    .floating-tooltip-pill {
      display: none;
    }

    .cart-drawer-panel {
      width: 100vw;
    }
  }
</style>
