require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const path = require('path');

const dbPath = process.env.DATABASE_URL || `file:${path.join(__dirname, '../../prisma/dev.db')}`;
const adapter = new PrismaLibSql({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding Restaurant Tables...');

  const hotel = await prisma.hotel.findFirst();
  if (!hotel) {
    console.error('No hotel found. Run the main seed first.');
    process.exit(1);
  }

  // Check if "Restaurant Table" room type already exists
  let tableType = await prisma.roomType.findFirst({ where: { name: 'Restaurant Table' } });

  if (!tableType) {
    tableType = await prisma.roomType.create({
      data: {
        name: 'Restaurant Table',
        description: 'Dining table for restaurant reservations.',
        basePrice: 0,
        capacity: 6,
        hotelId: hotel.id,
      }
    });
    console.log(`Created RoomType: ${tableType.name}`);
  } else {
    console.log(`Found existing RoomType: ${tableType.name}`);
  }

  // Create 5 tables (T1-T5)
  const tableNumbers = ['T1', 'T2', 'T3', 'T4', 'T5'];
  for (const num of tableNumbers) {
    const existing = await prisma.room.findFirst({ where: { number: num } });
    if (!existing) {
      await prisma.room.create({
        data: {
          number: num,
          floor: 1,
          status: 'AVAILABLE',
          housekeepingStatus: 'CLEAN',
          roomTypeId: tableType.id,
        }
      });
      console.log(`Created Table: ${num}`);
    } else {
      console.log(`Table ${num} already exists.`);
    }
  }

  console.log('Restaurant Tables Seeding Complete.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
