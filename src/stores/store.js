const disabledFetch = async () => new Response('[]', {status: 200});
import { writable, derived } from 'svelte/store';
import { db, DEFAULT_SELLERS, INITIAL_PRODUCTS, USER_STORAGE_KEY } from '../lib/db.js';
import { normWa } from '../data/seed.js';

export const AUTH_USER_STORAGE_KEY = 'shangyun.auth.user.v1';
export const THEME_STORAGE_KEY = 'shangyun.theme.v1';

// --- THEME STORE (Mode Gelap: Merah, Hitam, Emas | Mode Terang: Coklat, Merah, Cream) ---
function createThemeStore() {
  let initial = 'dark';
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') {
        initial = saved;
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        initial = 'light';
      }
    } catch (e) {}
  }

  const { subscribe, set } = writable(initial);

  function applyToDom(val) {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', val);
      document.documentElement.style.colorScheme = val;
    }
  }

  if (typeof window !== 'undefined') {
    applyToDom(initial);
  }

  return {
    subscribe,
    set: (val) => {
      set(val);
      applyToDom(val);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(THEME_STORAGE_KEY, val);
        } catch (e) {}
      }
    },
    toggle: () => {
      let current;
      subscribe((v) => (current = v))();
      const next = current === 'light' ? 'dark' : 'light';
      set(next);
      applyToDom(next);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch (e) {}
      }
    }
  };
}

export const theme = createThemeStore();

// --- CURRENT USER / AUTH STORE ---
function createAuthStore() {
  let initial = null;
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(AUTH_USER_STORAGE_KEY);
      if (saved) {
        initial = JSON.parse(saved);
      }
    } catch (e) {}
  }

  const { subscribe, set } = writable(initial);

  return {
    subscribe,
    login: (user) => {
      set(user);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
        } catch (e) {}
      }
    },
    logout: () => {
      set(null);
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(AUTH_USER_STORAGE_KEY);
        } catch (e) {}
      }
    }
  };
}

export const authUser = createAuthStore();
export const authModalOpen = writable(false);
export const authModalTab = writable('in'); // 'in' (Sign In) | 'up' (Sign Up)

// --- CURRENT ACTIVE ROLE STORE ---
// 'pembeli' | 'seller' | 'admin'
function createRoleStore() {
  let initial = 'pembeli';
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      if (saved && ['pembeli', 'seller', 'admin'].includes(saved)) {
        initial = saved;
      }
    } catch (e) {}
  }

  const { subscribe, set } = writable(initial);

  return {
    subscribe,
    set: (role) => {
      set(role);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(USER_STORAGE_KEY, role);
        } catch (e) {}
      }
    }
  };
}

export const currentRole = createRoleStore();
export const activeSellerId = writable('s1'); // ID seller yang sedang aktif jika role = 'seller'

// Sync role when authUser changes
authUser.subscribe((user) => {
  if (user && user.role) {
    currentRole.set(user.role);
    if (user.role === 'seller' && user.seller_id) {
      activeSellerId.set(user.seller_id);
    }
  }
});

// --- SELLERS STORE ---
function createSellersStore() {
  const initial = typeof window !== 'undefined' ? db.getSellers() : DEFAULT_SELLERS;
  const { subscribe, set, update } = writable(initial);

  return {
    subscribe,
    set,
    update,
    add: (sellerData) => {
      const newSeller = db.addSeller(sellerData);
      update((list) => [...list, newSeller]);

      // Sync to Neon via backend API
      if (typeof window !== 'undefined') {
        disabledFetch('/api/sellers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sellerData)
        }).catch((err) => console.warn('Could not sync seller to Neon:', err));
      }
      return newSeller;
    },
    updateWa: (sellerId, newWa) => {
      const normalized = normWa(newWa);
      if (!normalized) return false;
      update((list) => {
        const next = list.map((s) => (s.id === sellerId ? { ...s, no_wa: normalized } : s));
        db.saveSellers(next);
        return next;
      });

      // Sync to Neon via backend API
      if (typeof window !== 'undefined') {
        disabledFetch('/api/sellers', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: sellerId, no_wa: normalized })
        }).catch((err) => console.warn('Could not sync WA update to Neon:', err));
      }
      return true;
    },
    reset: () => {
      db.saveSellers(DEFAULT_SELLERS);
      set([...DEFAULT_SELLERS]);
    }
  };
}

export const sellers = createSellersStore();

// --- PRODUCTS STORE ---
function createProductsStore() {
  const initial = typeof window !== 'undefined' ? db.getProducts() : INITIAL_PRODUCTS;
  const { subscribe, set, update } = writable(initial);

  return {
    subscribe,
    set,
    update,
    add: (productData) => {
      const newProduct = db.addProduct(productData);
      update((list) => [...list, newProduct]);

      // Sync to Neon via backend API
      if (typeof window !== 'undefined') {
        disabledFetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProduct)
        }).catch((err) => console.warn('Could not sync product add to Neon:', err));
      }
      return newProduct;
    },
    edit: (id, productData) => {
      const updated = db.updateProduct(id, productData);
      if (updated) {
        update((list) => list.map((p) => (p.id === id ? { ...p, ...productData } : p)));

        // Sync to Neon via backend API
        if (typeof window !== 'undefined') {
          disabledFetch('/api/products', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...productData })
          }).catch((err) => console.warn('Could not sync product edit to Neon:', err));
        }
      }
      return updated;
    },
    remove: (id) => {
      db.deleteProduct(id);
      update((list) => list.filter((p) => p.id !== id));

      // Sync to Neon via backend API
      if (typeof window !== 'undefined') {
        disabledFetch('/api/products', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        }).catch((err) => console.warn('Could not sync product remove to Neon:', err));
      }
    },
    reset: () => {
      db.resetSeed();
      sellers.set([...DEFAULT_SELLERS]);
      set([...INITIAL_PRODUCTS]);
    }
  };
}

export const items = createProductsStore();

/**
 * Sync data with live Neon PostgreSQL via /api/sellers & /api/products
 */
export async function syncWithServer() {
  if (typeof window === 'undefined') return;
  try {
    const [resSellers, resProducts] = await Promise.all([
      disabledFetch('/api/sellers').catch(() => null),
      disabledFetch('/api/products').catch(() => null)
    ]);

    if (resSellers && resSellers.ok) {
      const sData = await resSellers.json();
      if (Array.isArray(sData) && sData.length > 0) {
        sellers.set(sData);
        db.saveSellers(sData);
      }
    }

    if (resProducts && resProducts.ok) {
      const pData = await resProducts.json();
      if (Array.isArray(pData) && pData.length > 0) {
        items.set(pData);
        db.saveProducts(pData);
      }
    }
  } catch (e) {
    console.info('Live sync notice: Using cached offline storage.', e);
  }
}

// Auto sync when loaded in browser
if (typeof window !== 'undefined') {
  syncWithServer();
}

// Filter & Navigation Stores
export const activeTab = writable('cat'); // 'cat' | 'dash'
export const q = writable('');
export const selectedCat = writable('all');
export const selectedSeller = writable('all'); // Filter by seller in catalog
export const sortOrder = writable('feat');

// Toast Notification (With cross-page redirect persistence)
function createToastStore() {
  let initial = '';
  if (typeof window !== 'undefined') {
    try {
      const saved = sessionStorage.getItem('shangyun_toast');
      if (saved) {
        initial = saved;
        sessionStorage.removeItem('shangyun_toast');
        setTimeout(() => toastMsg.set(''), 2500);
      }
    } catch (e) {}
  }
  return writable(initial);
}
export const toastMsg = createToastStore();
let toastTimer;
export function showToast(m) {
  toastMsg.set(m);
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('shangyun_toast', m);
    } catch (e) {}
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastMsg.set('');
      try {
        sessionStorage.removeItem('shangyun_toast');
      } catch (e) {}
    }, 2400);
  }
}

// Modal Dialog States
export const dialogState = writable({
  open: false,
  editId: null
});

export const sellerModalOpen = writable(false);
export const delConfirmId = writable(null);

// ========================================================
// SHOPPING CART STORE
// - Persistent cart across page refresh
// - Add to cart, update qty, remove item, clear cart
// - Floating cart trigger when cartCount > 0
// ========================================================
const CART_STORAGE_KEY = 'shangyun.cart.v1';

function createCartStore() {
  let initial = [];
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        initial = JSON.parse(saved);
      }
    } catch (e) {}
  }

  const { subscribe, set, update } = writable(initial);

  function save(items) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (e) {}
    }
  }

  return {
    subscribe,
    addItem: (product, qty = 1) => {
      let addedName = product.nama || 'Piece';
      if (!Number.isFinite(Number(product.stok)) || Number(product.stok) < 1) { showToast('This piece is out of stock.'); return false; }
      update((items) => {
        const existingIdx = items.findIndex((i) => i.id === product.id);
        const maxStock = Math.max(0, Math.floor(Number(product.stok) || 0));
        if (maxStock < 1) return items;
        qty = Math.max(1, Math.floor(Number(qty) || 1));
        let next;
        if (existingIdx > -1) {
          next = items.map((item, idx) => {
            if (idx === existingIdx) {
              const newQty = Math.min(item.qty + qty, maxStock);
              return { 
                ...item, 
                qty: newQty, 
                maxStock, 
                harga: product.harga, 
                nama: product.nama, 
                imageUrl: product.imageUrl || product.image_url 
              };
            }
            return item;
          });
        } else {
          let sId = product.seller_id || 's1';
          let sToko = product.seller_toko;
          let sWa = product.seller_wa;
          if (!sToko || !sWa) {
            const foundSeller = DEFAULT_SELLERS.find((s) => s.id === sId) || DEFAULT_SELLERS[0];
            sToko = sToko || foundSeller.nama_toko;
            sWa = sWa || foundSeller.no_wa;
          }

          const item = {
            id: product.id,
            nama: product.nama,
            kategori: product.kategori,
            harga: Number(product.harga) || 0,
            imageUrl: product.imageUrl || product.image_url,
            seller_id: sId,
            seller_toko: sToko,
            seller_wa: sWa,
            maxStock: maxStock,
            qty: Math.min(qty, maxStock)
          };
          next = [...items, item];
        }
        save(next);
        return next;
      });
      showToast(`"${addedName}" added to your basket.`);
    },
    updateQty: (productId, qty) => {
      update((items) => {
        const next = items
          .map((item) => {
            if (item.id === productId) {
              const safeQty = Math.max(1, Math.min(qty, Math.max(1, Number(item.maxStock) || 1)));
              return { ...item, qty: safeQty };
            }
            return item;
          })
          .filter((item) => item.qty > 0);
        save(next);
        return next;
      });
    },
    removeItem: (productId) => {
      update((items) => {
        const next = items.filter((i) => i.id !== productId);
        save(next);
        return next;
      });
      showToast('Piece removed from basket.');
    },
    clearCart: () => {
      set([]);
      save([]);
      showToast('Basket cleared.');
    }
  };
}

export const cart = createCartStore();
export const cartOpen = writable(false);

// Derived stores
export const cartCount = derived(cart, ($cart) =>
  $cart.reduce((total, item) => total + (Number(item.qty) || 0), 0)
);

export const cartTotal = derived(cart, ($cart) =>
  $cart.reduce((total, item) => total + (Number(item.harga) || 0) * (Number(item.qty) || 0), 0)
);

// ========================================================
// ORDERS STORE (Incoming demo orders Per Seller)
// - Persistent orders per seller in localStorage
// - Orders route exclusively to each respective seller
// ========================================================
export const ORDERS_STORAGE_KEY = 'shangyun.orders.v1';

export const INITIAL_ORDERS = [
  {
    id: 'ORD-2026-081',
    seller_id: 's1',
    seller_toko: 'Zhao Atelier Suzhou',
    buyer_name: 'Jessica Kusuma',
    buyer_wa: '000000000000',
    buyer_email: 'demo@example.invalid',
    items: [
      {
        id: 'p1',
        nama: 'Golden Silk Lantern',
        kategori: 'Decor',
        harga: 450000,
        qty: 2,
        subtotal: 900000
      }
    ],
    total: 900000,
    status: 'Awaiting review',
    created_at: '16 Feb 2026, 10:15 WIB',
    note: 'Please use a red gift box with a gold ribbon.'
  },
  {
    id: 'ORD-2026-074',
    seller_id: 's1',
    seller_toko: 'Zhao Atelier Suzhou',
    buyer_name: 'Hendro Wijaya',
    buyer_wa: '000000000000',
    buyer_email: 'demo@example.invalid',
    items: [
      {
        id: 'p4',
        nama: 'Lucky Knot Hanging',
        kategori: 'Accessories',
        harga: 95000,
        qty: 4,
        subtotal: 380000
      }
    ],
    total: 380000,
    status: 'In progress',
    created_at: '15 Feb 2026, 16:40 WIB',
    note: 'Sample note only. No payment has been made or verified.'
  },
  {
    id: 'ORD-2026-079',
    seller_id: 's2',
    seller_toko: 'Mei Cinnabar Workshop',
    buyer_name: 'Fanny Gunawan',
    buyer_wa: '000000000000',
    buyer_email: 'demo@example.invalid',
    items: [
      {
        id: 'p2',
        nama: 'Embroidered Silk Red Envelopes (set of 10)',
        kategori: 'Red envelopes',
        harga: 185000,
        qty: 3,
        subtotal: 555000
      }
    ],
    total: 555000,
    status: 'Awaiting review',
    created_at: '16 Feb 2026, 09:30 WIB',
    note: 'Sample delivery request. No courier is booked.'
  },
  {
    id: 'ORD-2026-068',
    seller_id: 's3',
    seller_toko: 'Jinlong Jade & Porcelain',
    buyer_name: 'Tan William',
    buyer_wa: '000000000000',
    buyer_email: 'demo@example.invalid',
    items: [
      {
        id: 'p3',
        nama: 'Prestige Lunar New Year Gift Box',
        kategori: 'Gift boxes',
        harga: 1250000,
        qty: 1,
        subtotal: 1250000
      }
    ],
    total: 1250000,
    status: 'In progress',
    created_at: '14 Feb 2026, 13:20 WIB',
    note: 'Please include a Happy New Year greeting card.'
  }
];

function createOrdersStore() {
  let initial = [...INITIAL_ORDERS];
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (saved) {
        initial = JSON.parse(saved);
      } else {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(INITIAL_ORDERS));
      }
    } catch (e) {}
  }

  const { subscribe, set, update } = writable(initial);

  function save(list) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(list));
      } catch (e) {}
    }
  }

  return {
    subscribe,
    addOrder: (orderData) => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      const timeStr = now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      });
      const orderId = `ORD-2026-${Math.floor(100 + Math.random() * 900)}`;

      const newOrder = {
        id: orderId,
        seller_id: orderData.seller_id || 's1',
        seller_toko: orderData.seller_toko || 'Zhao Atelier Suzhou',
        buyer_name: orderData.buyer_name || 'Shang Yun visitor',
        buyer_wa: orderData.buyer_wa || '',
        buyer_email: orderData.buyer_email || '',
        items: orderData.items || [],
        total: Number(orderData.total) || 0,
        status: orderData.status || 'Awaiting review',
        created_at: `${dateStr}, ${timeStr} WIB`,
        note: orderData.note || 'Sample order from the local catalogue.'
      };

      update((list) => {
        const next = [newOrder, ...list];
        save(next);
        return next;
      });

      return newOrder;
    },
    updateStatus: (orderId, newStatus) => {
      update((list) => {
        const next = list.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o));
        save(next);
        return next;
      });
    },
    removeOrder: (orderId) => {
      update((list) => {
        const next = list.filter((o) => o.id !== orderId);
        save(next);
        return next;
      });
    },
    reset: () => {
      set([...INITIAL_ORDERS]);
      save(INITIAL_ORDERS);
    }
  };
}

export const orders = createOrdersStore();
