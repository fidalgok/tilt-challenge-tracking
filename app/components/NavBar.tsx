
interface NavBarProps {
    children?: React.ReactNode;
}

export default function NavBar({ children }: NavBarProps) {
    return (
        <nav className="py-2 flex gap-4">
            {children}
        </nav>
    )
}