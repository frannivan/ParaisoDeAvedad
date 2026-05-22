require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const c = await prisma.hotel.count();
  console.log("Hotels:", c);
}
main().catch(console.error).finally(() => prisma.$disconnect());
