<script>
  import { items, sellers, q, selectedCat, selectedSeller, sortOrder, cart } from '../stores/store.js';
  import { img, ph, rp } from '../data/seed.js';

  // Derived category list
  $: categories = Array.from(new Set($items.map((p) => p.kategori).filter(Boolean))).sort();

  // If selected category is no longer in data, revert to 'all'
  $: if ($selectedCat !== 'all' && !categories.includes($selectedCat)) {
    selectedCat.set('all');
  }

  // Seller lookup map
  $: sellerMap = $sellers.reduce((map, s) => {
    map[s.id] = s;
    return map;
  }, {});

  // Filtered & sorted products
  $: filteredItems = (() => {
    const query = $q.trim().toLowerCase();
    const list = $items.filter((p) => {
      const matchCat = $selectedCat === 'all' || p.kategori === $selectedCat;
      const matchSeller = $selectedSeller === 'all' || p.seller_id === $selectedSeller;
      const matchQuery =
        !query ||
        (p.nama + ' ' + (p.deskripsi || '')).toLowerCase().indexOf(query) > -1;
      return matchCat && matchSeller && matchQuery;
    });

    const by = {
      feat: (x, y) => (y.unggulan - x.unggulan) || x.nama.localeCompare(y.nama),
      pasc: (x, y) => x.harga - y.harga,
      pdesc: (x, y) => y.harga - x.harga,
      name: (x, y) => x.nama.localeCompare(y.nama),
      stock: (x, y) => y.stok - x.stok
    };

    return list.sort(by[$sortOrder] || by.feat);
  })();

  function handleAddToCart(p, seller) {
    cart.addItem({
      ...p,
      seller_toko: seller?.nama_toko || 'Zhao Atelier Suzhou',
      seller_wa: seller?.no_wa || '6285738211550'
    });
  }

  function handleImgError(e, p) {
    const t = e.currentTarget;
    if (t && !t.dataset.f) {
      t.dataset.f = '1';
      t.src = ph(p);
    }
  }
</script>

<section id="v-cat">
  <div class="head" id="koleksi">
    <h2>Collection</h2>
    <input 
      id="q" 
      type="search" 
      placeholder="Search pieces" 
      aria-label="Search pieces" 
      bind:value={$q}
    />
    <select id="sort" aria-label="Sort" bind:value={$sortOrder}>
      <option value="feat">Featured first</option>
      <option value="pasc">Price: low to high</option>
      <option value="pdesc">Price: high to low</option>
      <option value="name">Name A–Z</option>
      <option value="stock">Most stock</option>
    </select>
  </div>

  <div class="chips" id="chips">
    <button 
      data-c="all" 
      aria-pressed={$selectedCat === 'all'} 
      on:click={() => selectedCat.set('all')}
    >
      All
    </button>
    {#each categories as k}
      <button 
        data-c={k} 
        aria-pressed={$selectedCat === k} 
        on:click={() => selectedCat.set(k)}
      >
        {k}
      </button>
    {/each}

    {#if $sellers.length > 1}
      <div class="seller-filter-wrap">
        <select class="seller-filter" bind:value={$selectedSeller} aria-label="Filter by artisan">
          <option value="all">All artisans ({$sellers.length})</option>
          {#each $sellers as s}
            <option value={s.id}>{s.nama_toko} ({s.nama})</option>
          {/each}
        </select>
      </div>
    {/if}
  </div>

  <div class="grid" id="grid" aria-live="polite">
    {#if filteredItems.length === 0}
      <div class="empty">
        No matching pieces. Try another search or category.
      </div>
    {:else}
      {#each filteredItems as p (p.id)}
        {@const out = p.stok < 1}
        {@const seller = sellerMap[p.seller_id]}
        <article>
          <div class="ph">
            {#if p.unggulan}
              <span class="tag" title="Featured">F</span>
            {/if}
            <img 
              data-c=".07" 
              data-id={p.id} 
              src={img(p)} 
              alt={p.nama} 
              loading="lazy"
              on:error={(e) => handleImgError(e, p)}
            />
          </div>
          <span class="side">{p.kategori}</span>
          <h3>{p.nama}</h3>
          {#if seller}
            <div class="seller-badge">
              <span>{seller.nama_toko}</span>
            </div>
          {/if}
          <p class="d">{p.deskripsi}</p>
          <div class="product-price-stock-row">
            <span class="pr">{rp(p.harga)}</span>
            <span class="st" class:out={out}>
              {out ? 'Sold out' : 'Stock ' + p.stok}
            </span>
          </div>

          <div class="product-actions-bar">
            {#if out}
              <button class="btn-cart-primary disabled" disabled>
                <span>Sold out</span>
              </button>
            {:else}
              <button 
                type="button" 
                class="btn-cart-primary" 
                on:click={() => handleAddToCart(p, seller)}
                title="Add {p.nama} to the basket"
              >
                <svg class="cart-btn-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
                <span>Add to basket</span>
              </button>
            {/if}
          </div>
        </article>
      {/each}
    {/if}
  </div>
</section>

<style>
  .product-price-stock-row {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-top: 10px;
  }

  .product-actions-bar {
    margin-top: 14px;
    width: 100%;
  }

  .btn-cart-primary {
    width: 100%;
    background: var(--red);
    border: 1px solid var(--red);
    color: #ffffff;
    padding: 8px 14px;
    border-radius: 8px;
    font-family: inherit;
    font-size: 13.5px;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
  }

  .btn-cart-primary:hover:not(:disabled) {
    background: var(--red-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.28);
  }

  .btn-cart-primary.disabled,
  .btn-cart-primary:disabled {
    background: var(--pill-bg);
    border-color: var(--line);
    color: var(--muted);
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
  }

  .cart-btn-icon {
    flex-shrink: 0;
  }

  .seller-badge {
    font-size: 11px;
    letter-spacing: .08em;
    color: var(--brass);
    text-transform: uppercase;
    margin-bottom: 6px;
    opacity: .85;
  }

  .seller-filter-wrap {
    margin-left: auto;
    display: flex;
    align-items: center;
  }

  .seller-filter {
    background: none;
    border: 0;
    border-bottom: 1px solid var(--line);
    color: var(--muted);
    font: inherit;
    font-size: 13px;
    padding: 2px 4px;
    border-radius: 0;
    cursor: pointer;
  }

  .seller-filter option {
    background: var(--bg-card);
    color: var(--white);
  }
</style>
