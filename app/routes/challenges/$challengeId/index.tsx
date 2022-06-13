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
            <table className="w-full border-separate border-spacing-0">
                <thead >
                    <tr>

                        <th className="sticky top-0 bg-slate-100 border-b border-slate-300 text-left p-3">Day</th>
                        <th className="sticky top-0 bg-slate-100 border-b border-slate-300 text-left p-3">Date</th>
                        <th className="sticky top-0 bg-slate-100 border-b border-slate-300 text-left p-3 w-full">Steps</th>
                        <th className="sticky top-0 bg-slate-100 border-b border-slate-300 text-left p-3">Actions</th>
                    </tr>
                </thead>
                <tbody >
                    {
                        challengeDaysArray.map(({ date, day, dateAsUTCString, formattedDate }) => {

                            const entry = entries?.find(e => UTCFormattedDate(new Date(e.date)) === dateAsUTCString);
                            const entryDate = new Date(date);
                            const month = formattedDate.split(' ')[0];
                            const dayOfMonth = formattedDate.split(' ')[1];
                            return (
                                <tr key={day} className="hover:bg-slate-50 border-b border-slate-100 " >
                                    <td className="p-3">{day}</td>
                                    <td className="p-3 w-fit">{formattedDate}</td>
                                    <td className="flex flex-col align-middle p-3">
                                        <span>{entry?.amount || " "}</span>
                                        {entry?.notes && (<span className="mt-2 text-slate-500">{entry?.notes || " "}</span>)}

                                    </td>
                                    {!entry && (
                                        <td className="p-3">
                                            <Link className="px-2" to={`entries/new?month=${month}&day=${dayOfMonth}`}>Add</Link>
                                        </td>
                                    )}
                                    {entry && (
                                        <td className="p-3 ">

                                            <Link className="block lg:inline px-2 mb-3 lg:mr-3 lg:mb-0 " to={`entries/${entry.id}/edit`}>Edit</Link>
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