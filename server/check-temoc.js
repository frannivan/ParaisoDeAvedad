const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const bookings = await prisma.booking.findMany({
    where: { guestName: { contains: 'Temoc' } },
    include: { order: { include: { items: true } } }
  });
  console.log('Bookings for Temoc:', JSON.stringify(bookings, null, 2));
  
  const restaurants = await prisma.restaurant.findMany();
  console.log('Total Restaurants:', restaurants.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
