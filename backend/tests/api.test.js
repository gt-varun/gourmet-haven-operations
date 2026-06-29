const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = require('../src/app');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Order = require('../src/models/Order');
const Branch = require('../src/models/Branch');

let connection;
let testBranch1;
let testBranch2;
let cashierToken;
let adminToken;
let superToken;
let testProduct;

beforeAll(async () => {
  // Use a separate test database
  const testUri = 'mongodb://127.0.0.1:27017/hotel_pos_test?replicaSet=rs0';
  connection = await mongoose.connect(testUri);

  // Clear tables
  await User.deleteMany({});
  await Product.deleteMany({});
  await Order.deleteMany({});
  await Branch.deleteMany({});

  // Seed test branches
  testBranch1 = await Branch.create({ name: 'Test Branch 1', businessId: new mongoose.Types.ObjectId() });
  testBranch2 = await Branch.create({ name: 'Test Branch 2', businessId: new mongoose.Types.ObjectId() });

  // Seed test users
  const cashier = await User.create({
    name: 'TCashier',
    email: 'test.cashier@test.com',
    password: 'Password123',
    role: 'CASHIER',
    branchId: testBranch1._id,
  });

  const admin = await User.create({
    name: 'TAdmin',
    email: 'test.admin@test.com',
    password: 'Password123',
    role: 'ADMIN',
    branchId: testBranch1._id,
  });

  const superAdmin = await User.create({
    name: 'TSuper',
    email: 'test.super@test.com',
    password: 'Password123',
    role: 'SUPER_ADMIN',
  });

  // Seed test products
  testProduct = await Product.create({
    name: 'Test Fries',
    sku: 'TF-999',
    price: 100,
    taxRate: 10,
    stock: 5,
    reorderLevel: 2,
    branchId: testBranch1._id,
  });

  // Login to get tokens
  const cashierRes = await request(app).post('/api/auth/login').send({
    email: 'test.cashier@test.com',
    password: 'Password123',
  });
  cashierToken = cashierRes.headers['set-cookie'][0].split(';')[0];

  const adminRes = await request(app).post('/api/auth/login').send({
    email: 'test.admin@test.com',
    password: 'Password123',
  });
  adminToken = adminRes.headers['set-cookie'][0].split(';')[0];

  const superRes = await request(app).post('/api/auth/login').send({
    email: 'test.super@test.com',
    password: 'Password123',
  });
  superToken = superRes.headers['set-cookie'][0].split(';')[0];
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

describe('POS & RBAC System Integration Tests', () => {
  
  test('1. Invalid credentials returns 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test.cashier@test.com',
      password: 'WrongPassword',
    });
    expect(res.status).toBe(401);
  });

  test('2. Cashier can view Reports for their branch', async () => {
    const res = await request(app)
      .get('/api/reports/dashboard')
      .set('Cookie', [cashierToken]);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('3. Admin can view Reports for their branch', async () => {
    const res = await request(app)
      .get('/api/reports/dashboard')
      .set('Cookie', [adminToken]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.metrics.lowStockCount).toBe(0); // Test fries has stock 5 (reorder 2)
  });

  test('4. Branch Isolation: Admin cannot access data of another branch', async () => {
    // Try to fetch products filtering by Branch 2
    const res = await request(app)
      .get(`/api/products?branchId=${testBranch2._id}`)
      .set('Cookie', [adminToken]);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Access denied: you cannot access data from another branch');
  });

  test('5. Transaction: Billing checkout decrements stock correctly', async () => {
    const checkoutPayload = {
      items: [{ productId: testProduct._id, quantity: 2 }],
      discountRate: 5,
      payment: { method: 'CASH' },
    };

    const res = await request(app)
      .post('/api/billing/checkout')
      .set('Cookie', [cashierToken])
      .send(checkoutPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    // Verify stock was decremented to 3
    const updatedProd = await Product.findById(testProduct._id);
    expect(updatedProd.stock).toBe(3);
  });

  test('6. Transaction: Cashier cannot apply discount > 10%', async () => {
    const checkoutPayload = {
      items: [{ productId: testProduct._id, quantity: 1 }],
      discountRate: 15, // greater than 10%
      payment: { method: 'CASH' },
    };

    const res = await request(app)
      .post('/api/billing/checkout')
      .set('Cookie', [cashierToken])
      .send(checkoutPayload);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Cashiers cannot apply discounts greater than 10%');
  });

  test('7. Transaction Rollback: Billing checkout rolls back atomically if any item is out of stock', async () => {
    // Current stock of testProduct is 3. We request 4 items.
    const checkoutPayload = {
      items: [{ productId: testProduct._id, quantity: 4 }],
      discountRate: 0,
      payment: { method: 'CASH' },
    };

    const res = await request(app)
      .post('/api/billing/checkout')
      .set('Cookie', [cashierToken])
      .send(checkoutPayload);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Out of stock');

    // Verify stock remains 3 (has not been decremented by the failing checkout)
    const updatedProd = await Product.findById(testProduct._id);
    expect(updatedProd.stock).toBe(3);

    // Verify no order was created
    const ordersCount = await Order.countDocuments({});
    // We created 1 successful order in test 5, none should be created here
    expect(ordersCount).toBe(1);
  });
});
