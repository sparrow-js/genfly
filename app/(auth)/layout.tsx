import type { Metadata } from "next";
import type { ReactNode } from "react";
import { auth } from "auth"
import { SessionProvider } from "next-auth/react"
import { Header } from '@/components/header/Header';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const metadata: Metadata = {
  title: "Login | Platforms Starter Kit",
};

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  return (
    <SessionProvider basePath={"/api/auth"} session={session}>
      <div className="flex flex-col h-full w-full">
      <iframe
        id="background-iframe"
        className="absolute inset-0 w-full h-full pointer-events-none dark:bg-black light:bg-white"
        src="/background"
        title="background"
      />
      <Header />
        {children}
      </div>
      <ToastContainer />
    </SessionProvider>
   
  );
}
