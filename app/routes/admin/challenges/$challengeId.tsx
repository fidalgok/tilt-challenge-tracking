import { Link, NavLink, Outlet, useLoaderData } from "@remix-run/react";
import { json, LoaderFunction, redirect } from "@remix-run/node";
import { adminGetChallenge, ChallengeWithActivitiesUsers, Entry } from "~/models/challenge.server";
import invariant from "tiny-invariant";



import { getUser } from "~/session.server";

type LoaderData = {
    challenge: ChallengeWithActivitiesUsers
}

export const loader: LoaderFunction = async ({ request, params }) => {

    const user = await getUser(request);
    if (!user || user.role !== 'ADMIN' || user.email !== "kyle.fidalgo@gmail.com") {
        return redirect("/challenges");
    }
    invariant(params.challengeId, "challengeId not found");
    const challenge = await adminGetChallenge({ id: params.challengeId });
    if (!challenge) {
        throw new Response("Not Found", { status: 404 });
    }
    return json<LoaderData>({ challenge });
}


export default function AdminChallengesViewChallengePage() {
    const data = useLoaderData();
    return (
        <div>

            <p>
                Challenge details here.
                can edit certain fields if there haven't been entries yet.
            </p>
            <nav className="flex py-2 px-1">
                <NavLink to="./entries">Challenge Entries</NavLink>
            </nav>
            <Outlet />

            <pre><code>{JSON.stringify(data, null, 2)}</code></pre>
        </div>
    );
}

