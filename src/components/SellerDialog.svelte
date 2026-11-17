<script>
  import { sellers, sellerModalOpen, showToast } from '../stores/store.js';
  import { normWa } from '../data/seed.js';

  let dialogEl;
  let nama = '';
  let namaToko = '';
  let noWa = '';
  let email = '';
  let spesialisasi = 'Silk Embroidery & Fans';
  let errMsg = '';

  $: if ($sellerModalOpen) {
    nama = '';
    namaToko = '';
    noWa = '';
    email = '';
    spesialisasi = 'Handicrafts';
    errMsg = '';
    if (dialogEl && !dialogEl.open) {
      dialogEl.showModal();
    }
  } else {
    if (dialogEl && dialogEl.open) {
      dialogEl.close();
    }
  }

  function closeModal() {
    sellerModalOpen.set(false);
  }

  function handleSubmit() {
    const trimmedNama = (nama || '').trim();
    const trimmedToko = (namaToko || '').trim();
    const normalizedWa = normWa(noWa);

    if (!trimmedNama) {
      errMsg = 'Enter an artisan name.';
      return;
    }
    if (!trimmedToko) {
      errMsg = 'Enter an atelier name.';
      return;
    }
    if (!normalizedWa) {
      errMsg = 'Enter a valid Indonesian contact number for the local demo.';
      return;
    }

    sellers.add({
      nama: trimmedNama,
      nama_toko: trimmedToko,
      no_wa: normalizedWa,
      email: (email || '').trim(),
      spesialisasi: (spesialisasi || '').trim()
    });

    showToast(`Atelier "${trimmedToko}" added locally.`);
    closeModal();
  }
</script>

<dialog id="seller-dlg" bind:this={dialogEl} on:close={closeModal}>
  <h2>Add a demo artisan</h2>
  <p style="color: var(--muted); font-size: 13px; margin: 0 0 16px;">
    Add a sample artisan to this browser-local partner directory.
  </p>

  <form method="dialog" novalidate on:submit|preventDefault={handleSubmit}>
    <label>
      Artisan name <span style="color: var(--red)">*</span>
      <input type="text" maxlength="80" placeholder="Example: Master Tan Wei" bind:value={nama} required />
    </label>

    <label>
      Atelier name <span style="color: var(--red)">*</span>
      <input type="text" maxlength="80" placeholder="Example: Tan Imperial Porcelain Studio" bind:value={namaToko} required />
    </label>

    <div class="row">
      <label>
        Contact number <span style="color: var(--red)">*</span>
        <input 
          type="tel" 
          inputmode="numeric"
          pattern="[0-9]*"
          placeholder="081234567890" 
          bind:value={noWa} 
          on:input={(e) => { noWa = e.target.value.replace(/\D/g, ''); }}
          on:keydown={(e) => {
            if (['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) || e.ctrlKey || e.metaKey) return;
            if (!/^\d$/.test(e.key)) e.preventDefault();
          }}
          required 
        />
      </label>
      <label>
        Specialty
        <input type="text" placeholder="Example: Ceramics & Carving" bind:value={spesialisasi} />
      </label>
    </div>

    <label>
      Contact email
      <input type="email" placeholder="tan.wei@shangyun.id" bind:value={email} />
    </label>

    {#if errMsg}
      <div class="err" role="alert">{errMsg}</div>
    {/if}

    <div class="acts">
      <button type="button" class="btn ghost" on:click={closeModal}>Cancel</button>
      <button type="submit" class="btn">Add artisan</button>
    </div>
  </form>
</dialog>

<style>
  dialog#seller-dlg {
    background: var(--ink2);
    color: var(--white);
    border: 1px solid var(--brass);
    padding: 28px;
    width: min(500px, 92vw);
    border-radius: 0;
  }
</style>
