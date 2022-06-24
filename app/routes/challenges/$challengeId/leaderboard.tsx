import { useMatchesData } from "~/utils";

import type { LoaderData } from '../$challengeId'

export default function ChallengeLeaderboardPage() {
    const { leaderboard, challenge } = useMatchesData('routes/challenges/$challengeId') as LoaderData;

    return <div>
        {leaderboard.map((entry, index) => (
            <div key={`${entry.name}-${entry.steps}`} className="flex border-b border-slate-100 py-3 px-4 last:border-b-0">
                <div className="mr-4 flex items-center text-lg font-bold">{index + 1}</div>
                <div className="grow flex flex-col">
                    {entry.name}
                    <br />
                    <span className="text-sm">{entry.steps} {challenge.activity[0].unit}</span>
                </div>

            </div>
        ))}
    </div>
}