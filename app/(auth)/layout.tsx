import type { Metadata } from "next";
import type { ReactNode } from "react";
import { auth } from "auth"
import { SessionProvider } from "next-auth/react"
import { Header } from '@/components/header/Header';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Background from '@/components/ui/BackgroundMeteor/Background';

export const metadata: Metadata = {
  title: "Genfly | Fast-track your idea to reality",
};

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  return (
    <SessionProvider basePath={"/api/auth"} session={session}>
      <div className="flex flex-col h-full w-full">
      <Header />
      <Background />
        {children}
      </div>
      <ToastContainer />
    </SessionProvider>
   
  );
}
