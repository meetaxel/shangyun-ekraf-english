export const KEY = 'shangyun.products.v1';
export const WK = 'shangyun.wa.v1';
export const DEFAULT_WA = '000000000000';

export const SEED = [
  {
    id: 'p1',
    nama: 'Golden Silk Lantern',
    kategori: 'Decor',
    harga: 450000,
    stok: 12,
    deskripsi: 'Wood-framed silk with gold-thread embroidery. Height: 40 cm.',
    imageUrl: '',
    unggulan: true
  },
  {
    id: 'p2',
    nama: 'Embroidered Silk Red Envelopes (set of 10)',
    kategori: 'Red envelopes',
    harga: 185000,
    stok: 40,
    deskripsi: 'Hand-embroidered fabric envelopes in a velvet-lined box.',
    imageUrl: '',
    unggulan: false
  },
  {
    id: 'p3',
    nama: 'Prestige Lunar New Year Gift Box',
    kategori: 'Gift boxes',
    harga: 1250000,
    stok: 6,
    deskripsi: 'A red lacquer box with tea, cookies, candles and red envelopes.',
    imageUrl: '',
    unggulan: true
  },
  {
    id: 'p4',
    nama: 'Lucky Knot Hanging',
    kategori: 'Accessories',
    harga: 95000,
    stok: 30,
    deskripsi: 'Red silk cord and wooden beads, assembled by hand.',
    imageUrl: '',
    unggulan: false
  },
  {
    id: 'p5',
    nama: 'Framed Fu Calligraphy',
    kategori: 'Decor',
    harga: 780000,
    stok: 5,
    deskripsi: 'Hand-brushed Fu character on rice paper in a teak frame.',
    imageUrl: '',
    unggulan: true
  },
  {
    id: 'p6',
    nama: 'Black Lacquer Tea Box',
    kategori: 'Gift boxes',
    harga: 560000,
    stok: 0,
    deskripsi: 'Gold-edged black lacquer with room for four tea tins.',
    imageUrl: '',
    unggulan: false
  },
  {
    id: 'p7',
    nama: 'Ceramic Dragon Ornament',
    kategori: 'Decor',
    harga: 890000,
    stok: 8,
    deskripsi: 'Deep red glazed ceramic for an altar or living-room display.',
    imageUrl: '',
    unggulan: false
  },
  {
    id: 'p8',
    nama: 'Embroidered Folding Fan',
    kategori: 'Accessories',
    harga: 210000,
    stok: 18,
    deskripsi: 'Bamboo fan with plum-blossom embroidered fabric.',
    imageUrl: '',
    unggulan: false
  }
];

export const GL = {
  Decor: 'JOY',
  'Red envelopes': 'GIVE',
  'Gift boxes': 'GIFT',
  Accessories: 'LUCK'
};

export function ph(p) {
  const g = GL[p.kategori] || 'BLOOM';
  let h = 0;
  for (let k = 0; k < p.nama.length; k++) {
    h = (h * 31 + p.nama.charCodeAt(k)) % 60;
  }
  const dark = h % 2;
  const top = dark ? '#1a0d0a' : 'hsl(' + (h % 12 + 2) + ',72%,34%)';
  const bot = dark ? '#050202' : 'hsl(' + (h % 10) + ',70%,14%)';
  const ox = 60 + h * 4;
  const oy = 40 + (h % 5) * 30;
  const s =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' +
    top +
    '"/><stop offset="1" stop-color="' +
    bot +
    '"/></linearGradient><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter></defs><rect width="400" height="500" fill="url(#g)"/><ellipse cx="' +
    ox +
    '" cy="' +
    oy +
    '" rx="110" ry="150" fill="#050202" opacity=".75" filter="url(#b)"/><ellipse cx="' +
    (400 - ox) +
    '" cy="470" rx="170" ry="60" fill="#050202" opacity=".6" filter="url(#b)"/><text x="200" y="300" text-anchor="middle" font-size="70" font-family="serif" fill="#e8dbc0" opacity=".9">' +
    g +
    '</text></svg>';
  return 'data:image/svg+xml,' + encodeURIComponent(s);
}

export function img(p) {
  return p.imageUrl || p.image_url || ph(p);
}

export function rp(n) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(n);
}

export function esc(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c];
  });
}

export function loadWa() {
  if (typeof window === 'undefined') return DEFAULT_WA;
  try {
    const v = localStorage.getItem(WK);
    if (v && /^62\d{8,13}$/.test(v)) return v;
  } catch (e) {}
  return DEFAULT_WA;
}

export function normWa(v) {
  let d = String(v).replace(/\D/g, '');
  if (d.indexOf('0') === 0) d = '62' + d.slice(1);
  else if (d.indexOf('8') === 0) d = '62' + d;
  return /^62\d{8,13}$/.test(d) ? d : '';
}

export function waLocal(wa) {
  return wa && wa.indexOf('62') === 0 ? '0' + wa.slice(2) : wa;
}
