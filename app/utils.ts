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

export function UTCFormattedDate(date: Date): string {
  return date.getUTCFullYear() + "-" + (date.getUTCMonth() + 1) + "-" + date.getUTCDate();
}

export function getUTCDate(date: number): number {
  //Prisma gives us dates in ISO format, but we don't need the timezone indicator at the end
  return new Date(date).getUTCDate();
}

export function stripTimeZone(date: string) {
  return date.split("T")[0];
}
export function getUTCMonth(date: number): number {
  //Prisma gives us dates in ISO format, but we don't need the timezone indicator at the end
  return new Date(date).getUTCMonth();
}

export function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(' ')
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