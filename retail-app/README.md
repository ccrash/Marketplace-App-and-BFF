# mobile-react-native

React Native / Expo customer-facing app for the retail BFF. Browse products, manage a cart, and place orders.

---

## Tech stack

| | |
|---|---|
| Framework | React Native 0.81 · Expo 54 |
| Language | TypeScript 5.9 |
| Routing | Expo Router 6 (file-based) |
| State | Zustand 5 (with AsyncStorage persistence) |
| Navigation | React Navigation 7 |
| Tests | Jest 29 · @testing-library/react-native |
| Package manager | npm |

---

## Screens

| Screen | Route | Description |
|---|---|---|
| Products | `/(tabs)/` | Browse catalogue — name, price, stock |
| Cart | `/(tabs)/cart` | View items, adjust quantities, see discount breakdown |
| Product detail | `/product/[id]` | Full details + Add to Cart |
| Checkout | `/checkout` | Order confirmation or failure reason |

---

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Expo Go](https://expo.dev/client) on your device **or** an iOS Simulator / Android Emulator
- The `retail-bff` running locally (see [retail-bff/README.md](../retail-bff/README.md))

---

## Environment

Create a `.env.local` file in this directory:

```bash

# Physical device using QR code — use your machine's LAN IP
# Run `ipconfig` (Windows) or `ifconfig` (Mac/Linux) to find it
EXPO_PUBLIC_BFF_URL=http://192.168.x.x:3000

# iOS Simulator — localhost resolves to the host machine
EXPO_PUBLIC_BFF_URL=http://localhost:3000

# Android Emulator — 10.0.2.2 is the special alias for the host machine
EXPO_PUBLIC_BFF_URL=http://10.0.2.2:3000
```

> After editing `.env.local`, restart the Expo dev server — `EXPO_PUBLIC_*` variables are baked in at startup, not at runtime.

---

## Install & run

```bash
npm install
npm start
```

- Scan the QR code with **Expo Go**
- Press `i` to open the iOS Simulator
- Press `a` to open the Android Emulator

---

## Tests

```bash
npm test             # watch mode
npm run coverage     # coverage report
```

### What is tested

| File | What it covers |
|---|---|
| `utils/api.test.ts` | BFF client — all endpoints, `ApiError`, network errors, timeout, 204 handling |
| `store/useProductsStore.test.ts` | Load products list, load single product, error states, clearError |
| `store/useCartStore.test.ts` | ensureCart, loadCart, addItem (incl. 410 retry), updateItem, removeItem, abandonCart, checkout, handleExpiredCart |
| `app/(tabs)/index.test.tsx` | Products screen — loading, empty state, list render, navigation, error + retry |
| `components/ProductCard.test.tsx` | Renders name, price, category, stock, out-of-stock label, press callback, accessibility |

---

## Project structure

```
app/
├── _layout.tsx            Root stack (tabs + product detail + checkout)
├── (tabs)/
│   ├── _layout.tsx        Tab bar (Products · Cart with badge)
│   ├── index.tsx          Products list
│   └── cart.tsx           Cart
├── product/[id].tsx       Product detail
└── checkout.tsx           Order confirmation

store/
├── useProductsStore.ts    Products list + selected product
└── useCartStore.ts        Cart lifecycle (persists cartId to AsyncStorage)

components/
├── ProductCard.tsx        Product list item
├── CartItem.tsx           Cart item with quantity controls
└── EmptyState.tsx         Reusable empty / placeholder state

utils/
├── api.ts                 BFF HTTP client (ApiError, 15 s timeout)
└── format.ts              formatPrice (pence → £) · formatError (status → message)

types/
├── product.ts
├── cart.ts
├── order.ts
└── discount.ts
```

---

## Error handling

- `ApiError(status, message)` is thrown by the API client and carries the HTTP status code.
- `formatError()` maps status codes to human-readable strings (e.g. `410` → "Your cart has expired").
- Cart expiry (HTTP 410) wipes the local `cartId` and shows a dismissible banner.
- Each tab screen has its own `ScreenErrorBoundary`; unexpected JS errors don't crash the whole app.
