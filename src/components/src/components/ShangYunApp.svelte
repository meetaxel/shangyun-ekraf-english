<script>
  import { onMount } from 'svelte';
  import { activeTab, syncWithServer, authUser } from '../stores/store.js';
  import TopNav from './TopNav.svelte';
  import Hero from './Hero.svelte';
  import Story from './Story.svelte';
  import Catalog from './Catalog.svelte';
  import Dashboard from './Dashboard.svelte';
  import ProductDialog from './ProductDialog.svelte';
  import SellerDialog from './SellerDialog.svelte';
  import AuthModal from './AuthModal.svelte';
  import Toast from './Toast.svelte';
  import CartDrawer from './CartDrawer.svelte';
  import ParallaxController from './ParallaxController.svelte';

  onMount(() => {
    if (typeof syncWithServer === 'function') {
      syncWithServer();
    }
  });
</script>

{#if $activeTab === 'cat'}
  <TopNav />

  <div id="home">
    <Hero />
    <Story />
    <Catalog />
  </div>

  <footer>
    Shang Yun (Shang Yun) — Handcrafted gifts for Lunar New Year.
  </footer>
{:else}
  <Dashboard />
{/if}

<ProductDialog />
<SellerDialog />
<AuthModal />
<Toast />
{#if !($authUser && ($authUser.role === 'seller' || $authUser.role === 'admin'))}
  <CartDrawer />
{/if}
<ParallaxController />
