<script>
import { authUser, authModalOpen } from '../stores/store.js';
export let isModal = false;
function enter(role) { authUser.login({name:'Demo visitor', role, seller_id:'s1', email:'', no_wa:''}); authModalOpen.set(false); if(role !== 'pembeli') window.location.href='/dashboard'; else window.location.href='/'; }
</script>
<section class="demo-login"><p class="eyebrow">PRIVATE ENGLISH PREVIEW</p><h1>Explore the atelier</h1><p>Choose a demo view. This is not account authentication.</p><p>Changes stay in this browser. No email, payments or messages are sent.</p><div class="roles"><button on:click={()=>enter('pembeli')}>Browse as a buyer</button><button on:click={()=>enter('seller')}>Preview seller workspace</button><button on:click={()=>enter('admin')}>Preview admin workspace</button></div><a href="/">Back to the collection</a></section>
<style>.demo-login{max-width:600px;margin:8vh auto;padding:32px;background:#1b100e;color:#f6efe2;border:1px solid #b9985c;text-align:center}.eyebrow{font-size:11px;letter-spacing:3px;color:#c9ab74}h1{font:42px Georgia,serif}p{line-height:1.7}.roles{display:grid;gap:12px;margin:28px 0}button{padding:16px;background:#b9985c;color:#190d0b;border:0;cursor:pointer;font:inherit}a{color:#d9bb84}</style>
