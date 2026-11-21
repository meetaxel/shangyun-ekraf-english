import test from 'node:test';
import assert from 'node:assert/strict';
import { esc, rp, normWa, waLocal, loadWa, ph, img, DEFAULT_WA, SEED, GL } from '../src/data/seed.js';

test('esc escapes HTML-significant characters', () => {
  assert.equal(esc('<b>"Tom & Jerry"</b>'), '&lt;b&gt;&quot;Tom &amp; Jerry&quot;&lt;/b&gt;');
  assert.equal(esc("it's"), 'it&#39;s');
});

test('esc leaves ordinary text untouched and coerces non-strings', () => {
  assert.equal(esc('Golden Silk Lantern'), 'Golden Silk Lantern');
  assert.equal(esc(450000), '450000');
});

test('rp formats prices as Indonesian Rupiah without decimals', () => {
  const formatted = rp(450000);
  assert.match(formatted, /Rp/);
  assert.match(formatted, /450\.000/); // id-ID groups thousands with dots
  assert.equal(rp(0), rp(0));
});

test('normWa normalizes Indonesian numbers to wa format', () => {
  assert.equal(normWa('0812-3456-7890'), '6281234567890');
  assert.equal(normWa('81234567890'), '6281234567890');
  assert.equal(normWa('+62 812 3456 7890'), '6281234567890');
  assert.equal(normWa('6281234567890'), '6281234567890');
});

test('normWa rejects numbers that cannot be valid', () => {
  assert.equal(normWa('08123'), '');
  assert.equal(normWa('12345'), '');
  assert.equal(normWa(''), '');
  assert.equal(normWa('001234567890123456789'), '');
});

test('waLocal renders a wa number in local 0-prefixed form', () => {
  assert.equal(waLocal('6281234567890'), '081234567890');
  assert.equal(waLocal('1234'), '1234');
});

test('loadWa falls back to the default outside the browser', () => {
  assert.equal(loadWa(), DEFAULT_WA);
});

test('ph builds a deterministic SVG data URI placeholder', () => {
  const p = SEED[0];
  const a = ph(p);
  assert.equal(a, ph(p)); // deterministic
  assert.ok(a.startsWith('data:image/svg+xml,'));
  assert.ok(a.includes(encodeURIComponent(GL[p.kategori]))); // category glyph text
  assert.ok(!a.slice('data:image/svg+xml,'.length).includes('<')); // fully URI-encoded
});

test('ph falls back to BLOOM for unknown categories', () => {
  const uri = ph({ nama: 'Mystery Item', kategori: 'Unknown' });
  assert.ok(uri.includes(encodeURIComponent('BLOOM')));
});

test('img prefers explicit URLs, then image_url, then the placeholder', () => {
  const p = { nama: 'Fan', kategori: 'Accessories' };
  assert.equal(img({ ...p, imageUrl: 'https://example.com/a.jpg' }), 'https://example.com/a.jpg');
  assert.equal(img({ ...p, image_url: 'https://example.com/b.jpg' }), 'https://example.com/b.jpg');
  assert.equal(img(p), ph(p));
});

test('seed catalogue entries are well formed', () => {
  assert.ok(SEED.length >= 8);
  for (const p of SEED) {
    assert.ok(p.id && p.nama && p.kategori, `entry ${p.id} has id, nama, kategori`);
    assert.ok(Number.isInteger(p.harga) && p.harga > 0, `${p.id} has a positive integer price`);
    assert.ok(Number.isInteger(p.stok) && p.stok >= 0, `${p.id} has a non-negative integer stock`);
  }
});
