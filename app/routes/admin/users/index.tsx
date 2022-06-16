import { Link, useLoaderData } from "@remix-run/react";
import { json, LoaderFunction } from "@remix-run/node";
import { getUsers } from "~/models/user.server";

type LoaderData = {
    users: Awaited<ReturnType<typeof getUsers>>;

}

export const loader: LoaderFunction = async ({ request }) => {
    const users = await getUsers();
    return json<LoaderData>({ users })
}

export default function AdminUsersIndexPage() {
    const { users } = useLoaderData() as LoaderData;
    return (
        <div>

            <p>
                TODO: This is the index page for managing users

            </p>
            <table className="w-full border-separate border-spacing-0">
                <thead>
                    <tr>
                        <th className="sticky top-0 bg-slate-100 border-b border-slate-300 text-left p-3">
                            <input name="userSelectAll" type="checkbox" id="userSelectAll" />
                        </th>
                        <th className="sticky top-0 bg-slate-100 border-b border-slate-300 text-left p-3">First Name</th>
                        <th className="sticky top-0 bg-slate-100 border-b border-slate-300 text-left p-3">Last Name</th>
                        <th className="sticky top-0 bg-slate-100 border-b border-slate-300 text-left p-3">Email</th>
                        <th className="sticky top-0 bg-slate-100 border-b border-slate-300 text-left p-3">Gym</th>
                        <th className="sticky top-0 bg-slate-100 border-b border-slate-300 text-left p-3">Role</th>
                    </tr>
                </thead>
                <tbody>

                    {users.map(user => (
                        <tr key={user.id} className="hover:bg-slate-50 border-b border-slate-100">
                            <td className="p-3">
                                <input name="userSelect" type={"checkbox"} value={user.id} />
                            </td>
                            <td className="p-3">{user.profile?.firstName}</td>
                            <td className="p-3">{user.profile?.lastName}</td>
                            <td className="p-3">{user.email}</td>
                            <td className="p-3">{user.profile?.gym}</td>
                            <td className="p-3">{user.role}</td>

                        </tr>
                    ))}
                </tbody>
            </table>

        </div>
    );
}
