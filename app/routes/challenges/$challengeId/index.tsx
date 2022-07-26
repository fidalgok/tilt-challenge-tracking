
import { ActionFunction, json } from "@remix-run/node";
import { ChevronUpIcon } from "@heroicons/react/solid";
import { Disclosure } from "@headlessui/react";



import { daysBetween, useMatchesData, capitalize, classNames, parseDateStringFromServer } from "~/utils";


import type { LoaderData } from "../$challengeId"

import { EntriesCalendar } from "~/components/EntriesCalendar";

import { requireUserId } from "~/session.server";
import { deleteEntry } from "~/models/challenge.server";
import { format, isBefore } from "date-fns";


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
            <div className="col-span-3 md:hidden">


                <Disclosure>
                    {({ open }) => (
                        <>
                            <Disclosure.Button className="flex w-full justify-between rounded-lg bg-slate-100 px-4 py-2 text-left text-sm font-medium text-slate-900 hover:bg-slate-200 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                                <span>Challenge Description</span>
                                <ChevronUpIcon
                                    className={`${open ? 'rotate-180 transform' : ''
                                        } h-5 w-5 text-slate-500`}
                                />
                            </Disclosure.Button>
                            <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm">
                                <p className="py-6 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: challenge.description }}></p>
                            </Disclosure.Panel>
                        </>
                    )}
                </Disclosure>
            </div>
            <p className="hidden md:block py-6 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: challenge.description }}></p>
            {isBefore(new Date(), new Date(parseDateStringFromServer(challenge.startDate.toString()))) ? (
                <div className="flex justify-center items-center flex-col">
                    <div className="max-w-md mt-12 mb-8">
                        <p className="text-5xl font-semibold text-center leading-relaxed">Challenge begins on <br /> {format(new Date(parseDateStringFromServer(challenge.startDate.toString())), "MMM dd")}</p>
                    </div>
                    <BeforeStartDate />
                </div>
            ) : (
                <>


                    <div>

                        <ResponsiveStats />

                    </div>
                    <div>

                        <EntriesCalendar entries={entries} maybeMobile={data.maybeMobile} />
                    </div>
                </>
            )}
        </>
    )
}


function ResponsiveStats() {
    const matches = useMatchesData('routes/challenges/$challengeId');
    const { challenge, entries, ...data } = matches as LoaderData;
    let isOpenEnded = challenge.activity[0].trackType == 'openVolume';
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
                    {isOpenEnded ? null : (<div className="flex flex-col py-3 px-4 mb-4">
                        <h4 className="grow text-center text-xl lg:text-2xl font-bold mb-3">{capitalize(challenge.activity[0].unit || "")} Left</h4>
                        <p className="text-center text-xl lg:text-4xl font-extrabold">{(challenge.activity[0]?.amount || 0) - totalSteps}</p>
                    </div>)}
                    <div className="flex flex-col  pt-3 pb-7 px-4">
                        <h4 className="grow text-center text-xl lg:text-2xl font-bold mb-3">Days Left</h4>
                        <p className="text-center text-xl lg:text-4xl font-extrabold">{daysLeft}</p>
                    </div>
                </div>
            </div>

            {/* Projected Steps */}
            {isOpenEnded ? null : (


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
            )}
            {/* Leaderboard */}
            <div className={classNames(
                "hidden shadow-sm ring-1 ring-black ring-opacity-5 col-span-3",
                "md:block md:col-auto md:row-span-2",
                isOpenEnded ? "" : "md:col-start-3 ",
                "md:row-start-1 xl:row-auto py-3 px-4 border rounded border-slate-100")}>
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
                                        {!isOpenEnded && (<div className="flex flex-col py-3 px-4 mb-4">
                                            <h4 className="grow text-center text-xl lg:text-2xl font-bold mb-3">{capitalize(challenge.activity[0].unit || "")} Left</h4>
                                            <p className="text-center text-xl lg:text-4xl font-extrabold">{(challenge.activity[0]?.amount || 0) - totalSteps}</p>
                                        </div>)}
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

            {!isOpenEnded && (<div className="col-span-3 md:hidden">

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
            </div>)}
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

function BeforeStartDate() {
    return (
        <>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 284.89 264.01"
                className="max-w-md"
            >
                <defs>
                    <style>
                        {
                            ".cls-2{stroke:#1e293b;stroke-linejoin:round;stroke-width:2.5px;fill:#fff}.cls-12{fill:#e5e7eb}.cls-13{fill:#9ca3af}.cls-16{fill:#1e293b;font-family:SourceSansRoman-Regular,'Source Sans Variable';font-size:17px;font-variation-settings:'wght' 400}.cls-18{letter-spacing:-.01em}.cls-23{letter-spacing:0}"
                        }
                    </style>
                </defs>
                <g
                    style={{
                        isolation: "isolate",
                    }}
                >
                    <g id="Layer_2">
                        <g id="Logo_07:_600_x_600">
                            <path
                                stroke="#000"
                                strokeMiterlimit={10}
                                strokeLinecap="round"
                                fill="none"
                                strokeWidth={2.5}
                                d="M254.05 262.76H1.25"
                            />
                            <path
                                className="cls-12"
                                d="M41.23 258.52c-21.76-15.8-34.59-40.81-34.59-67.96 0-18.26 5.76-35.63 16.65-50.23.32-.42.33-1 .04-1.44-5.86-8.81-8.96-19.1-8.96-29.76v-5.68c0-14.05 5.42-25.81 15.68-34.01 9.58-7.66 23.15-11.88 38.21-11.88h39.04c15.06 0 28.63 4.22 38.21 11.88 10.26 8.2 15.68 19.96 15.68 34.01v5.68c0 8.97-2.25 17.87-6.52 25.71-.25.45-.19 1.01.15 1.41 12.84 15.14 19.91 34.43 19.91 54.31 0 17.36-5.22 33.95-15.11 48.08-2.57-2.6-5.98-4.17-9.23-4.17-1.28 0-2.53.24-3.69.71-16.57 6.71-33.84 10.12-51.34 10.12-13.33 0-26.58-2-39.38-5.95a13.69 13.69 0 0 0-4.07-.64c-6.56 0-10.66 5.15-11.82 10.25-.69 3.04-.43 6.56 1.14 9.57Zm32.8-184.31c-25.85 0-40.09 10.68-40.09 30.08v4c0 5.38 1.05 10.6 3.11 15.51a1.254 1.254 0 0 0 1.16.77c.28 0 .55-.09.77-.26 14.9-11.63 32.78-17.79 51.71-17.79 16.94 0 33.26 5.01 47.19 14.49.21.14.46.22.7.22.14 0 .28-.02.41-.07.37-.13.66-.43.78-.8 1.23-3.89 1.86-7.95 1.86-12.07v-4c0-19.4-14.24-30.08-40.09-30.08h-27.5Z"
                            />
                            <path d="M107.3 58.81c14.78 0 28.07 4.12 37.43 11.6 9.95 7.96 15.21 19.38 15.21 33.04v5.68c0 8.77-2.2 17.45-6.37 25.12a2.5 2.5 0 0 0 .29 2.81 82.818 82.818 0 0 1 19.62 53.5c0 16.62-4.85 32.52-14.07 46.19-2.64-2.22-5.89-3.53-9.02-3.53-1.44 0-2.84.27-4.16.8-16.42 6.65-33.53 10.03-50.87 10.03-13.2 0-26.33-1.98-39.02-5.9-1.5-.46-2.99-.7-4.44-.7-6.27 0-11.51 4.51-13.04 11.22-.46 2.01-.53 4.21-.14 6.36-19.47-15.63-30.84-39.11-30.84-64.48 0-17.99 5.67-35.1 16.4-49.49.63-.85.66-2 .08-2.88-5.73-8.61-8.75-18.66-8.75-29.07v-5.68c0-13.66 5.26-25.08 15.21-33.04 9.36-7.48 22.65-11.6 37.43-11.6h39.04M38.2 125.82a2.5 2.5 0 0 0 1.54-.53c14.67-11.46 32.29-17.52 50.94-17.52 16.69 0 32.76 4.94 46.48 14.28.42.29.91.43 1.41.43.27 0 .55-.05.82-.14.75-.26 1.33-.85 1.57-1.61 1.27-4.01 1.92-8.2 1.92-12.45v-4c0-20.2-14.68-31.33-41.34-31.33h-27.5c-26.66 0-41.34 11.13-41.34 31.33v4c0 5.55 1.08 10.93 3.2 16 .3.72.92 1.25 1.67 1.45.21.05.42.08.63.08m69.1-69.5H68.26c-30.46 0-55.14 16.69-55.14 47.14v5.68c0 11.26 3.37 21.73 9.17 30.45-10.61 14.22-16.9 31.87-16.9 50.98 0 30.41 15.91 57.11 39.87 72.2h2.14c-11.02-5.28-6.82-22.81 4.51-22.81 1.16 0 2.4.18 3.7.59 13.05 4.03 26.42 6.01 39.75 6.01 17.59 0 35.13-3.45 51.81-10.21 1.05-.43 2.14-.62 3.22-.62 3.56 0 7.09 2.09 9.34 4.93 10.22-14.06 16.25-31.37 16.25-50.09 0-21.01-7.6-40.25-20.21-55.12a54.927 54.927 0 0 0 6.67-26.31v-5.68c0-30.45-24.68-47.14-55.14-47.14Zm-69.1 67.01c-1.94-4.62-3.01-9.7-3.01-15.03v-4c0-21.45 17.39-28.83 38.84-28.83h27.5c21.45 0 38.84 7.38 38.84 28.83v4c0 4.08-.63 8-1.8 11.69-13.65-9.29-30.14-14.71-47.89-14.71-19.79 0-38 6.74-52.48 18.05Z" />
                            <path
                                className="cls-12"
                                d="M45.62 261.51C21.2 245.99 6.64 219.49 6.64 190.56c0-18.26 5.76-35.63 16.65-50.23.32-.42.33-1 .04-1.44-5.86-8.81-8.96-19.1-8.96-29.76v-5.68c0-14.05 5.42-25.81 15.68-34.01 9.58-7.66 23.15-11.88 38.21-11.88h39.04c15.06 0 28.63 4.22 38.21 11.88 10.26 8.2 15.68 19.96 15.68 34.01v5.68c0 8.97-2.25 17.87-6.52 25.71-.25.45-.19 1.01.15 1.41 12.84 15.14 19.91 34.43 19.91 54.31 0 28.93-14.57 55.43-38.98 70.95H45.62Zm28.41-187.3c-25.85 0-40.09 10.68-40.09 30.08v4c0 5.38 1.05 10.6 3.11 15.51a1.254 1.254 0 0 0 1.16.77c.28 0 .55-.09.77-.26 14.9-11.63 32.78-17.79 51.71-17.79 16.94 0 33.26 5.01 47.19 14.49.21.14.46.22.7.22.14 0 .28-.02.41-.07.37-.13.66-.43.78-.8 1.23-3.89 1.86-7.95 1.86-12.07v-4c0-19.4-14.24-30.08-40.09-30.08h-27.5Z"
                            />
                            <path
                                d="M107.3 58.81c14.78 0 28.07 4.12 37.43 11.6 9.95 7.96 15.21 19.38 15.21 33.04v5.68c0 8.77-2.2 17.45-6.37 25.12a2.5 2.5 0 0 0 .29 2.81 82.818 82.818 0 0 1 19.62 53.5c0 28.38-14.23 54.38-38.1 69.7h-89.4c-23.87-15.32-38.1-41.32-38.1-69.7 0-17.99 5.67-35.1 16.4-49.49.63-.85.66-2 .08-2.88-5.73-8.61-8.75-18.66-8.75-29.07v-5.68c0-13.66 5.26-25.08 15.21-33.04 9.36-7.48 22.65-11.6 37.43-11.6h39.04M38.2 125.82a2.5 2.5 0 0 0 1.54-.53c14.67-11.46 32.29-17.52 50.94-17.52 16.69 0 32.76 4.94 46.48 14.28.42.29.91.43 1.41.43.27 0 .55-.05.82-.14.75-.26 1.33-.85 1.57-1.61 1.27-4.01 1.92-8.2 1.92-12.45v-4c0-20.2-14.68-31.33-41.34-31.33h-27.5c-26.66 0-41.34 11.13-41.34 31.33v4c0 5.55 1.08 10.93 3.2 16 .3.72.92 1.25 1.67 1.45.21.05.42.08.63.08m69.1-69.5H68.26c-30.46 0-55.14 16.69-55.14 47.14v5.68c0 11.26 3.37 21.73 9.17 30.45-10.61 14.22-16.9 31.87-16.9 50.98 0 30.41 15.91 57.11 39.87 72.2h90.85c23.96-15.09 39.87-41.79 39.87-72.2 0-21.01-7.6-40.25-20.21-55.12a54.927 54.927 0 0 0 6.67-26.31v-5.68c0-30.45-24.68-47.14-55.14-47.14Zm-69.1 67.01c-1.94-4.62-3.01-9.7-3.01-15.03v-4c0-21.45 17.39-28.83 38.84-28.83h27.5c21.45 0 38.84 7.38 38.84 28.83v4c0 4.08-.63 8-1.8 11.69-13.65-9.29-30.14-14.71-47.89-14.71-19.79 0-38 6.74-52.48 18.05Z"
                                fill="#1e293b"
                            />
                            <path
                                className="cls-13"
                                d="M164.73 238.15a85.526 85.526 0 0 1-23.62 22.11H52.4c-12.15-5.82-5.8-26.53 8.21-22.22 30.27 9.34 62.24 7.68 91.56-4.2 4.51-1.82 9.63.6 12.56 4.31Z"
                                opacity={0.55}
                            />
                            <circle
                                cx={90.68}
                                cy={190.67}
                                r={38.21}
                                stroke="#000"
                                fill="none"
                                strokeWidth={2.5}
                                strokeLinejoin="round"
                            />
                            <path
                                className="cls-13"
                                d="M124.91 166.97c-.08-.04-.15-.08-.23-.13-9.44-5.94-18.47-15.05-30.25-15.28-5.15.28-10.26.97-15.28 2.06-5.09 2.63-10.03 4.59-14.19 8.99-4.35 4.59-6.58 10.08-9.43 15.56 2.51-2.54 10.12-7.73 16.3-11.06 11.09-5.94 22.19-6.71 35.17-7.57 9.5-.63 10.8 7.24 15.22 12.26.31.35.86.39 1.29.58.3-1.87.75-3.69 1.4-5.41Z"
                            />
                            <circle
                                id="Inner_Circle_Mask"
                                cx={90.68}
                                cy={190.67}
                                r={38.21}
                                fill="none"
                                strokeWidth={2.5}
                                strokeLinejoin="round"
                                stroke="#1e293b"
                            />
                            <g id="NotePad">
                                <path
                                    className="cls-2"
                                    d="M149.45 23.39c-.24-.52-.43-1.07-.57-1.63h.01c.14.56.33 1.11.56 1.63Zm1.29 2.16c-.52-.66-.96-1.39-1.29-2.16.34.78.78 1.5 1.29 2.16Zm.04.05c.5.64 1.07 1.22 1.71 1.73a10 10 0 0 1-1.71-1.73Zm77.04-3.84c-.14.56-.33 1.11-.57 1.63.23-.52.42-1.07.56-1.63h.01Z"
                                />
                                <path
                                    className="cls-2"
                                    d="M273.67 21.76h-45.74l-10.23 7.85h-58.69l-10.08-7.73h-.02l-.14-.12h-48.11c-.61 0-1.09.49-1.09 1.1 0 0 1.88 61.2-6.5 127.63-.27 2.13-.55 4.26-.84 6.4.03.4-.03.8-.16 1.18-3.75 27.26-9.28 55.04-17.43 79.51-.18 1.48.91 2.04 2.03 2.04h131.9c.24 0 .47 0 .72-.02.15 0 .3-.01.46-.02h.01c.09 0 .18 0 .28-.02h.01s.05-.01.08-.01h.04c.91-.08 1.87-.21 2.88-.41.16-.03.32-.06.48-.1.95-.2 1.94-.45 2.96-.75.34-.09.68-.2 1.03-.31.43-.13.86-.27 1.29-.42a58.4 58.4 0 0 0 3.98-1.52 88.62 88.62 0 0 0 3.61-1.62c.26-.12.52-.25.79-.38.26-.12.52-.26.79-.39.09-.05.18-.09.27-.14.62-.31 1.24-.63 1.86-.96h.01c.62-.34 1.25-.68 1.87-1.03 1.89-1.06 3.78-2.19 5.67-3.4.45-.29.89-.58 1.34-.88.48-.31.97-.64 1.45-.97.14-.1.29-.2.43-.29.28-.2.57-.39.85-.59l.93-.66c.96-.68 1.91-1.39 2.85-2.1.58-.45 1.15-.89 1.72-1.34.53-.42 1.06-.85 1.58-1.28.46-.38.93-.77 1.38-1.14l.97-.85h.01l.04-.04c.07-.06.14-.12.21-.19.24-.2.47-.41.71-.62.42-.38.85-.77 1.26-1.15.42-.39.84-.78 1.24-1.17.06-.05.13-.11.19-.17l.12-.12c.3-.3.6-.59.89-.88l.89-.89c.54-.56 1.08-1.12 1.6-1.68.24-.27.48-.53.72-.79.06-.08.13-.15.2-.23.09-.1.17-.2.26-.3.11-.12.22-.25.33-.38l.39-.45c.13-.16.27-.31.4-.47.09-.12.19-.23.28-.34.07-.08.13-.15.19-.23.16-.19.31-.38.46-.57h.01c.06-.07.12-.15.18-.23l.54-.69h.01l.08-.11c.29-.38.57-.75.85-1.13.09-.13.19-.26.28-.39.18-.25.36-.5.53-.75.04-.06.08-.12.13-.18.14-.21.27-.41.41-.61.13-.2.27-.4.4-.61.08-.12.16-.25.24-.37.17-.27.33-.54.5-.81.11-.19.23-.39.34-.58h.01c.17-.28.33-.57.48-.85.01-.02.02-.05.04-.08h.01s.02-.03.02-.05c.16-.29.31-.58.46-.87.01-.01.01-.03.02-.04.01-.01.01-.02.02-.03.39-.77.74-1.57 1.05-2.39.19-.5.36-1.02.51-1.53.92-3.04 1.36-6.29 1.8-9.51.37-2.75.56-5.57.56-8.42l3.72-154.26c0-.61-.49-1.1-1.09-1.1Z"
                                />
                                <path
                                    className="cls-2"
                                    d="M270.48 185.54a61.82 61.82 0 0 1-3.39 13.5c-10.14 19.67-43.09 40.58-58.54 40.58h-19.36c18.65-3.96 31.17-23.76 33.7-40.82 31.51-.88 38.73-9.28 47.59-13.26Z"
                                />
                                <rect
                                    x={126.31}
                                    y={135.49}
                                    width={18.5}
                                    height={18.5}
                                    rx={9.25}
                                    ry={9.25}
                                    strokeMiterlimit={10}
                                    fill="#e9445d"
                                    stroke="#1e293b"
                                />
                                <path
                                    strokeLinecap="round"
                                    fill="none"
                                    strokeWidth={5}
                                    strokeLinejoin="round"
                                    stroke="#1e293b"
                                    d="m117.12 82.62 11.67 11.06 25.2-26.58"
                                />
                                <text className="cls-16" transform="translate(167.44 128.95)">
                                    <tspan x={0} y={0} letterSpacing="-.02em">
                                        {"W"}
                                    </tspan>
                                    <tspan x={13.09} y={0} letterSpacing={0}>
                                        {"ait "}
                                    </tspan>
                                    <tspan className="cls-23" x={34.99} y={0}>
                                        {"f"}
                                    </tspan>
                                    <tspan x={39.78} y={0}>
                                        {"or "}
                                    </tspan>
                                    <tspan x={0} y={20.4}>
                                        {"challenge"}
                                    </tspan>

                                    <tspan className="cls-18" x={0} y={40.8}>
                                        {"t"}
                                    </tspan>
                                    <tspan x={5.51} y={40.8} letterSpacing={0}>
                                        {"o"}
                                    </tspan>
                                    <tspan x={14.65} y={40.8} />
                                    <tspan x={18.05} y={40.8} letterSpacing="-.02em">
                                        {"s"}
                                    </tspan>
                                    <tspan x={24.84} y={40.8} letterSpacing="-.02em">
                                        {"t"}
                                    </tspan>
                                    <tspan x={30.23} y={40.8}>
                                        {"art!"}
                                    </tspan>
                                </text>
                                <text className="cls-16" transform="translate(167.44 74.8)">
                                    <tspan x={0} y={0}>
                                        {"Sign-u"}
                                    </tspan>
                                    <tspan x={45.66} y={0} letterSpacing={0}>
                                        {"p"}
                                    </tspan>
                                    <tspan x={55.03} y={0} />
                                    <tspan className="cls-23" x={58.43} y={0}>
                                        {"f"}
                                    </tspan>
                                    <tspan x={63.22} y={0}>
                                        {"or "}
                                    </tspan>
                                    <tspan x={0} y={20.4}>
                                        {"challenge"}
                                    </tspan>

                                </text>
                                <path
                                    d="M228.15 12.84v6.32c0 .68-.07 1.33-.19 1.97-.01.06-.02.12-.03.17-.03.16-.07.31-.11.46-.14.56-.33 1.11-.57 1.63-.33.77-.77 1.5-1.29 2.16-.01.02-.02.03-.04.05-.25.32-.52.63-.8.92-.29.29-.59.56-.91.81-.24.2-.49.38-.75.55-.23.15-.48.3-.73.44-.02 0-.04.02-.05.03-.21.11-.42.22-.64.31-.09.05-.18.09-.28.13-.19.08-.38.16-.58.23-.01 0-.03 0-.04.01-.26.09-.53.17-.8.24-.01.01-.02.01-.03.01-.25.06-.49.12-.75.16l-.15.03c-.26.04-.53.08-.81.1-.3.03-.6.04-.9.04h-58.69c-.3 0-.61-.01-.91-.04-.23-.02-.45-.05-.68-.08-.1-.02-.2-.03-.3-.05-.24-.04-.48-.1-.72-.16-.04-.01-.07-.02-.1-.03-.25-.06-.5-.14-.74-.22 0-.01-.03-.01-.04-.01-.19-.07-.39-.15-.58-.23a10.849 10.849 0 0 1-1.7-.91c-.26-.17-.51-.35-.75-.55-.32-.25-.62-.53-.91-.82-.29-.29-.55-.59-.8-.91-.02-.02-.03-.03-.04-.05-.52-.66-.96-1.39-1.29-2.16-.22-.49-.4-1-.54-1.52l-.03-.11c-.04-.15-.08-.3-.11-.46-.01-.05-.02-.11-.03-.17a9.74 9.74 0 0 1-.19-1.97v-6.32c0-1.18.96-2.14 2.15-2.14h28.19c0-5.22 4.24-9.45 9.46-9.45s9.45 4.23 9.45 9.45h28.21c1.19 0 2.14.96 2.14 2.14Z"
                                    fill="#f3f4f6"
                                    strokeWidth={2.5}
                                    strokeLinejoin="round"
                                    stroke="#1e293b"
                                />
                                <path
                                    d="M148.89 21.76h-48.23c-.61 0-1.09.49-1.09 1.1 0 0 1.88 61.2-6.5 127.63V21.7c0-4.69 3.79-8.49 8.48-8.49h47v5.95c0 .22 0 .45.02.67a9.74 9.74 0 0 0 .17 1.3c0 .04.02.09.03.13.03.17.07.34.12.5Zm134.75-.06v232.56c0 4.7-3.81 8.5-8.49 8.5h-173.6c-4.69 0-8.48-3.8-8.48-8.5v-14.64h115.47c.39 0 .79-.01 1.21-.04h.01c.09 0 .18 0 .28-.02.04 0 .08-.01.13-.01.91-.08 1.87-.21 2.88-.41.16-.03.32-.06.48-.1 1.27-.26 2.6-.62 3.99-1.06.42-.13.86-.27 1.29-.42a58.4 58.4 0 0 0 3.98-1.52c.59-.25 1.19-.5 1.79-.78.6-.26 1.21-.54 1.82-.84.52-.25 1.05-.5 1.58-.77.09-.05.18-.09.27-.14a90.75 90.75 0 0 0 3.74-1.99c1.89-1.06 3.78-2.19 5.67-3.4.45-.29.89-.58 1.34-.88.48-.31.97-.64 1.45-.97 1.71-1.16 3.4-2.38 5.06-3.64.58-.45 1.15-.89 1.72-1.34.53-.42 1.06-.85 1.58-1.28.46-.38.93-.77 1.38-1.14l.97-.85h.01l.04-.04c.07-.06.14-.12.21-.19.24-.2.47-.41.71-.62.85-.76 1.69-1.54 2.5-2.32.1-.09.2-.19.3-.29.3-.3.6-.59.89-.88l.89-.89c.54-.56 1.08-1.12 1.6-1.68.24-.27.48-.53.72-.79.06-.08.13-.15.2-.23l.27-.3c.11-.12.22-.25.33-.38l.39-.45c.13-.16.27-.31.4-.47.09-.12.19-.23.28-.34.07-.08.13-.15.19-.23.16-.19.31-.38.46-.57.06-.07.13-.15.19-.23l.54-.69c.03-.03.06-.07.09-.11.29-.38.57-.75.85-1.13.09-.13.19-.26.28-.39.18-.25.36-.5.53-.75.04-.06.08-.12.13-.18.27-.41.55-.81.81-1.22.08-.12.16-.25.24-.37.17-.27.33-.54.5-.81.11-.19.23-.39.34-.58.17-.28.33-.57.49-.85.01-.02.02-.05.04-.08.01-.01.02-.03.03-.05.16-.29.31-.58.46-.87.01-.01.01-.03.02-.04.01-.01.01-.02.02-.03.39-.77.74-1.57 1.05-2.39.19-.5.36-1.02.51-1.53.92-3.04 1.36-6.29 1.8-9.51.37-2.75.56-5.57.56-8.42l3.72-154.26c0-.61-.49-1.1-1.09-1.1H227.8c.04-.16.08-.33.12-.5 0-.04.02-.09.03-.13.12-.64.19-1.29.19-1.97v-5.95h47c4.68 0 8.49 3.8 8.49 8.49Z"
                                    style={{
                                        fill: "#e5e5e5",
                                        stroke: "#1e293b",
                                        strokeLinejoin: "round",
                                        strokeWidth: "2.5px",
                                    }}
                                />
                            </g>
                            <path
                                d="M227.93 20.84v.92h-.11c-.14.56-.33 1.11-.57 1.63-.33.77-.77 1.5-1.29 2.16-.01.02-.02.03-.04.05-.25.32-.52.63-.8.92-.29.29-.59.56-.91.81-.24.2-.49.38-.75.55-.23.15-.48.3-.73.44-.02 0-.04.02-.05.03-.21.11-.42.22-.64.31-.09.05-.18.09-.28.13-.19.08-.38.16-.58.23-.01 0-.03 0-.04.01-.26.09-.53.17-.8.24-.01.01-.02.01-.03.01-.25.06-.49.12-.75.16l-.15.03c-.26.04-.53.08-.81.1-.3.03-.6.04-.9.04h-58.69c-.3 0-.61-.01-.91-.04-.23-.02-.45-.05-.68-.08-.1-.02-.2-.03-.3-.05-.24-.04-.48-.1-.72-.16-.04-.01-.07-.02-.1-.03-.25-.06-.5-.14-.74-.22 0-.01-.03-.01-.04-.01-.19-.07-.39-.15-.58-.23a10.849 10.849 0 0 1-1.7-.91c-.26-.17-.51-.35-.75-.55-.32-.25-.62-.53-.91-.82-.29-.29-.55-.59-.8-.91-.02-.02-.03-.03-.04-.05-.52-.66-.96-1.39-1.29-2.16-.22-.49-.4-1-.54-1.52l-.03-.11h-.11v-.92h79.16Z"
                                style={{
                                    mixBlendMode: "multiply",
                                }}
                                opacity={0.39}
                                fill="#9ca3af"
                            />
                        </g>
                    </g>
                </g>
            </svg>
        </>
    )
}