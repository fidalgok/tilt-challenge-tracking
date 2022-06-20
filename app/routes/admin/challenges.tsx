import { Link, Outlet } from "@remix-run/react";

export default function AdminChallengesLayoutPage() {
    return (
        <div className="max-w-5xl">

            <Outlet />
        </div>
    );
}
