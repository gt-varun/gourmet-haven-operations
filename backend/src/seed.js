const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Business = require('./models/Business');
const Branch = require('./models/Branch');
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const AuditLog = require('./models/AuditLog');
const Ingredient = require('./models/Ingredient');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    console.log(`Connecting to database at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB. Clearing old data...');

    // Clear existing collections
    await Business.deleteMany({});
    await Branch.deleteMany({});
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await AuditLog.deleteMany({});
    await Ingredient.deleteMany({});

    console.log('Old data cleared.');

    // 1. Create Business
    const business = await Business.create({
      name: 'Gourmet Haven Group',
    });
    console.log(`Business created: ${business.name} (${business._id})`);

    // 2. Create Branches
    const branch1 = await Branch.create({
      name: 'Downtown Bistro',
      businessId: business._id,
      location: '123 Main St, Downtown',
    });
    const branch2 = await Branch.create({
      name: 'Uptown Café',
      businessId: business._id,
      location: '456 Park Ave, Uptown',
    });
    console.log(`Branches created: \n - ${branch1.name} (${branch1._id}) \n - ${branch2.name} (${branch2._id})`);

    // 3. Create Users (passwords will be hashed by userSchema pre-save middleware)
    const usersData = [
      {
        name: 'Sara Super',
        email: 'superadmin@gourmethaven.com',
        password: 'Password123',
        role: 'SUPER_ADMIN',
        branchId: null,
      },
      {
        name: 'Alice Admin',
        email: 'downtown.admin@gourmethaven.com',
        password: 'Password123',
        role: 'ADMIN',
        branchId: branch1._id,
      },
      {
        name: 'Charlie Cashier',
        email: 'downtown.cashier@gourmethaven.com',
        password: 'Password123',
        role: 'CASHIER',
        branchId: branch1._id,
      },
      {
        name: 'Bob Admin',
        email: 'uptown.admin@gourmethaven.com',
        password: 'Password123',
        role: 'ADMIN',
        branchId: branch2._id,
      },
      {
        name: 'Cathy Cashier',
        email: 'uptown.cashier@gourmethaven.com',
        password: 'Password123',
        role: 'CASHIER',
        branchId: branch2._id,
      },
    ];

    const users = await User.create(usersData);
    console.log(`Created ${users.length} system users.`);

    // 4. Create Products for Downtown Bistro
    const productsBranch1 = [
      {
        name: 'Truffle Fries',
        sku: 'DF-001',
        price: 350,
        taxRate: 18,
        stock: 50,
        reorderLevel: 10,
        category: 'Appetizers',
        imageUrl: '/assets/img/social/truffle-fries.jpg',
        branchId: branch1._id,
      },
      {
        name: 'Classic Margherita Pizza',
        sku: 'DF-002',
        price: 550,
        taxRate: 18,
        stock: 30,
        reorderLevel: 8,
        category: 'Main Course',
        imageUrl: '/assets/img/social/classic-margherita-pizza.jpg',
        branchId: branch1._id,
      },
      {
        name: 'Chocolate Fudge Brownie',
        sku: 'DF-003',
        price: 250,
        taxRate: 18,
        stock: 15,
        reorderLevel: 5,
        category: 'Desserts',
        imageUrl: '/assets/img/social/chocolate-fudge-brownie.jpg',
        branchId: branch1._id,
      },
      {
        name: 'Craft Beer',
        sku: 'DF-004',
        price: 400,
        taxRate: 18,
        stock: 8, // Low stock (below threshold 10)
        reorderLevel: 10,
        category: 'Beverages',
        imageUrl: '/assets/img/social/craft-beer.jpg',
        branchId: branch1._id,
      },
    ];

    // Create Products for Uptown Café
    const productsBranch2 = [
      {
        name: 'Avocado Toast',
        sku: 'UF-001',
        price: 450,
        taxRate: 18,
        stock: 40,
        reorderLevel: 10,
        category: 'Breakfast',
        imageUrl: '/assets/img/social/s62-sourdough.jpg',
        branchId: branch2._id,
      },
      {
        name: 'Cold Brew Coffee',
        sku: 'UF-002',
        price: 280,
        taxRate: 18,
        stock: 100,
        reorderLevel: 15,
        category: 'Beverages',
        imageUrl: '/assets/img/social/s78-baguettes.jpg',
        branchId: branch2._id,
      },
      {
        name: 'Croissant',
        sku: 'UF-003',
        price: 180,
        taxRate: 18,
        stock: 4, // Low stock (below threshold 10)
        reorderLevel: 10,
        category: 'Bakery',
        imageUrl: '/assets/img/social/s78-baguettes.jpg',
        branchId: branch2._id,
      },
      {
        name: 'Quinoa Bowl',
        sku: 'UF-004',
        price: 480,
        taxRate: 18,
        stock: 25,
        reorderLevel: 5,
        category: 'Main Course',
        imageUrl: '/assets/img/social/s90-vegetables.jpg',
        branchId: branch2._id,
      },
    ];

    const products = await Product.create([...productsBranch1, ...productsBranch2]);
    console.log(`Created ${products.length} menu items across both branches.`);

    // 5. Seed Ingredients
    const ingredientsBranch1 = [
      { name: 'Sugar', quantity: 10, unit: 'kg', branchId: branch1._id },
      { name: 'Fruits', quantity: 5, unit: 'kg', branchId: branch1._id },
      { name: 'Chicken', quantity: 20, unit: 'kg', branchId: branch1._id },
      { name: 'Curd', quantity: 8, unit: 'kg', branchId: branch1._id },
      { name: 'Milk', quantity: 15, unit: 'L', branchId: branch1._id },
    ];

    const ingredientsBranch2 = [
      { name: 'Sugar', quantity: 12, unit: 'kg', branchId: branch2._id },
      { name: 'Milk', quantity: 30, unit: 'L', branchId: branch2._id },
      { name: 'Fruits', quantity: 8, unit: 'kg', branchId: branch2._id },
      { name: 'Coffee Beans', quantity: 25, unit: 'kg', branchId: branch2._id },
    ];

    const ingredients = await Ingredient.create([...ingredientsBranch1, ...ingredientsBranch2]);
    console.log(`Created ${ingredients.length} ingredients across both branches.`);

    console.log('Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
