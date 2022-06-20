import type { Challenge, Prisma, User, ChallengeActivity, Entry, Activity } from "@prisma/client";
import { profile } from "console";


import { prisma } from "~/db.server";

export type ChallengeWithActivities = Prisma.ChallengeGetPayload<{
  include: { activity: true }
}>

export type ChallengeWithActivitiesUsers = Prisma.ChallengeGetPayload<{
  include: { activity: true, users: true },
}>

export type EntriesWithUserProfiles = Prisma.EntryGetPayload<{
  include: { user: { include: { profile: true } } }
}>

export type { Challenge, Entry } from "@prisma/client";

export function getChallenge({ id, userId }: Pick<Challenge, "id"> & { userId: User["id"] }) {

  return prisma.challenge.findFirst({
    where: { id, published: true, users: { some: { id: userId } } },
    include: { activity: true },

  });
}

export function adminGetChallenge({ id }: Pick<Challenge, "id">) {
  return prisma.challenge.findFirst({
    where: { id, published: true },
    include: { activity: true, users: true },
  });
}

export async function getChallengesByAdminId() {

  return prisma.challenge.findMany({
    where: { published: true },
    include: { activity: true },
  })
}

export function createChallenge({ title, description, startDate, endDate, isPublic, published }: Pick<Challenge, "title" | "description" | "startDate" | "endDate" | "published"> & { isPublic: Challenge["public"] }) {
  return prisma.challenge.create({
    data: {
      title,
      description,
      startDate,
      endDate,
      public: isPublic,
      published
    },
  });


}

export function createChallengeActivity({ challengeId, amount, trackType, unit, activityName }: {
  challengeId: Challenge["id"],
  amount: ChallengeActivity["amount"],
  trackType: ChallengeActivity["trackType"],
  unit: ChallengeActivity["unit"],
  activityName: Activity["name"]
}) {


  return prisma.challengeActivity.create({
    data: {
      challenge: {
        connect: {
          id: challengeId,
        }
      },
      amount,
      trackType,
      unit,
      activity: {
        connectOrCreate: {
          where: {
            name: activityName,
          },
          create: {
            name: activityName,
          }
        }
      },

    }
  })
}

export function getOpenChallenges({ userId }: { userId: User["id"] }) {

  return prisma.challenge.findMany({
    where: { published: true, public: true, users: { none: { id: userId } } },
    include: { activity: true },

  });
}

export function getActiveChallengesListItems({ userId }: { userId: User["id"] }) {
  return prisma.challenge.findMany({
    where: { published: true, users: { some: { id: userId } } },
    select: { id: true, title: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getChallengeActivityEntries({ challengeId, activityId }: { challengeId: Challenge["id"], activityId: Activity["id"] }) {
  return prisma.challengeActivity.findFirst({
    where: { challenge: { id: challengeId }, activity: { id: activityId } },
    include: { entries: true },
  })
}

export function getChallengeEntries({ id, userId }: Pick<Challenge, "id"> & { userId: User["id"] }) {
  return prisma.entry.findMany({
    where: { challengeId: id, user: { id: userId } },
  })

}

export function adminGetChallengeEntries({ challengeId }: { challengeId: Challenge["id"] }) {
  return prisma.entry.findMany({
    where: { challengeId },
    include: { user: { include: { profile: { select: { firstName: true, lastName: true } } } } },
  });
}

export function getTotalSteps({ id, userId }: Pick<Challenge, "id"> & { userId: User["id"] }) {
  return prisma.entry.aggregate({
    _sum: {
      amount: true
    },
    where: {
      AND: [
        { userId: { equals: userId } },
        { challengeId: { equals: id } }
      ]
    }
  })
}

export function joinChallengeById({ id, userId }: { id: Challenge["id"], userId: User["id"] }) {
  return prisma.challenge.update({
    where: { id },
    data: {
      users: {
        connect: {
          id: userId
        }
      }
    }
  })
}

export function getChallengeLeaderboard({ id }: Pick<Challenge, "id">) {
  return prisma.entry.findMany({
    where: { challengeId: id },
    include: { user: { select: { profile: true } } },
    orderBy: {
      user: {
        email: "asc"
      }
    }
  })

}

export function createChallengeEntry({ challengeId, userId, activityId, date, amount, notes }:
  {
    challengeId: ChallengeActivity["challengeId"],
    userId: User["id"],
    activityId: ChallengeActivity["activityId"],
    date: Date,
    amount: number,
    notes?: string
  }) {
  return prisma.entry.create({

    data: {
      challengeId,
      userId,
      activityId,
      date,
      amount,
      notes
    }
  })
}

export function getEntryById(id: Entry["id"]) {
  return prisma.entry.findFirst({
    where: { id }
  });
}

export function updateEntry(id: Entry["id"], data: Partial<Entry>) {
  return prisma.entry.update({
    where: { id },
    data
  })
}

export function deleteEntry({
  id,
  userId,
}: Pick<Entry, "id"> & { userId: User["id"] }) {
  return prisma.entry.deleteMany({
    where: { id, userId },
  });
}