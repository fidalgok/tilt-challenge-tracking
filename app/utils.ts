import { useMatches } from "@remix-run/react";
import { useMemo, useState, useEffect } from "react";
import type { User } from "~/models/user.server";
const DEFAULT_REDIRECT = "/";

/**
 * This should be used any time the redirect path is user-provided
 * (Like the query string on our login/signup pages). This avoids
 * open-redirect vulnerabilities.
 * @param {string} to The redirect destination
 * @param {string} defaultRedirect The redirect to use if the to is unsafe.
 */
export function safeRedirect(
  to: FormDataEntryValue | string | null | undefined,
  defaultRedirect: string = DEFAULT_REDIRECT
) {
  if (!to || typeof to !== "string") {
    return defaultRedirect;
  }

  if (!to.startsWith("/") || to.startsWith("//")) {
    return defaultRedirect;
  }

  return to;
}

/**
 * This base hook is used in other hooks to quickly search for specific data
 * across all loader data using useMatches.
 * @param {string} id The route id
 * @returns {JSON|undefined} The router data or undefined if not found
 */
export function useMatchesData(
  id: string
): Record<string, unknown> | undefined {
  const matchingRoutes = useMatches();
  const route = useMemo(
    () => matchingRoutes.find((route) => route.id === id),
    [matchingRoutes, id]
  );
  return route?.data;
}

function isUser(user: any): user is User {
  return user && typeof user === "object" && typeof user.email === "string";
}

export function useOptionalUser(): User | undefined {
  const data = useMatchesData("root");
  if (!data || !isUser(data.user)) {
    return undefined;
  }
  return data.user;
}

export function useUser(): User {
  const maybeUser = useOptionalUser();
  if (!maybeUser) {
    throw new Error(
      "No user found in root loader, but user is required by useUser. If user is optional, try useOptionalUser instead."
    );
  }
  return maybeUser;
}

export function validateEmail(email: unknown): email is string {
  return typeof email === "string" && email.length > 3 && email.includes("@");
}

// string utils
export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Date utils...
export interface TimeZoneOffsets {
  localTimezoneOffset: number;
  serverTimezoneOffset: number;
}

type RootLoaderData = {
  serverTimezoneOffset: number;
}
export function useTimeZoneOffset(): TimeZoneOffsets {
  const localTimezoneOffset = new Date().getTimezoneOffset() / 60;
  const [timezoneOffsets, setTimezoneOffsets] = useState({} as TimeZoneOffsets);

  const rootData = useMatchesData("root") as RootLoaderData;
  const serverTimezoneOffset = rootData?.serverTimezoneOffset || 0;

  useEffect(() => {
    const date = new Date();
    function padOffset(offset: number) {

      if (offset < 0) {
        let tempOffset = offset.toString().slice(1);
        return tempOffset.length === 1 ? `0${tempOffset}00` : `0${tempOffset}0`;
      }
      let stringOffset = offset.toString();
      return stringOffset.length === 1 ? `0${stringOffset}00` : `0${stringOffset}0`;
    }
    const localUTCOffset = padOffset(localTimezoneOffset);
    const localTime = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}T${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}${localTimezoneOffset > 0 ? '-' : '+'}${localUTCOffset}`;

    const serverUTCOffset = padOffset(serverTimezoneOffset)
    const serverTime = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}T${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}${rootData?.serverTimezoneOffset > 0 ? '-' : '+'}${serverUTCOffset}`;


    setTimezoneOffsets({ localTimezoneOffset, serverTimezoneOffset });
  }, [serverTimezoneOffset]);

  return timezoneOffsets;
}

export function daysBetween(start: Date, end: Date): number {
  start = new Date(start);
  end = new Date(end);
  const diff = end.getTime() - start.getTime();
  // The +2 at the end makes it inclusive of the end date and the start date since we're flooring the difference.
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

export function daysFromToday(endDate: Date): number {
  const start = new Date();
  return daysBetween(start, endDate);
}

export function UTCFormattedDate(date: number): string
export function UTCFormattedDate(date: Date): string

export function UTCFormattedDate(date: Date | number): string {
  if (typeof date === "number") {
    date = new Date(date);
    let month = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
    let day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
    return date.getFullYear() + "-" + (month) + "-" + day;
  }
  let month = date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
  let day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
  return date.getFullYear() + "-" + (month) + "-" + day;
}

export function getUTCDate(date: number): number {
  //Prisma gives us dates in ISO format, but we don't need the timezone indicator at the end
  return new Date(date).getUTCDate();
}

export function stripTimeZone(date: string) {
  return date.split("T")[0].split("-").join("/");
}
export function getUTCMonth(date: number): number {
  //Prisma gives us dates in ISO format, but we don't need the timezone indicator at the end
  return new Date(date).getUTCMonth();
}

export function classNames(...classes: (string | boolean)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * This strips the Z from the end of a date string. When coming from the server
 * there are times when the app only cares about the date and time but not set to the GMT timezone.
 * Technically the "date" coming from the server is actually an iso string but the type and the app
 * thinks it's an actual date.
 * 
 * @param {string} date: The isoString format of the date
 * @returns {string} The isoString format of the date without the Z at the end
 */

export function parseDateStringFromServer(date: string): string {
  // the date from the server is technically a string even though it's typed as a date
  return date.split("Z")[0];
}

export function prepareDateForServer(date: Date): string
export function prepareDateForServer(y: string, m: string, d: string): string
export function prepareDateForServer(date: string): string

export function prepareDateForServer(yearOrDate: string | Date, month?: string, date?: string): string {
  if (typeof yearOrDate === 'string' && yearOrDate.includes('-')) {
    const y = yearOrDate.split('-')[0];
    const m = yearOrDate.split('-')[1].length == 1 ? `0${yearOrDate.split('-')[1]}` : yearOrDate.split('-')[1];
    const d = yearOrDate.split('-')[2].length == 1 ? `0${yearOrDate.split('-')[2]}` : yearOrDate.split('-')[2];
    return `${y}-${m}-${d}T00:00:00.000`;
  } else if (typeof yearOrDate === 'string') {
    const m = month && parseFloat(month) < 10 ? `0${month}` : month;
    const d = date && parseFloat(date) < 10 ? `0${date}` : date;
    return `${yearOrDate}-${m}-${d}T:00:00:00`;

  } else {
    const month = yearOrDate.getMonth() + 1 < 10 ? `0${yearOrDate.getMonth() + 1}` : yearOrDate.getMonth() + 1;
    const date = yearOrDate.getDate() < 10 ? `0${yearOrDate.getDate()}` : yearOrDate.getDate();
    return `${yearOrDate.getFullYear()}-${month}-${date}T00:00:00`;
  }
}

// HOOkS to the window resize event to update the window width and height
// Thanks: 
export function useWindowSize() {
  const hasWindow = typeof window !== 'undefined';

  function getWindowDimensions() {
    const width = hasWindow ? window.innerWidth : null;
    const height = hasWindow ? window.innerHeight : null;

    return {
      width,
      height,
    };
  }

  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

  useEffect(() => {
    if (hasWindow) {
      function handleResize() {
        setWindowDimensions(getWindowDimensions());
      }

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [hasWindow]);



  return windowDimensions;
}

