import type { LoaderFunction, ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, } from "@remix-run/react";
import * as React from "react";
import { requireUserId } from "~/session.server";

import { ChallengeWithActivitiesUsers, updateChallenge } from "~/models/challenge.server";
import { getUserById } from "~/models/user.server";
import { RadioGroup } from "@headlessui/react";
import { parseDateStringFromServer, prepareDateForServer, stripTimeZone, useMatchesData } from "~/utils";
import { isBefore } from "date-fns";

type ActionData = {
    errors?: {
        challengeId?: string;
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

type MatchesData = {
    challenge: ChallengeWithActivitiesUsers
}



export const action: ActionFunction = async ({ request, params }) => {
    const userId = await requireUserId(request);
    const user = await getUserById(userId);

    if (!user || user.role !== "ADMIN") {
        return json({ message: 'unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();

    const challengeTitle = formData.get("challengeTitle");
    const description = formData.get("description");
    const startDate = formData.get("startDate");
    const endDate = formData.get("endDate");
    const isPublic = formData.get("isPublic");
    const published = formData.get("published");

    // all the things I need
    // challenge: title, description, startDate, endDate, isPublic, published

    //console.log({ challengeTitle, description, startDate, endDate, isPublic, published });
    if (!params.challengeId) {
        return json<ActionData>(
            {
                errors: { challengeId: "Challenge ID not found" },

            },
            { status: 400 }
        )
    }
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
    if (isBefore(new Date(endDate), new Date(startDate))) {
        return json<ActionData>(
            { errors: { endDate: "Challenge end date must be after start date" } },
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


    const convertedStartDate = new Date(prepareDateForServer(startDate));

    const convertedEndDate = new Date(prepareDateForServer(endDate));
    //console.log(convertedEndDate)

    const challenge = await updateChallenge(params.challengeId, {
        title: challengeTitle,
        description: description,
        startDate: convertedStartDate,
        endDate: convertedEndDate,
        isPublic: isPublic.toLowerCase() === "true",
        published: published.toLowerCase() === "true",
    });



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

export default function AdminEditChallengePage() {
    const actionData = useActionData();
    //console.log(challengeData)
    // TODO: lock down fields depending on whether challenge has started
    // or users have started adding entries.
    // challenge: title, description, startDate, endDate, isPublic, published

    return (
        <div className="p-3">
            <h1 className="text-4xl mb-8">Edit Challenge Details</h1>
            {actionData?.success && <p>Success!</p>}

            <Form method="post" style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,

            }}>
                <ChallengeDetailsSection fieldErrors={actionData?.errors} />

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

interface RadioOption {
    name: string;
    value: string;
    description: string,
}

const visibilityOptions: VisibilityOption[] = [
    {
        name: 'Public',
        value: 'true',
        description: 'Available for all members to join'
    },
    {
        name: 'Join Code',
        value: 'false',
        description: 'Requires a "secret" 🤫 code'
    },
]

function ChallengeDetailsSection({ fieldErrors }: { fieldErrors: ActionData["errors"] }) {
    const { challenge } = useMatchesData('routes/admin/challenges/$challengeId') as MatchesData;
    //console.log(challenge)
    const challengeTitleRef = React.useRef<HTMLInputElement>(null);
    const descriptionRef = React.useRef<HTMLTextAreaElement>(null);
    const startDateRef = React.useRef<HTMLInputElement>(null);
    const endDateRef = React.useRef<HTMLInputElement>(null);

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
                                            defaultValue={challenge?.title}
                                            required
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
                                                    defaultValue={challenge.description}
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
                                                defaultValue={parseDateStringFromServer(challenge.startDate?.toString()).split('T')[0]}

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
                                                defaultValue={parseDateStringFromServer(challenge.endDate.toString()).split("T")[0]}
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

                                        <VisibilityRadioGroup isPublic={challenge.public.toString()} />
                                        <HeadlessRadioGroup
                                            name="published"
                                            radioLabel="Published Status"
                                            published={challenge.published}
                                            radioOptions={
                                                [{ name: "Published", value: "true", description: "" },
                                                { name: "Unpublished", value: "false", description: "" }
                                                ]
                                            } />

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
                    defaultValue={props?.defaultValue}
                    required={props?.required ? true : false}
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

function VisibilityRadioGroup({ isPublic }: { isPublic?: string }) {
    const [selected, setSelected] = React.useState(visibilityOptions[0])

    return (
        <div className="col-span-6 md:col-span-4">
            <div className="w-full max-w-md">
                <RadioGroup
                    value={selected.value}
                    name='isPublic'
                    onChange={(e: string) => {
                        let foundOption = visibilityOptions.find(option => option.value === e);
                        if (foundOption) {

                            setSelected(foundOption)
                        }
                    }
                    }
                >
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
            {selected.value == "false" && (

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
function HeadlessRadioGroup({ name, radioLabel, radioOptions, published }: { name: string, radioLabel: string, radioOptions: RadioOption[], published: boolean }) {
    const [selected, setSelected] = React.useState({ description: '', value: published ? 'true' : 'false', name: published ? "Published" : "Unpublished" })

    return (
        <div className="col-span-6 md:col-span-4">
            <div className="w-full max-w-md">
                <RadioGroup
                    value={selected.value}
                    name={name}
                    onChange={(e: string) => {
                        let foundOption = radioOptions.find(option => option.value === e);
                        if (foundOption) {

                            setSelected(foundOption)
                        }
                    }
                    }
                >
                    <RadioGroup.Label className="block py-4">{radioLabel}</RadioGroup.Label>
                    <div className="space-y-2">
                        {radioOptions.map((option) => (
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

export function CatchBoundary() {
    return <div>Whoops</div>
}