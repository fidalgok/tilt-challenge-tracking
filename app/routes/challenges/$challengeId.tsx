import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useCatch, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

import type {Challenge, Entry} from "~/models/challenge.server";
import { getChallengeEntries, getChallenge } from "~/models/challenge.server";
//TODO: bring in the ability to create and delete entries
//TODO: bring in the ability to aggregate entries for the leaderboard
import { requireUserId } from "~/session.server";

type LoaderData= {
    challenge: Challenge;
    entries: Entry[];
}

export const loader: LoaderFunction = async ({ request, params }) => {
    const userId = await requireUserId(request);
    invariant(params.challengeId, "challengeId not found");

    const challenge = await getChallenge({ id: params.challengeId, userId });
    if(!challenge) {
        throw new Response("Not Found", { status: 404 });
    }
    
    const [entries] = await getChallengeEntries({ id: params.challengeId, userId });
    
    return json<LoaderData>({ challenge, entries: entries?.entries });

}

export default function ChallengeDetailsPage(){
    const data = useLoaderData() as LoaderData;

    return (
        <div>
            <p>You've reached the challenge details page.</p>
            <pre>
                <code>

            {JSON.stringify(data, null, 2)}
                </code>
            </pre>
        </div>
    )
}