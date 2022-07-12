import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useLoaderData, useActionData } from "@remix-run/react";
import * as React from "react";
import { requireUserId } from "~/session.server";

import { createChallenge, createChallengeActivity, getActiveChallengesListItems } from "~/models/challenge.server";
import { getUserById } from "~/models/user.server";
import { RadioGroup } from "@headlessui/react";

type ActionData = {
    errors?: {
        challengeTitle?: string;
        challengeDescription?: string;
        startDate?: string;
        endDate?: string;
        isPublic?: string;
        published?: string;
        activityAmount?: string;
        activityName?: string;

        activityTrackType?: string;
        activityUnit?: string;
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

    // challenge: title, description, startDate, endDate, isPublic, published
    // challenge activity:  amount, trackType, unit, activityName
    return (
        <div className="p-3">
            <h1 className="text-4xl mb-8">Create a Challenge</h1>
            {actionData?.success && <p>Success!</p>}

            <Form method="post" style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,

            }}>
                <ChallengeDetailsSection fieldErrors={actionData?.errors} />

                <div className="hidden sm:block" aria-hidden="true">
                    <div className="py-5">
                        <div className="border-t border-gray-200" />
                    </div>
                </div>

                <ActivityDetails fieldErrors={actionData?.errors} />


                <div className="mt-8 gap-4 flex justify-end">
                    <button
                        type="submit"
                        className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
                    >
                        Save
                    </button>
                    <Link to={'..'} className="rounded bg-gray-100 py-2 px-4 hover:bg-gray-200 focus:bg-gray-300">Cancel</Link>
                </div>
            </Form>
        </div>
    )
}

interface VisibilityOption {
    name: string;
    value: string;
    description: string,
}

const visibilityOptions: VisibilityOption[] = [
    {
        name: 'Public',
        value: 'isPublic',
        description: 'Available for all members to join'
    },
    {
        name: 'Join Code',
        value: 'joinCode',
        description: 'Requires a "secret" 🤫 code'
    },
]

function ChallengeDetailsSection({ fieldErrors }: { fieldErrors: ActionData["errors"] }) {
    const challengeTitleRef = React.useRef<HTMLInputElement>(null);
    const descriptionRef = React.useRef<HTMLTextAreaElement>(null);
    const startDateRef = React.useRef<HTMLInputElement>(null);
    const endDateRef = React.useRef<HTMLInputElement>(null);
    const isPublicRef = React.useRef<HTMLInputElement>(null);
    const publishedRef = React.useRef<HTMLInputElement>(null);
    return (
        <>
            <div>
                <div className="md:grid md:grid-cols-3 md:gap-6">
                    <div className="md:col-span-1">
                        <div className="px-4 sm:px-0">
                            <h3 className="text-xl font-medium leading-6 text-gray-900">Challenge Details</h3>
                            <p className="mt-1 text-sm text-gray-600">
                                This section configures the core challenge details.
                            </p>
                        </div>
                    </div>
                    <div className="mt-5 md:mt-0 md:col-span-2">
                        {/* start */}
                        <div>

                            <div className="shadow overflow-hidden sm:rounded-md">
                                <div className="px-4 py-5 bg-white sm:p-6">
                                    <div className="grid grid-cols-6 gap-6">

                                        <FormTextInput
                                            label="Challenge Title"
                                            name="challengeTitle"
                                            fieldError={fieldErrors?.challengeTitle}
                                            ref={challengeTitleRef}
                                        />

                                        <div className="col-span-6">
                                            <label htmlFor="description" className="block text-lg font-medium text-gray-700">
                                                Challenge Description
                                            </label>
                                            <p className="my-2 text-sm text-gray-500">
                                                Brief description of the challenge. Include any details about what activity or activites are being tracked, length of the challenge, if/how points are calculated, any prizes or bragging rights, or anything else you think people should know!
                                            </p>
                                            <div className="mt-2">
                                                <textarea
                                                    id="description"
                                                    name="description"
                                                    ref={descriptionRef}
                                                    rows={3}
                                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full  border border-gray-300 rounded-md"
                                                    aria-invalid={fieldErrors?.challengeDescription ? true : undefined}
                                                    aria-errormessage={fieldErrors?.challengeDescription ? "description-error" : undefined}
                                                    defaultValue={''}
                                                    required
                                                />
                                            </div>
                                            {fieldErrors?.challengeTitle && (
                                                <div className="text-red-500 text-sm italic" id="challengeDescription-error">
                                                    {fieldErrors.challengeDescription}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-span-6 sm:col-span-4">
                                            <label htmlFor="startDate" className="block font-medium text-lg text-gray-700">
                                                Challenge Start Date
                                            </label>
                                            <input
                                                ref={startDateRef}
                                                name="startDate"
                                                id="endDate"
                                                placeholder="EST EX: 2022-05-01T00:00:00-0400"
                                                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm  border-gray-300 rounded-md leading-loose"
                                                aria-invalid={fieldErrors?.startDate ? true : undefined}
                                                aria-errormessage={fieldErrors?.startDate ? "startDate-error" : undefined}
                                                type="date"
                                                required
                                            />

                                            {fieldErrors?.startDate && (
                                                <div className="text-red-500 text-sm italic" id="startDate-error">
                                                    {fieldErrors.startDate}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-span-6 sm:col-span-4">
                                            <label htmlFor="endDate" className="block font-medium text-lg text-gray-700">
                                                Challenge End Date
                                            </label>
                                            <input
                                                ref={endDateRef}
                                                name="endDate"
                                                id="endDate"

                                                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm  border-gray-300 rounded-md leading-loose"
                                                aria-invalid={fieldErrors?.endDate ? true : undefined}
                                                aria-errormessage={fieldErrors?.endDate ? "endDate-error" : undefined}
                                                type="date"
                                                required
                                            />

                                            {fieldErrors?.endDate && (
                                                <div className="text-red-500 text-sm italic" id="endDate-error">
                                                    {fieldErrors.endDate}
                                                </div>
                                            )}
                                        </div>

                                        <VisibilityRadioGroup />




                                        <div className="col-span-6 md:col-span-4">
                                            <label className="flex w-full flex-col gap-1">
                                                <span className="block font-medium text-lg text-gray-700">Is the challenge published:</span>
                                                <input
                                                    ref={publishedRef}
                                                    name="published"
                                                    placeholder="True or False"
                                                    className="shadow-sm focus:ring-blue-500 focus:border-blue-500 mt-1 block w-full  border border-gray-300 rounded-md leading-loose"
                                                    aria-invalid={fieldErrors?.published ? true : undefined}
                                                    aria-errormessage={fieldErrors?.published ? "published-error" : undefined}
                                                    type="text"

                                                />
                                            </label>
                                            {fieldErrors?.published && (
                                                <div className="text-red-500 text-sm italic" id="published-error">
                                                    {fieldErrors.published}
                                                </div>
                                            )}
                                        </div>


                                    </div>



                                </div>
                            </div>
                        </div>
                        {/* end */}
                    </div>
                </div>
            </div>
        </>
    )
}

function ActivityDetails({ fieldErrors }: { fieldErrors: ActionData["errors"] }) {
    const activityNameRef = React.useRef<HTMLInputElement>(null);
    const activityAmountRef = React.useRef<HTMLInputElement>(null);
    const activityTrackTypeRef = React.useRef<HTMLInputElement>(null);
    const activityUnitRef = React.useRef<HTMLInputElement>(null);

    return (
        <>
            <div>
                <div className="md:grid md:grid-cols-3 md:gap-6">
                    <div className="md:col-span-1">
                        <div className="px-4 sm:px-0">
                            <h3 className="text-xl font-medium leading-6 text-gray-900">Activity Details</h3>
                            <p className="mt-1 text-sm text-gray-600">
                                Add activities to track for this challenge.
                            </p>
                        </div>
                    </div>
                    <div className="mt-5 md:mt-0 md:col-span-2">
                        {/* start fields */}
                        <div>

                            <div className="shadow overflow-hidden sm:rounded-md">
                                <div className="px-4 py-5 bg-white sm:p-6">
                                    <div className="grid grid-cols-6 gap-6">
                                        <div className="col-span-6 sm:col-span-4">
                                            <label htmlFor="activityName" className="block font-medium text-lg text-gray-700">
                                                Activity Name
                                            </label>
                                            <input
                                                ref={activityNameRef}
                                                name="activityName"
                                                required
                                                className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm  border-gray-300 rounded-md leading-loose"
                                                aria-invalid={fieldErrors?.activityName ? true : undefined}
                                                aria-errormessage={fieldErrors?.activityName ? "activityName-error" : undefined}
                                                type="text"

                                            />
                                            {fieldErrors?.activityName && (
                                                <div className="text-red-500 text-sm italic" id="activityName-error">
                                                    {fieldErrors.activityName}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-span-6 sm:col-span-4">
                                            <label className="flex w-full flex-col gap-1">
                                                <span className="block font-medium text-lg text-gray-700">Activity TrackType:</span>
                                                <input
                                                    ref={activityTrackTypeRef}
                                                    name="activityTrackType"

                                                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm  border-gray-300 rounded-md leading-loose"
                                                    aria-invalid={fieldErrors?.activityTrackType ? true : undefined}
                                                    aria-errormessage={fieldErrors?.activityTrackType ? "activityTrackType-error" : undefined}
                                                    type="text"

                                                />
                                            </label>
                                            {fieldErrors?.activityTrackType && (
                                                <div className="text-red-500 text-sm italic" id="activityTrackType-error">
                                                    {fieldErrors.activityTrackType}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-span-6 sm:col-span-4">
                                            <label className="flex w-full flex-col gap-1">
                                                <span className="block font-medium text-lg text-gray-700">Activity Unit:</span>
                                                <input
                                                    ref={activityUnitRef}
                                                    name="activityUnit"

                                                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm  border-gray-300 rounded-md leading-loose"
                                                    aria-invalid={fieldErrors?.activityUnit ? true : undefined}
                                                    aria-errormessage={fieldErrors?.activityUnit ? "activityUnit-error" : undefined}
                                                    type="text"

                                                />
                                            </label>
                                            {fieldErrors?.activityUnit && (
                                                <div className="text-red-500 text-sm italic" id="activityUnit-error">
                                                    {fieldErrors.activityUnit}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-span-6 sm:col-span-4">
                                            <label className="flex w-full flex-col gap-1">
                                                <span className="block font-medium text-lg text-gray-700">Activity Amount to Track:</span>
                                                <input
                                                    ref={activityAmountRef}
                                                    name="activityAmount"

                                                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm  border-gray-300 rounded-md leading-loose"
                                                    aria-invalid={fieldErrors?.activityAmount ? true : undefined}
                                                    aria-errormessage={fieldErrors?.activityAmount ? "activityAmount-error" : undefined}
                                                    type="number"

                                                />
                                            </label>
                                            {fieldErrors?.activityAmount && (
                                                <div className="text-red-500 text-sm italic" id="activityAmount-error">
                                                    {fieldErrors.activityAmount}
                                                </div>
                                            )}
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* end fields */}
                    </div>
                </div>
            </div>
        </>
    );
}

// { name, label, ref, fieldError }
interface TextInputProps extends React.HTMLProps<HTMLDivElement> {
    name: string,
    label: string,
    fieldError: string | undefined,
}

const FormTextInput = React.forwardRef<HTMLInputElement, TextInputProps>((props, ref) => {
    return (


        <div className="col-span-6 sm:col-span-4">
            <label className="flex w-full flex-col gap-1">
                <span className="block font-medium text-lg text-gray-700">{props.label}</span>
                <input
                    ref={ref}
                    name={props.name}
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm  border-gray-300 rounded-md leading-loose"
                    aria-invalid={props.fieldError ? true : undefined}
                    aria-errormessage={props.fieldError ? "activityAmount-error" : undefined}
                    type="text"

                />
            </label>
            {props.fieldError && (
                <div className="text-red-500 text-sm italic" id="activityAmount-error">
                    {props.fieldError}
                </div>
            )}
        </div>
    )
})

function VisibilityRadioGroup() {
    const [selected, setSelected] = React.useState(visibilityOptions[0])

    return (
        <div className="col-span-6 md:col-span-4">
            <div className="w-full max-w-md">
                <RadioGroup value={selected.value}
                    onChange={(e: string) => {
                        let foundOption = visibilityOptions.find(option => option.value === e);
                        if (foundOption) {

                            setSelected(foundOption)
                        }
                    }
                    }
                    name="visibility">
                    <RadioGroup.Label className="block py-4">Visibility Options</RadioGroup.Label>
                    <div className="space-y-2">
                        {visibilityOptions.map((option) => (
                            <RadioGroup.Option
                                key={option.value}
                                value={option.value}

                                className={({ active, checked }) =>
                                    `${active
                                        ? 'ring-2 ring-white ring-opacity-60 ring-offset-2 ring-offset-sky-300'
                                        : ''
                                    }
                    ${checked ? 'bg-sky-900 bg-opacity-75 text-white' : 'bg-white'
                                    }
                      relative flex cursor-pointer rounded-lg px-5 py-4 shadow-md focus:outline-none`
                                }
                            >
                                {({ active, checked }) => (
                                    <>
                                        <div className="flex w-full items-center justify-between">
                                            <div className="flex items-center">
                                                <div className="text-sm">
                                                    <RadioGroup.Label
                                                        as="p"
                                                        className={`font-medium  ${checked ? 'text-white' : 'text-gray-900'
                                                            }`}
                                                    >
                                                        {option.name}
                                                    </RadioGroup.Label>
                                                    <RadioGroup.Description
                                                        as="span"
                                                        className={`inline ${checked ? 'text-sky-100' : 'text-gray-500'
                                                            }`}
                                                    >
                                                        <span>
                                                            {option.description}</span>
                                                    </RadioGroup.Description>
                                                </div>
                                            </div>
                                            {checked && (
                                                <div className="shrink-0 text-white">
                                                    <CheckIcon className="h-6 w-6" />
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </RadioGroup.Option>
                        ))}
                    </div>
                </RadioGroup>
            </div>
            {selected.value == "joinCode" && (

                <div className="py-4">
                    {/* TODO */}
                    <FormTextInput
                        fieldError={undefined}
                        label="Join Code"
                        name="joinCode"
                    />
                </div>
            )}
        </div >
    )
}

function CheckIcon({ className }: { className: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
            <circle cx={12} cy={12} r={12} fill="#fff" opacity="0.2" />
            <path
                d="M7 13l3 3 7-7"
                stroke="#fff"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}