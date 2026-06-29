const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = require('../src/app');
const User = require('../src/models/User');
const Ingredient = require('../src/models/Ingredient');
const Branch = require('../src/models/Branch');

let connection;
let branchA;
let branchB;
let cashierToken;
let permittedCashierToken;
let adminToken;
let testIngredient;

beforeAll(async () => {
  // Use a separate test database
  const testUri = 'mongodb://127.0.0.1:27017/hotel_pos_ingredients_test?replicaSet=rs0';
  connection = await mongoose.connect(testUri);

  // Clear tables
  await User.deleteMany({});
  await Ingredient.deleteMany({});
  await Branch.deleteMany({});

  // Seed test branches
  branchA = await Branch.create({ name: 'Test Branch A', businessId: new mongoose.Types.ObjectId() });
  branchB = await Branch.create({ name: 'Test Branch B', businessId: new mongoose.Types.ObjectId() });

  // Seed cashiers
  await User.create({
    name: 'NormalCashier',
    email: 'normal.cashier@test.com',
    password: 'Password123',
    role: 'CASHIER',
    branchId: branchA._id,
    hasIngredientsAccess: false,
  });

  await User.create({
    name: 'PermittedCashier',
    email: 'permitted.cashier@test.com',
    password: 'Password123',
    role: 'CASHIER',
    branchId: branchA._id,
    hasIngredientsAccess: true,
  });

  await User.create({
    name: 'AdminUser',
    email: 'admin.user@test.com',
    password: 'Password123',
    role: 'ADMIN',
    branchId: branchA._id,
  });

  // Seed ingredients
  testIngredient = await Ingredient.create({
    name: 'Sugar',
    quantity: 10,
    unit: 'kg',
    branchId: branchA._id,
  });

  await Ingredient.create({
    name: 'Coffee',
    quantity: 5,
    unit: 'kg',
    branchId: branchB._id,
  });

  // Login to get tokens
  const normRes = await request(app).post('/api/auth/login').send({
    email: 'normal.cashier@test.com',
    password: 'Password123',
  });
  cashierToken = normRes.headers['set-cookie'][0].split(';')[0];

  const permRes = await request(app).post('/api/auth/login').send({
    email: 'permitted.cashier@test.com',
    password: 'Password123',
  });
  permittedCashierToken = permRes.headers['set-cookie'][0].split(';')[0];

  const adminRes = await request(app).post('/api/auth/login').send({
    email: 'admin.user@test.com',
    password: 'Password123',
  });
  adminToken = adminRes.headers['set-cookie'][0].split(';')[0];
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

describe('Ingredients Access Control and Branch Isolation Integration Tests', () => {

  test('1. Cashier without permission gets 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/ingredients')
      .set('Cookie', [cashierToken]);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('Access denied');
  });

  test('2. Cashier with permission gets 200 and can read ingredients', async () => {
    const res = await request(app)
      .get('/api/ingredients')
      .set('Cookie', [permittedCashierToken]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.ingredients.length).toBe(1); // Should only see branchA ingredient (Sugar)
    expect(res.body.ingredients[0].name).toBe('Sugar');
  });

  test('3. Admin can read ingredients automatically', async () => {
    const res = await request(app)
      .get('/api/ingredients')
      .set('Cookie', [adminToken]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('4. Branch Isolation: permitted cashier cannot read ingredients of another branch', async () => {
    // Attempting to filter by branchB
    const res = await request(app)
      .get(`/api/ingredients?branchId=${branchB._id}`)
      .set('Cookie', [permittedCashierToken]);

    expect(res.status).toBe(403);
  });

  test('5. Permitted Cashier can create ingredient for their branch', async () => {
    const res = await request(app)
      .post('/api/ingredients')
      .set('Cookie', [permittedCashierToken])
      .send({
        name: 'Milk',
        quantity: 5,
        unit: 'L',
      });

    expect(res.status).toBe(201);
    expect(res.body.ingredient.name).toBe('Milk');
    expect(res.body.ingredient.branchId.toString()).toBe(branchA._id.toString());
  });

  test('6. Permitted Cashier cannot create duplicate ingredient', async () => {
    const res = await request(app)
      .post('/api/ingredients')
      .set('Cookie', [permittedCashierToken])
      .send({
        name: 'Sugar', // Sugar already exists
        quantity: 5,
        unit: 'kg',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('already exists');
  });
});
