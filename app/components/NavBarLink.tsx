import { NavLink } from "@remix-run/react";


interface NavBarProps {
    children?: React.ReactNode;
    to: string;
}

export default function NavBarLink({ children, to }: NavBarProps) {
    return (
        <NavLink
            to={to}

            className={({ isActive }) => (
                isActive ?
                    "disabled text-gray-500 inline-block border-b-2 border-slate-600" :
                    "inline-block"
            )}
        >
            {children}
        </NavLink>
    )
}