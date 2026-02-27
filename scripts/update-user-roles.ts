import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const users = [
    { email: 'test@example.com', role: 'USER' },
    { email: 'kol@example.com', role: 'KOL' },
    { email: 'admin@example.com', role: 'ADMIN' },
  ]

  for (const user of users) {
    try {
      const updatedUser = await prisma.user.upsert({
        where: { email: user.email },
        update: { role: user.role },
        create: {
          email: user.email,
          role: user.role,
          name: user.email.split('@')[0],
          password: 'password123', // Default password for test users
        },
      })
      console.log(`Upserted ${user.email} to role: ${updatedUser.role}`)
    } catch (error) {
      console.error(`Failed to upsert ${user.email}:`, error)
    }
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
