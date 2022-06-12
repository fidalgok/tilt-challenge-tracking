import type { ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useParams, useSearchParams, useMatches } from "@remix-run/react";
import * as React from "react";

import { createChallengeEntry } from "~/models/challenge.server";
import { requireUserId } from "~/session.server";

import type { challengeMatchesData } from "~/routes/challenges/$challengeId/index";

type ActionData = {
    errors?: {
        amount?: string;
        notes?: string;
        challengeId?: string;
        activityId?: string;
        date?: string;
    },
    month?: string;
    day?: string;
}

const months = {
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
    let month = formData.get("month");
    month = typeof month == 'string' && month?.length ? month.toString() : new Date().getUTCMonth();
    const day = formData.get("day");
    const date = new Date(`${new Date().getUTCFullYear()}/${months[month]}/${day}`);
    //hidden fields
    const challengeId = params.challengeId;
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

    const challengeEntry = await createChallengeEntry({
        userId,
        amount,
        notes,
        challengeId,
        activityId,
        date

    });

    return redirect(`/challenges/${challengeId}`);
}

export default function NewChallengeEntryPage() {
    const actionData = useActionData() as ActionData;
    const [searchParams] = useSearchParams();
    const month = actionData?.month ? actionData.month : searchParams.get("month");
    const day = actionData?.day ? actionData.day : searchParams.get("day");
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
                <p>New Entry for {month} {day}</p>

            </div>
            <div>
                <label className="flex w-full flex-col gap-1">
                    <span>{matchesData.challenge?.activity[0].unit} Amount: </span>
                    <input
                        ref={amountRef}
                        name="amount"

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

                    ></textarea>
                </label>
                {actionData?.errors?.notes && (
                    <div className="text-red-500 text-sm italic" id="amount-error">
                        {actionData.errors.notes}
                    </div>
                )}
            </div>
            <div>
                <input type="hidden" name="month" value={month || ""} />
                <input type="hidden" name="day" value={day || ""} />
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