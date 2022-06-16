import { Entry } from "@prisma/client";
import { Form, Link, useActionData, useTransition } from "@remix-run/react";
import { ActionFunction, json } from "@remix-run/node";
import { ChallengeWithActivities, deleteEntry } from "~/models/challenge.server";
import { requireUser } from "~/session.server";
import { daysBetween, useMatchesData, UTCFormattedDate } from "~/utils";

import { PlusIcon, PencilIcon } from '@heroicons/react/outline'
import { format, isToday } from "date-fns";

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

function stripTimeZone(date: string) {
    return date.split("T")[0];
}

export default function ChallengeEntries() {
    const actionData = useActionData() as ActionData;
    let transition = useTransition();
    let busy = transition.submission;
    const matches = useMatchesData('routes/challenges/$challengeId');
    const { challenge, entries } = matches as challengeMatchesData;
    const challengeStart = new Date(challenge?.startDate || "now");
    const challengeEnd = new Date(challenge?.endDate || "now");
    const today = new Date();
    const todayMonth = format(today, 'MMM');
    const entryForToday = findEntrybyDate(new Date());

    const challengeDays = daysBetween(challengeStart, challengeEnd);
    // create an empty array of challengeDays with an index for the day and the corresponding date    
    const challengeDaysArray = Array.from({ length: challengeDays }, (_, i) =>
    ({
        day: i + 1,
        date: challengeStart.getTime() + ((i) * 24 * 60 * 60 * 1000),
        strippedDate: stripTimeZone(new Date(challengeStart.getTime() + ((i) * 24 * 60 * 60 * 1000)).toISOString()),
        dateAsUTCString: UTCFormattedDate(new Date(challengeStart.getTime() + ((i) * 24 * 60 * 60 * 1000))),
        formattedDate: new Date(challengeStart.getTime() + ((i) * 24 * 60 * 60 * 1000)).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        }),

    }));

    function findEntrybyDate(date: Date): Entry | undefined {
        // date is coming from the user input, so we need to strip the timezone because
        // the date stored in the DB is utc and the user input could be different
        // plus, depending on where the user is, the date could bump up against the next day in utc land which is not great...
        const hoursInDay = 24;
        const localOffset = date.getTimezoneOffset() / 60;
        if (localOffset < 0) {
            // accounts for east of UTC
            const minSafeTime = 0 - localOffset;
            if (date.getHours() < minSafeTime) {
                date.setHours(minSafeTime + 1);
            }
        } else {
            // accounts for west of GMT 
            const maxSafeTime = hoursInDay - localOffset;
            if (date.getHours() > maxSafeTime) {
                date.setHours(maxSafeTime - 1);
            }
        }
        const entry = entries?.find(e => stripTimeZone(new Date(e.date).toISOString()) === stripTimeZone(date.toISOString()));
        return entry;
    }

    return (
        <div >

            <div className="flex justify-between mb-3">
                <h3 className="font-bold text-lg md:text-xl ">Challenge Entries</h3>
                {entryForToday ?
                    (
                        <Link to={`entries/${entryForToday.id}/edit`}>
                            <div className="flex items-center">

                                <PencilIcon className="h-5 w-5 text-slate-500 inline" />{" "} <span>Quick Edit For Today</span>
                            </div>
                        </Link>
                    ) :
                    (
                        <Link to={`entries/new?month=${todayMonth}&day=${today.getDate()}`}>
                            <div className="flex items-center">

                                <PlusIcon className="h-5 w-5 text-slate-500 inline" />{" "} <span>Quick Add For Today</span>
                            </div>
                        </Link>
                    )
                }

            </div>
            <table className="w-full border-separate border-spacing-0">
                <thead>
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

                            const entry = findEntrybyDate(new Date(dateAsUTCString))
                            const entryDate = new Date(date);
                            const month = formattedDate.split(' ')[0];
                            const dayOfMonth = formattedDate.split(' ')[1];
                            return (
                                <tr
                                    id={`${month}-${dayOfMonth}`}
                                    key={`${month}-${dayOfMonth}`}
                                    className="hover:bg-slate-50 border-b border-slate-100"
                                >
                                    <td className="p-3">{isToday(new Date(dateAsUTCString)) ?
                                        (<span className="w-16 h-16 flex items-center justify-center bg-slate-800 text-white aspect-square rounded-full ">{day}</span>) :
                                        (<span className="w-16 h-16 flex items-center justify-center aspect-square rounded-full ">{day}</span>)
                                    }
                                    </td>
                                    <td className="p-3 w-fit">
                                        <div className="flex flex-col items-start">

                                            <span className="self-center inline-block">{month}</span>
                                            <span className="self-center inline-block mt-2">{dayOfMonth}</span>

                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex flex-col items-start ">

                                            <div>{entry?.amount || " "}</div>
                                            {entry?.notes && (<div><span className="inline-block text-sm mt-[10px] text-slate-500">{entry?.notes || " "}</span></div>)}
                                        </div>

                                    </td>
                                    {!entry && (
                                        <td className="p-3">
                                            <Link className="px-2" to={`entries/new?month=${month}&day=${dayOfMonth}`}>Add</Link>
                                        </td>
                                    )}
                                    {entry && (
                                        <td className="p-3 ">
                                            <div className="flex flex-col md:flex-row items-start justify-between">

                                                <Link className="block  md:inline-block px-2 mb-3 md:mr-3 md:mb-0 " to={`entries/${entry.id}/edit`}>Edit</Link>
                                                <Form
                                                    method="post"
                                                    className="inline-block  px-2"
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
                                            </div>
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