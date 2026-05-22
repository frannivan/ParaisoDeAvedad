require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const path = require('path');

const dbPath = process.env.DATABASE_URL || `file:${path.join(__dirname, '../../prisma/dev.db')}`;
const adapter = new PrismaLibSql({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔄 Running translation and deduplication script...');

  // 1. Room Types translation and merge map
  const roomTypeMap = {
    "Doble Estándar": { name: "Standard Double", description: "Comfortable room for business trips or quick stays." },
    "Estándar Doble": { name: "Standard Double", description: "Comfortable room for business trips or quick stays." },
    "Suite Deluxe": { name: "Deluxe Suite", description: "Panoramic views and private jacuzzi for a romantic getaway." },
    "Suite Presidencial": { name: "Presidential Suite", description: "The hotel's jewel. Maximum luxury with 24/7 butler service." }
  };

  for (const [spanishName, trans] of Object.entries(roomTypeMap)) {
    const spanishRt = await prisma.roomType.findFirst({ where: { name: spanishName } });
    if (!spanishRt) continue;

    // Check if the English record already exists
    const englishRt = await prisma.roomType.findFirst({ where: { name: trans.name } });
    if (englishRt) {
      // Re-map rooms pointing to Spanish RT to the English RT
      await prisma.room.updateMany({
        where: { roomTypeId: spanishRt.id },
        data: { roomTypeId: englishRt.id }
      });
      // Delete the duplicate Spanish RT
      await prisma.roomType.delete({ where: { id: spanishRt.id } });
      console.log(`Merged and deleted duplicate RoomType: "${spanishName}" ➡️ "${trans.name}"`);
    } else {
      // No duplicate, safe to rename
      await prisma.roomType.update({
        where: { id: spanishRt.id },
        data: { name: trans.name, description: trans.description }
      });
      console.log(`Renamed RoomType: "${spanishName}" ➡️ "${trans.name}"`);
    }
  }

  // 2. Extra Services translation and merge map
  const serviceMap = {
    "Desayuno Buffet": { name: "Buffet Breakfast", description: "All-you-can-eat continental and traditional breakfast." },
    "Desayuno": { name: "Buffet Breakfast", description: "All-you-can-eat continental and traditional breakfast." },
    "Spa": { name: "Spa & Massage", description: "1-hour relaxing full-body massage therapy." },
    "Spa y Masaje": { name: "Spa & Massage", description: "1-hour relaxing full-body massage therapy." },
    "Transporte": { name: "Airport Shuttle", description: "Roundtrip transportation to the international airport." },
    "Transporte Aeropuerto": { name: "Airport Shuttle", description: "Roundtrip transportation to the international airport." },
    "Acceso VIP": { name: "VIP Beach Access", description: "Exclusive access to private lounge and beach beds." }
  };

  for (const [spanishName, trans] of Object.entries(serviceMap)) {
    const spanishEs = await prisma.extraService.findFirst({ where: { name: spanishName } });
    if (!spanishEs) continue;

    const englishEs = await prisma.extraService.findFirst({ where: { name: trans.name } });
    if (englishEs) {
      // In prisma, BookingToExtraService is an implicit many-to-many relationship.
      // We need to re-link bookings that are linked to the spanish extra service.
      // Since it is implicit, we can query bookings that include the spanish service.
      const bookingsWithSpanish = await prisma.booking.findMany({
        where: { extraServices: { some: { id: spanishEs.id } } }
      });

      for (const booking of bookingsWithSpanish) {
        // Disconnect Spanish, connect English
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            extraServices: {
              disconnect: { id: spanishEs.id },
              connect: { id: englishEs.id }
            }
          }
        });
      }

      // Delete duplicate Spanish service
      await prisma.extraService.delete({ where: { id: spanishEs.id } });
      console.log(`Merged and deleted duplicate ExtraService: "${spanishName}" ➡️ "${trans.name}"`);
    } else {
      // Rename
      await prisma.extraService.update({
        where: { id: spanishEs.id },
        data: { name: trans.name, description: trans.description }
      });
      console.log(`Renamed ExtraService: "${spanishName}" ➡️ "${trans.name}"`);
    }
  }

  // 3. Cancellation Reasons translation and merge map
  const reasonMap = {
    "Cambio de planes": "Guest changed plans",
    "Error en fechas": "Error in dates/room",
    "Error en fechas/habitación": "Error in dates/room",
    "Emergencia personal": "Personal emergency",
    "Encontré mejor precio": "Found better price",
    "Quiero cambiar de hotel": "Wants to change hotel",
    "Otro (Ver detalle)": "Other (See details)"
  };

  for (const [spanishName, transName] of Object.entries(reasonMap)) {
    const spanishCr = await prisma.cancellationReason.findFirst({ where: { name: spanishName } });
    if (!spanishCr) continue;

    const englishCr = await prisma.cancellationReason.findFirst({ where: { name: transName } });
    if (englishCr) {
      // Re-map bookings pointing to Spanish CR to English CR
      await prisma.booking.updateMany({
        where: { cancellationReasonId: spanishCr.id },
        data: { cancellationReasonId: englishCr.id }
      });
      // Delete duplicate Spanish reason
      await prisma.cancellationReason.delete({ where: { id: spanishCr.id } });
      console.log(`Merged and deleted duplicate CancellationReason: "${spanishName}" ➡️ "${transName}"`);
    } else {
      // Rename
      await prisma.cancellationReason.update({
        where: { id: spanishCr.id },
        data: { name: transName }
      });
      console.log(`Renamed CancellationReason: "${spanishName}" ➡️ "${transName}"`);
    }
  }

  // 4. Dishes / Menu items translation
  const dishes = await prisma.dish.findMany();
  const dishTranslations = {
    "Hamburguesa Clásica": { name: "Classic Burger", description: "Juicy beef patty with cheese." },
    "Ensalada César": { name: "Caesar Salad", description: "Fresh greens with parmesan." },
    "Cerveza Artesanal": { name: "Local Craft Beer", description: "Refreshing 500ml draft." },
    "Batido de Mango": { name: "Fresh Mango Shake", description: "Sweet local mangoes." },
    "Filete Wagyu": { name: "Wagyu Ribeye", description: "Premium grade wagyu steak." },
    "Langosta": { name: "Lobster Thermidor", description: "Fresh lobster in rich mustard sauce." },
    "Risotto de Trufa": { name: "Truffle Risotto", description: "Creamy arborio rice with black truffle." }
  };

  for (const d of dishes) {
    if (dishTranslations[d.name]) {
      const trans = dishTranslations[d.name];
      await prisma.dish.update({
        where: { id: d.id },
        data: { name: trans.name, description: trans.description }
      });
      console.log(`Updated Dish: "${d.name}" ➡️ "${trans.name}"`);
    }
  }

  // 5. Inventory Items translation
  const inventoryItems = await prisma.inventoryItem.findMany();
  const inventoryTranslations = {
    "Tomates Frescos": "Fresh Tomatoes",
    "Aceite de Oliva": "Olive Oil",
    "Platos": "Dining Plates",
    "Copas": "Wine Glasses",
    "Servilletas": "Table Napkins"
  };

  for (const iv of inventoryItems) {
    if (inventoryTranslations[iv.name]) {
      const transName = inventoryTranslations[iv.name];
      await prisma.inventoryItem.update({
        where: { id: iv.id },
        data: { name: transName }
      });
      console.log(`Updated InventoryItem: "${iv.name}" ➡️ "${transName}"`);
    }
  }

  console.log('🎉 Translation and deduplication complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during translation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
