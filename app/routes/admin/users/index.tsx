import { Form, Link, useLoaderData, useMatches } from "@remix-run/react";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getUsers } from "~/models/user.server";
import React, { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { classNames, useMatchesData } from "~/utils";
import invariant from "tiny-invariant";

type LoaderData = {
    users: Awaited<ReturnType<typeof getUsers>>;

}

type selectedUsersList = string[] | [];

export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    const { _action, ...values } = Object.fromEntries(formData);

    if (_action == "edit") {

        console.log({ _action, values })

    }
    return null;
}

export const loader: LoaderFunction = async ({ request }) => {
    const users = await getUsers();
    return json<LoaderData>({ users })
}

export default function AdminUsersIndexPage() {
    const { users } = useLoaderData() as LoaderData;
    let [isOpen, setIsOpen] = useState(false)
    let [selectedUsers, setSelectedUsers] = useState<selectedUsersList>([])
    let [updateAttribute, setUpdateAttribute] = useState('')

    function openModal() {
        setIsOpen(true);
    }

    function handleUserCheckboxCheck(e: React.ChangeEvent<HTMLInputElement>) {
        // if checkbox value is checked add userId to selected users array otherwise remove them
        if (e.target.checked) {
            // grab the value and add it to selected users array

            setSelectedUsers([...selectedUsers, e.target.value])
        } else {
            // remove the userID from the array
            setSelectedUsers(
                selectedUsers.filter(userId => userId !== e.target.value)
            )
        }
    }
    function handleEditAttributeClick(attribute: string) {
        setUpdateAttribute(attribute);
        openModal()
    }
    return (
        <div>

            <p>
                TODO: This is the index page for managing users

            </p>
            <EditUserDialog
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                updateAttribute={updateAttribute}
                selectedUsers={selectedUsers}
            />
            <button
                className={classNames(
                    selectedUsers.length === 0 ?
                        'disabled:cursor-not-allowed text-gray-500' :
                        '',
                    'p-3'

                )}
                disabled={selectedUsers.length === 0}
                onClick={() => handleEditAttributeClick('Role')}>Update Role</button>
            <table className="w-full border-separate border-spacing-0">
                <thead>
                    <tr>
                        <th className="sticky top-0 bg-slate-100 border-b border-slate-300 text-left p-3">
                            <input
                                name="userSelectAll"
                                type="checkbox"
                                id="userSelectAll"
                            />
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
                                <input
                                    name="userSelect"
                                    type={"checkbox"}
                                    value={user.id}
                                    onChange={(e) => handleUserCheckboxCheck(e)}
                                />
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


function EditUserDialog({ isOpen, setIsOpen, updateAttribute, selectedUsers }:
    {
        isOpen: boolean,
        setIsOpen: React.Dispatch<React.SetStateAction<boolean>>,
        updateAttribute: string,
        selectedUsers: string[]
    }
) {
    const { users } = useMatchesData("routes/admin/users/index") as LoaderData
    const filteredUsers = users.filter(u => selectedUsers.find(id => id === u.id))
    function closeModal() {
        return setIsOpen(false)
    }

    return (
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
                                    Update {updateAttribute}
                                </Dialog.Title>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        TODO: show selected users and a dropdown to change their role. Update each user at a time and send a success/failure message back to the page.
                                    </p>
                                    <Form method="post" id="user-update">
                                        <div className="grid grid-cols-2 w-full gap-4">
                                            <div>Name</div>
                                            <div>{updateAttribute}</div>

                                        </div>
                                        {filteredUsers.map(user => (
                                            <div className="grid grid-cols-2 w-full gap-4" key={user.id}>
                                                <div>{user.profile?.firstName}{" "}{user.profile?.lastName}</div>
                                                {updateAttribute == 'Role' && (
                                                    <div>
                                                        <label htmlFor="role-select" className="sr-only">Role</label>
                                                        <select id="role-select" name="role" defaultValue={user.role}>
                                                            <option value="ADMIN" >Admin</option>
                                                            <option value="MEMBER" >Member</option>
                                                        </select>
                                                    </div>
                                                )}
                                                <input type='hidden' name="id" value={user.id} />
                                            </div>
                                        ))}
                                    </Form>
                                </div>

                                <div className="mt-4">
                                    <button
                                        type="submit"
                                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 mr-6 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                        name="_action"
                                        value="edit"
                                        form="user-update"
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                        onClick={closeModal}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    )
}