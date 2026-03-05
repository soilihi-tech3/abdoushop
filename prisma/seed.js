const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Categories
  const cats = await Promise.all([
    prisma.category.upsert({ where: { name: 'Téléphone' }, update: {}, create: { name: 'Téléphone', desc: 'Smartphones' } }),
    prisma.category.upsert({ where: { name: 'Ordinateur' }, update: {}, create: { name: 'Ordinateur', desc: 'Laptops & Desktops' } }),
    prisma.category.upsert({ where: { name: 'Accessoire' }, update: {}, create: { name: 'Accessoire', desc: 'Accessoires divers' } }),
    prisma.category.upsert({ where: { name: 'Tablette' }, update: {}, create: { name: 'Tablette', desc: 'Tablettes numériques' } }),
  ])

  // Brands
  const brands = await Promise.all([
    prisma.brand.upsert({ where: { name: 'Apple' }, update: {}, create: { name: 'Apple' } }),
    prisma.brand.upsert({ where: { name: 'Samsung' }, update: {}, create: { name: 'Samsung' } }),
    prisma.brand.upsert({ where: { name: 'Huawei' }, update: {}, create: { name: 'Huawei' } }),
    prisma.brand.upsert({ where: { name: 'HP' }, update: {}, create: { name: 'HP' } }),
  ])

  // Suppliers
  const sups = await Promise.all([
    prisma.supplier.upsert({ where: { id: 1 }, update: {}, create: { name: 'Tech Dakar', phone: '+221 77 111 11 11', email: 'tech@dakar.sn', address: 'Plateau, Dakar' } }),
    prisma.supplier.upsert({ where: { id: 2 }, update: {}, create: { name: 'Mobile World', phone: '+221 77 222 22 22', email: 'mobile@world.sn', address: 'Almadies, Dakar' } }),
  ])

  // Admin employee
  const adminHash = await bcrypt.hash('admin123', 10)
  const empHash = await bcrypt.hash('emp123', 10)

  await prisma.employee.upsert({
    where: { email: 'admin@fartech.com' },
    update: {},
    create: { first: 'Admin', last: 'FarTech', email: 'admin@fartech.com', password: adminHash, role: 'admin', active: true }
  })
  await prisma.employee.upsert({
    where: { email: 'emp@fartech.com' },
    update: {},
    create: { first: 'Fatou', last: 'Diallo', email: 'emp@fartech.com', password: empHash, role: 'employee', active: true }
  })

  // Products
  await prisma.product.createMany({
    skipDuplicates: true,
    data: [
      { name: 'iPhone 15 Pro', imei: '352345678901234', brandId: brands[0].id, categoryId: cats[0].id, storage: '256 Go', state: 'Neuf', buyPrice: 650000, sellPrice: 850000, qty: 5, supplierId: sups[0].id },
      { name: 'Samsung Galaxy S24', imei: '352567890123456', brandId: brands[1].id, categoryId: cats[0].id, storage: '128 Go', state: 'Neuf', buyPrice: 480000, sellPrice: 620000, qty: 3, supplierId: sups[1].id },
      { name: 'iPhone 14', imei: '352123456789012', brandId: brands[0].id, categoryId: cats[0].id, storage: '128 Go', state: 'Venant', buyPrice: 400000, sellPrice: 520000, qty: 8, supplierId: sups[0].id },
      { name: 'MacBook Air M2', brandId: brands[0].id, categoryId: cats[1].id, storage: '256 Go', state: 'Neuf', buyPrice: 900000, sellPrice: 1150000, qty: 2, supplierId: sups[0].id },
      { name: 'AirPods Pro 2', brandId: brands[0].id, categoryId: cats[2].id, state: 'Neuf', buyPrice: 150000, sellPrice: 200000, qty: 10, supplierId: sups[1].id },
    ]
  })

  // Settings
  await prisma.setting.upsert({ where: { key: 'shop' }, update: {}, create: { key: 'shop', value: 'FARTECH' } })
  await prisma.setting.upsert({ where: { key: 'addr' }, update: {}, create: { key: 'addr', value: 'Liberté 2 en Face de pharmacie' } })
  await prisma.setting.upsert({ where: { key: 'phone' }, update: {}, create: { key: 'phone', value: '+221 33 355 46 / 77 495 05 22 / 77 262 38 81' } })

  console.log('✅ Seed complete!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
