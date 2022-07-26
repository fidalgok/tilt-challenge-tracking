import { Form, Link, useSearchParams } from "@remix-run/react";
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { add, eachDayOfInterval, endOfMonth, endOfWeek, format, getDay, isAfter, isBefore, isEqual, isSameDay, isSameMonth, isToday, parse, startOfDay, startOfMonth, startOfToday, startOfWeek } from "date-fns";
import { Dialog, Menu, Transition } from "@headlessui/react";
import { ChevronLeftIcon, ChevronRightIcon, DotsVerticalIcon, PlusIcon } from "@heroicons/react/outline";

import { classNames, parseDateStringFromServer, useMatchesData, useTimeZoneOffset, useWindowSize, UTCFormattedDate } from "~/utils";
import { Entry, User } from "@prisma/client";

import type { EntriesWithUserProfiles } from "~/models/challenge.server";
import type { LoaderData } from "~/routes/challenges/$challengeId";
interface Out {
    top: boolean;
    bottom: boolean;
    left: boolean;
    right: boolean;
    any: boolean;

}

function isOutOfViewPort(elem: HTMLElement | null): Out | null {
    if (!elem) return null;
    // Get element's bounding
    var bounding = elem.getBoundingClientRect();

    // Check if it's out of the viewport on each side
    var out = {} as Out;
    out.top = bounding.top < 0;
    out.left = bounding.left < 0;
    out.bottom = bounding.bottom > (window.innerHeight || document.documentElement.clientHeight);
    out.right = bounding.right > (window.innerWidth || document.documentElement.clientWidth);
    out.any = out.top || out.left || out.bottom || out.right;

    return out;

};
function elementDistanceFromBottom(elem: HTMLElement | null) {
    if (!elem) return null;
    // Get element's bounding
    var bounding = elem.getBoundingClientRect();
    return bounding.bottom - (window.innerHeight || document.documentElement.clientHeight);
}


export function EntriesCalendar({ entries, maybeMobile }: { entries: Entry[], maybeMobile: boolean }) {
    const timezoneOffsets = useTimeZoneOffset();
    const [searchParams] = useSearchParams();
    const matches = useMatchesData('routes/challenges/$challengeId')
    const { challenge } = matches as LoaderData;
    const screenWidth = useWindowSize();
    const view = searchParams.get("view") === "week" ? "week" :
        maybeMobile ? "week" :
            (screenWidth?.width && screenWidth.width < 400) ? "week" :
                "month";

    let today = startOfToday();

    //local state
    let [hasLoaded, setHasLoaded] = useState(false);
    let [selectedDay, setSelectedDay] = useState(today)
    let [currentMonth, setCurrentMonth] = useState(format(today, 'MMM-yyyy'))
    let [currentWeek, setCurrentWeek] = useState(format(today, 'ww'))
    let firstDayCurrentMonth = parse(currentMonth, 'MMM-yyyy', new Date())
    let firstDayCurrentWeek = parse(currentWeek, 'ww', new Date())
    let challengeStart = new Date(parseDateStringFromServer(challenge.startDate.toString()))
    let challengeEnd = new Date(parseDateStringFromServer(challenge.endDate.toString()))

    let days = eachDayOfInterval({
        start: startOfWeek(view === "month" ? firstDayCurrentMonth : firstDayCurrentWeek),
        end: view === "month" ? endOfWeek(endOfMonth(firstDayCurrentMonth)) : endOfWeek(firstDayCurrentWeek),
    });
    console.log(challengeStart)
    function goToToday() {

        setSelectedDay(today)
        setCurrentMonth(format(today, 'MMM-yyyy'))
        setCurrentWeek(format(today, 'ww'))
    }

    function goToPrevious() {
        if (view === "month") {
            // no need to update the month if it's before the challenge start date
            let lastDayLastMonth = endOfMonth(add(firstDayCurrentMonth, { months: -1 }))

            if (isBefore(lastDayLastMonth, challengeStart)) {
                return;
            }
            previousMonth()
        } else {
            // no need to update the month if it's before the challenge start date
            let lastDayLastWeek = endOfWeek(add(firstDayCurrentWeek, { weeks: -1 }))

            if (isBefore(lastDayLastWeek, challengeStart)) {
                return;
            }
            previousWeek()
        }
    }
    function goToNext() {
        if (view === "month") {
            // no need to update the month if it's after the challenge end date
            let firstDayNextMonth = startOfMonth(add(firstDayCurrentMonth, { months: 1 }))

            if (isBefore(challengeEnd, firstDayNextMonth)) {
                return;
            }
            nextMonth()
        } else {
            // no need to update the month if it's after the challenge end date
            let firstDayNextWeek = startOfMonth(add(firstDayCurrentWeek, { weeks: 1 }))

            if (isBefore(challengeEnd, firstDayNextWeek)) {
                return;
            }
            nextWeek()
        }
    }

    function previousMonth() {
        let firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 })
        setCurrentMonth(format(firstDayNextMonth, 'MMM-yyyy'))
    }

    function nextMonth() {
        let firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 })
        setCurrentMonth(format(firstDayNextMonth, 'MMM-yyyy'))
    }
    function previousWeek() {
        let firstDayNextWeek = add(firstDayCurrentWeek, { weeks: -1 })
        setCurrentMonth(format(firstDayNextWeek, 'MMM-yyyy'))
        setCurrentWeek(format(firstDayNextWeek, 'ww'))
    }

    function nextWeek() {
        let firstDayNextWeek = add(firstDayCurrentWeek, { weeks: 1 })
        setCurrentMonth(format(firstDayNextWeek, 'MMM-yyyy'))
        setCurrentWeek(format(firstDayNextWeek, 'ww'))
    }

    let selectedDayEntries = entries.filter((entry) => {

        return isSameDay(new Date(parseDateStringFromServer(entry.date.toString())), selectedDay)
    }
    )

    useEffect(() => {

        if (timezoneOffsets.localTimezoneOffset) {
            // we have the local timezone. It's safe to assume we're looking at the right date
            setHasLoaded(true)
        }

    }, [timezoneOffsets.localTimezoneOffset])


    return (
        <div className="pt-4 pb-16">
            <div className="max-w-md px-4 mx-auto md:mx-0 sm:px-7 md:max-w-4xl md:px-6">
                <div className="md:grid md:grid-cols-2 md:divide-x md:divide-gray-200">
                    <div className="md:pr-14">
                        <div className="flex items-center">
                            <h2 className="flex-auto font-semibold text-gray-900">
                                {format(firstDayCurrentMonth, 'MMMM yyyy')}
                            </h2>
                            <button
                                type="button"
                                onClick={goToToday}
                                className="-my-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
                            >
                                <span>Today</span>

                            </button>
                            <button
                                type="button"
                                onClick={goToPrevious}
                                className="-my-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
                            >
                                <span className="sr-only">Previous {view === "month" ? "month" : "week"}</span>
                                <ChevronLeftIcon className="w-5 h-5" aria-hidden="true" />
                            </button>
                            <button
                                onClick={goToNext}
                                type="button"
                                className="-my-1.5 -mr-1.5 ml-2 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
                            >
                                <span className="sr-only">Next {view === "month" ? "month" : "week"}</span>
                                <ChevronRightIcon className="w-5 h-5" aria-hidden="true" />
                            </button>
                        </div>
                        <div className="grid grid-cols-7 mt-10 text-xs leading-6 text-center text-gray-500">
                            <div>S</div>
                            <div>M</div>
                            <div>T</div>
                            <div>W</div>
                            <div>T</div>
                            <div>F</div>
                            <div>S</div>
                        </div>
                        <div className="grid grid-cols-7 mt-2 text-sm">
                            {days.map((day, dayIdx) => (
                                <div
                                    key={day.toString()}
                                    className={classNames(
                                        dayIdx === 0 && colStartClasses[getDay(day)],
                                        'py-1.5'
                                    )}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setSelectedDay(day)}
                                        disabled={isBefore(day, startOfDay(challengeStart)) || isAfter(day, challengeEnd)}
                                        className={classNames(
                                            hasLoaded && isEqual(day, selectedDay) && 'text-white',
                                            !isEqual(day, selectedDay) &&
                                            isToday(day) && 'text-red-500',
                                            !isEqual(day, selectedDay) &&
                                            !isToday(day) &&
                                            isSameMonth(day, firstDayCurrentMonth) &&
                                            'text-gray-900',
                                            !isEqual(day, selectedDay) &&
                                            !isToday(day) &&
                                            !isSameMonth(day, firstDayCurrentMonth) &&
                                            'text-gray-400',
                                            hasLoaded && isEqual(day, selectedDay) && isToday(day) && 'bg-red-500',
                                            isEqual(day, selectedDay) &&
                                            !isToday(day) &&
                                            'bg-gray-900',
                                            !isEqual(day, selectedDay) && 'hover:bg-gray-200',
                                            hasLoaded && (isEqual(day, selectedDay) || isToday(day)) &&
                                            'font-semibold',
                                            'mx-auto flex h-8 w-8 items-center justify-center rounded-full'
                                        )}
                                    >
                                        <time dateTime={format(day, 'yyyy-MM-dd')}>
                                            {format(day, 'd')}
                                        </time>
                                    </button>

                                    <div className="w-1 h-1 mx-auto mt-1">
                                        {entries.some((entry) =>
                                            isSameDay(new Date(parseDateStringFromServer(entry.date.toString())), day)
                                        ) && (
                                                <div className="w-1 h-1 rounded-full bg-sky-500"></div>
                                            )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <section className="mt-12 mb-12 md:mt-0 md:pl-14">
                        <h2 className="font-semibold text-gray-900">
                            Entries for{' '}
                            <time dateTime={format(selectedDay, 'yyyy-MM-dd')}>
                                {format(selectedDay, 'MMM dd, yyy')}
                            </time>
                        </h2>
                        <ol className="mt-4 space-y-1 text-sm leading-6 text-gray-500">
                            {selectedDayEntries.length > 0 ? (
                                selectedDayEntries.map((entry) => (
                                    <EntryItem entry={entry} key={entry.id} />
                                ))
                            ) : isBefore(selectedDay, startOfDay(challengeStart)) ? null : (
                                <Link to={`entries/new?date=${UTCFormattedDate(selectedDay)}`}>
                                    <div className="flex items-center">

                                        <PlusIcon className="h-5 w-5 text-gray-900 inline" />{" "} <span className="text-gray-900">Add Entry</span>
                                    </div>
                                </Link>
                            )}
                        </ol>
                    </section>
                </div>
            </div>
        </div>
    )
}

function EntryItem({ entry }: { entry: Partial<EntriesWithUserProfiles> & Pick<Entry, 'date'> }) {
    let entryDate = parseDateStringFromServer(entry.date.toString());
    // some extra state to keep the menu open while the delete dialog is also open
    let [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    let [toCloseToBottom, setToCloseToBottom] = useState(false);
    let ref = useRef<HTMLLIElement>(null);
    useLayoutEffect(() => {
        if (ref.current) {
            window.addEventListener('scroll', () => {
                let distanceFromBottom = elementDistanceFromBottom(ref.current);
                if (distanceFromBottom && (distanceFromBottom > -120)) {
                    // we're too close to render the menu below the list item, need to position it above.
                    // It's worth noting this number (-120) is completely arbitrary, but it works well for the dropdown menu.
                    setToCloseToBottom(true);
                } else if (distanceFromBottom && (distanceFromBottom < -120)) {
                    // we're far enough away to render the menu below the list item, need to position it below.
                    setToCloseToBottom(false);
                }
            })
        }
    }, [ref])
    return (
        <li ref={ref} className="flex items-center px-4 py-2 space-x-4 group rounded-xl focus-within:bg-gray-100 hover:bg-gray-100">


            <div className="flex-auto">
                <p className="text-gray-900">{entry.amount}</p>

                <p className="mt-0.5">
                    {entry?.notes}
                </p>
            </div>
            <Menu
                as="div"
                className="relative"
            >
                {({ open }) => (

                    <>

                        <div>
                            <Menu.Button className="-m-2 flex items-center rounded-full p-1.5 text-gray-500 hover:text-gray-600">
                                <span className="sr-only">Open options</span>
                                <DotsVerticalIcon className="w-6 h-6" aria-hidden="true" />
                            </Menu.Button>
                        </div>

                        {(open || isDeleteDialogOpen) && (
                            <Transition
                                as={Fragment}
                                show={open || isDeleteDialogOpen}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >


                                <Menu.Items
                                    className={classNames(toCloseToBottom ? 'absolute right-0 -top-32 z-10 mt-2 origin-top-right bg-white rounded-md shadow-lg w-36 ring-1 ring-black ring-opacity-5 focus:outline-none' : `absolute right-0 z-10 mt-2 origin-top-right bg-white rounded-md shadow-lg w-36 ring-1 ring-black ring-opacity-5 focus:outline-none`)}
                                    static={true}

                                >
                                    <div className="py-1">
                                        <Menu.Item>
                                            {({ active }) => (
                                                <Link
                                                    to={`./entries/${entry.id}/edit`}
                                                    className={classNames(
                                                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                        'block px-4 py-2 text-sm'
                                                    )}
                                                >
                                                    Edit
                                                </Link>
                                            )}
                                        </Menu.Item>

                                        <DeleteConfirmation
                                            setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                                            entryId={entry.id || ""}
                                            entryDate={entryDate}
                                            user={{ id: entry?.user?.id || '', profile: { firstName: entry?.user?.profile?.firstName || '' } }}

                                        />

                                        <Menu.Item>
                                            {({ active }) => (
                                                <Link
                                                    to="./"
                                                    className={classNames(
                                                        active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                                        'block px-4 py-2 text-sm'
                                                    )}
                                                >
                                                    Cancel
                                                </Link>
                                            )}
                                        </Menu.Item>
                                    </div>
                                </Menu.Items>
                            </Transition>
                        )}
                    </>)}
            </Menu>
        </li>
    )
}

let colStartClasses = [
    '',
    'col-start-2',
    'col-start-3',
    'col-start-4',
    'col-start-5',
    'col-start-6',
    'col-start-7',
]

function DeleteConfirmation({ entryId, user, entryDate, setIsDeleteDialogOpen }: {
    entryId: string, user: Pick<User, "id"> & {
        profile: {
            firstName: string
        }
    },
    setIsDeleteDialogOpen: (isDeleteDialogOpen: boolean) => void,
    entryDate: string
}) {
    let [isOpen, setIsOpen] = useState(false)

    function closeModal() {

        setIsOpen(false)
        setIsDeleteDialogOpen(false);
    }

    function openModal() {

        setIsOpen(true)
        setIsDeleteDialogOpen(true)
    }


    return (
        <>
            <div>
                <Menu.Item>
                    {({ active }) => (

                        <button
                            type="button"
                            onClick={openModal}
                            className={
                                classNames(
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                    'block w-full text-left px-4 py-2 text-sm')}
                        >
                            Delete Entry
                        </button>
                    )}
                </Menu.Item>
            </div>

            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-10" onClose={closeModal}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black bg-opacity-25" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-lg font-medium leading-6 text-gray-900"
                                    >
                                        Delete Confirmation
                                    </Dialog.Title>
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-500">
                                            You're about to delete the entry for {format(new Date(entryDate), "MMM dd")}. Are you sure? This action cannot be undone.
                                        </p>
                                    </div>

                                    <div className="mt-4">
                                        <Form method="post">
                                            <input type="hidden" name="entryId" value={entryId} />
                                            <input type="hidden" name="userId" value={user.id} />
                                            <button
                                                type="submit"
                                                name="_action"
                                                value="delete"
                                                className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"

                                            >
                                                Delete Entry
                                            </button>
                                        </Form>
                                    </div>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    )
}