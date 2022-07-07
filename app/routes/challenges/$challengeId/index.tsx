
import { ActionFunction, json } from "@remix-run/node";
import { ChevronUpIcon } from "@heroicons/react/solid";
import { Disclosure } from "@headlessui/react";



import { daysBetween, useMatchesData, capitalize } from "~/utils";


import type { LoaderData } from "../$challengeId"

import { EntriesCalendar } from "~/components/EntriesCalendar";

import { requireUser, requireUserId } from "~/session.server";
import { deleteEntry } from "~/models/challenge.server";

type ActionData = {
    errors?: {
        id?: string;
        userId?: string;
    }
}

export const action: ActionFunction = async ({ request }) => {
    const userId = await requireUserId(request);
    let formData = await request.formData();
    let { _action, ...values } = Object.fromEntries(formData);

    if (!values?.entryId || typeof values.entryId !== "string") {
        return json<ActionData>(
            { errors: { id: "The entry id is missing." } },
            { status: 400 }
        );
    }

    if (_action === "delete") {
        // delete entry
        //console.log({ id: values.entryId, userId: values.userId })
        return deleteEntry({ id: values.entryId, userId: userId })
    } else {
        // do nothing for now, may want to come back and add other capabilities later.
    }
    return null;
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

    const matches = useMatchesData('routes/challenges/$challengeId');
    const { challenge, entries, ...data } = matches as LoaderData;

    return (
        <>
            <p className="py-6">{challenge.description}</p>
            <div>

                <ResponsiveStats />

            </div>
            <div>

                <EntriesCalendar entries={entries} maybeMobile={data.maybeMobile} />
            </div>
        </>
    )
}


function ResponsiveStats() {
    const matches = useMatchesData('routes/challenges/$challengeId');
    const { challenge, entries, ...data } = matches as LoaderData;

    const totalSteps = Number(data.totalSteps);
    const daysLeft = daysBetween(new Date(), challenge.endDate) + 1;
    const projectedSteps = getProjectedStepsPerWeek(
        totalSteps,
        challenge.activity[0]?.amount || 0,
        daysLeft
    )
    return (
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
                                            <h4 className=" text-center text-xl lg:text-2xl font-bold mb-3">{capitalize(challenge.activity[0].unit || "")} Completed</h4>
                                            <p className="text-center text-xl lg:text-4xl font-extrabold">{data.totalSteps}</p>
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
    )
}