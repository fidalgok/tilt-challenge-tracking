import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useLoaderData, Outlet, NavLink } from "@remix-run/react";

import { requireUserId } from "../session.server";
import { useUser } from "../utils";
import { getActiveChallengesListItems } from "../models/challenge.server";

type LoaderData = {
  challengeListItems: Awaited<ReturnType<typeof getActiveChallengesListItems>>;
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const challengeListItems = await getActiveChallengesListItems({ userId });
  return json<LoaderData>({ challengeListItems });
}

export default function ChallengesPage() {
  const data = useLoaderData() as LoaderData;
  const user = useUser();

  return (
    <div className="flex h-full min-h-screen flex-col">
      <header className="flex items-center justify-between  bg-slate-800 p-4 text-white">
        <div className="flex flex-col sm:items-center sm:flex-row sm:justify-between">

          <h1 className="text-3xl font-bold sm:mr-8">
            <Link to=".">Challenges</Link>
          </h1>
          <p>{user.email}</p>
        </div>
        <Form action="/logout" method="post">
          <button
            type="submit"
            className="rounded bg-slate-600 py-2 px-4 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
          >
            Logout
          </button>
        </Form>
      </header>

      <main className="flex flex-col sm:flex-row h-full bg-white">
        <div className="sm:h-full  sm:max-w-sm border-r bg-gray-50">
          <Link to="join" className="block p-4 text-xl text-blue-500">
            + Join Other Active Challenges
          </Link>

          <hr />

          {data.challengeListItems.length === 0 ? (
            <p className="p-4">No challenges yet</p>
          ) : (
            <ol>
              {data.challengeListItems.map((challenge) => (
                <li key={challenge.id}>
                  <NavLink
                    className={({ isActive }) =>
                      `block border-b p-4 text-xl ${isActive ? "bg-white" : ""}`
                    }
                    to={challenge.id}
                  >
                    💪 {challenge.title}
                  </NavLink>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}