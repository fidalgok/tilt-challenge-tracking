import type {
    ActionFunction,
    LoaderFunction,
    MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import * as React from "react";

import { createUserSession, getUserId } from "~/session.server";
import { resetPassword, verifyLogin } from "~/models/user.server";
import { safeRedirect, validateEmail } from "~/utils";

export const loader: LoaderFunction = async ({ request }) => {
    const userId = await getUserId(request);
    //if (userId) return redirect("/");
    let url = new URL(request.url);
    let resetToken = url.searchParams.get('token');
    return json({});
};

interface ActionData {
    errors?: {
        email?: string;
        password?: string;
        reset?: string;
    };
    token?: string;
}

export const action: ActionFunction = async ({ request }) => {
    let url = new URL(request.url);

    const formData = await request.formData();
    const email = formData.get("email");
    const password = formData.get("password");
    const redirectTo = safeRedirect(formData.get("redirectTo"), "/challenges");
    const token = formData.get('resetToken') as string;
    const remember = formData.get("remember");
    //console.log({ token })
    if (!validateEmail(email)) {
        return json<ActionData>(
            { errors: { email: "Email is invalid" }, token: token },
            { status: 400 }
        );
    }

    if (typeof password !== "string" || password.length === 0) {
        return json<ActionData>(
            { errors: { password: "Password is required" }, token: token },
            { status: 400 }
        );
    }

    if (password.length < 8) {
        return json<ActionData>(
            { errors: { password: "Password is too short. Please use at least 8 characters." }, token: token },
            { status: 400 }
        );
    }

    // let's verify the email and token match with what's in the database
    const result = await resetPassword({ email, newPassword: password, token: token || '' })


    if (result && result?.error) {
        return json<ActionData>(
            { errors: { reset: result.error }, token: token },
            { status: 400 }
        );
    }
    if (result.user) {

        return createUserSession({
            request,
            userId: result.user.id,
            remember: remember === "on" ? true : false,
            redirectTo,
        });
    }
};

export const meta: MetaFunction = () => {
    return {
        title: "Reset Password",
    };
};

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get("redirectTo") || "/challenges";
    const resetToken = searchParams.get('token') || '';
    const actionData = useActionData() as ActionData;
    const emailRef = React.useRef<HTMLInputElement>(null);
    const passwordRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (actionData?.errors?.email) {
            emailRef.current?.focus();
        } else if (actionData?.errors?.password) {
            passwordRef.current?.focus();
        }
    }, [actionData]);

    return (
        <div className="flex min-h-full flex-col justify-center">
            <div className="mx-auto w-full max-w-2xl px-8">

                <h1 className="text-5xl text-center mb-8">Tilt Challenge Tracking</h1>
            </div>
            <div className="mx-auto w-full max-w-md px-8">
                {actionData?.errors?.reset && (
                    <div className="pt-1 text-red-700" id="email-error">
                        {actionData.errors.reset}
                    </div>
                )}
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

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700"
                        >
                            New Password
                        </label>
                        <div className="mt-1">
                            <input
                                id="password"
                                ref={passwordRef}
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                aria-invalid={actionData?.errors?.password ? true : undefined}
                                aria-describedby="password-error"
                                className="w-full rounded border border-gray-500 px-2 py-1 text-lg"
                            />
                            {actionData?.errors?.password && (
                                <div className="pt-1 text-red-700" id="password-error">
                                    {actionData.errors.password}
                                </div>
                            )}
                        </div>
                    </div>

                    <input type="hidden" name="redirectTo" value={redirectTo} />
                    <input type="hidden" name="resetToken" value={actionData?.token || resetToken} />
                    <button
                        type="submit"
                        className="w-full rounded bg-blue-500  py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400"
                    >
                        Reset Password
                    </button>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember"
                                name="remember"
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label
                                htmlFor="remember"
                                className="ml-2 block text-sm text-gray-900"
                            >
                                Remember me
                            </label>
                        </div>
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



