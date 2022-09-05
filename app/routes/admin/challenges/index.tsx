import { Link, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import type { LoaderArgs } from "@remix-run/node";
import { getChallengesByAdminId } from "~/models/challenge.server";
import type { ChallengeWithActivities } from "~/models/challenge.server";





export const loader = async ({ request }: LoaderArgs) => {

    const challenges = await getChallengesByAdminId();

    return json({ challenges });
}

export default function AdminChallengesIndexPage() {
    const loaderData = useLoaderData<typeof loader>();

    return (
        <div>
            TODO: add dashboard for the various admin duties
            <div className="grid grid-cols-[repeat(auto-fit,385px)] gap-4  ">
                {loaderData.challenges.map((challenge) => (
                    // @ts-ignore
                    <ChallengeItem key={challenge.id} challenge={challenge} />
                ))}
            </div>
            <pre><code>
                {JSON.stringify(loaderData, null, 2)}
            </code></pre>
        </div>
    );
}


function ChallengeItem({ challenge }: { challenge: ChallengeWithActivities }) {


    const startDate = challenge.startDate.toString();
    const endDate = challenge.endDate.toString()

    return (
        <div key={challenge.id} className="p-6  bg-white rounded-xl shadow-lg flex flex-col items-start ">
            <h3 className="text-2xl mb-4 font-bold">{challenge.title}</h3>
            <p className="mb-2">
                <span className="block font-bold">When:</span>
                <time dateTime={startDate}>{challenge.startDate}</time> through <time dateTime={endDate}>{challenge.endDate}</time>
            </p>
            <p className="mb-6">
                <span className="block font-bold">What:</span> {challenge.description}
            </p>
            <Link to={`${challenge.id}`}>View</Link>
        </div>
    )
}