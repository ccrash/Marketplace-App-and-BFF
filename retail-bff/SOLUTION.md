# SOLUTION.md

## How to run the BFF

```bash
cd retail-bff
npm install
npm run start:dev
```

The API starts on **http://localhost:3000**. Set `PORT=<n>` in your environment to use a different port.

---

## How to run the tests

### Unit tests

```bash
cd retail-bff
npm test
```

### E2E tests

```bash
cd retail-bff
npm run test:e2e
```

### All tests (unit + E2E)

```bash
cd retail-bff
npm test && npm run test:e2e
```

---

## API overview

| Method | Path | Description |
|---|---|---|
| GET | `/products` | List all products with live stock |
| GET | `/products/:id` | Get product detail |
| GET | `/discounts` | List active discounts |
| GET | `/discounts/:id` | Get discount detail |
| POST | `/cart` | Create a new cart |
| GET | `/cart/:cartId` | View cart with live discount preview |
| POST | `/cart/:cartId/items` | Add item to cart |
| PATCH | `/cart/:cartId/items/:productId` | Update item quantity (0 = remove) |
| DELETE | `/cart/:cartId/items/:productId` | Remove item from cart |
| DELETE | `/cart/:cartId` | Abandon cart (releases reserved stock) |
| POST | `/checkout/:cartId` | Check out cart |

---

## Assumptions

1. **No authentication**: All carts and endpoints are unauthenticated. A `cartId` UUID serves as the session token.

2. **Prices in pence**: All monetary values in the API are integers representing pence (GBP). `27999` = £279.99. This avoids IEEE 754 floating-point errors in discount calculations.

3. **Stock deducted on reserve, not on checkout**: When an item is added to a cart, stock is immediately deducted from the available pool and recorded as reserved. This prevents overselling when multiple carts are active simultaneously. Node.js's single-threaded event loop means no locking is required.

4. **Cart expiry tolerance**: The inactivity check runs every 15 seconds. A cart may remain accessible for up to 15 seconds past its exact 2-minute expiry window. This is acceptable for this use case and avoids per-cart timer proliferation.

5. **Checkout re-validates reservations**: Even though stock is reserved when items are added, checkout re-verifies that all cart reservations are intact. If a reservation is missing (e.g. the cart was partially released), all reservation info is released and a 400 response is returned.

6. **Discount stacking**: Multiple discounts can apply to the same cart, but only one product-level discount applies per product (first match wins). Basket-level discounts (BASKET_THRESHOLD) always run last and apply on top of product-level discounts.

7. **Seed data is reset on restart**: All state is in-memory. Restarting the BFF resets stock levels, active carts, and sold counts to their seeded values.

---

## Discount engine

The discount engine is a pure, stateless service (`DiscountEngineService`) that accepts a cart snapshot and the active discount catalogue, and returns the applied discounts and total savings. It is called from both `CartService` (for live preview on `GET /cart/:id`) and `CheckoutService` (for the final order summary).

### Discount types

#### 1. `PERCENTAGE_OFF` — percentage discount on a specific product

**Example**: `SONY15` — 15% off Sony WH-1000XM5 Headphones

Saving = `lineTotal × (percentage / 100)`, rounded to the nearest pence.

#### 2. `FIXED_AMOUNT_OFF` — fixed pence discount on a specific product

**Example**: `DYSON10` — £10 off Dyson V15 Vacuum

Saving = `min(amountOff, lineTotal)`. Cannot save more than the item costs.

#### 3. `BUY_X_GET_Y_FREE` — buy X units of a product, get Y free

**Example**: `COFFEE3FOR2` — buy 2 bags of coffee, get 1 free

```
freeUnits = floor(quantity / (buyQuantity + getFreeQuantity)) × getFreeQuantity
saving = freeUnits × unitPrice
```

For `BUY_2_GET_1_FREE`: qty=3 → 1 free, qty=6 → 2 free, qty=2 → 0 free.

#### 4. `BASKET_THRESHOLD` — flat discount when basket total meets a threshold

**Example**: `SPEND100` — spend £100 or more, get £15 off the whole basket

Evaluated after all product-level discounts. Saving = `amountOff` if `subtotal >= thresholdAmount`.

#### 5. `MULTI_BUY_FIXED` — buy N items from a category for a fixed bundle price

**Example**: `BEAUTY3FOR25` — any 3 beauty or food items for £25

```
bundles = floor(totalQualifyingUnits / requiredQuantity)
normalCost = sum of unit prices for the cheapest N × bundles units
saving = normalCost - (bundles × fixedPrice)
```

The cheapest units are selected first to maximise customer savings.

### Ordering rule

Product-level discounts are evaluated in seed order. Basket-level discounts (`BASKET_THRESHOLD`) always run last, operating on the pre-discount subtotal. This matches common retail practice.

### Deduplication rule

Each product can only benefit from one product-level discount (first match wins). This prevents discount stacking on a single item, which is typical in retail systems.

---

## Data persistence

All state is held in-memory using `Map` instances within NestJS injectable services:

- **`StockService`**: owns `stockLevels`, `reservations`, and `soldCounts`
- **`ProductsService`**: owns the product catalogue (read-only after seeding)
- **`DiscountsService`**: owns the discount catalogue (read-only after seeding)
- **`CartService`**: owns all active carts

State is initialised from hardcoded seed data at application startup and is lost on restart. This satisfies the exercise constraint of no real database.

---

## Stock reservation lifecycle

```
Add item to cart     → stockService.reserve()           → stock deducted, reservation recorded
Update qty up        → stockService.adjustReservation()  → delta deducted from stock
Update qty down      → stockService.adjustReservation()  → delta returned to stock
Remove item          → stockService.adjustReservation(0) → full qty returned to stock
Abandon cart         → stockService.releaseAllReservations() → all cart qty returned
Cart expires (2 min) → stockService.releaseAllReservations() → all cart qty returned
Successful checkout  → stockService.commitReservations()  → reservation removed, stock NOT returned (sale)
Failed checkout      → stockService.releaseAllReservations() → all cart qty returned
```
