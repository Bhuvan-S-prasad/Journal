'use client'

import { sidebarLinks } from "@/lib/constants";
import { SignedIn, SignOutButton } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function Sidebar() {

    const pathname = usePathname()
    return (
        <div className="sticky left-0 top-0 z-20 flex max-h-screen w-[270px] flex-col justify-between overflow-auto pb-5 pt-5 max-md:hidden">
            <h1 className="text-2xl font-bold p-6">Daymark</h1>
            <div className="flex flex-col gap-3 px-6 w-full">

                {sidebarLinks.map((link) => {
                    const isActive = (pathname.includes(link.route) && link.route.length > 1) || pathname === link.route;

                    let route = link.route;
                    return (
                        <div key={link.label}>
                            <Link href={route}
                                className={`flex gap-4 p-3 rounded-lg hover:bg-chart-5 text-sidebar-accent-foreground ${isActive && 'bg-chart-5'}`}>
                                <span className="w-5 h-5">{link.icon}</span>
                                <p className="max-xs:hidden">{link.label}</p>
                            </Link >
                        </div >
                    )
                }
                )}

            </div>

            <div className="mt-10 px-6">
                <SignedIn>
                    <SignOutButton redirectUrl="/sign-in">
                        <div className="flex cursor-pointer gap-4 p-4">
                            <LogOut />
                            <p className="max-xs:hidden">Logout</p>
                        </div>
                    </SignOutButton>
                </SignedIn>
            </div>

            <div className="m-5 p-5 flex flex-col items-center justify-center gap-3 bg-chart-5 rounded-2xl ">
                <h3 className="text-muted-foreground">writing streak</h3>
                <p className="text-2xl text-sidebar-primary font-bold">2 days</p>
                <p>keep it up</p>

            </div>
        </div>
    )
}

export default Sidebar;