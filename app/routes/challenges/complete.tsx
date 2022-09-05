import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getDate, getMonth } from "date-fns";
import { getClosedChallenges } from "~/models/challenge.server";
import { requireUserId } from "~/session.server";
import { parseDateStringFromServer } from "~/utils";

export async function loader({ request, params }: LoaderArgs) {
    let userId = await requireUserId(request);
    const completedChallenges = await getClosedChallenges({ userId });
    return json({ challenges: completedChallenges });
}

export default function PastChallengeRoute() {
    let data = useLoaderData<typeof loader>();

    function getEndDate(date: string) {
        let parsedDate = parseDateStringFromServer(date);
        let month = getMonth(new Date(parsedDate)) + 1
        let day = getDate(new Date(parsedDate));
        return `${month} / ${day}`
    }

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4">View Past Challenges:</h2>
            <div className="flex flex-col gap-4">
                {data.challenges.map(challenge => (
                    <div
                        className="px-2 py-4 border rounded border-gray-100 shadow"
                        key={challenge.id}>
                        <p className="text-lg font-semibold">

                            {challenge.title}{" "}
                        </p>
                        <p className="mb-2">Completed on - <span>{getEndDate(challenge.endDate)}</span></p>
                        <Link
                            className="text-blue-500 hover:underline"
                            to={`/challenges/complete/${challenge.id}`}>Challenge Results</Link>
                    </div>
                ))}
            </div>
        </div>
    )
}