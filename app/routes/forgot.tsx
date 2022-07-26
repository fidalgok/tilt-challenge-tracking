import type {
    ActionFunction,
    LoaderFunction,
    MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import * as React from "react";


import { requestPasswordReset } from "~/models/user.server";
import { safeRedirect, validateEmail } from "~/utils";

export const loader: LoaderFunction = async ({ request }) => {


    return json({});
};

interface ActionData {
    errors?: {
        email?: string;

    };

    message?: string;
}

export const action: ActionFunction = async ({ request }) => {

    const formData = await request.formData();
    const email = formData.get("email");

    if (!validateEmail(email)) {
        return json<ActionData>(
            { errors: { email: "Email is invalid" } },
            { status: 400 }
        );
    }


    // let's verify the email and token match with what's in the database
    const result = await requestPasswordReset(email);



    return json<ActionData>(
        { message: result?.message || '' },
        { status: 200 }
    );


};

export const meta: MetaFunction = () => {
    return {
        title: "Reset Password",
    };
};

export default function ForgotPassword() {
    const [searchParams] = useSearchParams();
    const actionData = useActionData() as ActionData;
    const emailRef = React.useRef<HTMLInputElement>(null);


    React.useEffect(() => {
        if (actionData?.errors?.email) {
            emailRef.current?.focus();
        }
    }, [actionData]);

    return (
        <div className="flex min-h-full flex-col justify-center">
            <div className="mx-auto w-full max-w-2xl px-8">

                <h1 className="text-5xl text-center mb-8">Tilt Challenge Tracking</h1>
            </div>
            <div className="mx-auto w-full max-w-md px-8">
                {actionData?.message === 'done' ? (
                    <div className="mb-8">
                        <p className="mb-4">
                            Hey! Just a heads up. This password request get's sent to an admin first and then we'll send you an email with a reset link. If a user with that email exists you can expect a link from an admin in the next 24 hours or so. Sit tight, keep tracking, everything will be all right!</p>
                        <p>Don't forget to check your email for a reset link soon.</p>
                    </div>
                ) : actionData?.message == '' ? (
                    <div className="mb-8">
                        A password request has been sent. If a user with that email was found you'll receive an email with instructions for resetting your password.
                    </div>
                ) : null}

                <Form method="post" className="space-y-6">
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Email address
                        </label>
                        <div className="mt-1">
                            <input
                                ref={emailRef}
                                id="email"
                                required
                                autoFocus={true}
                                name="email"
                                type="email"
                                autoComplete="email"
                                aria-invalid={actionData?.errors?.email ? true : undefined}
                                aria-describedby="email-error"
                                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
                            />
                            {actionData?.errors?.email && (
                                <div className="pt-1 text-red-700" id="email-error">
                                    {actionData.errors.email}
                                </div>
                            )}
                        </div>
                    </div>



                    <button
                        type="submit"
                        className="w-full rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
                    >
                        Request Password Reset
                    </button>
                    <div className="flex items-center justify-between">

                        <div className="text-center text-sm text-gray-500">
                            Don't have an account?{" "}
                            <Link
                                className="text-blue-500 underline"
                                to={{
                                    pathname: "/join",
                                    search: searchParams.toString(),
                                }}
                            >
                                Sign up
                            </Link>
                        </div>
                    </div>
                </Form>
            </div>
        </div>
    );
}



