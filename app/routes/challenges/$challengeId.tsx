import { Profile } from "@prisma/client";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, Outlet, useCatch, useLoaderData, useLocation } from "@remix-run/react";
import invariant from "tiny-invariant";



import { Entry, ChallengeWithActivities, getChallengeLeaderboard } from "~/models/challenge.server";
import { getChallengeEntries, getChallenge, getTotalSteps } from "~/models/challenge.server";

import { requireUserId } from "~/session.server";

import { daysBetween, UTCFormattedDate } from "~/utils";

type LoaderData = {
    challenge: ChallengeWithActivities;
    entries: Entry[];
    leaderboard: {
        name: string;
        steps: number;
    }[];
    totalSteps: number;
}

type LeaderBoardReduceReturnType = {
    name: string;
    amount: number;
    userId: string;
}

export const loader: LoaderFunction = async ({ request, params }) => {
    const userId = await requireUserId(request);
    invariant(params.challengeId, "challengeId not found");

    const challenge = await getChallenge({ id: params.challengeId, userId });
    if (!challenge) {
        throw new Response("Not Found", { status: 404 });
    }

    const [entries] = await getChallengeEntries({ id: params.challengeId, userId });
    const aggregation = await getTotalSteps({ id: params.challengeId, userId });

    const leaderboardData = await getChallengeLeaderboard({ id: params.challengeId });
    const leaderboard = leaderboardData
        .map((entry) => ({
            name: `${entry.user?.profile?.firstName || 'anonymous'} ${entry.user?.profile?.lastName || ''}`,
            userId: entry.userId,
            amount: entry.amount || 0
        }))
        .reduce<LeaderBoardReduceReturnType[]>((acc, entry) => {
            const exists = acc.find((e) => e.userId === entry.userId);
            if (!exists) {
                acc.push(entry)
            } else {
                exists.amount ? exists.amount += entry.amount : entry.amount;
            }
            return acc;
        }, []).map(users => ({ name: users.name, steps: users.amount })).sort();


    return json<LoaderData>({ challenge, entries: entries?.entries, totalSteps: aggregation._sum.amount || 0, leaderboard });

}

export default function ChallengeDetailsPage() {
    const data = useLoaderData() as LoaderData;
    const totalSteps = Number(data.totalSteps);


    return (
        <>
            <div className="mb-8">
                <h3 className="text-3xl font-bold">{data.challenge.title}</h3>
                <p className="py-6">{data.challenge.description}</p>


            </div>
            <div className="grid grid-cols-[1fr_minmax(200px,_max-content)]">

                <div>

                    <div className="flex py-4 mb-8">

                        <div className="w-1/3">
                            <h4 className="text-center text-2xl font-bold mb-3">{data.challenge.activity[0].unit} Completed</h4>
                            <p className="text-center text-4xl font-extrabold">{data.totalSteps}</p>
                        </div>
                        <div className="w-1/3">
                            <h4 className="text-center text-2xl font-bold mb-3">{data.challenge.activity[0].unit} Left</h4>
                            <p className="text-center text-4xl font-extrabold">{(data.challenge.activity[0]?.amount || 0) - totalSteps}</p>
                        </div>
                        <div className="w-1/3">
                            <h4 className="text-center text-2xl font-bold mb-3">Days Left</h4>
                            <p className="text-center text-4xl font-extrabold">{daysBetween(new Date(), data.challenge.endDate) + 1}</p>
                        </div>
                    </div>

                    <Outlet />
                </div>
                <div className="self-start pt-4 px-2 border rounded border-slate-100">
                    <h4 className="text-2xl font-bold">Leaderboard</h4>
                    <hr />
                    {data.leaderboard.map((entry, index) => (
                        <div key={entry.name} className="flex border-b border-slate-100 py-3 last:border-b-0">
                            <div className="mr-4 flex items-center text-lg font-bold">{index + 1}</div>
                            <div className="grow flex flex-col">
                                {entry.name}
                                <br />
                                <span className="text-sm">{entry.steps} {data.challenge.activity[0].unit}</span>
                            </div>

                        </div>
                    ))}
                </div>
            </div>

        </>
    )
}

export function ErrorBoundary({ error }: { error: Error }) {
    console.error(error);

    return <div>An unexpected error occurred: {error.message}</div>;
}

export function CatchBoundary() {
    const caught = useCatch();

    if (caught.status === 404) {
        return <div>Challenge not found</div>;
    }

    throw new Error(`Unexpected caught response with status: ${caught.status}`);
}

