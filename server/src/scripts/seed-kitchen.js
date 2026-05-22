require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const path = require('path');

const dbPath = process.env.DATABASE_URL || `file:${path.join(__dirname, '../../prisma/dev.db')}`;

const adapter = new PrismaLibSql({
  url: dbPath,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding Kitchen Data...');

  // 1. Get or Create a Hotel
  let hotel = await prisma.hotel.findFirst();
  if (!hotel) {
    hotel = await prisma.hotel.create({
      data: {
        name: 'Paraiso de Avedad',
      }
    });
  }

  // 2. Get or Create a Restaurant
  let restaurant = await prisma.restaurant.findFirst({
    where: { name: 'Avedad Main Dining' }
  });

  if (!restaurant) {
    restaurant = await prisma.restaurant.create({
      data: {
        name: 'Avedad Main Dining',
        hotelId: hotel.id
      }
    });
    console.log(`Created Restaurant: ${restaurant.name}`);
  } else {
    console.log(`Found existing Restaurant: ${restaurant.name}`);
  }

  // 3. Create Dishes
  const dishesData = [
    { name: 'Lobster Thermidor', price: 45, category: 'Main', description: 'Fresh lobster in rich mustard sauce.' },
    { name: 'Wagyu Ribeye', price: 85, category: 'Main', description: 'Premium grade wagyu steak.' },
    { name: 'Truffle Risotto', price: 32, category: 'Vegetarian', description: 'Creamy arborio rice with black truffle.' },
  ];

  for (const dish of dishesData) {
    const existing = await prisma.dish.findFirst({ where: { name: dish.name } });
    if (!existing) {
      await prisma.dish.create({
        data: {
          name: dish.name,
          price: dish.price,
          category: dish.category,
          description: dish.description,
          restaurantId: restaurant.id
        }
      });
      console.log(`Created Dish: ${dish.name}`);
    }
  }

  // 4. Create Inventory Items
  const inventoryData = [
    { name: 'Fresh Tomatoes', quantity: 15, unit: 'kg', category: 'FOOD' },
    { name: 'Olive Oil', quantity: 5, unit: 'liters', category: 'FOOD' },
    { name: 'Dining Plates', quantity: 200, unit: 'units', category: 'EQUIPMENT' },
  ];

  for (const item of inventoryData) {
    const existing = await prisma.inventoryItem.findFirst({ where: { name: item.name } });
    if (!existing) {
      await prisma.inventoryItem.create({
        data: {
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          hotelId: hotel.id
        }
      });
      console.log(`Created Inventory Item: ${item.name}`);
    }
  }

  console.log('Kitchen Seeding Complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
