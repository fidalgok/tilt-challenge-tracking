import { Entry } from "@prisma/client";
import { Form, Link, useActionData, useTransition } from "@remix-run/react";
import { ActionFunction, json } from "@remix-run/node";
import { ChallengeWithActivities, deleteEntry } from "~/models/challenge.server";
import { requireUser } from "~/session.server";
import { daysBetween, useMatchesData, UTCFormattedDate } from "~/utils";

export type challengeMatchesData = {
    challenge?: ChallengeWithActivities,
    entries?: Entry[],
}

type ActionData = {
    errors?: {
        id?: string;
    }
}

export const action: ActionFunction = async ({ request }) => {
    let user = await requireUser(request)
    let formData = await request.formData();
    let { _action, ...values } = Object.fromEntries(formData);

    if (!values?.id || typeof values.id !== "string") {
        return json<ActionData>(
            { errors: { id: "The entry id is missing." } },
            { status: 400 }
        );
    }

    if (_action === "delete") {
        // delete entry
        return deleteEntry({ id: values.id, userId: user.id })
    } else {
        // do nothing for now, may want to come back and add other capabilities later.
    }
    return null;
}

export default function ChallengeEntries() {
    const actionData = useActionData() as ActionData;
    let transition = useTransition();
    let busy = transition.submission;
    const matches = useMatchesData('routes/challenges/$challengeId');
    const { challenge, entries } = matches as challengeMatchesData;
    const challengeStart = new Date(challenge?.startDate || "now");
    const challengeEnd = new Date(challenge?.endDate || "now");


    const challengeDays = daysBetween(challengeStart, challengeEnd);
    // create an empty array of challengeDays with an index for the day and the corresponding date    
    const challengeDaysArray = Array.from({ length: challengeDays }, (_, i) =>
    ({
        day: i + 1,
        date: challengeStart.getTime() + ((i) * 24 * 60 * 60 * 1000),
        dateAsUTCString: UTCFormattedDate(new Date(challengeStart.getTime() + ((i) * 24 * 60 * 60 * 1000))),
        formattedDate: new Date(challengeStart.getTime() + ((i) * 24 * 60 * 60 * 1000)).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        }),

    }));

    return (
        <div >

            <h1>Challenge Entries</h1>
            <table className="border-collapse grid gap-6 grid-cols-[min-content_max-content_1fr_2fr_max-content] grid-flow-row">
                <thead className="contents">
                    <tr className="contents">

                        <th className="sticky top-0 bg-white text-left py-3">Day</th>
                        <th className="sticky top-0 bg-white text-left py-3">Date</th>
                        <th className="sticky top-0 bg-white text-left py-3">Steps</th>
                        <th className="sticky top-0 bg-white text-left py-3">Notes</th>
                        <th className="sticky top-0 bg-white text-left py-3">Actions</th>
                    </tr>
                </thead>
                <tbody className="contents">
                    {
                        challengeDaysArray.map(({ date, day, dateAsUTCString, formattedDate }) => {

                            const entry = entries?.find(e => UTCFormattedDate(new Date(e.date)) === dateAsUTCString);
                            const entryDate = new Date(date);
                            const month = formattedDate.split(' ')[0];
                            const dayOfMonth = formattedDate.split(' ')[1];
                            return (
                                <tr key={day} className="contents hover:bg-slate-100" >
                                    <td>{day}</td>
                                    <td>{formattedDate}</td>
                                    <td>{entry?.amount || " "}</td>
                                    <td>{entry?.notes || " "}</td>
                                    {!entry && (
                                        <td>
                                            <Link className="px-2" to={`entries/new?month=${month}&day=${dayOfMonth}`}>Add</Link>
                                        </td>
                                    )}
                                    {entry && (
                                        <td>

                                            <Link className="px-2 mr-3" to={`entries/${entry.id}/edit`}>Edit</Link>
                                            <Form
                                                method="post"
                                                className="inline px-2"
                                            >
                                                <input type="hidden" name="id" value={entry.id} />
                                                <button
                                                    type="submit"
                                                    name="_action"
                                                    value="delete"
                                                >
                                                    {busy ? "Deleting" : "Delete"}
                                                </button>
                                            </Form>
                                            {actionData?.errors?.id && (
                                                <div className="text-red-500">
                                                    {actionData.errors.id}
                                                </div>
                                            )}

                                        </td>
                                    )}

                                </tr>
                            )
                        })
                    }

                </tbody>
            </table>
        </div>
    )
}