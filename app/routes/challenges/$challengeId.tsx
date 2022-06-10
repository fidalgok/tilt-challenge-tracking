import { Profile } from "@prisma/client";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useCatch, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";



import { Entry, ChallengeWithActivities, getChallengeLeaderboard } from "~/models/challenge.server";
import { getChallengeEntries, getChallenge, getTotalSteps } from "~/models/challenge.server";
//TODO: bring in the ability to create and delete entries
//TODO: bring in the ability to aggregate entries for the leaderboard
import { requireUserId } from "~/session.server";

import { daysBetween, UTCFormattedDate } from "~/utils";

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
            name: `${entry.user.profile?.firstName} ${entry.user.profile?.lastName}`,
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
        }, []).map(users => ({ name: users.name, steps: users.amount })).sort();


    return json<LoaderData>({ challenge, entries: entries?.entries, totalSteps: aggregation._sum.amount || 0, leaderboard });

}

export default function ChallengeDetailsPage() {
    const data = useLoaderData() as LoaderData;
    const totalSteps = Number(data.totalSteps);

    return (
        <>
            <div className="mb-8">
                <h3 className="text-3xl font-bold">{data.challenge.title}</h3>
                <p className="py-6">{data.challenge.description}</p>


            </div>
            <div className="grid grid-cols-[1fr_minmax(200px,_max-content)]">

                <div>

                    <div className="flex py-4 mb-8">

                        <div className="w-1/3">
                            <h4 className="text-center text-2xl font-bold mb-3">{data.challenge.activity[0].unit} Completed</h4>
                            <p className="text-center text-4xl font-extrabold">{data.totalSteps}</p>
                        </div>
                        <div className="w-1/3">
                            <h4 className="text-center text-2xl font-bold mb-3">{data.challenge.activity[0].unit} Left</h4>
                            <p className="text-center text-4xl font-extrabold">{(data.challenge.activity[0]?.amount || 0) - totalSteps}</p>
                        </div>
                        <div className="w-1/3">
                            <h4 className="text-center text-2xl font-bold mb-3">Days Left</h4>
                            <p className="text-center text-4xl font-extrabold">{daysBetween(new Date(), data.challenge.endDate) + 1}</p>
                        </div>
                    </div>
                    <ChallengeEntries
                        entries={data.entries}
                        challengeStart={new Date(data.challenge.startDate)}
                        challengeEnd={new Date(data.challenge.endDate)}
                        challengeId={data.challenge.id}
                    />
                </div>
                <div className="self-start pt-4 px-2 border rounded border-slate-100">
                    <h4 className="text-2xl font-bold">Leaderboard</h4>
                    <hr />
                    {data.leaderboard.map((entry, index) => (
                        <div key={entry.name} className="flex border-b border-slate-100 py-3 last:border-b-0">
                            <div className="mr-4 flex items-center text-lg font-bold">{index + 1}</div>
                            <div className="grow flex flex-col">
                                {entry.name}
                                <br />
                                <span className="text-sm">{entry.steps} {data.challenge.activity[0].unit}</span>
                            </div>

                        </div>
                    ))}
                </div>
            </div>

        </>
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

function ChallengeEntries({ challengeId, entries, challengeStart, challengeEnd }: { challengeId: string, entries: Entry[], challengeStart: Date, challengeEnd: Date }) {
    // TODO: Pass in Challenge start and end date to calculate days of challenge
    // loop over those days and display the entries that match the date
    const challengeDays = daysBetween(challengeStart, challengeEnd);
    // create an empty array of challengeDays with an index for the day and the corresponding date    
    const challengeDaysArray = Array.from({ length: challengeDays }, (_, i) =>
    ({
        day: i + 1,
        date: challengeStart.getTime() + ((i) * 24 * 60 * 60 * 1000),
        dateAsUTCString: UTCFormattedDate(new Date(challengeStart.getTime() + ((i) * 24 * 60 * 60 * 1000))),
        formattedDate: new Date(challengeStart.getTime() + ((i + 1) * 24 * 60 * 60 * 1000)).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        }),

    }));
    console.log({ challengeDaysArray, entries })
    return (
        <div >


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
                        challengeDaysArray.map(({ day, dateAsUTCString, formattedDate }) => {

                            const entry = entries.find(e => UTCFormattedDate(new Date(e.date)) === dateAsUTCString);

                            return (
                                <tr key={day} className="contents">
                                    <td>{day}</td>
                                    <td>{formattedDate}</td>
                                    <td>{entry?.amount || " "}</td>
                                    <td>{entry?.notes || " "}</td>
                                    <td>
                                        <Link to={`entries/create`}>Add</Link>
                                        {entry && (
                                            <>
                                                <Link to={`entries/${entry.id}/edit`}>Edit</Link>
                                                <Link to={`entries/${entry.id}/delete`}>Delete</Link>
                                            </>
                                        )}

                                    </td>
                                </tr>
                            )
                        })
                    }

                </tbody>
            </table>
        </div>
    )
}