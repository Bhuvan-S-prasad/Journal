"use client"

import { useEffect, useState } from "react";
import EntryForm from "@/components/form/EntryForm";

function Page() {
    const [timestamp, setTimestamp] = useState<string>('');

    useEffect(() => {
        setTimestamp(new Date().toLocaleString());
    }, []);

    return (
        <main className="pt-10 min-h-screen px-4 md:px-20 max-w-5xl mx-auto">
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold font-serif text-foreground">Create Entry</h1>
                    <p className="text-muted-foreground text-sm">{timestamp || "\u00A0"}</p>
                </div>

                <EntryForm />
            </div>
        </main>
    )
}

export default Page