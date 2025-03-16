"use client"

import BackgroundMeteor from '@/components/ui/BackgroundMeteor/MeteorShower';
import NatureScene from '@/components/ui/BackgroundMeteor/NatureScene';
import { themeStore, Theme } from '@/lib/stores/theme';
import { useStore } from '@nanostores/react';
import { useEffect } from 'react';


export default function Background() {
  const theme = useStore(themeStore);
  useEffect(() => {
    const theme = localStorage.getItem('bolt_theme');
    themeStore.set(theme as Theme || 'dark');
  }, [theme]);
  
  return (
    <>
      {theme === 'dark' ? <BackgroundMeteor /> : <NatureScene />}
    </>
  );
} 