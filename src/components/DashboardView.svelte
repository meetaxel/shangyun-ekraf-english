<script>
  import { onMount } from 'svelte';
  import { activeTab, currentRole, authUser } from '../stores/store.js';
  import Dashboard from './Dashboard.svelte';
  import ProductDialog from './ProductDialog.svelte';
  import SellerDialog from './SellerDialog.svelte';
  import AuthModal from './AuthModal.svelte';
  import Toast from './Toast.svelte';
  import ParallaxController from './ParallaxController.svelte';

  onMount(() => {
    activeTab.set('dash');
    // Guard: Khusus Admin dan Seller yang berhak mengakses dashboard
    if (!$authUser || ($authUser.role !== 'admin' && $authUser.role !== 'seller')) {
      window.location.href = '/';
      return;
    }
  });

  // Reaktif: Begitu user logout atau bukan admin/seller, langsung redirect ke landing page
  $: if (typeof window !== 'undefined' && (!$authUser || ($authUser.role !== 'admin' && $authUser.role !== 'seller'))) {
    window.location.href = '/';
  }
</script>

{#if $authUser && ($authUser.role === 'admin' || $authUser.role === 'seller')}
  <Dashboard />
{/if}

<ProductDialog />
<SellerDialog />
<AuthModal />
<Toast />
<ParallaxController />
