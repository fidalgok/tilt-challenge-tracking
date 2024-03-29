import type { LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useLoaderData, Outlet, NavLink } from "@remix-run/react";
import { Fragment } from "react";

import { requireUserId } from "../session.server";
import { useUser } from "../utils";
import { getActiveChallengesListItems, getClosedChallengesListItems } from "../models/challenge.server";

import { Popover, Transition } from "@headlessui/react"
import { MenuIcon, XIcon } from "@heroicons/react/outline"



export const loader = async ({ request }: LoaderArgs) => {
  const userId = await requireUserId(request);

  const challengesPromise = getActiveChallengesListItems({ userId });
  const pastChallengesPromise = getClosedChallengesListItems({ userId });

  const [challengeListItems, pastChallengeListItems] = await Promise.all([challengesPromise, pastChallengesPromise]);


  return json({ challengeListItems, pastChallengeListItems });
}

export default function ChallengesPage() {

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

      <main className="grow flex flex-col md:flex-row  bg-white">
        <ChallengesMenu />

        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function ChallengesMenu() {
  const data = useLoaderData<typeof loader>();
  const user = useUser();
  return (
    <Popover className="relative px-4 md:px-0">
      <div className="mr-2 my-2 md:hidden">
        <Popover.Button className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
          <span className="sr-only">Open menu</span>
          <MenuIcon className="h-6 w-6" aria-hidden="true" />
        </Popover.Button>
      </div>
      <Popover.Group className="hidden md:h-full md:block border-r bg-gray-50">
        <div className="max-w-[200px]  md:max-w-[200px] [@media(min-width:968px)]:max-w-sm">
          <Link to="join" className="block p-4 text-xl text-blue-500">
            + Join Other Active Challenges
          </Link>

          <hr />

          {data.challengeListItems.length === 0 ? null : (
            <ol>
              {data.challengeListItems.map((challenge) => (
                <li key={challenge.id}>
                  <NavLink
                    className={({ isActive }) =>
                      `block border-b p-4 text-xl ${isActive ? "bg-white" : ""}`
                    }
                    to={challenge.id}
                  >
                    🏆 {challenge.title}
                  </NavLink>
                </li>
              ))}
            </ol>
          )}
          {data.pastChallengeListItems?.length === 0 ? null : (
            <div className="mt-4">


              <Link to="complete" className="block p-4 text-xl" >Archived Challenges</Link>
            </div>
          )}
          {user?.role === 'ADMIN' && (
            <>
              <div className="mt-4">


                <Link to="/admin" className="block p-4 text-xl" >Admin</Link>
              </div>
            </>
          )
          }
        </div>
      </Popover.Group>
      <Transition
        as={Fragment}
        enter="duration-200 ease-out"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="duration-100 ease-in"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <Popover.Panel focus className="absolute top-0 inset-x-0 p-2 transition transform origin-top-right md:hidden">
          {({ close }) => (


            <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white divide-y-2 divide-gray-50">
              <div className="pt-5 pb-6 px-2">
                <div className="flex items-center justify-between">

                  <Popover.Button className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
                    <span className="sr-only">Close menu</span>
                    <XIcon className="h-6 w-6" aria-hidden="true" />
                  </Popover.Button>
                </div>
              </div>
              <div className="mt-2">
                <nav className="grid gap-y-8">
                  <div className="sm:h-full  sm:max-w-sm border-r bg-gray-50">
                    <Link
                      onClick={() => close()}
                      to="join" className="block p-4 text-xl text-blue-500">
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
                              onClick={() => close()}
                              className={({ isActive }) =>
                                `block border-b p-4 text-xl ${isActive ? "bg-white" : ""}`
                              }
                              to={challenge.id}
                            >
                              🏆 {challenge.title}
                            </NavLink>
                          </li>
                        ))}
                      </ol>
                    )}
                    {user?.role === 'ADMIN' && (
                      <>
                        <div className="mt-4">


                          <Link onClick={() => close()} to="/admin" className="block p-4 text-xl" >Admin</Link>
                        </div>
                      </>
                    )
                    }
                  </div>
                </nav>
              </div>
            </div>
          )}
        </Popover.Panel>
      </Transition>

    </Popover>
  );
}