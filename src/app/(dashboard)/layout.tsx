import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex-col">
            <header className="sticky top-0 z-50 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
                <Link
                    href={"/"}
                    className="flex items-center gap-2 font-semibold"
                >
                    <span className="text-lg font-bold">TimeOffer</span>
                </Link>
                <nav className="flex gap-4 sm:gap-6">
                    <UserButton afterSignOutUrl="/" />
                </nav>
            </header>
            <div className="flex flex-1">
                <main className="flex-1 p-4 md:p-6">{children}</main>
            </div>
        </div>
    );
}
