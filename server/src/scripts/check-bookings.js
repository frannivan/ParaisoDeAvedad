const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const dbPath = process.env.DATABASE_URL || `file:${path.join(__dirname, '../../prisma/dev.db')}`;
const adapter = new PrismaLibSql({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  const bookings = await prisma.booking.findMany({ include: { room: { include: { roomType: true } } } });
  console.log(JSON.stringify(bookings.filter(b => b.room && b.room.roomType.name.toLowerCase().includes('restaurant')), null, 2));
}
main().finally(() => prisma.$disconnect());
