"use client";
// プレイ画面

import { Scene as SimpleScene } from '@/components/feature/simple/Scene';
import { Scene as JoyconScene } from '@/components/feature/joycon/Scene';
import { useEffect, useState } from 'react';


export default function Play() {
  const [controlType, setControlType] = useState<'space' | 'joycon'>('space');
  useEffect(() => {
    const saved = localStorage.getItem('controlType');
    if (saved === 'joycon' || saved === 'space') setControlType(saved);
  }, []);
  return (
    <div className="w-full h-[calc(100vh-80px)]">
      {controlType === 'joycon' ? (
        <JoyconScene debugMode={process.env.NODE_ENV === 'development'} />
      ) : (
        <SimpleScene debugMode={process.env.NODE_ENV === 'development'} />
      )}
    </div>
  );
}
