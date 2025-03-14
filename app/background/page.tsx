"use client"

import BackgroundMeteor from '@/components/ui/BackgroundMeteor/MeteorShower';
import NatureScene from '@/components/ui/BackgroundMeteor/NatureScene';
import { themeStore } from '@/lib/stores/theme';
import { useStore } from '@nanostores/react';

export default function Background() {
  const theme = useStore(themeStore);
  
  return (
    <div className="w-full h-full">
      {theme === 'dark' ? <BackgroundMeteor /> : <NatureScene />}
    </div>
  );
} 