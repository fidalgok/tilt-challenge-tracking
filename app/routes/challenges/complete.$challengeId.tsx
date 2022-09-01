import type { LoaderArgs } from "@remix-run/server-runtime";
import { json } from "@remix-run/node";
import invariant from "tiny-invariant";
import { getChallenge, getChallengeEntries, getChallengeLeaderboard, getTotalAmount } from "~/models/challenge.server";
import { requireUserId } from "~/session.server";
import { useLoaderData } from "@remix-run/react";


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
            This challenge is complete! Here are the results.
            <div className="flex gap-6">
                <div>
                    <h2>Your Stats</h2>
                    <div>

                        <div>
                            <h3>Your Rank</h3>
                            <p>{rank}</p>
                        </div>
                        <div>
                            <h3>Total {data.challenge.activity[0].unit}</h3>
                            <p>{data.totalVolume}</p>
                        </div>



                    </div>
                </div>
                <div>
                    <h2>The Leaderboard</h2>
                    {data.leaderboard.map((entry, index) => (
                        <div key={`${entry.userId}`} className="flex border-b border-slate-100 py-3 px-4 last:border-b-0">
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
            <div>
                <h3>Your Entries</h3>
                <div>TODO: show entries</div>
            </div>
        </div>
    )
}