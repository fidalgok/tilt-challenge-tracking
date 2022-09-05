import type { ActionFunction, LoaderArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useParams, useMatches, useCatch, useLoaderData, Link } from "@remix-run/react";
import * as React from "react";

import type { Entry } from "~/models/challenge.server"
import { getEntryById, updateEntry } from "~/models/challenge.server";
import { requireUserId } from "~/session.server";

import type { LoaderData as challengeMatchesData } from "~/routes/challenges/$challengeId";
import invariant from "tiny-invariant";
import { format, getDate, getYear } from "date-fns";
import { parseDateStringFromServer, prepareDateForServer } from "~/utils";


type ActionData = {
    errors?: {
        amount?: string;
        notes?: string;
        challengeId?: string;
        activityId?: string;
        date?: string;

    }
}

type LoaderData = {
    entry: Entry
}

const months: { [key: string]: number } = {
    "Jan": 1,
    "Feb": 2,
    "Mar": 3,
    "Apr": 4,
    "May": 5,
    "Jun": 6,
    "Jul": 7,
    "Aug": 8,
    "Sep": 9,
    "Oct": 10,
    "Nov": 11,
    "Dec": 12,
}

export const action: ActionFunction = async ({ request, params }) => {
    const userId = await requireUserId(request);

    const formData = await request.formData();
    const amount = Number(formData.get("amount"));
    const notes = formData.get("notes");
    const date = formData.get('activityDate');
    if (typeof date !== 'string' || date.length == 0) {
        return json<ActionData>(
            { errors: { date: "Whoops! The activity date is missing." } },
            { status: 400 }
        );
    }

    const activityDate = new Date(date);
    if (activityDate instanceof Date && isNaN(activityDate.getTime())) {
        // not a valid date
        return json<ActionData>(
            { errors: { date: "Whoops! There is something wrong with the entry date." } },
            { status: 400 }
        );
    }


    //hidden fields
    const challengeId = params.challengeId;
    const entryId = params.entryId;
    const activityId = formData.get("activityId");



    if (Number.isNaN(amount) || amount < 0) {
        return json<ActionData>(
            { errors: { amount: "Whoops! Looks like you forgot to enter an amount." } },
            { status: 400 }
        );
    }

    if (typeof notes !== "string") {
        return json<ActionData>(
            { errors: { notes: "Notes are required." } },
            { status: 400 }
        )
    }

    if (typeof challengeId !== "string" || challengeId.length === 0) {
        return json<ActionData>(
            { errors: { challengeId: "Challenge ID is required." } },
            { status: 400 }
        )
    }

    if (typeof activityId !== "string" || activityId.length === 0) {
        return json<ActionData>(
            { errors: { activityId: "Activity ID is required." } },
            { status: 400 });
    }
    if (typeof entryId !== "string" || entryId.length === 0) {
        return json<ActionData>(
            { errors: { activityId: "Entry ID is required." } },
            { status: 400 });
    }

    const challengeEntry = await updateEntry(entryId, {

        userId,
        amount,
        notes,
        challengeId,
        activityId,
        date: activityDate

    });



    return redirect(`/challenges/${challengeId}`);
}

export const loader = async ({ request, params }: LoaderArgs) => {
    const userId = await requireUserId(request);
    invariant(params.entryId, "Entry ID not found");
    const entry = await getEntryById(params.entryId);
    if (!entry) {
        throw new Response("Not Found", { status: 404 });
    }
    return json({ entry });
}

export default function EditChallengeEntryPage() {
    const actionData = useActionData() as ActionData;
    const loaderData = useLoaderData<typeof loader>();

    const activityDate = parseDateStringFromServer(loaderData.entry.date.toString());
    const month = format(new Date(activityDate), "MMM");
    const day = getDate(new Date(activityDate));

    const matches = useMatches();
    const params = useParams();

    const amountRef = React.useRef<HTMLInputElement>(null);
    const notesRef = React.useRef<HTMLTextAreaElement>(null);

    const match = matches.find(match => match.pathname === `/challenges/${params.challengeId}`);

    const matchesData = match?.data as challengeMatchesData;

    React.useEffect(() => {
        if (actionData?.errors?.amount) {
            amountRef.current?.focus();
        } else if (actionData?.errors?.notes) {
            notesRef.current?.focus();
        }
    }, [actionData]);
    // shadow-sm focus:ring-blue-500 focus:border-blue-500 px-2 block w-full  border border-gray-300 rounded-md
    return (
        <Form
            method="post"
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                width: "100%"
            }}
        >
            <div>
                <p>Edit Entry for {month} {day}</p>

            </div>
            <div>
                <label className="flex w-full flex-col gap-1">
                    <span>{matchesData.challenge?.activity[0].unit} Amount: </span>
                    <input
                        ref={amountRef}
                        name="amount"
                        defaultValue={loaderData?.entry?.amount || 0}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 px-2 block w-full  border border-gray-300 rounded-md"
                        aria-invalid={actionData?.errors?.amount ? true : undefined}
                        aria-errormessage={actionData?.errors?.amount ? "amount-error" : undefined}
                        type="number"

                    />
                </label>
                {actionData?.errors?.amount && (
                    <div className="text-red-500 text-sm italic" id="amount-error">
                        {actionData.errors.amount}
                    </div>
                )}
            </div>
            <div>
                <label className="flex w-full flex-col gap-1">
                    <span>Notes: </span>
                    <textarea
                        ref={notesRef}
                        name="notes"
                        defaultValue={loaderData?.entry?.notes || ""}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 px-2 block w-full  border border-gray-300 rounded-md"
                        aria-invalid={actionData?.errors?.notes ? true : undefined}
                        aria-errormessage={actionData?.errors?.notes ? "notes-error" : undefined}
                        rows={4}
                        placeholder=""

                    >

                    </textarea>
                </label>
                {actionData?.errors?.notes && (
                    <div className="text-red-500 text-sm italic" id="amount-error">
                        {actionData.errors.notes}
                    </div>
                )}
            </div>
            <div>

                <input type="hidden" name="activityDate" value={prepareDateForServer(new Date(activityDate))} />
                <input type="hidden" name="activityId" value={matchesData.challenge?.activity[0].activityId || ""} />
            </div>
            <div className="mt-4 gap-4 flex justify-end">
                <button
                    type="submit"
                    className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
                >
                    Save
                </button>
                <Link to={'..'} className="rounded bg-gray-100 py-2 px-4 hover:bg-gray-200 focus:bg-gray-300">Cancel</Link>
            </div>

        </Form>
    )
}


export function ErrorBoundary({ error }: { error: Error }) {
    console.error(error);

    return <div>An unexpected error occurred: {error.message}</div>;
}

export function CatchBoundary() {
    const caught = useCatch();

    if (caught.status === 404) {
        return <div>Entry not found</div>;
    }

    throw new Error(`Unexpected caught response with status: ${caught.status}`);
}
