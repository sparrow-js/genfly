'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/header/Header';
import { BaseChat } from '@/components/chat/BaseChat';
import { Chat } from '@/components/chat/Chat.client';
import { Suspense } from 'react';


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
export default function Home() {
  return (
    <div className="flex flex-col h-full w-full">
      <Suspense fallback={<BaseChat />}>
        <Chat />
      </Suspense>
    </div>
  );
}