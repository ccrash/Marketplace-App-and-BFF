# retail-bff

NestJS REST API (Backend-for-Frontend) that powers the retail mobile app. All state is held in-memory — no database required.

---

## Tech stack

| | |
|---|---|
| Framework | NestJS 10 + Express |
| Language | TypeScript |
| Validation | class-validator / class-transformer |
| ID generation | uuid |
| Tests | Jest + Supertest |
| Port | `3000` (override with `PORT` env var) |

---

## Running

```bash
npm install

npm run start:dev   # watch mode (recommended during development)
npm start           # production mode
npm run build       # compile to dist/
```

---

## API reference

### Products

| Method | Path | Description |
|---|---|---|
| `GET` | `/products` | List all products with live stock availability |
| `GET` | `/products/:id` | Single product with full stock breakdown (available / reserved / sold) |

### Discounts

| Method | Path | Description |
|---|---|---|
| `GET` | `/discounts` | List all active, non-expired discounts |
| `GET` | `/discounts/:id` | Single discount by ID |

### Cart

| Method | Path | Description |
|---|---|---|
| `POST` | `/cart` | Create a new cart → returns `{ cartId, expiresAt }` |
| `GET` | `/cart/:cartId` | View cart with items, live discount preview, and totals |
| `POST` | `/cart/:cartId/items` | Add a product (reserves stock immediately) |
| `PATCH` | `/cart/:cartId/items/:productId` | Update quantity (set to `0` to remove) |
| `DELETE` | `/cart/:cartId/items/:productId` | Remove a single item |
| `DELETE` | `/cart/:cartId` | Abandon the cart (releases all stock reservations) |

### Checkout

| Method | Path | Description |
|---|---|---|
| `POST` | `/checkout/:cartId` | Process checkout → returns order summary |

---

## Error responses

| Status | Meaning |
|---|---|
| `400` | Validation error or insufficient stock |
| `404` | Cart, product, or item not found |
| `409` | Cart already checked out |
| `410` | Cart has expired (2-minute inactivity window) |

Error bodies follow NestJS's default shape: `{ statusCode, message, error }`.

---

## Key behaviours

**Cart expiry** — carts expire after 2 minutes of inactivity. Any mutation (add / update / remove) resets the timer. A background job cleans up expired carts every 15 seconds, so a cart may remain accessible for up to 15 seconds past its theoretical expiry.

**Stock reservations** — stock is reserved the moment an item is added to a cart, not at checkout. This prevents overselling across concurrent carts. Reservations are released on item removal, cart abandonment, or expiry.

**Prices** — all monetary values are integers in **pence** (e.g. `27999` = £279.99).

**Discount types**

| Type | Description |
|---|---|
| `PERCENTAGE_OFF` | Percentage off a specific product |
| `FIXED_AMOUNT_OFF` | Fixed pence off a specific product |
| `BUY_X_GET_Y_FREE` | Buy X units, get Y free |
| `BASKET_THRESHOLD` | Flat discount when basket exceeds a spend threshold |
| `MULTI_BUY_FIXED` | Fixed price for N items from a category |

---

## Seeded data

### Products

| ID | Name | Price | Category | Stock |
|---|---|---|---|---|
| `prod_001` | Sony WH-1000XM5 Headphones | £279.99 | electronics | 15 |
| `prod_002` | Levi's 501 Jeans | £89.99 | clothing | 40 |
| `prod_003` | Organic Ground Coffee 1kg | £12.99 | food | 100 |
| `prod_004` | Dyson V15 Detect Vacuum | £599.99 | home | 8 |
| `prod_005` | CeraVe Moisturising Cream 454g | £14.99 | beauty | 60 |

### Active discounts

| Code | Type | Detail |
|---|---|---|
| `SONY15` | `PERCENTAGE_OFF` | 15% off Sony headphones |
| `DYSON10` | `FIXED_AMOUNT_OFF` | £10 off Dyson vacuum |
| `COFFEE3FOR2` | `BUY_X_GET_Y_FREE` | Buy 2 coffees, get 1 free |
| `SPEND100` | `BASKET_THRESHOLD` | Spend £100+, get £15 off |
| `BEAUTY3FOR25` | `MULTI_BUY_FIXED` | Any 3 beauty/food items for £25 |

---

## Tests

```bash
npm test               # unit tests
npm run test:cov       # with coverage report
npm run test:e2e       # end-to-end tests
```

Tests use Jest. Unit tests cover services and the discount engine; e2e tests cover the full HTTP layer via Supertest.
