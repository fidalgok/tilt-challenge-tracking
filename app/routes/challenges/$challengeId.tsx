import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useCatch, useLoaderData } from "@remix-run/react";
import invariant from "tiny-invariant";

export default function ChallengeDetailsPage(){
    return (
        <div>
            <p>You've reached the challenge details page.</p>
        </div>
    )
}