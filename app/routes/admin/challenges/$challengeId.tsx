import { Outlet, useLoaderData } from "@remix-run/react";
import { json, LoaderFunction } from "@remix-run/node";
import { adminGetChallenge, ChallengeWithActivitiesUsers } from "~/models/challenge.server";
import invariant from "tiny-invariant";



import { getUser } from "~/session.server";
import NavBar from "~/components/NavBar";
import NavBarLink from "~/components/NavBarLink";

type LoaderData = {
    challenge: ChallengeWithActivitiesUsers
}

export const loader: LoaderFunction = async ({ request, params }) => {

    const user = await getUser(request);

    invariant(params.challengeId, "challengeId not found");
    const challenge = await adminGetChallenge({ id: params.challengeId });
    if (!challenge) {
        throw new Response("Not Found", { status: 404 });
    }
    return json<LoaderData>({ challenge });
}


export default function AdminChallengesViewChallengePage() {
    const data = useLoaderData() as LoaderData;
    return (
        <div>
            <h3 className="text-3xl font-bold">{data.challenge.title}</h3>
            <NavBar>
                <NavBarLink to={`./`}>Challenge Details</NavBarLink>
                <NavBarLink to={`./entries`}>Challenge Entries</NavBarLink>
                <NavBarLink to={`./users`}>Challenge Members</NavBarLink>
            </NavBar>


            <Outlet />

            <pre><code>{JSON.stringify(data, null, 2)}</code></pre>
        </div>
    );
}

