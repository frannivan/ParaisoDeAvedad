require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const path = require('path');

const dbPath = process.env.DATABASE_URL || `file:${path.join(__dirname, '../../prisma/dev.db')}`;
const adapter = new PrismaLibSql({ url: dbPath });
const prisma = new PrismaClient({ adapter });



const chefDishes = [
  { name: 'Grilled Salmon Fillet', description: 'Fresh Atlantic salmon with lemon butter sauce and seasonal vegetables.', price: 28.00, category: 'FOOD', imageUrl: '/uploads/plato1.jpeg' },
  { name: 'Wagyu Beef Tenderloin', description: 'Premium wagyu beef with truffle mashed potatoes and red wine reduction.', price: 52.00, category: 'FOOD', imageUrl: '/uploads/plato2.jpeg' },
  { name: 'Lobster Bisque', description: 'Creamy lobster bisque with a hint of cognac and fresh cream.', price: 22.00, category: 'FOOD', imageUrl: '/uploads/plato3.jpeg' },
  { name: 'Duck Confit', description: 'Slow-cooked duck leg with orange glaze, wild mushrooms and polenta.', price: 34.00, category: 'FOOD', imageUrl: '/uploads/plato4.jpeg' },
  { name: 'Mango Panna Cotta', description: 'Silky vanilla panna cotta with fresh mango coulis and mint.', price: 12.00, category: 'FOOD', imageUrl: '/uploads/plato5.jpeg' },
  { name: 'Signature Sunset Cocktail', description: 'House special with tropical fruits, aged rum and a sparkling finish.', price: 16.00, category: 'DRINK', imageUrl: '/uploads/plato6.jpg' },
];

async function main() {
  // Get or create a restaurant to link the dishes to
  let restaurant = await prisma.restaurant.findFirst();
  if (!restaurant) {
    const hotel = await prisma.hotel.findFirst();
    if (!hotel) { console.error('No hotel found. Please set up the hotel first.'); process.exit(1); }
    restaurant = await prisma.restaurant.create({
      data: { name: 'Avedad Kitchen', hotelId: hotel.id }
    });
    console.log('Created restaurant:', restaurant.name);
  }

  // Mark all existing dishes as NOT chef recommendation first
  await prisma.dish.updateMany({ data: { isChefRecommendation: false } });

  // Upsert the 6 chef dishes
  for (const dish of chefDishes) {
    const existing = await prisma.dish.findFirst({ where: { name: dish.name } });
    if (existing) {
      await prisma.dish.update({
        where: { id: existing.id },
        data: { ...dish, isChefRecommendation: true, restaurantId: restaurant.id }
      });
      console.log('Updated:', dish.name);
    } else {
      await prisma.dish.create({
        data: { ...dish, isChefRecommendation: true, restaurantId: restaurant.id }
      });
      console.log('Created:', dish.name);
    }
  }

  console.log('\n✅ 6 Chef Recommendation dishes seeded successfully!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
