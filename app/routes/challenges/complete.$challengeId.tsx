import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/node";
import invariant from "tiny-invariant";
import { getChallenge, getChallengeEntries, getChallengeLeaderboard, getTotalAmount } from "~/models/challenge.server";
import { requireUserId } from "~/session.server";
import { useCatch, useLoaderData, useParams } from "@remix-run/react";


type LeaderBoardReduceReturnType = {
    name: string;
    amount: number;
    userId: string;
}

export const loader = async ({ request, params }: LoaderArgs) => {
    const userId = await requireUserId(request);
    const challengeId = params.challengeId;
    invariant(challengeId, "Challenge ID is missing from the URL");

    const challenge = await getChallenge({ id: challengeId, userId });
    if (!challenge) {
        throw new Response("Not Found", { status: 404 });
    }

    const entries = await getChallengeEntries({ id: challengeId, userId });

    const aggregation = await getTotalAmount({ id: challengeId, userId });

    const leaderboardData = await getChallengeLeaderboard({ id: challengeId });
    const leaderboard = leaderboardData
        .map((entry) => ({
            name: `${entry.user?.profile?.firstName || 'anonymous'} ${entry.user?.profile?.lastName || ''}`,
            userId: entry.userId,
            amount: entry.amount || 0
        })).reduce<LeaderBoardReduceReturnType[]>((acc, entry) => {
            const exists = acc.find((e) => e.userId === entry.userId);
            if (!exists) {
                acc.push(entry)
            } else {
                exists.amount ? exists.amount += entry.amount : entry.amount;
            }
            return acc;
        }, []).sort((userA: { userId: string, name: string; amount: number }, userB: { userId: string, name: string; amount: number }) => {
            if (userA.amount > userB.amount) {
                return -1;
            }
            return 1;
        });

    return json({ challenge, entries, totalVolume: aggregation._sum.amount, leaderboard, userId: userId })
}

export default function ChallengeCompleteRoute() {
    const data = useLoaderData<typeof loader>();
    let idx = data.leaderboard.findIndex(p => p.userId === data.userId);
    let rank = idx === -1 ? 'something bad happened' : idx + 1;
    return (
        <div>
            <p className="text-2xl font-semibold mb-8">{data.challenge.title}{" "}Results
            </p>
            <div className="flex gap-8">
                <div className="rounded-lg shadow-sm ring-1 ring-black ring-opacity-5 col-span-3 md:col-span-2 xl:col-auto py-3 px-4">

                    <div>
                        <div className="mb-6">
                            <h3 className="text-2xl font-semibold mb-4">Total {data.challenge.activity[0].unit}</h3>
                            <p className="text-center text-lg">{data.totalVolume}</p>
                        </div>
                        <div>
                            <h3 className="text-2xl font-semibold mb-4">Your Rank</h3>
                            <p className="text-center text-lg">{rank}</p>
                        </div>




                    </div>
                </div>
                <div className="rounded-lg shadow-sm ring-1 ring-black ring-opacity-5 col-span-3 md:col-span-2 xl:col-auto py-3 px-4">
                    <h3 className="text-2xl font-semibold mb-4">The Leaderboard</h3>
                    {data.leaderboard.map((entry, index) => (
                        <div key={`${entry.userId}`} className="flex border-b border-slate-100 pb-3 px-4 last:border-b-0">
                            <div className="mr-4 flex items-center text-lg font-bold">{index + 1}</div>
                            <div className="grow flex flex-col">
                                {entry.name}
                                <br />
                                <span className="text-sm">{entry.amount} {data.challenge.activity[0].unit}</span>
                            </div>

                        </div>
                    ))}
                </div>


            </div>

        </div>
    )
}

export function CatchBoundary() {
    const caught = useCatch();
    const params = useParams();

    if (caught.status === 404) {
        return (
            <div className="p-12 text-red-500">
                No challenge found with the ID of "{params.challengeId}"
            </div>
        );
    }

    throw new Error(`Unexpected caught response with status: ${caught.status}`);
}

export function ErrorBoundary({ error }: { error: Error }) {
    console.error(error);

    return (
        <div className="absolute inset-0 flex justify-center bg-red-100 pt-4">
            <div className="text-red-brand text-center">
                <div className="text-[14px] font-bold">Oh snap!</div>
                <div className="px-2 text-[12px]">There was a problem. Sorry.</div>
            </div>
        </div>
    );
}