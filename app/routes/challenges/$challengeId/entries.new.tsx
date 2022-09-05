import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData, useParams, useSearchParams, useMatches, useLoaderData, useNavigate, Link } from "@remix-run/react";
import * as React from "react";

import { createChallengeEntry, Entry, getChallengeEntries } from "~/models/challenge.server";
import { requireUserId } from "~/session.server";

import type { LoaderData as challengeMatchesData } from "~/routes/challenges/$challengeId";
import { format, getDate, isSameDay, parse } from "date-fns";
import invariant from "tiny-invariant";
import { prepareDateForServer, capitalize, parseDateStringFromServer } from "~/utils";
import startOfToday from "date-fns/startOfToday";

type LoaderData = {

    date: string | null;
}

type ActionData = {
    errors?: {
        amount?: string;
        notes?: string;
        challengeId?: string;
        activityId?: string;
        date?: string;
    },
    date?: string;

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
    let errorDateMonth = activityDate.getUTCMonth() + 1 < 10 ? `0${activityDate.getUTCMonth() + 1}` : activityDate.getUTCMonth() + 1;
    let formattedDate = `${activityDate.getUTCFullYear()}-${errorDateMonth}-${activityDate.getUTCDate()}`;

    if (activityDate instanceof Date && isNaN(activityDate.getTime())) {
        // not a valid date
        return json<ActionData>(
            { errors: { date: "Whoops! There is something wrong with the entry date." } },
            { status: 400 }
        );
    }
    //hidden fields
    const challengeId = params.challengeId;
    const activityId = formData.get("activityId");



    if (Number.isNaN(amount) || amount < 0) {
        return json<ActionData>(
            { errors: { amount: "Whoops! Looks like you forgot to enter an amount." }, date: formattedDate },
            { status: 400 }
        );
    }

    if (typeof notes !== "string") {
        return json<ActionData>(
            { errors: { notes: "Notes are required." }, date: formattedDate },
            { status: 400 }
        )
    }

    if (typeof challengeId !== "string" || challengeId.length === 0) {
        return json<ActionData>(
            { errors: { challengeId: "Challenge ID is required." }, date: formattedDate },
            { status: 400 }
        )
    }

    if (typeof activityId !== "string" || activityId.length === 0) {
        return json<ActionData>(
            { errors: { activityId: "Activity ID is required." }, date: formattedDate },
            { status: 400 });
    }

    const challengeEntry = await createChallengeEntry({
        userId,
        amount,
        notes,
        challengeId,
        activityId,
        date: activityDate

    });

    return redirect(`/challenges/${challengeId}`);
}



export const loader: LoaderFunction = async ({ request, params }) => {
    await requireUserId(request);
    const challengeId = params.challengeId;
    invariant(challengeId, "challengeId is required");

    return null;
}

export default function NewChallengeEntryPage() {
    const actionData = useActionData() as ActionData;
    const params = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const matches = useMatches();
    const match = matches.find(match => match.pathname === `/challenges/${params.challengeId}`);
    const matchesData = match?.data as challengeMatchesData;

    let searchDate = searchParams.get("date");

    let date = actionData?.date ? actionData.date : searchDate ? searchDate : format(startOfToday(), "yyyy-MM-dd");


    //debugger;
    const month = format(parse(date, 'yyyy-MM-dd', new Date()), "MMMM")
    const day = format(parse(date, 'yyyy-MM-dd', new Date()), "dd")
    const preparedDate = prepareDateForServer(date)


    const amountRef = React.useRef<HTMLInputElement>(null);
    const notesRef = React.useRef<HTMLTextAreaElement>(null);

    // if somehow we land on the new page and there is already an entry for this date, redirect to the edit page

    const foundEntry = matchesData.entries?.find(entry => isSameDay(new Date(parseDateStringFromServer(entry.date.toString())), new Date(preparedDate)));

    //console.log(foundEntry)
    React.useEffect(() => {
        if (actionData?.errors?.amount) {
            amountRef.current?.focus();
        } else if (actionData?.errors?.notes) {
            notesRef.current?.focus();
        }
    }, [actionData]);

    React.useEffect(() => {
        if (foundEntry?.id) {
            navigate(`/challenges/${params.challengeId}/entries/${foundEntry.id}/edit`, { replace: true });
        }
    }, [foundEntry])

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
                    <span>{capitalize(matchesData.challenge?.activity[0].unit || "")} Amount: </span>
                    <input
                        ref={amountRef}
                        name="amount"

                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full  border border-gray-300 rounded-md"
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

                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full  border border-gray-300 rounded-md"
                        aria-invalid={actionData?.errors?.notes ? true : undefined}
                        aria-errormessage={actionData?.errors?.notes ? "notes-error" : undefined}
                        rows={4}
                        placeholder=""

                    ></textarea>
                </label>
                {actionData?.errors?.notes && (
                    <div className="text-red-500 text-sm italic" id="amount-error">
                        {actionData.errors.notes}
                    </div>
                )}
            </div>
            <div>
                <input type="hidden" name="activityDate" value={preparedDate} />
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