# SOLUTION.md

## How to run the BFF

```bash
cd retail-bff
npm install
npm run start:dev
```

The API starts on **http://localhost:3000**. Set `PORT=<n>` to use a different port.

---

## How to run the React Native app

**1. Configure the BFF URL**

Create `retail-app/.env.local`:

```bash
# iOS Simulator
EXPO_PUBLIC_BFF_URL=http://localhost:3000

# Android Emulator
EXPO_PUBLIC_BFF_URL=http://10.0.2.2:3000

# Physical device — replace with your machine's LAN IP
EXPO_PUBLIC_BFF_URL=http://192.168.x.x:3000
```

**2. Start the app**

```bash
cd retail-app
npm install
npm start
```

- Scan the QR code with **Expo Go**
- Press `i` for iOS Simulator, `a` for Android Emulator

---

## How to run the tests

### BFF — unit tests

```bash
cd retail-bff
npm test
```

### BFF — E2E tests

```bash
cd retail-bff
npm run test:e2e
```

### BFF — all tests

```bash
cd retail-bff
npm test && npm run test:e2e
```

### React Native app

```bash
cd retail-app
npm test
```

---

## Assumptions

1. **No authentication** — all endpoints are unauthenticated. A `cartId` UUID acts as the session token.

2. **Prices in pence** — all monetary values are integers representing pence (e.g. `27999` = £279.99). This avoids IEEE 754 floating-point errors in discount calculations.

3. **Stock reserved on add, not on checkout** — adding an item to a cart immediately deducts from available stock and records a reservation. This prevents overselling across concurrent carts.

4. **Cart expiry tolerance** — the inactivity check runs every 15 seconds. A cart may remain accessible for up to 15 seconds past its exact 2-minute expiry. This is acceptable and avoids per-cart timer proliferation.

5. **Checkout re-validates reservations** — even though stock is reserved at add-item time, checkout re-verifies all reservations before committing. If a reservation is missing, all are released and a 400 is returned.

6. **Discount stacking** — multiple discounts can apply to the same cart, but only one product-level discount applies per product (first match wins). Basket-level discounts always run last.

7. **In-memory state only** — all state resets on BFF restart. See `retail-bff/SOLUTION.md` for the full discount engine and stock reservation documentation.

---

## Repository structure

```
retail-bff/          NestJS BFF — see retail-bff/README.md
retail-app/          React Native app — see retail-app/README.md
.github/workflows/   CI (both test suites run on every push/PR)
```
