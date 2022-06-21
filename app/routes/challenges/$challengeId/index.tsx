import { Entry } from "@prisma/client";
import { Form, Link, useActionData, useTransition } from "@remix-run/react";
import { ActionFunction, json } from "@remix-run/node";
import { deleteEntry } from "~/models/challenge.server";
import { requireUser } from "~/session.server";
import { daysBetween, useMatchesData, UTCFormattedDate, stripTimeZone } from "~/utils";

import { PlusIcon, PencilIcon } from '@heroicons/react/outline'
import { format, isToday, subHours } from "date-fns";
import { Disclosure } from "@headlessui/react";
import { ChevronUpIcon } from "@heroicons/react/solid";



import type { LoaderData } from "../$challengeId"

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

function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getProjectedStepsPerWeek(stepsCompleted: number, stepsGoal: number, daysLeft: number): { sessions: number, steps: number }[] {

    const stepsRemaining = stepsGoal - stepsCompleted;
    const projectedSessionsPerWeek = [3, 4, 5, 6, 7];
    const stepProjection = projectedSessionsPerWeek.map(projectedSessions => ({
        sessions: projectedSessions,
        steps: Math.ceil(stepsRemaining / (daysLeft * projectedSessions / 7))
    }))
    return stepProjection;
}

export default function ChallengeEntries() {
    const actionData = useActionData() as ActionData;
    let transition = useTransition();
    let busy = transition.submission;
    const matches = useMatchesData('routes/challenges/$challengeId');
    const { challenge, entries, ...data } = matches as LoaderData;
    const challengeStart = new Date(challenge?.startDate ? stripTimeZone(challenge.startDate.toString()) : "now");
    const challengeEnd = new Date(challenge?.endDate ? stripTimeZone(challenge.endDate.toString()) : "now");
    const today = new Date();
    const todayMonth = format(today, 'MMM');
    const entryForToday = findEntrybyDate(new Date());
    const localOffset = new Date().getTimezoneOffset() / 60;


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

    function parseDateFromServer(date: string): { year: number, month: number, date: number, originalDate: string, parsedDate: Date } {
        // this receives a stripped down version of the date
        // in this format YYYY/MM/DD
        const createdDate = new Date(date);
        const UTCYear = createdDate.getUTCFullYear();
        const UTCMonth = createdDate.getUTCMonth();
        const UTCDate = createdDate.getUTCDate();
        return {
            year: UTCYear,
            month: UTCMonth,
            date: UTCDate,
            originalDate: date,
            parsedDate: new Date(`${UTCYear}/${UTCMonth}/${UTCDate}`)
        }
    }

    function getMonth(month: string | number): string | null {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        if (typeof month == 'number') {
            return months[month];
        }
        return null;
    }


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
        const entry = entries?.find(e => {
            const parsedEntryDate = stripTimeZone(new Date(e.date).toISOString())
            const parsedUserDate = stripTimeZone(date.toISOString())

            return parsedEntryDate === parsedUserDate;
        });

        return entry;
    }

    const totalSteps = Number(data.totalSteps);
    const daysLeft = daysBetween(new Date(), challenge.endDate) + 1;
    const projectedSteps = getProjectedStepsPerWeek(
        totalSteps,
        challenge.activity[0]?.amount || 0,
        daysLeft
    )

    return (
        <>
            <p className="py-6">{challenge.description}</p>
            <div>

                <div className="grid grid-cols-3 gap-x-8 gap-y-6 py-8 mb-8">

                    {/* stats */}
                    <div className="hidden rounded-lg shadow-sm ring-1 ring-black ring-opacity-5 col-span-3 md:block md:col-span-2 xl:col-auto py-3 px-4">

                        <h4 className="font-bold md:text-xl py-3 px-4 mb-8">
                            <span className="inline-block border-b-4 border-slate-800">Stats</span>
                        </h4>
                        <div className="flex flex-col justify-between md:flex-row xl:flex-col">

                            <div className="flex flex-col  py-3 px-4 mb-4">
                                <h4 className=" text-center text-xl lg:text-2xl font-bold mb-3">{capitalize(challenge.activity[0].unit || "")} Completed</h4>
                                <p className="text-center text-xl lg:text-4xl font-extrabold">{totalSteps}</p>
                            </div>
                            <div className="flex flex-col py-3 px-4 mb-4">
                                <h4 className="grow text-center text-xl lg:text-2xl font-bold mb-3">{capitalize(challenge.activity[0].unit || "")} Left</h4>
                                <p className="text-center text-xl lg:text-4xl font-extrabold">{(challenge.activity[0]?.amount || 0) - totalSteps}</p>
                            </div>
                            <div className="flex flex-col  pt-3 pb-7 px-4">
                                <h4 className="grow text-center text-xl lg:text-2xl font-bold mb-3">Days Left</h4>
                                <p className="text-center text-xl lg:text-4xl font-extrabold">{daysLeft}</p>
                            </div>
                        </div>
                    </div>

                    {/* Projected Steps */}
                    <div className="hidden rounded-lg shadow-sm ring-1 ring-black ring-opacity-5 col-span-3 md:block md:col-span-2 xl:col-auto py-3 px-4">
                        <div >

                            <h4 className="font-bold md:text-xl py-3 px-4 mb-8">
                                <span className="inline-block border-b-4 border-slate-800">Projected Steps Left Per Week</span>
                            </h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="place-self-center font-bold">Sessions / Week</div>
                            <div className="place-self-center font-bold">Steps / Session</div>
                            {projectedSteps.map(({ sessions, steps }) => (
                                <div key={challenge.id + sessions} className="col-span-2 grid grid-cols-2 gap-4">
                                    <div className="place-self-center text-xl">{sessions}</div>
                                    <div className="place-self-center text-xl">{steps}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Leaderboard */}
                    <div className="hidden shadow-sm ring-1 ring-black ring-opacity-5 col-span-3 md:block md:col-auto md:row-span-2 md:col-start-3 md:row-start-1 xl:row-auto py-3 px-4 border rounded border-slate-100">
                        <h4 className="text-xl font-bold py-3 px-4">
                            <span className="inline-block border-b-4 border-slate-800">Leaderboard</span>
                        </h4>

                        {data.leaderboard.slice(0, 5).map((entry, index) => (
                            <div key={`${entry.name}-${entry.steps}`} className="flex border-b border-slate-100 py-3 px-4 last:border-b-0">
                                <div className="mr-4 flex items-center text-lg font-bold">{index + 1}</div>
                                <div className="grow flex flex-col">
                                    {entry.name}
                                    <br />
                                    <span className="text-sm">{entry.steps} {challenge.activity[0].unit}</span>
                                </div>

                            </div>
                        ))}
                    </div>

                    {/* mobile */}
                    <div className="col-span-3 md:hidden">


                        <Disclosure>
                            {({ open }) => (
                                <>
                                    <Disclosure.Button className="flex w-full justify-between rounded-lg bg-slate-100 px-4 py-2 text-left text-sm font-medium text-slate-900 hover:bg-slate-200 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                                        <span>Stats</span>
                                        <ChevronUpIcon
                                            className={`${open ? 'rotate-180 transform' : ''
                                                } h-5 w-5 text-slate-500`}
                                        />
                                    </Disclosure.Button>
                                    <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm">
                                        <div className="rounded-lg shadow-sm ring-1 ring-black ring-opacity-5 col-span-3 md:col-span-2 xl:col-auto py-3 px-4">

                                            <h4 className="text-center text-lg font-bold mb-2 py-3 px-4 decoration-slate-800 underline-offset-2 underline decoration-4 xl:text-left">Stats</h4>
                                            <div className="flex flex-col justify-between md:flex-row xl:flex-col">

                                                <div className="flex flex-col  py-3 px-4 mb-4">
                                                    <h4 className=" text-center text-xl lg:text-2xl font-bold mb-3">{challenge.activity[0].unit} Completed</h4>
                                                    <p className="text-center text-xl lg:text-4xl font-extrabold">{data.totalSteps}</p>
                                                </div>
                                                <div className="flex flex-col py-3 px-4 mb-4">
                                                    <h4 className="grow text-center text-xl lg:text-2xl font-bold mb-3">{challenge.activity[0].unit} Left</h4>
                                                    <p className="text-center text-xl lg:text-4xl font-extrabold">{(challenge.activity[0]?.amount || 0) - totalSteps}</p>
                                                </div>
                                                <div className="flex flex-col  pt-3 pb-7 px-4">
                                                    <h4 className="grow text-center text-xl lg:text-2xl font-bold mb-3">Days Left</h4>
                                                    <p className="text-center text-xl lg:text-4xl font-extrabold">{daysLeft}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </Disclosure.Panel>
                                </>
                            )}
                        </Disclosure>
                    </div>

                    <div className="col-span-3 md:hidden">

                        <Disclosure>
                            {({ open }) => (
                                <>
                                    <Disclosure.Button className="flex w-full justify-between rounded-lg bg-slate-100 px-4 py-2 text-left text-sm font-medium text-slate-900 hover:bg-slate-200 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                                        <span>Projected Steps Per Week</span>
                                        <ChevronUpIcon
                                            className={`${open ? 'rotate-180 transform' : ''
                                                } h-5 w-5 text-slate-500`}
                                        />
                                    </Disclosure.Button>
                                    <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm">
                                        <div className="rounded-lg shadow-sm ring-1 ring-black ring-opacity-5 col-span-3  md:col-span-2 xl:col-auto py-3 px-4">
                                            <h4 className="font-bold md:text-xl decoration-slate-800 underline-offset-2 underline decoration-4 py-3 px-4 mb-8">Projected Steps Per Week</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="place-self-center font-bold">Sessions / Week</div>
                                                <div className="place-self-center font-bold">Steps / Session</div>
                                                {projectedSteps.map(({ sessions, steps }) => (
                                                    <div key={challenge.id + sessions} className="col-span-2 grid grid-cols-2 gap-4">
                                                        <div className="place-self-center text-xl">{sessions}</div>
                                                        <div className="place-self-center text-xl">{steps}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </Disclosure.Panel>
                                </>
                            )}
                        </Disclosure>
                    </div>
                    <div className="col-span-3 md:hidden">


                        <Disclosure>
                            {({ open }) => (
                                <>
                                    <Disclosure.Button className="flex w-full justify-between rounded-lg bg-slate-100 px-4 py-2 text-left text-sm font-medium text-slate-900 hover:bg-slate-200 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                                        <span>Leaderboard</span>
                                        <ChevronUpIcon
                                            className={`${open ? 'rotate-180 transform' : ''
                                                } h-5 w-5 text-slate-500`}
                                        />
                                    </Disclosure.Button>
                                    <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm">
                                        <div className=" shadow-sm ring-1 ring-black ring-opacity-5 col-span-3 md:col-auto md:row-span-2 md:col-start-3 md:row-start-1 xl:row-auto py-3 px-4 border rounded border-slate-100">
                                            <h4 className="text-2xl font-bold py-3 px-4 decoration-slate-800 underline-offset-2 underline decoration-4">Leaderboard</h4>

                                            {data.leaderboard.slice(0, 5).map((entry, index) => (
                                                <div key={`${entry.name}-${entry.steps}`} className="flex border-b border-slate-100 py-3 px-4 last:border-b-0">
                                                    <div className="mr-4 flex items-center text-lg font-bold">{index + 1}</div>
                                                    <div className="grow flex flex-col">
                                                        {entry.name}
                                                        <br />
                                                        <span className="text-sm">{entry.steps} {challenge.activity[0].unit}</span>
                                                    </div>

                                                </div>
                                            ))}
                                        </div>
                                    </Disclosure.Panel>
                                </>
                            )}
                        </Disclosure>
                    </div>

                </div>


            </div>
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
                            challengeDaysArray.map(({ date, day, strippedDate, formattedDate }) => {

                                const entry = findEntrybyDate(new Date(strippedDate))

                                const month = formattedDate.split(' ')[0];
                                const dayOfMonth = formattedDate.split(' ')[1];


                                return (
                                    <tr
                                        id={`${month}-${dayOfMonth}`}
                                        key={`${month}-${dayOfMonth}`}
                                        className="hover:bg-slate-50 border-b border-slate-100"
                                    >
                                        <td className="p-3">{isToday(date) ?
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
        </>
    )
}