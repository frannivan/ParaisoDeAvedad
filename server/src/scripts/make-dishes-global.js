require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const path = require('path');

const dbPath = process.env.DATABASE_URL || `file:${path.join(__dirname, '../../prisma/dev.db')}`;
const adapter = new PrismaLibSql({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.dish.updateMany({
    data: {
      restaurantId: null
    }
  });
  console.log('All dishes are now global (restaurantId: null)');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
