import type { Challenge, Prisma, User, ChallengeActivity } from "@prisma/client";

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