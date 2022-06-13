import { Disclosure } from "@headlessui/react";
import { ChevronUpIcon } from "@heroicons/react/outline";
import { Profile } from "@prisma/client";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, Outlet, useCatch, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";



import { Entry, ChallengeWithActivities, getChallengeLeaderboard } from "~/models/challenge.server";
import { getChallengeEntries, getChallenge, getTotalSteps } from "~/models/challenge.server";

import { requireUserId } from "~/session.server";

import { daysBetween } from "~/utils";

type LoaderData = {
    challenge: ChallengeWithActivities;
    entries: Entry[];
    leaderboard: {
        name: string;
        steps: number;
    }[];
    totalSteps: number;
}

type LeaderBoardReduceReturnType = {
    name: string;
    amount: number;
    userId: string;
}

export const loader: LoaderFunction = async ({ request, params }) => {
    const userId = await requireUserId(request);
    invariant(params.challengeId, "challengeId not found");

    const challenge = await getChallenge({ id: params.challengeId, userId });
    if (!challenge) {
        throw new Response("Not Found", { status: 404 });
    }

    const [entries] = await getChallengeEntries({ id: params.challengeId, userId });
    const aggregation = await getTotalSteps({ id: params.challengeId, userId });

    const leaderboardData = await getChallengeLeaderboard({ id: params.challengeId });
    const leaderboard = leaderboardData
        .map((entry) => ({
            name: `${entry.user?.profile?.firstName || 'anonymous'} ${entry.user?.profile?.lastName || ''}`,
            userId: entry.userId,
            amount: entry.amount || 0
        }))
        .reduce<LeaderBoardReduceReturnType[]>((acc, entry) => {
            const exists = acc.find((e) => e.userId === entry.userId);
            if (!exists) {
                acc.push(entry)
            } else {
                exists.amount ? exists.amount += entry.amount : entry.amount;
            }
            return acc;
        }, []).map(users => ({ name: users.name, steps: users.amount })).sort((userA: { name: string; steps: number }, userB: { name: string; steps: number }) => {
            if (userA.steps > userB.steps) {
                return -1;
            }
            return 1;
        });


    return json<LoaderData>({ challenge, entries: entries?.entries, totalSteps: aggregation._sum.amount || 0, leaderboard });

}

function getProjectedStepsPerWeek(stepsCompleted: number, stepsGoal: number, daysLeft: number): { sessions: number, steps: number }[] {
    // =ROUNDUP(stepsRemaining/ ((daysLeft)*3/7))
    const stepsRemaining = stepsGoal - stepsCompleted;
    const projectedSessionsPerWeek = [3, 4, 5, 6, 7];
    const stepProjection = projectedSessionsPerWeek.map(projectedSessions => ({
        sessions: projectedSessions,
        steps: Math.ceil(stepsRemaining / (daysLeft * projectedSessions / 7))
    }))
    return stepProjection;
}

function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function ChallengeDetailsPage() {
    const data = useLoaderData() as LoaderData;
    const totalSteps = Number(data.totalSteps);
    const daysLeft = daysBetween(new Date(), data.challenge.endDate) + 1;
    const projectedSteps = getProjectedStepsPerWeek(
        totalSteps,
        data.challenge.activity[0]?.amount || 0,
        daysLeft
    )

    return (
        <div className='max-w-6xl'>
            <div className="mb-2 sm:mb-6">
                <h3 className="text-3xl font-bold">{data.challenge.title}</h3>
                <p className="py-6">{data.challenge.description}</p>


            </div>
            <div>

                <div className="grid grid-cols-3 gap-x-8 gap-y-6 py-8 mb-8">

                    {/* stats */}
                    <div className="hidden rounded-lg shadow-sm ring-1 ring-black ring-opacity-5 col-span-3 md:block md:col-span-2 xl:col-auto py-3 px-4">

                        <h4 className="text-center text-lg font-bold mb-2 py-3 px-4 decoration-slate-800 underline-offset-2 underline decoration-4 xl:text-left">Stats</h4>
                        <div className="flex flex-col justify-between md:flex-row xl:flex-col">

                            <div className="flex flex-col  py-3 px-4 mb-4">
                                <h4 className=" text-center text-xl lg:text-2xl font-bold mb-3">{capitalize(data.challenge.activity[0].unit || ""} Completed</h4>
                                <p className="text-center text-xl lg:text-4xl font-extrabold">{data.totalSteps}</p>
                            </div>
                            <div className="flex flex-col py-3 px-4 mb-4">
                                <h4 className="grow text-center text-xl lg:text-2xl font-bold mb-3">{capitalize(data.challenge.activity[0].unit || "")} Left</h4>
                                <p className="text-center text-xl lg:text-4xl font-extrabold">{(data.challenge.activity[0]?.amount || 0) - totalSteps}</p>
                            </div>
                            <div className="flex flex-col  pt-3 pb-7 px-4">
                                <h4 className="grow text-center text-xl lg:text-2xl font-bold mb-3">Days Left</h4>
                                <p className="text-center text-xl lg:text-4xl font-extrabold">{daysLeft}</p>
                            </div>
                        </div>
                    </div>

                    {/* Projected Steps */}
                    <div className="hidden rounded-lg shadow-sm ring-1 ring-black ring-opacity-5 col-span-3 md:block md:col-span-2 xl:col-auto py-3 px-4">
                        <h4 className="font-bold md:text-xl decoration-slate-800 underline-offset-2 underline decoration-4 py-3 px-4 mb-8">Projected Steps Left Per Week</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="place-self-center font-bold">Sessions / Week</div>
                            <div className="place-self-center font-bold">Steps / Session</div>
                            {projectedSteps.map(({ sessions, steps }) => (
                                <>
                                    <div className="place-self-center text-xl">{sessions}</div>
                                    <div className="place-self-center text-xl">{steps}</div>
                                </>
                            ))}
                        </div>
                    </div>
                    {/* Leaderboard */}
                    <div className="hidden shadow-sm ring-1 ring-black ring-opacity-5 col-span-3 md:block md:col-auto md:row-span-2 md:col-start-3 md:row-start-1 xl:row-auto py-3 px-4 border rounded border-slate-100">
                        <h4 className="text-2xl font-bold py-3 px-4 decoration-slate-800 underline-offset-2 underline decoration-4">Leaderboard</h4>

                        {data.leaderboard.slice(0, 5).map((entry, index) => (
                            <div key={`${entry.name}-${entry.steps}`} className="flex border-b border-slate-100 py-3 px-4 last:border-b-0">
                                <div className="mr-4 flex items-center text-lg font-bold">{index + 1}</div>
                                <div className="grow flex flex-col">
                                    {entry.name}
                                    <br />
                                    <span className="text-sm">{entry.steps} {data.challenge.activity[0].unit}</span>
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
                                                    <h4 className=" text-center text-xl lg:text-2xl font-bold mb-3">{data.challenge.activity[0].unit} Completed</h4>
                                                    <p className="text-center text-xl lg:text-4xl font-extrabold">{data.totalSteps}</p>
                                                </div>
                                                <div className="flex flex-col py-3 px-4 mb-4">
                                                    <h4 className="grow text-center text-xl lg:text-2xl font-bold mb-3">{data.challenge.activity[0].unit} Left</h4>
                                                    <p className="text-center text-xl lg:text-4xl font-extrabold">{(data.challenge.activity[0]?.amount || 0) - totalSteps}</p>
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
                                                    <>
                                                        <div className="place-self-center text-xl">{sessions}</div>
                                                        <div className="place-self-center text-xl">{steps}</div>
                                                    </>
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
                                                        <span className="text-sm">{entry.steps} {data.challenge.activity[0].unit}</span>
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
                <Outlet />

            </div>

        </div>
    )
}

export function ErrorBoundary({ error }: { error: Error }) {
    console.error(error);

    return <div>An unexpected error occurred: {error.message}</div>;
}

export function CatchBoundary() {
    const caught = useCatch();

    if (caught.status === 404) {
        return <div>Challenge not found</div>;
    }

    throw new Error(`Unexpected caught response with status: ${caught.status}`);
}

