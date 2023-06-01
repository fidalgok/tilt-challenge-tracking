import type {
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Link,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useCatch,
} from "@remix-run/react";

import tailwindStylesheetUrl from "./styles/tailwind.css";
import { getUser } from "./session.server";

export const links: LinksFunction = () => {
  return [
    {
      rel: "stylesheet", href: tailwindStylesheetUrl
    },
    { rel: "icon", href: `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🏆</text></svg>` }
  ];
};

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Gym Challenges",
  viewport: "width=device-width,initial-scale=1",
});

type LoaderData = {
  user: Awaited<ReturnType<typeof getUser>>;
  serverTimezoneOffset: number;
};


export const loader: LoaderFunction = async ({ request }) => {
  const serverTimezoneOffset = new Date().getTimezoneOffset() / 60;
  return json<LoaderData>({
    user: await getUser(request),
    serverTimezoneOffset
  });
};

function Document({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <html lang="en">
      <head>
        <Meta />
        {title ? <title>{title}</title> : null}
        <Links />
      </head>
      <body className="h-full">
        {children}
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <html lang="en" className="h-full">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  return (
    <html>
      <head lang="en" className="h-full">
        <title>Oops!</title>
        <Meta />
        <Links />
      </head>
      <body>
        <h1 className="text-2xl">
          {caught.status}
        </h1>
        <p>{caught.statusText}</p>
        <Link to='/challenges'>Go Home</Link>
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return (
    <Document title="Uh-oh!">
      <div className="p-6 bg-rose-200 text-rose-900">
        <h1 className="text-3xl text-rose-900">App Error</h1>
        <pre className="text-rose-900">{error.message}</pre>
        <Link to='/challenges'>Go Home</Link>
      </div>
    </Document>
  );
}