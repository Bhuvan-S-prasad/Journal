'use client'

import { useUser } from "@clerk/nextjs";

export default function Home() {
  const { user } = useUser();

  const imageUrl = user?.imageUrl;

  return (
    <>
      <main className="flex pt-10 justify-center h-screen px-10 md:px-30">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">Welcome Back {user?.firstName} </h1>
          <p className="text-muted-foreground">How are you feeling Today?</p>
        </div>

        <div className="">

        </div>

      </main>

    </>
  );
}
