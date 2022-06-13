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


    return (
        <div>
            {data?.challenges.length ? (
                <div>
                    <p>Here are the open challenges to join</p>
                    <div className="flex flex-wrap mt-8">
                        {data.challenges.map((challenge) => (
                            <ChallengeItem key={challenge.id} challenge={challenge} />


                        ))}
                    </div>
                </div>

            ) : (
                <div>It looks like there aren't any challenges to join at this time. You can click one of your active challenges on the left to start tracking!</div>
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
        , 'MMMM do')}`;
    const endDate = `${format(
        new Date(
            2022,
            getUTCMonth(new Date(challenge.endDate).getTime()),
            getUTCDate(new Date(challenge.endDate).getTime())
        )
        , 'MMMM do')}`;

    return (
        <div key={challenge.id} className="p-6 max-w-sm  bg-white rounded-xl shadow-lg flex flex-col items-start ">
            <h3 className="text-2xl mb-4 font-bold">{challenge.title}</h3>
            <p className="mb-2"><span className="block font-bold">When:</span> {startDate} through {endDate}</p>
            <p className="mb-6"><span className="block font-bold">What:</span> {challenge.description}</p>
            <fetcher.Form method="post">
                <button className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400" value={challenge.id} name="id" type="submit" disabled={isJoining}>
                    {isJoining ? "Joining..." : "Join"}
                </button>
            </fetcher.Form>
        </div>
    )
}