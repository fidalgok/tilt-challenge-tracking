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
    }
}



export const action: ActionFunction = async ({ request }) => {
    const userId = await requireUserId(request);

    const formData = await request.formData();
    const amount = Number(formData.get("amount"));
    const notes = formData.get("notes");
    const month = formData.get("month");
    const day = formData.get("day");
    const date = new Date(`${new Date().getUTCFullYear()}/${month}/${day}`);
    //hidden fields
    const challengeId = formData.get("challengeId");
    const activityId = formData.get("activityId");

    if (Number.isNaN(amount) || amount < 0) {
        return json<ActionData>(
            { errors: { amount: "Amount a valid amount of zero or more." } },
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
    const month = searchParams.get("month");
    const day = searchParams.get("day");
    const matches = useMatches();
    const params = useParams();
    const { challengeId } = params
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
                width: "50%"
            }}
        >
            <div>
                New Entry for {matchesData.challenge?.title} on {month}/{day}
                <input type="hidden" name="month" value={month || ""} />
                <input type="hidden" name="day" value={day || ""} />
            </div>
            <div>
                <label className="flex w-full flex-col gap-1">
                    <span>Amount: </span>
                    <input
                        ref={amountRef}
                        name="amount"
                        className="flex-1 rounded-md border-2 border-blue-500 px-x text-lg leading-loose"
                        aria-invalid={actionData?.errors?.amount ? true : undefined}
                        aria-errormessage={actionData?.errors?.amount ? "amount-error" : undefined}

                    />
                </label>
                {actionData?.errors?.amount && (
                    <div className="text-red-500 text-sm italic" id="amount-error">
                        {actionData.errors.amount}
                    </div>
                )}
            </div>


        </Form>
    )
}