import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Seed categories
  const incomeCategories = ["Salary", "Freelance", "Investment"];
  const expenseCategories = [
    "Food",
    "Transport",
    "Housing",
    "Utilities",
    "Entertainment",
    "Healthcare",
    "Shopping",
    "Education",
  ];

  for (const name of incomeCategories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, type: "INCOME" },
    });
  }

  for (const name of expenseCategories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, type: "EXPENSE" },
    });
  }

  console.log("Categories seeded");

  // Seed default admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@finance.app" },
    update: {},
    create: {
      email: "admin@finance.app",
      name: "Admin",
      password: hashedPassword,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  console.log("Admin user seeded (admin@finance.app / admin123)");
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
