"use client"

import { useEffect, useState } from "react";

function Page() {
    const [timestamp, setTimestamp] = useState<string>('');

    useEffect(() => {
        setTimestamp(new Date().toLocaleString());
    }, []);

    return (
        <main className="pt-10 h-screen px-10 md:px-15">
            <div className="flex flex-col items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">Create Entry</h1>

                <p className="text-muted-foreground text-sm">{timestamp || "\u00A0"}</p>

                <p>How are you feeling today?</p>


            </div>
            <div className="flex-1">


            </div>


        </main>
    )
}

export default Page