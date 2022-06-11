import { Entry } from "@prisma/client";
import { Link } from "@remix-run/react";
import { ChallengeWithActivities } from "~/models/challenge.server";
import { daysBetween, useMatchesData, UTCFormattedDate } from "~/utils";

export type challengeMatchesData = {
    challenge?: ChallengeWithActivities,
    entries?: Entry[],
}

export default function ChallengeEntries() {

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
        formattedDate: new Date(challengeStart.getTime() + ((i + 1) * 24 * 60 * 60 * 1000)).toLocaleDateString('en-US', {
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
                                <tr key={day} className="contents">
                                    <td>{day}</td>
                                    <td>{formattedDate}</td>
                                    <td>{entry?.amount || " "}</td>
                                    <td>{entry?.notes || " "}</td>
                                    <td>
                                        <Link to={`entries/new?month=${month}&day=${dayOfMonth}`}>Add</Link>
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