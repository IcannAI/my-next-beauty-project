import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'kol@example.com' },
  })

  if (!user) {
    console.error('KOL user not found')
    process.exit(1)
  }

  const kolProfile = await prisma.kolProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  })

  const products = [
    { name: 'SK-II 青春露 30ml', price: 3200, description: 'Pitera™ 精華，讓肌膚晶瑩剔透。', stock: 50 },
    { name: '蘭蔻菁純精華', price: 4500, description: '頂級賦活精華，延緩肌膚老化。', stock: 30 },
    { name: '雅詩蘭黛小棕瓶', price: 2800, description: '修護權威，一覺醒來肌膚透亮。', stock: 100 },
    { name: '資生堂防曬乳', price: 1200, description: '全方位防曬，清爽不黏膩。', stock: 200 },
    { name: 'NARS 氣墊粉餅', price: 1800, description: '持久遮瑕，打造天生好膚質。', stock: 80 },
  ]

  for (const p of products) {
    await prisma.product.create({
      data: {
        ...p,
        kolProfileId: kolProfile.id,
      },
    })
    console.log(`Created product: ${p.name}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
