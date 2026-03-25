# Solution Notes — Retail App (React Native)

## Overview

This is a customer-facing React Native mobile app that consumes the `retail-bff` API.
It is built on top of the existing Expo/TypeScript project and replaces the previous cat-browsing app.

---

## Architecture Decisions

### Navigation — Expo Router with Root Stack

The app uses **Expo Router** (file-based routing) with a two-level navigation structure:

```
Root Stack (app/_layout.tsx)
├── (tabs)/              ← Tab bar
│   ├── index.tsx        ← Products list (tab 1)
│   └── cart.tsx         ← Cart (tab 2)
├── product/[id].tsx     ← Product detail (full-screen stack push, hides tab bar)
└── checkout.tsx         ← Checkout result (full-screen stack push)
```

**Why this structure?**
- Product detail and checkout are full-screen "focus" flows where the tab bar would be distracting.
- Keeping them outside the `(tabs)` group means they overlay the tab bar cleanly.
- Expo Router's file-based routing makes the navigation structure easy to read at a glance.

### State Management — Zustand

Two stores, following the existing pattern in the codebase:

| Store | Responsibility |
|---|---|
| `useProductsStore` | Product list + selected product for detail screen |
| `useCartStore` | Cart lifecycle: create, add/update/remove items, checkout |

**Why Zustand?**
- Already used in the project (`useThemeStore`) — consistency.
- Lightweight, no boilerplate, composable selectors.
- Supports `persist` middleware out of the box, which we use to persist `cartId` across app restarts.

**Cart ID persistence:**
Only the `cartId` string is persisted to AsyncStorage (not the full cart). On mount, if a `cartId` is found, the cart is re-fetched from the BFF. If the BFF returns 410 (expired), the state is cleared gracefully.

### API Client — `utils/api.ts`

Thin wrapper around `fetch` that:
- Reads `EXPO_PUBLIC_BFF_URL` from env (defaults to `http://localhost:3000`).
- Throws a typed `ApiError(status, message)` for non-2xx responses, extracting the `message` field from the BFF's error body.
- Throws `ApiError(0, ...)` for network failures and timeouts (15 s).
- Returns `undefined` for 204 No Content (cart abandon).

### Error Handling

| Layer | Strategy |
|---|---|
| API client | `ApiError` with HTTP status code preserved |
| `formatError()` util | Maps status codes to user-readable strings |
| Stores | Catch all errors, write to `error` field in state |
| Screens | Render error banners / full-screen error states with retry |
| Cart expiry (410) | Wipes `cartId` + cart, shows "Your cart expired" message |
| Root / screen boundaries | Existing `RootErrorBoundary` + `ScreenErrorBoundary` catch unexpected JS errors |

Users never see raw stack traces or `[object Object]` messages.

### Price Display

All BFF prices are **integers in pence** (e.g. `27999` = £279.99).
The `formatPrice(pence)` utility (`utils/format.ts`) handles display consistently.

---

## Screen Summary

### Products (`app/(tabs)/index.tsx`)
- Fetches and displays all products via `useProductsStore.loadProducts()` on mount.
- Full-screen loading spinner, full-screen error + retry, and pull-to-refresh.
- Tapping a card navigates to `product/[id]`.

### Product Detail (`app/product/[id].tsx`)
- Fetches single product via `useProductsStore.loadProduct(id)` on mount.
- Shows name, category, formatted price, and a stock breakdown (available / reserved / sold).
- "Add to Cart" button: calls `useCartStore.addItem()` — creates a new cart automatically if none exists.
- Inline feedback: button turns green with a checkmark for 2 s after a successful add.
- Out-of-stock products disable the button.
- "View Cart" shortcut navigates to the cart tab.

### Cart (`app/(tabs)/cart.tsx`)
- Loads cart on mount (if `cartId` is persisted).
- CartItem rows show item name, quantity controls (−/+), line total, and a trash icon to remove.
- Quantity buttons use optimistic-feeling per-item loading spinners.
- Order summary at the bottom: subtotal, individual discount lines (green), grand total.
- "Checkout" button navigates to `/checkout`.
- Cart tab badge shows total item quantity.
- Dismissible error banner for inline errors (stock issues, etc.).

### Checkout (`app/checkout.tsx`)
- On mount, immediately calls `useCartStore.checkout()`.
- Shows a loading spinner while waiting.
- **Success:** Displays order ID, item list, pricing breakdown including discounts, total paid, and payment status. "Continue Shopping" returns to the products tab and clears the cart.
- **Failure:** Shows the user-readable error (e.g. "Your cart has expired — please start a new one") with a "Back to Cart" button.

---

## Testing Strategy

Tests are written with **Jest** + **@testing-library/react-native**, following the existing project conventions.

### What is tested

| File | Coverage |
|---|---|
| `utils/api.test.ts` | All BFF endpoint functions, ApiError structure, network/timeout errors, 204 handling |
| `store/useProductsStore.test.ts` | loadProducts (success, failure, loading flag), loadProduct (success, 404, loading, clears previous), clearError |
| `store/useCartStore.test.ts` | ensureCart, loadCart (success, 410, error), addItem (cart creation, loading, 410 retry, 400), updateItem, removeItem, abandonCart (success, failure, no-op), checkout (success, failure, no cart), handleExpiredCart, clearError |
| `app/(tabs)/index.test.tsx` | Loading spinner, empty state, product list render, navigation on tap, error state + retry |
| `components/ProductCard.test.tsx` | Name, formatted price, category, stock count, out-of-stock label, onPress callback, accessibilityLabel |

### Philosophy

- **Stores are unit-tested** against mocked API functions — the business logic lives there and is the highest-value test surface.
- **Screen tests** focus on user-visible behaviour (what the user sees and can interact with), not implementation details.
- **The API client is tested** by mocking `global.fetch` directly — no MSW overhead needed for a thin wrapper.
- Old cat-app test files are replaced with single-line placeholders to keep the test runner clean.

---

## Project Config

| File | Purpose |
|---|---|
| `.env.local` | `EXPO_PUBLIC_BFF_URL=http://localhost:3000` — BFF base URL |
| `jest.setup.ts` | Sets `EXPO_PUBLIC_BFF_URL` for test environment |
| `__mocks__/utils.ts` | Factory helpers: `makeProduct`, `makeCart`, `makeCartItem`, `makeOrder` |

---

## Running the App

```bash
# Install dependencies
npm install

# Start BFF first
cd ../retail-bff && npm run start:dev

# Start the app
cd ../mobile-react-native && npm start

# Run tests
npm test

# Coverage report
npm run coverage
```
