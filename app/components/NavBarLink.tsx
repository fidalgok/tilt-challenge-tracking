import { NavLink } from "@remix-run/react";


interface NavBarProps {
    children?: React.ReactNode;
    to: string;
    end?: boolean;
}

export default function NavBarLink({ children, to, ...props }: NavBarProps) {
    return (
        <NavLink
            to={to}

            className={({ isActive }) => (
                isActive ?
                    "disabled text-gray-500 inline-block border-b-2 border-slate-600" :
                    "inline-block"
            )}
            {...props}
        >
            {children}
        </NavLink>
    )
}