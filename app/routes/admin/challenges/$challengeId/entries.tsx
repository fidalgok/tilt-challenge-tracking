import { useActionData, useLoaderData } from "@remix-run/react";

import { Entry, User } from "@prisma/client";
import { ActionFunction, json } from "@remix-run/node";
import type { LoaderArgs } from "@remix-run/node";
import { adminGetChallengeEntries, deleteEntry } from "~/models/challenge.server";

import invariant from "tiny-invariant";
import { requireUserId } from "~/session.server";
import { AdminEntriesCalendar } from "~/components/AdminEntriesCalendar";


type ActionData = {
    errors?: {
        id?: string;
        userId?: string;
    }
}

export const action: ActionFunction = async ({ request }) => {
    const user = await requireUserId(request);
    let formData = await request.formData();
    let { _action, ...values } = Object.fromEntries(formData);

    if (!values?.entryId || typeof values.entryId !== "string") {
        return json<ActionData>(
            { errors: { id: "The entry id is missing." } },
            { status: 400 }
        );
    }
    if (!values?.userId || typeof values.userId !== "string") {
        return json<ActionData>(
            { errors: { userId: "The user id is missing." } },
            { status: 400 }
        );
    }

    if (_action === "delete") {
        // delete entry
        //console.log({ id: values.entryId, userId: values.userId })
        return deleteEntry({ id: values.entryId, userId: values.userId })
    } else {
        // do nothing for now, may want to come back and add other capabilities later.
    }
    return null;
}

export const loader = async ({ request, params }: LoaderArgs) => {
    // get request headers
    const userAgent = request.headers.get("user-agent");
    const maybeMobile = userAgent ? userAgent.toLowerCase().indexOf('mobi') > -1 : false;
    invariant(params.challengeId, "challengeId not found");

    const entries = await adminGetChallengeEntries({ challengeId: params.challengeId });
    return json({ entries, maybeMobile });

}

export default function AdminChallengeIdEntriesPage() {
    const data = useLoaderData<typeof loader>();
    const actionData = useActionData() as ActionData;

    return (
        <div>
            TODO: entries for challenge ID and activity ID
            {/* @ts-ignore */}
            <AdminEntriesCalendar entries={data.entries} />
        </div>
    );
}
