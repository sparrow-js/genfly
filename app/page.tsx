import { Header } from '@/components/header/Header';
import { BaseChat } from '@/components/chat/BaseChat';
import { Suspense } from 'react';
import { Chat } from '@/components/chat/Chat.client';
import { auth } from "auth"
import { SessionProvider } from "next-auth/react"



// Client-side only components
// const Chat = dynamic(() => import('@/components/chat/Chat.client').then(mod => mod.Chat), {
//   ssr: false,
// });

/**
 * Landing page component for genfly
 * Note: Settings functionality should ONLY be accessed through the sidebar menu.
 * Do not add settings button/panel to this landing page as it was intentionally removed
 * to keep the UI clean and consistent with the design system.
 */
export default async function Home() {
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
      <Suspense fallback={<div>loading...</div>}>
        <Chat />
      </Suspense>
    </div>
    </SessionProvider>

  );
}
