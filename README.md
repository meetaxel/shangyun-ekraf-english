# Shang Yun - English demo

An English-language adaptation of [mchann/shangyun-ekraf](https://github.com/mchann/shangyun-ekraf).

**Original project, visual design and artwork:** mchann.  
**English recreation and improvements:** Axel ([@meetaxel](https://github.com/meetaxel)).

This repository is an independent, history-free adaptation, **not a native GitHub fork**. Original authorship is not claimed. No license is added over the original work; do not assume this repository grants unrestricted reuse rights.

## What this version does

- English interface, artwork text, greetings, product descriptions, dialogs and validation messages.
- Original Lunar New Year layout, palette and artwork composition retained.
- Search, category/artisan filters, sorting and browser-local basket.
- Clearly labelled buyer, seller and admin demo views.
- Local inventory editing and sample order status views.
- Out-of-stock basket handling corrected; intentionally empty local catalogues persist.
- Mobile navigation adapted for the longer English labels.

## Important: demo only

**This is not a production marketplace.** Role selection is a demo tool, not authentication. Data lives in this browser's localStorage and is not shared across devices or users. No real order is submitted. No email, WhatsApp message, payment, database write or external image upload is performed. Contact actions are disabled. Prices are sample Indonesian Rupiah (IDR) catalogue values, not offers.

The original server API/email implementation and Git history are not included. No credentials are required or bundled. Backend authentication, role/ownership enforcement, secure OTP issuance/validation, durable storage, rate limits, order/inventory transactions and service integrations must be implemented and tested before any production use. Removing those routes from a demo is not a production security fix.

## Run locally

Requirements: Node.js 22 or newer and npm.

```sh
npm ci --ignore-scripts
npm run dev
```

Open the local address printed by Astro. Use **Demo views** to explore buyer, seller and admin interfaces. Do not enter real customer information. Clear this site's browser storage to reset demo data.

```sh
npm run build
npm run preview
```

## Verification

Production build succeeds. Local browser checks cover the eight-piece initial catalogue, English search and empty state, disabled sold-out action, basket persistence, seller create/edit/reload, admin rendering, mobile horizontal fit and browser script errors. Product and artisan validation dialogs and order views were also visually inspected. These checks do not verify production security or a real ordering backend.

## Attribution

Source reference: https://github.com/mchann/shangyun-ekraf  
Adapted from revision `81d0dbe63c1c7403cc0945a685a4c71d48558f62`.

Keep original creator credit when sharing this adaptation. This repository adds no license grant for third-party code, artwork or dependencies; their respective rights remain with their owners.
