import { prisma } from "@/lib/db"
import { hashPassword } from "@/lib/auth"

async function main() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: "admin@learnsphere.com" },
    })

    if (existingAdmin) {
      console.log("Admin user already exists")
      return
    }

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: "admin@learnsphere.com",
        name: "Admin User",
        password: await hashPassword("Admin123"),
        role: "ADMIN",
        status: "ACTIVE",
      },
    })

    console.log("Admin user created:", admin.email)

    // Create sample student user
    const student = await prisma.user.create({
      data: {
        email: "student@learnsphere.com",
        name: "Sample Student",
        password: await hashPassword("Student123"),
        role: "STUDENT",
        status: "ACTIVE",
      },
    })

    console.log("Student user created:", student.email)
  } catch (error) {
    console.error("Seeding error:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
