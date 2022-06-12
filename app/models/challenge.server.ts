import type { Challenge, Prisma, User, ChallengeActivity, Entry } from "@prisma/client";

import { prisma } from "~/db.server";

export type ChallengeWithActivities = Prisma.ChallengeGetPayload<{
  include: { activity: true }
}>

export type { Challenge, Entry } from "@prisma/client";

export function getChallenge({ id, userId }: Pick<Challenge, "id"> & { userId: User["id"] }) {

  return prisma.challenge.findFirst({
    where: { id, published: true, users: { some: { id: userId } } },
    include: { activity: true },

  });
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

export function getChallengeEntries({ id, userId }: Pick<Challenge, "id"> & { userId: User["id"] }) {
  return prisma.user.findMany({
    where: { id: userId, entries: { some: { challengeId: id } } },
    select: { entries: true }
  })
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