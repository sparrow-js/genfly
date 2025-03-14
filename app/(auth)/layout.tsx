import type { Metadata } from "next";
import type { ReactNode } from "react";
import { auth } from "auth"
import { SessionProvider } from "next-auth/react"

export const metadata: Metadata = {
  title: "Login | Platforms Starter Kit",
};

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  return (
    <SessionProvider basePath={"/api/auth"} session={session}>
       {children}
    </SessionProvider>
   
  );
}
