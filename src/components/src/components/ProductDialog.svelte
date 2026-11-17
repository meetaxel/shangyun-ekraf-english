<script>
  import { onMount } from 'svelte';
  import { items, sellers, currentRole, activeSellerId, dialogState, showToast } from '../stores/store.js';
  import { uploadImageToCloudinary } from '../lib/cloudinary.js';

  let dialogEl;
  let nama = '';
  let kategori = '';
  let harga = '';
  let stok = '';
  let deskripsi = '';
  let imageUrl = '';
  let sellerId = 's1';
  let unggulan = false;
  let errMsg = '';
  let isUploading = false;
  let uploadStatusText = '';
  let fileInputEl;

  $: categories = Array.from(new Set($items.map((p) => p.kategori).filter(Boolean)));
  $: isNewCategory = Boolean(kategori && kategori.trim() && !categories.includes(kategori.trim()));

  $: if ($dialogState.open) {
    if ($dialogState.editId) {
      const p = $items.find((x) => x.id === $dialogState.editId) || {};
      nama = p.nama || '';
      kategori = p.kategori || '';
      harga = p.harga !== undefined ? p.harga : '';
      stok = p.stok !== undefined ? p.stok : '';
      deskripsi = p.deskripsi || '';
      imageUrl = p.imageUrl || p.image_url || '';
      sellerId = p.seller_id || $activeSellerId || 's1';
      unggulan = Boolean(p.unggulan);
    } else {
      nama = '';
      kategori = '';
      harga = '';
      stok = '';
      deskripsi = '';
      imageUrl = '';
      sellerId = $currentRole === 'seller' ? $activeSellerId : ($sellers[0]?.id || 's1');
      unggulan = false;
    }
    errMsg = '';
    isUploading = false;
    uploadStatusText = '';
    if (dialogEl && !dialogEl.open) {
      dialogEl.showModal();
    }
  } else {
    if (dialogEl && dialogEl.open) {
      dialogEl.close();
    }
  }

  function closeDialog() {
    dialogState.set({ open: false, editId: null });
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      errMsg = 'Choose an image file (PNG, JPG, WebP or GIF).';
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      errMsg = 'Ukuran gambar maksimal 8 MB.';
      return;
    }

    isUploading = true;
    uploadStatusText = 'Memproses & mengunggah foto pieces...';
    errMsg = '';

    try {
      const result = await uploadImageToCloudinary(file);
      imageUrl = result.url;
      if (result.isCloudinary) {
        uploadStatusText = 'Foto pieces tersimpan di cloud CDN.';
        showToast('Image added to the local preview.');
      } else {
        uploadStatusText = 'Foto tersimpan di penyimpanan lokal.';
      }
    } catch (err) {
      errMsg = 'Gagal mengunggah foto: ' + (err.message || 'Error');
    } finally {
      isUploading = false;
    }
  }

  function removePhoto() {
    imageUrl = '';
    uploadStatusText = '';
    if (fileInputEl) fileInputEl.value = '';
  }

  function handleSubmit() {
    const trimmedNama = (nama || '').trim();
    const trimmedKat = (kategori || '').trim();
    const h = harga;
    const s = stok;
    let er = '';

    if (!trimmedNama) {
      er = 'Enter a piece name.';
    } else if (!trimmedKat) {
      er = 'Enter a category.';
    } else if (h === '' || isNaN(+h) || +h < 0) {
      er = 'Enter a non-negative price.';
    } else if (s === '' || !/^\d+$/.test(String(s))) {
      er = 'Stock must be a non-negative whole number.';
    }

    if (er) {
      errMsg = er;
      return;
    }

    const payload = {
      nama: trimmedNama,
      kategori: trimmedKat,
      harga: +h,
      stok: +s,
      deskripsi: (deskripsi || '').trim(),
      imageUrl: (imageUrl || '').trim(),
      image_url: (imageUrl || '').trim(),
      seller_id: sellerId,
      unggulan: Boolean(unggulan)
    };

    if ($dialogState.editId) {
      items.edit($dialogState.editId, payload);
      showToast('Piece updated locally.');
    } else {
      items.add(payload);
      showToast('Piece added locally.');
    }

    closeDialog();
  }
</script>

<dialog id="dlg" bind:this={dialogEl} on:close={closeDialog}>
  <h2 id="dtitle">{$dialogState.editId ? 'Edit piece' : 'Add piece'}</h2>
  <form id="f" method="dialog" novalidate on:submit|preventDefault={handleSubmit}>
    {#if $currentRole === 'admin' && $sellers.length > 0}
      <label>
        Atelier owner <span style="color: var(--red)">*</span>
        <select bind:value={sellerId} required>
          {#each $sellers as s}
            <option value={s.id}>{s.nama_toko} ({s.nama})</option>
          {/each}
        </select>
      </label>
    {/if}

    <label>
      Piece name <span style="color: var(--red)">*</span>
      <input id="f-nama" maxlength="80" bind:value={nama} required />
    </label>

    <div class="field-block">
      <div class="field-header-row">
        <label for="f-kat">
          Category <span style="color: var(--red)">*</span>
        </label>
        <span class="field-sub-hint">Choose a category or enter a new one</span>
      </div>

      {#if categories.length > 0}
        <div class="quick-cat-chips" aria-label="Craft categories">
          {#each categories as k}
            <button 
              type="button" 
              class="quick-cat-pill" 
              class:selected={kategori === k}
              on:click={() => (kategori = k)}
            >
              {k}
            </button>
          {/each}
        </div>
      {/if}

      <input 
        id="f-kat" 
        list="kats" 
        maxlength="30" 
        placeholder="Enter a category or choose from the list..." 
        bind:value={kategori} 
        required 
      />
      <datalist id="kats">
        {#each categories as k}
          <option value={k}></option>
        {/each}
      </datalist>

      {#if isNewCategory}
        <div class="new-category-hint">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>New category <b>"{kategori.trim()}"</b> will appear in the local catalogue filter.</span>
        </div>
      {/if}
    </div>

    <div class="row">
      <label>
        Price (Rp) <span style="color: var(--red)">*</span>
        <input id="f-harga" type="number" min="0" step="1000" bind:value={harga} required />
      </label>
      <label>
        Stock <span style="color: var(--red)">*</span>
        <input id="f-stok" type="number" min="0" step="1" bind:value={stok} required />
      </label>
    </div>

    <label>
      Description
      <textarea id="f-desc" rows="2" maxlength="300" bind:value={deskripsi}></textarea>
    </label>

    <label>
      Image preview (external upload disabled)
      <small>File uploads are disabled in this private preview.</small>
      <input id="f-img" placeholder="Or an image URL (https://...)" bind:value={imageUrl} />
    </label>

    {#if isUploading}
      <div class="upload-status-row uploading">
        <svg class="spin-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="2" x2="12" y2="6"></line>
          <line x1="12" y1="18" x2="12" y2="22"></line>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
          <line x1="2" y1="12" x2="6" y2="12"></line>
          <line x1="18" y1="12" x2="22" y2="12"></line>
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
        </svg>
        <span>{uploadStatusText}</span>
      </div>
    {:else if uploadStatusText}
      <div class="upload-status-row success">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span>{uploadStatusText}</span>
      </div>
    {/if}

    {#if imageUrl}
      <div style="display: flex; align-items: center; gap: 12px; margin-top: 8px;">
        <img src={imageUrl} alt="Preview" style="width: 50px; height: 50px; object-fit: cover; outline: 1px solid var(--brass);" />
        <button type="button" class="btn ghost sm" on:click={removePhoto}>Remove image</button>
      </div>
    {/if}

    <label class="chk" style="margin-top: 14px;">
      <input id="f-feat" type="checkbox" bind:checked={unggulan} />
      Mark as featured
    </label>

    {#if errMsg}
      <div class="err" id="err" role="alert">{errMsg}</div>
    {/if}

    <div class="acts">
      <button type="button" class="btn ghost" id="cancel" on:click={closeDialog}>
        Cancel
      </button>
      <button type="submit" class="btn" disabled={isUploading}>
        {isUploading ? 'Uploading...' : 'Save'}
      </button>
    </div>
  </form>
</dialog>

<style>
  .field-block {
    margin-top: 14px;
  }

  .field-header-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 6px;
  }

  .field-header-row label {
    margin-top: 0;
  }

  .field-sub-hint {
    font-size: 11.5px;
    color: var(--muted);
  }

  .quick-cat-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
  }

  .quick-cat-pill {
    background: var(--bg-secondary);
    border: 1px solid var(--line);
    color: var(--white);
    font-size: 11.5px;
    padding: 3px 9px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .quick-cat-pill:hover {
    border-color: var(--gold);
    color: var(--gold);
  }

  .quick-cat-pill.selected {
    background: rgba(224, 181, 98, 0.15);
    border-color: var(--gold);
    color: var(--gold);
    font-weight: 500;
  }

  .new-category-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--gold);
    background: rgba(224, 181, 98, 0.08);
    border: 1px solid rgba(224, 181, 98, 0.25);
    padding: 5px 9px;
    border-radius: 4px;
    margin-top: 6px;
  }

  .upload-status-row {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 12px;
    margin-top: 6px;
  }

  .upload-status-row.uploading {
    color: var(--brass);
  }

  .upload-status-row.success {
    color: #4ade80;
  }

  .spin-icon {
    animation: spin 1.2s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
