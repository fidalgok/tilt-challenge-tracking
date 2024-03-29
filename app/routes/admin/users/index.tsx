import { Form, Link, useActionData, useLoaderData, useLocation, useMatches, useResolvedPath, useTransition } from "@remix-run/react";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { adminGetUsers, createPasswordResetToken, updateUserRole } from "~/models/user.server";
import React, { useState, Fragment, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { classNames, useMatchesData } from "~/utils";
import invariant from "tiny-invariant";

type LoaderData = {
    users: Awaited<ReturnType<typeof adminGetUsers>>;

}
type ActionData = {
    update: Awaited<ReturnType<typeof updateUserRole>>[] | null;
    tokens: Awaited<ReturnType<typeof createPasswordResetToken>>[] | null;
}

type selectedUsersList = string[] | [];

type userRole = "ADMIN" | "MEMBER"

export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData();
    //console.log(formData.getAll('email'))
    let emails = formData.getAll('email')
    const { _action, ...values } = Object.fromEntries(formData);

    if (_action == "edit") {

        const entries = Object.entries(values)
        const entryPromises = entries.map(entry => {
            let userId = entry[0].split('-')[1];
            let role = entry[1] as userRole;
            return updateUserRole(userId, role)
        })
        const updatedUsers = await Promise.all(entryPromises);
        return json<ActionData>({ update: updatedUsers, tokens: null })
    } else if (_action == 'passwordReset') {

        let resetTokenPromises = emails.map(email => {
            if (typeof email == 'string' && email.length) {
                return createPasswordResetToken(email)
            } else {
                return new Promise<null>((resolve) => resolve(null))
            }
        })

        let tokens = await Promise.all(resetTokenPromises);
        return json<ActionData>({ tokens, update: null })
    }
    return null;
}

export const loader: LoaderFunction = async ({ request }) => {
    const users = await adminGetUsers();
    return json<LoaderData>({ users })
}

export default function AdminUsersIndexPage() {
    const { users } = useLoaderData() as LoaderData;
    const actionData = useActionData() as ActionData;

    const transition = useTransition();
    const isBusy = transition.state == 'submitting';

    let [isOpen, setIsOpen] = useState(false)
    let [isResetModalOpen, setIsResetModalOpen] = useState(false);
    let [selectedUsers, setSelectedUsers] = useState<selectedUsersList>([])
    let [updateAttribute, setUpdateAttribute] = useState('')

    function openModal() {
        setIsOpen(true);
    }
    function closeModal() {
        setIsOpen(false)
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
    function showPasswordModal() {
        setIsResetModalOpen(true);
    }
    function handleSelectAllUsers(e: React.ChangeEvent<HTMLInputElement>) {
        const inputList = document.querySelectorAll('input[name="userSelect"]') as NodeListOf<HTMLInputElement>
        let userIds = [] as selectedUsersList;
        inputList.forEach((input) => {
            if (input && input.type === 'checkbox') {
                userIds = [...userIds, input.value]
                if (e.target.checked) {
                    input.checked = true;

                } else {
                    input.checked = false;
                }
            }
        });
        if (e.target.checked) {
            setSelectedUsers(userIds)
        } else {
            setSelectedUsers([])
        }
    }

    useEffect(() => {
        if (transition.type === "actionReload") {
            //closeModal();
        }
        if (actionData?.tokens) {
            setIsResetModalOpen(true)
        }
    }, [transition.state === "loading"])
    return (
        <div>
            <PasswordResetDialog
                isOpen={isResetModalOpen}
                setIsOpen={setIsResetModalOpen}

                isBusy={isBusy}
                resetTokens={actionData?.tokens || null}
                selectedUsers={selectedUsers}
            />

            <EditUserDialog
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                updateAttribute={updateAttribute}
                selectedUsers={selectedUsers}
                isBusy={isBusy}
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
            <Form method="post" className="inline">
                {selectedUsers.map(u => {
                    let foundUser = users.find(user => user.id === u);
                    return <input
                        type="hidden"
                        key={u}
                        name={'email'}
                        value={foundUser?.email || u}
                    />
                })}
                <button
                    type="submit"
                    name="_action"
                    value="passwordReset"
                    className={classNames(
                        selectedUsers.length === 0 ?
                            'disabled:cursor-not-allowed text-gray-500' :
                            '',
                        'p-3'

                    )}
                    disabled={selectedUsers.length === 0}

                >
                    Reset Password
                </button>
            </Form>
            <table className="w-full border-separate border-spacing-0">
                <thead>
                    <tr>
                        <th className="sticky top-0 bg-slate-100 border-b border-slate-300 text-left p-3">
                            <input
                                name="userSelectAll"
                                type="checkbox"
                                id="userSelectAll"
                                onChange={(e) => handleSelectAllUsers(e)}
                            />
                        </th>
                        <th className="sticky top-0 bg-slate-100 border-b border-slate-300 text-left p-3">Name</th>
                        <th className="sticky top-0 bg-slate-100 border-b border-slate-300 text-left p-3">Email</th>
                        <th className="sticky top-0 bg-slate-100 border-b border-slate-300 text-left p-3">Password Reset</th>
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
                            <td className="p-3">{`${user.profile?.firstName} ${user.profile?.lastName}`}</td>
                            <td className="p-3">{user.email}</td>
                            <td className="p-3">
                                {user.password?.resetToken ? `reset expires on ${user.password.tokenExpiration}` : ''}
                                <br />
                                {user.password?.resetToken ?
                                    `/reset-password?${new URLSearchParams({ token: user.password?.resetToken }).toString()}` :
                                    ""}
                            </td>
                            <td className="p-3">{user.profile?.gym}</td>
                            <td className="p-3">{user.role}</td>

                        </tr>
                    ))}
                </tbody>
            </table>

        </div>
    );
}


function EditUserDialog({ isOpen, setIsOpen, updateAttribute, selectedUsers, isBusy }:
    {
        isOpen: boolean,
        setIsOpen: React.Dispatch<React.SetStateAction<boolean>>,
        updateAttribute: string,
        selectedUsers: string[],
        isBusy: boolean;
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
                                        {filteredUsers.map((user, i) => (
                                            <div className="grid grid-cols-2 w-full gap-4" key={user.id}>
                                                <div>{user.profile?.firstName}{" "}{user.profile?.lastName}</div>
                                                {updateAttribute == 'Role' && (
                                                    <div>
                                                        <label htmlFor={"role-select" + i} className="sr-only">Role</label>
                                                        <select id={"role-select" + i} name={`role-${user.id}`} defaultValue={user.role}>
                                                            <option value="ADMIN" >Admin</option>
                                                            <option value="MEMBER" >Member</option>
                                                        </select>
                                                    </div>
                                                )}

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
                                        disabled={isBusy}
                                    >
                                        {isBusy ? "Saving Changes" : "Save Changes"}
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

function PasswordResetDialog({ isOpen, setIsOpen, resetTokens, selectedUsers, isBusy }:
    {
        isOpen: boolean,
        setIsOpen: React.Dispatch<React.SetStateAction<boolean>>,
        resetTokens: ActionData["tokens"] | undefined | null,
        selectedUsers: string[],
        isBusy: boolean;
    }
) {
    const { users } = useMatchesData("routes/admin/users/index") as LoaderData
    const filteredUsers = users.filter(u => selectedUsers.find(id => id === u.id))
    function closeModal() {
        return setIsOpen(false)
    }

    let userResetTokens = filteredUsers.map(user => {
        let foundToken = resetTokens?.find(token => token?.id === user.id)
        return {
            id: user.id,
            name: `${user.profile?.firstName} ${user.profile?.lastName}`,
            token: foundToken ? new URLSearchParams({ token: foundToken?.password?.resetToken || '' }) : ''
        }
    })
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
                                    Password Reset Link
                                </Dialog.Title>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        Password reset link{filteredUsers.length > 1 ? 's' : null} can be found below.
                                    </p>

                                    {userResetTokens.map((user, i) => (
                                        <div className="grid grid-cols-2 w-full gap-4" key={user.id}>
                                            <div>{user.name}</div>
                                            <Link to={`/reset-password?${user.token}`}>Reset Link</Link>

                                        </div>
                                    ))}

                                </div>

                                <div className="mt-4">

                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                        onClick={closeModal}
                                    >
                                        Close
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