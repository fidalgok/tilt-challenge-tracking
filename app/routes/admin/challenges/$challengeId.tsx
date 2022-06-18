import { Link, useLoaderData } from "@remix-run/react";
import { LoaderFunction } from "@remix-run/node";
import { Entry, getChallenge } from "~/models/challenge.server";
import invariant from "tiny-invariant";
import { add, eachDayOfInterval, endOfMonth, format, getDay, isEqual, isSameDay, isSameMonth, isToday, parse, parseISO, startOfToday } from "date-fns";
import { Menu, Transition } from "@headlessui/react";
import { ChevronLeftIcon, ChevronRightIcon, DotsVerticalIcon } from "@heroicons/react/outline";
import { Fragment, useState } from "react";

export const loader: LoaderFunction = async ({ request, params }) => {


    invariant(params.challengeId, "challengeId not found");

    return null;
}

const entries = [
    {
        id: "1",
        amount: 150,
        notes: "This is a note",
        challengeActivityId: "1",
        userId: "1",
        date: new Date('2022-05-01T00:00:00.000Z'),
        updatedAt: new Date('2022-06-01T00:00:00.000Z'),
    },
    {
        id: "3",
        amount: 100,
        notes: "This is a note",
        challengeActivityId: "1",
        userId: "1",
        date: new Date('2022-05-01T00:00:00.000Z'),
        updatedAt: new Date('2022-05-21T00:00:00.000Z'),
    },
    {
        id: "4",
        amount: 10,
        notes: "This is a note",
        challengeActivityId: "1",
        userId: "1",
        date: new Date('2022-05-01T00:00:00.000Z'),
        updatedAt: new Date('2022-06-10T00:00:00.000Z'),
    },
    {
        id: "1",
        amount: 10,
        notes: "This is a note",
        challengeActivityId: "1",
        userId: "1",
        date: new Date('2022-05-01T00:00:00.000Z'),
        updatedAt: new Date('2022-05-01T00:25:00.000Z'),
    },
    {
        id: "2",
        amount: 20,
        notes: "This is a note",
        challengeActivityId: "1",
        userId: "1",
        date: new Date('2022-05-01T04:00:00.000Z'),
        updatedAt: new Date('2022-06-01T04:00:00.000Z'),
    }
]



function classNames(...classes: (string | boolean)[]): string {
    return classes.filter(Boolean).join(' ')
}

function parseDateStringFromServer(date: Date) {
    // the date from the server is technically a string even though it's typed as a date
    return date.toString().split("Z")[0];
}

export default function AdminChallengesViewChallengePage() {
    const data = useLoaderData();
    return (
        <div>

            <p>
                Challenge info here
            </p>
            <Calendar />
        </div>
    );
}

function Calendar() {
    // eventually will come from the server
    let validStartDate = '2022-05-01T00:00:00.000Z';
    let validEndDate = '2022-08-31T00:00:00.000Z';


    let today = startOfToday();
    //local state
    let [selectedDay, setSelectedDay] = useState(today)
    let [currentMonth, setCurrentMonth] = useState(format(today, 'MMM-yyyy'))
    let firstDayCurrentMonth = parse(currentMonth, 'MMM-yyyy', new Date())

    let days = eachDayOfInterval({
        start: firstDayCurrentMonth,
        end: endOfMonth(firstDayCurrentMonth),
    });

    function previousMonth() {
        let firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 })
        setCurrentMonth(format(firstDayNextMonth, 'MMM-yyyy'))
    }

    function nextMonth() {
        let firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 })
        setCurrentMonth(format(firstDayNextMonth, 'MMM-yyyy'))
    }

    let selectedDayEntries = entries.filter((entry) =>
        isSameDay(parseISO(entry.date.toISOString()), selectedDay)
    )


    return (
        <div className="pt-16">
            <div className="max-w-md px-4 mx-auto sm:px-7 md:max-w-4xl md:px-6">
                <div className="md:grid md:grid-cols-2 md:divide-x md:divide-gray-200">
                    <div className="md:pr-14">
                        <div className="flex items-center">
                            <h2 className="flex-auto font-semibold text-gray-900">
                                {format(firstDayCurrentMonth, 'MMMM yyyy')}
                            </h2>
                            <button
                                type="button"
                                onClick={previousMonth}
                                className="-my-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
                            >
                                <span className="sr-only">Previous month</span>
                                <ChevronLeftIcon className="w-5 h-5" aria-hidden="true" />
                            </button>
                            <button
                                onClick={nextMonth}
                                type="button"
                                className="-my-1.5 -mr-1.5 ml-2 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
                            >
                                <span className="sr-only">Next month</span>
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
                                        className={classNames(
                                            isEqual(day, selectedDay) && 'text-white',
                                            !isEqual(day, selectedDay) &&
                                            isToday(day) &&
                                            'text-red-500',
                                            !isEqual(day, selectedDay) &&
                                            !isToday(day) &&
                                            isSameMonth(day, firstDayCurrentMonth) &&
                                            'text-gray-900',
                                            !isEqual(day, selectedDay) &&
                                            !isToday(day) &&
                                            !isSameMonth(day, firstDayCurrentMonth) &&
                                            'text-gray-400',
                                            isEqual(day, selectedDay) && isToday(day) && 'bg-red-500',
                                            isEqual(day, selectedDay) &&
                                            !isToday(day) &&
                                            'bg-gray-900',
                                            !isEqual(day, selectedDay) && 'hover:bg-gray-200',
                                            (isEqual(day, selectedDay) || isToday(day)) &&
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
                                            isSameDay(parseISO(entry.date.toISOString()), day)
                                        ) && (
                                                <div className="w-1 h-1 rounded-full bg-sky-500"></div>
                                            )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <section className="mt-12 md:mt-0 md:pl-14">
                        <h2 className="font-semibold text-gray-900">
                            Schedule for{' '}
                            <time dateTime={format(selectedDay, 'yyyy-MM-dd')}>
                                {format(selectedDay, 'MMM dd, yyy')}
                            </time>
                        </h2>
                        <ol className="mt-4 space-y-1 text-sm leading-6 text-gray-500">
                            {selectedDayEntries.length > 0 ? (
                                selectedDayEntries.map((entry) => (
                                    <EntryItem entry={entry} key={entry.id} />
                                ))
                            ) : (
                                <p>No meetings for today.</p>
                            )}
                        </ol>
                    </section>
                </div>
            </div>
        </div>
    )
}

function EntryItem({ entry }: { entry: Partial<Entry> & Pick<Entry, 'date'> }) {
    let entryDate = entry?.date?.toISOString().split("Z")[0];
    let startDateTime = parseISO(entryDate);
    console.log({ entryDate, startDateTime, entry })

    return (
        <li className="flex items-center px-4 py-2 space-x-4 group rounded-xl focus-within:bg-gray-100 hover:bg-gray-100">


            <div className="flex-auto">
                <p className="text-gray-900">{entry.amount}</p>
                <p className="mt-0.5">
                    <time dateTime={entryDate}>
                        {format(startDateTime, 'h:mm a')}
                    </time>
                </p>
            </div>
            <Menu
                as="div"
                className="relative "
            >
                <div>
                    <Menu.Button className="-m-2 flex items-center rounded-full p-1.5 text-gray-500 hover:text-gray-600">
                        <span className="sr-only">Open options</span>
                        <DotsVerticalIcon className="w-6 h-6" aria-hidden="true" />
                    </Menu.Button>
                </div>

                <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                >
                    <Menu.Items className="absolute right-0 z-10 mt-2 origin-top-right bg-white rounded-md shadow-lg w-36 ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="py-1">
                            <Menu.Item>
                                {({ active }) => (
                                    <a
                                        href="#"
                                        className={classNames(
                                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                            'block px-4 py-2 text-sm'
                                        )}
                                    >
                                        Edit
                                    </a>
                                )}
                            </Menu.Item>
                            <Menu.Item>
                                {({ active }) => (
                                    <a
                                        href="#"
                                        className={classNames(
                                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                                            'block px-4 py-2 text-sm'
                                        )}
                                    >
                                        Cancel
                                    </a>
                                )}
                            </Menu.Item>
                        </div>
                    </Menu.Items>
                </Transition>
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