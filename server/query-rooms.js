require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const path = require('path');

const dbPath = process.env.DATABASE_URL || `file:${path.join(__dirname, '../prisma/dev.db')}`;

const adapter = new PrismaLibSql({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  const types = await prisma.roomType.findMany({ include: { rooms: true } });
  console.log(JSON.stringify(types, null, 2));
}
main().finally(() => prisma.$disconnect());
