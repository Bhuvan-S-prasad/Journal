'use client'

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sidebarLinks } from "@/lib/constants";

function Bottombar() {
    const pathname = usePathname();

    return (
        <section className="fixed bottom-0 z-10 w-full rounded-t-3xl bg-sidebar-background backdrop-blur-lg p-4 border-t border-border xs:px-7 md:hidden">
            <div className="flex items-center justify-between gap-3 xs:gap-5">
                {sidebarLinks.map((link) => {
                    const isActive = (pathname.includes(link.route) && link.route.length > 1) || pathname === link.route;

                    return (
                        <div key={link.label}>
                            <Link href={link.route}
                                className={` relative flex flex-col items-center gap-2 rounded-lg p-2 sm:flex-1 sm:px-2 sm:py-2.5 ${isActive && 'bg-primary'}`}>
                                <span className="w-6 h-6">{link.icon}</span>
                                <p className="text-medium max-sm:hidden">{link.label.split(/\s+/)[0]}</p>
                            </Link >
                        </div >
                    )
                }
                )}
            </div>

        </section>
    )
}

export default Bottombar;