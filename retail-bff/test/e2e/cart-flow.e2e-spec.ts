import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Cart flow (E2E)', () => {
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

  it('creates a cart and returns cartId + expiresAt', async () => {
    const res = await request(app.getHttpServer()).post('/cart').expect(201);
    expect(res.body.cartId).toBeDefined();
    expect(res.body.expiresAt).toBeDefined();
  });

  it('GET /cart/:id returns 404 for unknown cart', async () => {
    await request(app.getHttpServer()).get('/cart/nonexistent').expect(404);
  });

  it('adds an item to the cart and returns updated cart view', async () => {
    const { body: { cartId } } = await request(app.getHttpServer()).post('/cart').expect(201);

    const res = await request(app.getHttpServer())
      .post(`/cart/${cartId}/items`)
      .send({ productId: 'prod_003', quantity: 2 })
      .expect(201);

    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].productId).toBe('prod_003');
    expect(res.body.items[0].quantity).toBe(2);
    expect(res.body.subtotal).toBe(2598); // 2 × £12.99
  });

  it('returns 400 when adding more stock than available', async () => {
    const { body: { cartId } } = await request(app.getHttpServer()).post('/cart').expect(201);

    await request(app.getHttpServer())
      .post(`/cart/${cartId}/items`)
      .send({ productId: 'prod_001', quantity: 999 })
      .expect(400);
  });

  it('updates item quantity via PATCH', async () => {
    const { body: { cartId } } = await request(app.getHttpServer()).post('/cart').expect(201);
    await request(app.getHttpServer())
      .post(`/cart/${cartId}/items`)
      .send({ productId: 'prod_003', quantity: 2 });

    const res = await request(app.getHttpServer())
      .patch(`/cart/${cartId}/items/prod_003`)
      .send({ quantity: 5 })
      .expect(200);

    expect(res.body.items[0].quantity).toBe(5);
  });

  it('removes item via DELETE /cart/:id/items/:productId', async () => {
    const { body: { cartId } } = await request(app.getHttpServer()).post('/cart').expect(201);
    await request(app.getHttpServer())
      .post(`/cart/${cartId}/items`)
      .send({ productId: 'prod_003', quantity: 2 });

    const res = await request(app.getHttpServer())
      .delete(`/cart/${cartId}/items/prod_003`)
      .expect(200);

    expect(res.body.items).toHaveLength(0);
  });

  it('abandons cart via DELETE /cart/:id and returns 204', async () => {
    const { body: { cartId } } = await request(app.getHttpServer()).post('/cart').expect(201);
    await request(app.getHttpServer()).delete(`/cart/${cartId}`).expect(204);
  });

  it('releases stock when item is removed from cart', async () => {
    // Check prod_003 stock before
    const { body: before } = await request(app.getHttpServer()).get('/products/prod_003');
    const initialStock = before.stock.available;

    const { body: { cartId } } = await request(app.getHttpServer()).post('/cart').expect(201);
    await request(app.getHttpServer())
      .post(`/cart/${cartId}/items`)
      .send({ productId: 'prod_003', quantity: 5 });

    // Stock should be reduced
    const { body: during } = await request(app.getHttpServer()).get('/products/prod_003');
    expect(during.stock.available).toBe(initialStock - 5);

    // Remove item
    await request(app.getHttpServer()).delete(`/cart/${cartId}/items/prod_003`);

    // Stock should be restored
    const { body: after } = await request(app.getHttpServer()).get('/products/prod_003');
    expect(after.stock.available).toBe(initialStock);
  });

  it('returns 400 for invalid add-item body', async () => {
    const { body: { cartId } } = await request(app.getHttpServer()).post('/cart').expect(201);
    await request(app.getHttpServer())
      .post(`/cart/${cartId}/items`)
      .send({ productId: 'prod_003', quantity: -1 })
      .expect(400);
  });
});
