import { json } from "@remix-run/node";
import { Outlet, useCatch, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";
import type { LoaderArgs } from "@remix-run/node";

import { Entry, ChallengeWithActivities, getChallengeLeaderboard } from "~/models/challenge.server";
import { getChallengeEntries, getChallenge, getTotalAmount } from "~/models/challenge.server";

import { requireUserId } from "~/session.server";
import NavBar from "~/components/NavBar";
import NavBarLink from "~/components/NavBarLink";
import { isAfter } from "date-fns";
import { parseDateStringFromServer } from "~/utils";



export type LoaderData = {
    challenge: ChallengeWithActivities;
    entries: Entry[];
    leaderboard: {
        name: string;
        steps: number;
    }[];
    totalSteps: number;
    maybeMobile: boolean;
}

type LeaderBoardReduceReturnType = {
    name: string;
    amount: number;
    userId: string;
}

export const loader = async ({ request, params }: LoaderArgs) => {
    const userId = await requireUserId(request);
    // get request headers
    const userAgent = request.headers.get("user-agent");
    const maybeMobile = userAgent ? userAgent.toLowerCase().indexOf('mobi') > -1 : false;
    invariant(params.challengeId, "challengeId not found");

    const challenge = await getChallenge({ id: params.challengeId, userId });
    if (!challenge) {
        throw new Response("Not Found", { status: 404 });
    }

    const entries = await getChallengeEntries({ id: params.challengeId, userId });

    const aggregation = await getTotalAmount({ id: params.challengeId, userId });

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
        }, []).map(users => ({ name: users.name, steps: users.amount })).sort((userA: { name: string; steps: number }, userB: { name: string; steps: number }) => {
            if (userA.steps > userB.steps) {
                return -1;
            }
            return 1;
        });


    return json({ challenge, entries: entries, totalSteps: aggregation._sum.amount || 0, leaderboard, maybeMobile });

}


export default function ChallengeDetailsPage() {
    const data = useLoaderData<typeof loader>();



    return (
        <div className='max-w-6xl'>
            <div className="mb-2 sm:mb-6">
                <h3 className="text-3xl font-bold">{data.challenge.title}</h3>
                <NavBar>
                    <NavBarLink to={`.`} end>Challenge Details</NavBarLink>
                    {isAfter(new Date(), new Date(parseDateStringFromServer(data.challenge.startDate.toString()))) && (
                        <>
                            <NavBarLink to={`entries`}>Entries</NavBarLink>
                            <NavBarLink to={`leaderboard`}>Full Leaderboard</NavBarLink>
                        </>
                    )}
                </NavBar>
            </div>

            <Outlet />
        </div>
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
    console.error(caught.data)
    throw new Error(`Unexpected caught response with status: ${caught.status} ${JSON.stringify(caught.data, null, 2)}`);
}

