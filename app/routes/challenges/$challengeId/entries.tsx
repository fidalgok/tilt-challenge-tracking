import { PencilIcon, PlusIcon } from "@heroicons/react/outline";
import { Entry } from "@prisma/client";
import { Form, Link, useActionData, useTransition } from "@remix-run/react";
import { ActionFunction, json } from "@remix-run/node";
import { format, isSameDay, startOfToday } from "date-fns";
import { useEffect, useState } from "react";
import { capitalize, daysBetween, parseDateStringFromServer, useMatchesData, useTimeZoneOffset, UTCFormattedDate } from "~/utils"

import { LoaderData } from "../$challengeId"
import { requireUser } from "~/session.server";
import { deleteEntry } from "~/models/challenge.server";

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

export default function ChallengeEntriesPage() {
    const [hasLoaded, setHasLoaded] = useState(false); // this uses the useEffect to see if we've loaded on the client first.
    const matches = useMatchesData(`routes/challenges/$challengeId`);
    const { entries, challenge } = matches as LoaderData;
    let actionData = useActionData();
    let transition = useTransition();
    let busy = transition.submission;
    const timezoneOffsets = useTimeZoneOffset();


    const today = startOfToday();
    const entryForToday = findEntrybyDate(today);
    const challengeStart = new Date(challenge?.startDate ? parseDateStringFromServer(challenge.startDate.toString()) : "now");
    const challengeEnd = new Date(challenge?.endDate ? parseDateStringFromServer(challenge.endDate.toString()) : "now");
    const challengeDays = daysBetween(challenge.startDate, challengeEnd);
    // create an empty array of challengeDays with an index for the day and the corresponding date    
    const challengeDaysArray = Array.from({ length: challengeDays }, (_, i) =>
    ({
        day: i + 1,
        date: new Date(parseDateStringFromServer(challengeStart.toString())).getTime() + ((i) * 24 * 60 * 60 * 1000),
        strippedDate: new Date(parseDateStringFromServer(challengeStart.toString())).getTime() + ((i) * 24 * 60 * 60 * 1000),
        dateAsUTCString: UTCFormattedDate(new Date(parseDateStringFromServer(challengeStart.toString())).getTime() + ((i) * 24 * 60 * 60 * 1000)),
        formattedDate: new Date(challengeStart.getTime() + ((i) * 24 * 60 * 60 * 1000)).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        }),

    }));

    function findEntrybyDate(date: Date): Entry | undefined {
        // date is coming from the user input, so we need to strip the timezone because
        // the date stored in the DB is utc and the user input could be different
        // plus, depending on where the user is, the date could bump up against the next day in utc land which is not great...

        const entry = entries?.find(e => {
            return isSameDay(new Date(parseDateStringFromServer(e.date.toString())), date)
        });

        return entry;
    }

    useEffect(() => {

        if (timezoneOffsets.localTimezoneOffset) {
            // we have the local timezone. It's safe to assume we're looking at the right date
            setHasLoaded(true)
        }



    }, [timezoneOffsets.localTimezoneOffset])


    return (


        <div>

            <div className="flex justify-between mb-3">
                <h3 className="font-bold text-lg md:text-xl ">Challenge Entries</h3>
                {(entryForToday) ?
                    (
                        <Link to={`${entryForToday.id}/edit`}>
                            <div className="flex items-center">

                                <PencilIcon className="h-5 w-5 text-slate-500 inline" />{" "} <span>Quick Edit For Today</span>
                            </div>
                        </Link>
                    ) :
                    (
                        <Link to={`new?date=${UTCFormattedDate(today)}`}>
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
                        <th className="sticky top-0 bg-slate-100 border-b border-slate-300 text-left p-3 w-full">{capitalize(challenge.activity[0].unit || "")}</th>
                        <th className="sticky top-0 bg-slate-100 border-b border-slate-300 text-left p-3">Actions</th>
                    </tr>
                </thead>
                <tbody >
                    {
                        challengeDaysArray.map(({ date, day, strippedDate, dateAsUTCString }) => {

                            const entry = findEntrybyDate(new Date(strippedDate))

                            return (
                                <tr
                                    id={`${strippedDate}`}
                                    key={`${strippedDate}`}
                                    className="hover:bg-slate-50 border-b border-slate-100"
                                >
                                    <td className="p-3">
                                        {!hasLoaded && (<span></span>)}
                                        {(hasLoaded && isSameDay(date, today)) ?
                                            (<span className="w-16 h-16 flex items-center justify-center bg-slate-800 text-white aspect-square rounded-full ">{day}</span>) :
                                            (<span className="w-16 h-16 flex items-center justify-center aspect-square rounded-full ">{day}</span>)
                                        }
                                    </td>
                                    <td className="p-3 w-fit">
                                        <div className="flex flex-col items-start">

                                            <span className="self-center inline-block">{format(date, "MMMM")}</span>
                                            <span className="self-center inline-block mt-2">{format(date, "dd")}</span>

                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex flex-col items-start ">

                                            <div>{entry?.amount ?? " "}</div>
                                            {entry?.notes && (<div><span className="inline-block text-sm mt-[10px] text-slate-500">{entry?.notes || " "}</span></div>)}
                                        </div>

                                    </td>
                                    {!hasLoaded && (<td className="p-3"></td>)}
                                    {(hasLoaded && !entry) && (
                                        <td className="p-3">
                                            <Link className="px-2" to={`new?date=${dateAsUTCString}`}>Add</Link>
                                        </td>
                                    )}
                                    {(hasLoaded && entry) && (
                                        <td className="p-3 ">
                                            <div className="flex flex-col md:flex-row items-start justify-between">

                                                <Link className="block  md:inline-block px-2 mb-3 md:mr-3 md:mb-0 " to={`${entry.id}/edit`}>Edit</Link>
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