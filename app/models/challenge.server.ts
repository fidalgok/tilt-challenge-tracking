import type { Challenge, User } from "@prisma/client";

import { prisma } from "~/db.server";

export type {Challenge, Entry} from "@prisma/client";

export function getChallenge({id, userId}: Pick<Challenge, "id"> & {userId: User["id"]}) {
   
  return prisma.challenge.findFirst({
    where: { id, published: true, users:{some: {id: userId}} },
    include: { activity: true },
    
  });
}

export function getActiveChallengesListItems({userId}: {userId: User["id"]}) {
    return prisma.challenge.findMany({
        where: { published: true, users:{some: {id: userId}} },
        select: { id: true, title: true },
        orderBy: { createdAt: "desc" },});
}

export function getChallengeEntries({id, userId}: Pick<Challenge, "id"> & {userId: User["id"]}) {
    return prisma.user.findMany({
        where: {id: userId, entries: {some: {challengeId: id}}},
        select: {entries: true}
    })
}