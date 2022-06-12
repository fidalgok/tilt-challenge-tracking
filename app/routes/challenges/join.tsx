import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { ActionFunction, LoaderFunction, json } from "@remix-run/node";

import { ChallengeWithActivities, getOpenChallenges, joinChallengeById } from "~/models/challenge.server";
import { requireUserId } from "~/session.server";
import { format } from "date-fns";
import { getUTCDate, getUTCMonth } from "~/utils";

export type LoaderData = {

    challenges: Awaited<ReturnType<typeof getOpenChallenges>>
}

type ActionData = {
    errors?: {
        challengeId?: string;
    }
}

export const action: ActionFunction = async ({ request }) => {
    const userId = await requireUserId(request);
    const formData = await request.formData();
    const challengeId = formData.get("id");

    if (typeof challengeId !== 'string' || challengeId.length == 0) {
        return json<ActionData>({ errors: { challengeId: "Challenge id is required" } }, { status: 400 });
    }

    console.log({ userId, challengeId });
    const joinedChallenge = await joinChallengeById({ id: challengeId, userId });
    return null;
}



export const loader: LoaderFunction = async ({ request, params }) => {
    const userId = await requireUserId(request);

    const challenges = await getOpenChallenges({ userId });

    return json<LoaderData>({ challenges });
}

export default function JoinOpenChallengesPage() {
    const data = useLoaderData() as LoaderData;
    console.log(data)

    return (
        <div>
            {data?.challenges.length ? (
                <div>
                    <p>Here are the open challenges to join</p>
                    <div>
                        {data.challenges.map((challenge) => (
                            <ChallengeItem key={challenge.id} challenge={challenge} />


                        ))}
                    </div>
                </div>

            ) : (
                <div>It looks like there aren't any active challenges to join at this time.</div>
            )}
        </div>
    );
}

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function ChallengeItem({ challenge }: { challenge: ChallengeWithActivities }) {
    let fetcher = useFetcher();
    let isJoining = fetcher.submission?.formData.get("id") == challenge.id;
    const startDate = `${format(
        new Date(
            2022,
            getUTCMonth(new Date(challenge.startDate).getTime()),
            getUTCDate(new Date(challenge.startDate).getTime())
        )
        , 'MMMM, dd')}`;
    const endDate = `${format(
        new Date(
            2022,
            getUTCMonth(new Date(challenge.endDate).getTime()),
            getUTCDate(new Date(challenge.endDate).getTime())
        )
        , 'MMMM, dd')}`;

    return (
        <div key={challenge.id}>
            <h3>{challenge.title}</h3>
            <p>{challenge.description}</p>
            <p>It starts on {startDate} and ends on {endDate}</p>
            <fetcher.Form method="post">
                <button value={challenge.id} name="id" type="submit" disabled={isJoining}>
                    {isJoining ? "Joining..." : "Join"}
                </button>
            </fetcher.Form>
        </div>
    )
}