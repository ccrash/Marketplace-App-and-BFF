import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Checkout flow (E2E)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  async function createCartWithItem(productId: string, quantity: number) {
    const { body: { cartId } } = await request(app.getHttpServer()).post('/cart').expect(201);
    await request(app.getHttpServer())
      .post(`/cart/${cartId}/items`)
      .send({ productId, quantity })
      .expect(201);
    return cartId;
  }

  it('completes a successful checkout and returns order summary', async () => {
    const cartId = await createCartWithItem('prod_003', 3); // 3 coffees

    const res = await request(app.getHttpServer())
      .post(`/checkout/${cartId}`)
      .expect(200);

    expect(res.body.orderId).toBeDefined();
    expect(res.body.cartId).toBe(cartId);
    expect(res.body.paymentStatus).toBe('SIMULATED_SUCCESS');
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].quantity).toBe(3);
    expect(res.body.subtotal).toBe(3897); // 3 × 1299
  });

  it('applies BUY_X_GET_Y_FREE discount on checkout (3 coffees = 1 free)', async () => {
    const cartId = await createCartWithItem('prod_003', 3);

    const res = await request(app.getHttpServer())
      .post(`/checkout/${cartId}`)
      .expect(200);

    // disc_003: Buy 2 get 1 free on coffee (prod_003)
    // qty 3 → 1 free unit → saving = 1 × 1299 = 1299
    expect(res.body.appliedDiscounts.some((d: any) => d.code === 'COFFEE3FOR2')).toBe(true);
    expect(res.body.discountTotal).toBe(1299);
    expect(res.body.totalPaid).toBe(3897 - 1299);
  });

  it('decrements stock after successful checkout', async () => {
    const { body: before } = await request(app.getHttpServer()).get('/products/prod_003');
    const stockBefore = before.stock.available;

    const cartId = await createCartWithItem('prod_003', 2);
    await request(app.getHttpServer()).post(`/checkout/${cartId}`).expect(200);

    const { body: after } = await request(app.getHttpServer()).get('/products/prod_003');
    expect(after.stock.available).toBe(stockBefore - 2);
  });

  it('returns 409 on double checkout of same cart', async () => {
    const cartId = await createCartWithItem('prod_003', 1);
    await request(app.getHttpServer()).post(`/checkout/${cartId}`).expect(200);
    await request(app.getHttpServer()).post(`/checkout/${cartId}`).expect(409);
  });

  it('returns 404 for unknown cart checkout', async () => {
    await request(app.getHttpServer()).post('/checkout/nonexistent').expect(404);
  });

  it('returns 400 with failures array when stock exhausted between add and checkout', async () => {
    // Buy all prod_004 (Dyson) stock (8 units) across two carts — second checkout should fail
    const { body: { cartId: cart1 } } = await request(app.getHttpServer()).post('/cart');
    const { body: { cartId: cart2 } } = await request(app.getHttpServer()).post('/cart');

    // Cart 1 reserves all 8 units
    await request(app.getHttpServer())
      .post(`/cart/${cart1}/items`)
      .send({ productId: 'prod_004', quantity: 8 });

    // Cart 2 tries to reserve 1 more — should fail at add-item level (stock already exhausted)
    const addRes = await request(app.getHttpServer())
      .post(`/cart/${cart2}/items`)
      .send({ productId: 'prod_004', quantity: 1 });

    expect(addRes.status).toBe(400);
    expect(addRes.body.message).toBe('Insufficient stock');
  });

  it('applies BASKET_THRESHOLD discount when basket >= £100', async () => {
    // Add Sony Headphones (£279.99) — exceeds £100 threshold
    const cartId = await createCartWithItem('prod_001', 1);

    const res = await request(app.getHttpServer())
      .post(`/checkout/${cartId}`)
      .expect(200);

    // SONY15 (15% off): 27999 * 0.15 = 4200 (rounded)
    // SPEND100 (£15 off basket): 1500
    const codes = res.body.appliedDiscounts.map((d: any) => d.code);
    expect(codes).toContain('SPEND100');
    expect(codes).toContain('SONY15');
  });
});
