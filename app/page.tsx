'use client'

import { useUser } from "@clerk/nextjs";

export default function Home() {
  const { user } = useUser();

  return (
    <>
    <main className="flex pt-10 justify-center h-screen px-30">
      <h1>Welcome Back {user?.firstName} </h1>
      s
    </main>
      
    </>
  );
}
