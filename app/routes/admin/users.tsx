import { Link, Outlet } from "@remix-run/react";

export default function AdminUsersLayoutPage() {
    return (
        <div>
            <h1>User Management</h1>
            <Outlet />
        </div>
    );
}
