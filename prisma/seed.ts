import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
  const memberEmail = "rachel@remix.run";
  const adminEmail = "kyle.fidalgo@gmail.com"

  // cleanup the existing database
  await prisma.user.deleteMany({}).catch(() => {
    // no worries if it doesn't exist yet
  });

  const memberHashedPassword = await bcrypt.hash("racheliscool", 10);
  const adminHashedPassword = await bcrypt.hash("racheliscool", 10);

  const memberPromise = prisma.user.create({
    data: 
      {
      email: memberEmail,
      password: {
        create: {
          hash: memberHashedPassword,
        },
      },
    },
  
  });
  const adminPromise = prisma.user.create({
    data: 
      {
      email: adminEmail,
      role: "ADMIN",
      password: {
        create: {
          hash: adminHashedPassword,
        },
      },
    },
  
  });

  const [member, admin] = await Promise.all([memberPromise,adminPromise])

  await prisma.note.create({
    data: {
      title: "My first note",
      body: "Hello, world!",
      userId: member.id,
    },
  });

  await prisma.note.create({
    data: {
      title: "My second note",
      body: "Hello, world!",
      userId: admin.id,
    },
  });

  console.log(`Database has been seeded. 🌱`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
