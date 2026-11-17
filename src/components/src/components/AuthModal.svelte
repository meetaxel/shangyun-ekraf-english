<script>
  import { onDestroy } from 'svelte';
  import { authModalOpen, authModalTab } from '../stores/store.js';
  import AuthCard from './AuthCard.svelte';

  function handleComplete() {
    setTimeout(() => {
      authModalOpen.set(false);
    }, 1200);
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      authModalOpen.set(false);
    }
  }

  // Lock body scroll when modal is open so wheel and touch scroll the modal cleanly
  $: if (typeof document !== 'undefined') {
    if ($authModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  onDestroy(() => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  });
</script>

{#if $authModalOpen}
  <div 
    class="auth-modal-overlay" 
    data-lenis-prevent
    on:click={handleBackdropClick}
    role="dialog"
    aria-modal="true"
  >
    <AuthCard isModal={true} initialMode={$authModalTab} onComplete={handleComplete} />
  </div>
{/if}

<style>
  .auth-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(12, 6, 5, 0.88);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 16px;
    box-sizing: border-box;
    animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  /* Custom luxury scrollbar for modal overlay */
  .auth-modal-overlay::-webkit-scrollbar {
    width: 8px;
  }
  .auth-modal-overlay::-webkit-scrollbar-track {
    background: rgba(12, 6, 5, 0.8);
  }
  .auth-modal-overlay::-webkit-scrollbar-thumb {
    background: rgba(224, 181, 98, 0.35);
    border-radius: 4px;
  }
  .auth-modal-overlay::-webkit-scrollbar-thumb:hover {
    background: var(--gold, #e0b562);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
