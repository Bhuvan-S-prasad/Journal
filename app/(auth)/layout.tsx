import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";


const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Daymark",
    description: "Daymark is a modern journaling app to write daily entries, reflect on your thoughts, track moods, and chat with an AI that understands your personal journal history.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ClerkProvider>
            <html lang="en">
                <body
                    className={`${geistSans.variable} ${geistMono.variable} antialiased`}
                >
                    <main className="flex flex-row">
                        <div className="flex-1 bg-background">
                            {children}
                        </div>
                    </main>
                </body>
            </html>
        </ClerkProvider>
    );
}
