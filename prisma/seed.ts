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
  const adminHashedPassword = await bcrypt.hash("kyleiscool", 10);

  const memberPromise = prisma.user.create({
    data:
    {
      email: memberEmail,
      password: {
        create: {
          hash: memberHashedPassword,
        },
      },
      role: "MEMBER",
      profile: {
        create: {

          firstName: "Rachel",
          lastName: "Remix",
          avatar: "https://placekitten.com/80/80",
          gym: "Waltham"
        }


      }
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
      profile: {
        create: {
          firstName: "Kyle",
          lastName: "Fidalgo",
          avatar: "https://placekitten.com/80/80",
          gym: "Waltham"
        }
      }
    },

  });

  const [member, admin] = await Promise.all([memberPromise, adminPromise])

  const stepChallenge = await prisma.challenge.upsert({
    where: {
      title: "Tilt Step Up Challenge"
    },
    update: {
      title: "Tilt Step Up Challenge",
    },
    create: {
      title: "Tilt Step Up Challenge",
      description: "Accumulate 10,000 step-ups to any height box, wall, child, dog, tree stump, or anything else by August 31st",
      startDate: new Date(2022, 4, 1),
      endDate: new Date(2022, 8, 31),
      public: true,
      published: true
    },
  });

  const challengeActivity = await prisma.challengeActivity.create({
    data: {
      challenge: {
        connect: {
          id: stepChallenge.id,
        }
      },
      amount: 10000,
      trackType: "Reps",
      unit: "Steps",
      activity: {
        connectOrCreate: {
          where: {
            name: "Step Ups",
          },
          create: {
            name: "Step Ups",
          }
        }
      },

    }
  })

  await prisma.challenge.update({
    where: {
      id: stepChallenge.id,
    },
    data: {
      users: {
        connect: [
          { id: member.id }, { id: admin.id }
        ]
      }
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
