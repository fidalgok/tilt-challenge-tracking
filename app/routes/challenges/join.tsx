import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import type { LoaderArgs } from "@remix-run/node";
import { ActionFunction, json, redirect } from "@remix-run/node";

import { ChallengeWithActivities, getOpenChallenges, joinChallengeById } from "~/models/challenge.server";
import { requireUserId } from "~/session.server";
import { format } from "date-fns";
import { getUTCDate, getUTCMonth, useWindowSize } from "~/utils";

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
    return redirect(`/challenges/${joinedChallenge.id}`);
}



export const loader = async ({ request, params }: LoaderArgs) => {
    const userId = await requireUserId(request);

    const challenges = await getOpenChallenges({ userId });

    return json<LoaderData>({ challenges });
}

export default function JoinOpenChallengesPage() {
    const data = useLoaderData<typeof loader>();
    const { width, height } = useWindowSize();

    const isMobile = width ? width < 640 : false;

    return (
        <div>
            {data?.challenges.length ? (
                <div>
                    <h2 className="text-2xl font-semibold">Join a Challenge:</h2>
                    <div className="flex flex-wrap mt-8 gap-4">
                        {data.challenges.map((challenge) => (
                            // @ts-ignore
                            <ChallengeItem key={challenge.id} challenge={challenge} />


                        ))}
                    </div>
                </div>

            ) : (
                <div>
                    It looks like there aren't any challenges to join at this time.
                    If you are part of an active challenge you can find it {isMobile ? "in the menu above" : "in the left menu"} to start tracking!
                </div>
            )}
        </div>
    );
}

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
        <div key={challenge.id} className="p-6 w-96 bg-white rounded-xl shadow-lg flex flex-col">
            <div>

                <h3 className="text-2xl mb-4 font-bold">{challenge.title}</h3>
                <p className="mb-2"><span className="block font-bold">When:</span> {startDate} through {endDate}</p>
                <p className="mb-6 whitespace-pre-line"><span className="block font-bold">What:</span> {challenge.description}</p>
            </div>
            <fetcher.Form method="post" className="grow flex items-end">
                <button className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400" value={challenge.id} name="id" type="submit" disabled={isJoining}>
                    {isJoining ? "Joining..." : "Join"}
                </button>
            </fetcher.Form>
        </div>
    )
}