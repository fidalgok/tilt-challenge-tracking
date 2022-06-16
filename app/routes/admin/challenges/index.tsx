import { Link, useLoaderData } from "@remix-run/react";
import { json, LoaderFunction } from "@remix-run/node";
import { getChallengesByAdminId } from "~/models/challenge.server";

export type LoaderData = {
    challenges: Awaited<ReturnType<typeof getChallengesByAdminId>>;
}


export const loader: LoaderFunction = async ({ request }) => {

    const challenges = await getChallengesByAdminId();

    return json({ challenges });
}

export default function AdminChallengesIndexPage() {
    const loaderData = useLoaderData() as LoaderData;

    return (
        <div>
            TODO: add dashboard for the various admin duties
            <pre><code>
                {JSON.stringify(loaderData, null, 2)}
            </code></pre>
        </div>
    );
}
