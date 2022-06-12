import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useParams, useSearchParams, useMatches, useCatch, useLoaderData } from "@remix-run/react";
import * as React from "react";

import type { Entry } from "~/models/challenge.server"
import { getEntryById, updateEntry } from "~/models/challenge.server";
import { requireUserId } from "~/session.server";

import type { challengeMatchesData } from "~/routes/challenges/$challengeId/index";
import invariant from "tiny-invariant";
import { format, getDate } from "date-fns";


type ActionData = {
    errors?: {
        amount?: string;
        notes?: string;
        challengeId?: string;
        activityId?: string;
        date?: string;
        month?: string;
        day?: string;
    },
    month?: string;
    day?: string;
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
    const month = formData.get("month");
    const day = formData.get("day");
    if (typeof month !== 'string' || month.length == 0) {
        return json<ActionData>(
            { errors: { amount: "Whoops! Looks like something went wrong." }, month: `${month}`, day: `${day}` },
            { status: 400 }
        );
    }

    const date = new Date(`${new Date().getUTCFullYear()}/${months[month]}/${day}`);
    //hidden fields
    const challengeId = params.challengeId;
    const entryId = params.entryId;
    const activityId = formData.get("activityId");

    console.log({ userId, amount, notes, date, challengeId, activityId });

    if (Number.isNaN(amount) || amount <= 0) {
        return json<ActionData>(
            { errors: { amount: "Whoops! Looks like you forgot to enter an amount." }, month: `${month}`, day: `${day}` },
            { status: 400 }
        );
    }

    if (typeof notes !== "string") {
        return json<ActionData>(
            { errors: { notes: "Notes are required." }, month: `${month}`, day: `${day}` },
            { status: 400 }
        )
    }

    if (typeof challengeId !== "string" || challengeId.length === 0) {
        return json<ActionData>(
            { errors: { challengeId: "Challenge ID is required." }, month: `${month}`, day: `${day}` },
            { status: 400 }
        )
    }

    if (typeof activityId !== "string" || activityId.length === 0) {
        return json<ActionData>(
            { errors: { activityId: "Activity ID is required." }, month: `${month}`, day: `${day}` },
            { status: 400 });
    }
    if (typeof entryId !== "string" || entryId.length === 0) {
        return json<ActionData>(
            { errors: { activityId: "Entry ID is required." }, month: `${month}`, day: `${day}` },
            { status: 400 });
    }

    const challengeEntry = await updateEntry(entryId, {

        userId,
        amount,
        notes,
        challengeId,
        activityId,
        date

    });

    return redirect(`/challenges/${challengeId}`);
}

export const loader: LoaderFunction = async ({ request, params }) => {
    const userId = await requireUserId(request);
    invariant(params.entryId, "Entry ID not found");
    const entry = await getEntryById(params.entryId);
    if (!entry) {
        throw new Response("Not Found", { status: 404 });
    }
    return json<LoaderData>({ entry });
}

export default function EditChallengeEntryPage() {
    const actionData = useActionData() as ActionData;
    const loaderData = useLoaderData() as LoaderData;


    const month = format(new Date(loaderData.entry.date), "MMM");
    const day = getDate(new Date(loaderData.entry.date));
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
                        className="flex-1 rounded-md border-2 focus:border-blue-500 px-2 text-lg leading-loose"
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

                        className="flex-1 rounded-md border-2 focus:border-blue-500 px-2 text-lg leading-loose"
                        aria-invalid={actionData?.errors?.notes ? true : undefined}
                        aria-errormessage={actionData?.errors?.notes ? "notes-error" : undefined}
                        rows={4}
                        placeholder="Ex. 20 inch box, body weight"

                    >
                        {loaderData.entry?.notes}
                    </textarea>
                </label>
                {actionData?.errors?.notes && (
                    <div className="text-red-500 text-sm italic" id="amount-error">
                        {actionData.errors.notes}
                    </div>
                )}
            </div>
            <div>
                <input type="hidden" name="month" value={format(new Date(loaderData.entry.date), "MMM") || ""} />
                <input type="hidden" name="day" value={getDate(new Date(loaderData.entry.date)) || ""} />
                <input type="hidden" name="activityId" value={matchesData.challenge?.activity[0].activityId || ""} />
            </div>
            <div className="text-right">
                <button
                    type="submit"
                    className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
                >
                    Save
                </button>
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
