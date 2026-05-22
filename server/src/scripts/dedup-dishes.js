require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const path = require('path');

const dbPath = process.env.DATABASE_URL || `file:${path.join(__dirname, '../../prisma/dev.db')}`;
const adapter = new PrismaLibSql({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  const dishes = await prisma.dish.findMany();
  
  // Group by name
  const nameMap = new Map();
  for (const d of dishes) {
    if (!nameMap.has(d.name)) {
      nameMap.set(d.name, []);
    }
    nameMap.get(d.name).push(d);
  }
  
  let deletedCount = 0;
  
  for (const [name, duplicates] of nameMap.entries()) {
    if (duplicates.length > 1) {
      console.log(`Found ${duplicates.length} duplicates for "${name}"`);
      
      // Prioritize keeping the one with an image, then the latest one (or just the first one)
      duplicates.sort((a, b) => {
        if (a.imageUrl && !b.imageUrl) return -1;
        if (!a.imageUrl && b.imageUrl) return 1;
        return 0;
      });
      
      const keep = duplicates[0];
      const toDelete = duplicates.slice(1);
      
      for (const d of toDelete) {
        // Update any order items that reference the duplicate dish to reference the kept dish instead
        await prisma.orderItem.updateMany({
          where: { dishId: d.id },
          data: { dishId: keep.id }
        });
        
        await prisma.dish.delete({ where: { id: d.id } });
        deletedCount++;
      }
      console.log(`  Kept ID: ${keep.id}, Deleted: ${toDelete.length}`);
    }
  }
  
  console.log(`Deduplication complete. Deleted ${deletedCount} duplicate dishes.`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
