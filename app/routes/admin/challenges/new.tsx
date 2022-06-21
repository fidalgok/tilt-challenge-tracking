import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData, useActionData } from "@remix-run/react";
import * as React from "react";
import { requireUserId } from "~/session.server";

import { createChallenge, createChallengeActivity, getActiveChallengesListItems } from "~/models/challenge.server";
import { getUserById } from "~/models/user.server";

type ActionData = {
    errors?: {
        [key: string]: string;
    },
    success?: string
}

type LoaderData = {
    challengeListItems: Awaited<ReturnType<typeof getActiveChallengesListItems>>;
};


export const action: ActionFunction = async ({ request }) => {
    const userId = await requireUserId(request);
    const user = await getUserById(userId);
    let reqHeaders = request.headers.entries();
    // Display the key/value pairs
    for (var pair of reqHeaders) {
        console.log(pair[0] + ': ' + pair[1]);
    }


    if (!user) {
        return json({ message: 'unauthorized' }, { status: 401 });
    }
    if (user.email.toLowerCase() == 'kyle.fidalgo@gmail.com') {
        // good to go
    } else if (user.role !== "ADMIN") {
        return json({ message: 'unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();

    const challengeTitle = formData.get("challengeTitle");
    const description = formData.get("description");
    const startDate = formData.get("startDate");
    const endDate = formData.get("endDate");
    const isPublic = formData.get("isPublic");
    const published = formData.get("published");
    const activityName = formData.get("activityName");
    const activityAmount = formData.get("activityAmount");
    const activityUnit = formData.get("activityUnit");
    const activityTrackType = formData.get("activityTrackType");
    // all the things I need
    // challenge: title, description, startDate, endDate, isPublic, published
    // challenge activity: challengeId, amount, trackType, unit, activityName
    console.log({ challengeTitle, description, startDate, endDate, isPublic, published, activityName, activityAmount, activityUnit, activityTrackType });
    if (typeof challengeTitle !== "string" || challengeTitle.length === 0) {
        return json<ActionData>(
            { errors: { challengeTitle: "Challenge title is required." } },
            { status: 400 }
        )
    }
    if (typeof description !== "string" || description.length === 0) {
        return json<ActionData>(
            { errors: { challengeDescription: "Challenge description is required." } },
            { status: 400 }
        )
    }
    if (typeof startDate !== "string" || startDate.length === 0) {
        return json<ActionData>(
            { errors: { startDate: "Challenge startDate is required." } },
            { status: 400 }
        )
    }
    if (typeof endDate !== "string" || endDate.length === 0) {
        return json<ActionData>(
            { errors: { endDate: "Challenge endDate is required." } },
            { status: 400 }
        )
    }
    if (typeof isPublic !== "string" || isPublic.length === 0) {
        return json<ActionData>(
            { errors: { isPublic: "Challenge isPublic is required." } },
            { status: 400 }
        )
    }
    if (typeof published !== "string" || published.length === 0) {
        return json<ActionData>(
            { errors: { published: "Challenge published is required." } },
            { status: 400 }
        )
    }
    if (!activityAmount || Number.isNaN(parseFloat(activityAmount.toString())) || Number(activityAmount) <= 0) {
        return json<ActionData>(
            { errors: { activityAmount: "Challenge activityAmount is required." } },
            { status: 400 }
        )
    }
    if (typeof activityName !== "string" || activityName.length === 0) {
        return json<ActionData>(
            { errors: { activityName: "Challenge activityName is required." } },
            { status: 400 }
        )
    }
    if (typeof activityName !== "string" || activityName.length === 0) {
        return json<ActionData>(
            { errors: { activityName: "Challenge activityName is required." } },
            { status: 400 }
        )
    }
    if (typeof activityTrackType !== "string" || activityTrackType.length === 0) {
        return json<ActionData>(
            { errors: { activityTrackType: "Challenge activityTrackType is required." } },
            { status: 400 }
        )
    }
    if (typeof activityUnit !== "string" || activityUnit.length === 0) {
        return json<ActionData>(
            { errors: { activityUnit: "Challenge activityUnit is required." } },
            { status: 400 }
        )
    }


    const convertedStartDate = new Date(startDate);

    const convertedEndDate = new Date(endDate);

    const challenge = await createChallenge({
        title: challengeTitle,
        description: description,
        startDate: convertedStartDate,
        endDate: convertedEndDate,
        isPublic: isPublic.toLowerCase() === "true",
        published: published.toLowerCase() === "true",
    });

    // we have the challenge now create the challenge activity
    const activity = await createChallengeActivity({
        challengeId: challenge.id,
        amount: Number(activityAmount),
        trackType: activityTrackType,
        unit: activityUnit,
        activityName: activityName,
    })

    return json<ActionData>({ success: "Challenge created successfully." });
}

export const loader: LoaderFunction = async ({ request }) => {
    const userId = await requireUserId(request);
    const user = await getUserById(userId);
    if (!user) {
        throw redirect("/challenges");
    }
    if (user.email.toLowerCase() == 'kyle.fidalgo@gmail.com') {
        // good to go
    } else if (user.role !== "ADMIN") {
        throw redirect("/challenges");
    }

    return null;
}

export default function CreateNewChallengePage() {
    const data = useLoaderData() as LoaderData;
    const actionData = useActionData();
    const challengeTitleRef = React.useRef<HTMLInputElement>(null);
    const descriptionRef = React.useRef<HTMLInputElement>(null);
    const startDateRef = React.useRef<HTMLInputElement>(null);
    const endDateRef = React.useRef<HTMLInputElement>(null);
    const isPublicRef = React.useRef<HTMLInputElement>(null);
    const publishedRef = React.useRef<HTMLInputElement>(null);
    const activityNameRef = React.useRef<HTMLInputElement>(null);
    const activityAmountRef = React.useRef<HTMLInputElement>(null);
    const activityTrackTypeRef = React.useRef<HTMLInputElement>(null);
    const activityUnitRef = React.useRef<HTMLInputElement>(null);
    // challenge: title, description, startDate, endDate, isPublic, published
    // challenge activity:  amount, trackType, unit, activityName
    return (
        <div className="p-3">
            <h1>Admin Page</h1>
            {actionData?.success && <p>Success!</p>}
            <p>You've reached the admin page. It's not pretty but it gets the job done for now.</p>
            <Form method="post" style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                width: "50%"
            }}>
                <div>
                    <label className="flex w-full flex-col gap-1">
                        <span>Challenge Title:</span>
                        <input
                            ref={challengeTitleRef}
                            name="challengeTitle"

                            className="flex-1 rounded-md border-2 focus:border-blue-500 px-2 text-lg leading-loose"
                            aria-invalid={actionData?.errors?.challengeTitle ? true : undefined}
                            aria-errormessage={actionData?.errors?.challengeTitle ? "challengeTitle-error" : undefined}
                            type="text"

                        />
                    </label>
                    {actionData?.errors?.challengeTitle && (
                        <div className="text-red-500 text-sm italic" id="challengeTitle-error">
                            {actionData.errors.challengeTitle}
                        </div>
                    )}
                </div>

                <div>
                    <label className="flex w-full flex-col gap-1">
                        <span>Challenge Description:</span>
                        <input
                            ref={descriptionRef}
                            name="description"

                            className="flex-1 rounded-md border-2 focus:border-blue-500 px-2 text-lg leading-loose"
                            aria-invalid={actionData?.errors?.description ? true : undefined}
                            aria-errormessage={actionData?.errors?.description ? "description-error" : undefined}
                            type="text"

                        />
                    </label>
                    {actionData?.errors?.description && (
                        <div className="text-red-500 text-sm italic" id="description-error">
                            {actionData.errors.description}
                        </div>
                    )}
                </div>

                <div>
                    <label className="flex w-full flex-col gap-1">
                        <span>Challenge Start Date:</span>
                        <input
                            ref={startDateRef}
                            name="startDate"
                            placeholder="EST EX: 2022-05-01T00:00:00-0400"
                            className="flex-1 rounded-md border-2 focus:border-blue-500 px-2 text-lg leading-loose"
                            aria-invalid={actionData?.errors?.startDate ? true : undefined}
                            aria-errormessage={actionData?.errors?.startDate ? "startDate-error" : undefined}
                            type="text"

                        />
                    </label>
                    {actionData?.errors?.startDate && (
                        <div className="text-red-500 text-sm italic" id="startDate-error">
                            {actionData.errors.startDate}
                        </div>
                    )}
                </div>
                <div>
                    <label className="flex w-full flex-col gap-1">
                        <span>Challenge End Date:</span>
                        <input
                            ref={endDateRef}
                            name="endDate"
                            placeholder="EST EX: 2022-05-01T00:00:00-0400"
                            className="flex-1 rounded-md border-2 focus:border-blue-500 px-2 text-lg leading-loose"
                            aria-invalid={actionData?.errors?.endDate ? true : undefined}
                            aria-errormessage={actionData?.errors?.endDate ? "endDate-error" : undefined}
                            type="text"

                        />
                    </label>
                    {actionData?.errors?.endDate && (
                        <div className="text-red-500 text-sm italic" id="endDate-error">
                            {actionData.errors.endDate}
                        </div>
                    )}
                </div>

                <div>
                    <label className="flex w-full flex-col gap-1">
                        <span>Is the challenge public:</span>
                        <input
                            ref={isPublicRef}
                            name="isPublic"
                            placeholder="True or False"
                            className="flex-1 rounded-md border-2 focus:border-blue-500 px-2 text-lg leading-loose"
                            aria-invalid={actionData?.errors?.isPublic ? true : undefined}
                            aria-errormessage={actionData?.errors?.isPublic ? "isPublic-error" : undefined}
                            type="text"

                        />
                    </label>
                    {actionData?.errors?.isPublic && (
                        <div className="text-red-500 text-sm italic" id="isPublic-error">
                            {actionData.errors.isPublic}
                        </div>
                    )}
                </div>

                <div>
                    <label className="flex w-full flex-col gap-1">
                        <span>Is the challenge published:</span>
                        <input
                            ref={publishedRef}
                            name="published"
                            placeholder="True or False"
                            className="flex-1 rounded-md border-2 focus:border-blue-500 px-2 text-lg leading-loose"
                            aria-invalid={actionData?.errors?.published ? true : undefined}
                            aria-errormessage={actionData?.errors?.published ? "published-error" : undefined}
                            type="text"

                        />
                    </label>
                    {actionData?.errors?.published && (
                        <div className="text-red-500 text-sm italic" id="published-error">
                            {actionData.errors.published}
                        </div>
                    )}
                </div>

                <div>
                    <label className="flex w-full flex-col gap-1">
                        <span>Activity Name:</span>
                        <input
                            ref={activityNameRef}
                            name="activityName"

                            className="flex-1 rounded-md border-2 focus:border-blue-500 px-2 text-lg leading-loose"
                            aria-invalid={actionData?.errors?.activityName ? true : undefined}
                            aria-errormessage={actionData?.errors?.activityName ? "activityName-error" : undefined}
                            type="text"

                        />
                    </label>
                    {actionData?.errors?.activityName && (
                        <div className="text-red-500 text-sm italic" id="activityName-error">
                            {actionData.errors.activityName}
                        </div>
                    )}
                </div>

                <div>
                    <label className="flex w-full flex-col gap-1">
                        <span>Activity Amount to Track:</span>
                        <input
                            ref={activityAmountRef}
                            name="activityAmount"

                            className="flex-1 rounded-md border-2 focus:border-blue-500 px-2 text-lg leading-loose"
                            aria-invalid={actionData?.errors?.activityAmount ? true : undefined}
                            aria-errormessage={actionData?.errors?.activityAmount ? "activityAmount-error" : undefined}
                            type="number"

                        />
                    </label>
                    {actionData?.errors?.activityAmount && (
                        <div className="text-red-500 text-sm italic" id="activityAmount-error">
                            {actionData.errors.activityAmount}
                        </div>
                    )}
                </div>

                <div>
                    <label className="flex w-full flex-col gap-1">
                        <span>Activity Unit:</span>
                        <input
                            ref={activityUnitRef}
                            name="activityUnit"

                            className="flex-1 rounded-md border-2 focus:border-blue-500 px-2 text-lg leading-loose"
                            aria-invalid={actionData?.errors?.activityUnit ? true : undefined}
                            aria-errormessage={actionData?.errors?.activityUnit ? "activityUnit-error" : undefined}
                            type="text"

                        />
                    </label>
                    {actionData?.errors?.activityUnit && (
                        <div className="text-red-500 text-sm italic" id="activityUnit-error">
                            {actionData.errors.activityUnit}
                        </div>
                    )}
                </div>

                <div>
                    <label className="flex w-full flex-col gap-1">
                        <span>Activity TrackType:</span>
                        <input
                            ref={activityTrackTypeRef}
                            name="activityTrackType"

                            className="flex-1 rounded-md border-2 focus:border-blue-500 px-2 text-lg leading-loose"
                            aria-invalid={actionData?.errors?.activityTrackType ? true : undefined}
                            aria-errormessage={actionData?.errors?.activityTrackType ? "activityTrackType-error" : undefined}
                            type="text"

                        />
                    </label>
                    {actionData?.errors?.activityTrackType && (
                        <div className="text-red-500 text-sm italic" id="activityTrackType-error">
                            {actionData.errors.activityTrackType}
                        </div>
                    )}
                </div>

                <div className="text-right">
                    <button
                        type="submit"
                        className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
                    >
                        Save
                    </button>
                </div>
            </Form>
        </div>
    )
}