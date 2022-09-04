import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getClosedChallengesListItems } from "~/models/challenge.server";
import { requireUserId } from "~/session.server";

export async function loader({ request, params }: LoaderArgs) {
    let userId = await requireUserId(request);
    const completedChallenges = await getClosedChallengesListItems({ userId });
    return json({ challenges: completedChallenges });
}

export default function PastChallengeRoute() {
    let data = useLoaderData<typeof loader>();

    return (
        <div>
            <h2 className="text-2xl font-semibold">View Past Challenges:</h2>
            <div>
                {data.challenges.map(challenge => (
                    <div key={challenge.id}>
                        {challenge.title}
                    </div>
                ))}
            </div>
        </div>
    )
}