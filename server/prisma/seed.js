require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');

const path = require('path');

const dbPath = process.env.DATABASE_URL || `file:${path.join(__dirname, 'dev.db')}`;
const adapter = new PrismaLibSql({
  url: dbPath,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting Seed (Paraiso De Avedad Luxury)...');

  // 1. Principal Hotel
  const hotel = await prisma.hotel.upsert({
    where: { id: "cmnzxqrot0000cs8onjcau8rf" },
    update: {},
    create: {
      id: "cmnzxqrot0000cs8onjcau8rf",
      name: "Paraiso De Avedad Luxury",
      domain: "paraisodeavedad.com",
    }
  });

  // 2. Room Types (Translated & Updated)
  const roomTypesData = [
    { name: "Standard Double", description: "Comfortable room for business trips or quick stays.", basePrice: 120, capacity: 2 },
    { name: "Deluxe Suite", description: "Panoramic views and private jacuzzi for a romantic getaway.", basePrice: 250, capacity: 2 },
    { name: "Presidential Suite", description: "The hotel's jewel. Maximum luxury with 24/7 butler service.", basePrice: 500, capacity: 4 }
  ];

  const roomTypesMap = {};
  for (const rt of roomTypesData) {
    let createdRt = await prisma.roomType.findFirst({ where: { name: rt.name } });
    if (!createdRt) {
      createdRt = await prisma.roomType.create({
        data: { ...rt, hotelId: hotel.id }
      });
    }
    roomTypesMap[rt.name] = createdRt;
  }

  // 3. Rooms
  const roomsData = [
    { number: "101", floor: 1, typeName: "Standard Double" },
    { number: "102", floor: 1, typeName: "Standard Double" },
    { number: "201", floor: 2, typeName: "Deluxe Suite" },
    { number: "202", floor: 2, typeName: "Deluxe Suite" },
    { number: "301", floor: 3, typeName: "Presidential Suite" }
  ];

  for (const r of roomsData) {
    const existingRoom = await prisma.room.findFirst({ where: { number: r.number } });
    if (!existingRoom) {
      await prisma.room.create({
        data: {
          number: r.number,
          floor: r.floor,
          roomTypeId: roomTypesMap[r.typeName].id,
          housekeepingStatus: "CLEAN"
        }
      });
    }
  }

  // 4. Extra Services (Clear them for now as requested)
  await prisma.extraService.deleteMany();

  // 5. Restaurants (New Request)
  const restaurants = ["Dady Cafe", "Lola Cafe", "Dad Cafe", "Son Cafe"];
  for (const name of restaurants) {
    await prisma.restaurant.upsert({
      where: { id: name.toLowerCase().replace(' ', '_') },
      update: { name },
      create: { 
        id: name.toLowerCase().replace(' ', '_'),
        name,
        hotelId: hotel.id 
      }
    });
  }
  console.log('✅ Restaurants secured.');

  // 6. Dishes & Drinks (Test Data)
  const restIds = restaurants.map(n => n.toLowerCase().replace(' ', '_'));
  for (const rid of restIds) {
    const dishes = [
      { name: "Classic Burger", description: "Juicy beef patty with cheese.", price: 18.0, category: "FOOD" },
      { name: "Caesar Salad", description: "Fresh greens with parmesan.", price: 15.0, category: "FOOD" },
      { name: "Local Craft Beer", description: "Refreshing 500ml draft.", price: 8.0, category: "DRINK" },
      { name: "Fresh Mango Shake", description: "Sweet local mangoes.", price: 10.0, category: "DRINK" }
    ];
    for (const d of dishes) {
      await prisma.dish.create({
        data: { ...d, restaurantId: rid }
      });
    }
  }
  console.log('✅ Menu items seeded.');

  // 7. Demo Orders
  const sampleDishes = await prisma.dish.findMany();
  if (sampleDishes.length > 0) {
    const dadyRest = await prisma.restaurant.findFirst({ where: { name: "Dady Cafe" } });
    if (dadyRest) {
      await prisma.order.create({
        data: {
          guestName: "Alice Smith",
          tableNumber: "T-05",
          peopleCount: 2,
          restaurantId: dadyRest.id,
          status: "PENDING",
          items: {
            create: [
              { dishId: sampleDishes[0].id, quantity: 2 },
              { dishId: sampleDishes[2].id, quantity: 2 }
            ]
          }
        }
      });
    }
  }
  console.log('✅ Sample orders seeded.');

  // 8. Demo Bookings
  const allRooms = await prisma.room.findMany();
  if (allRooms.length > 0) {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const existingBooking = await prisma.booking.findFirst({ where: { guestName: 'John Doe (Demo)' } });
    if (!existingBooking) {
      await prisma.booking.create({
        data: {
          guestName: 'John Doe (Demo)',
          guestEmail: 'john.doe@paraiso.com',
          checkIn: today,
          checkOut: tomorrow,
          totalPrice: 120.0,
          status: 'CONFIRMED',
          source: 'LOCAL',
          roomId: allRooms[0].id
        }
      });
    }
  }

  // 9. Cancellation Reasons (Translated)
  const reasons = [
    'No Show',
    'Guest changed plans',
    'Error in dates/room',
    'Personal emergency',
    'Found better price',
    'Wants to change hotel',
    'Other (See details)'
  ];

  for (const name of reasons) {
    await prisma.cancellationReason.upsert({
      where: { id: name.substring(0, 5) }, 
      update: { name },
      create: { id: name.substring(0, 5), name }
    });
  }

  console.log('🎉 DATABASE SYNCED AND READY (PARAISO DE AVEDAD)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
