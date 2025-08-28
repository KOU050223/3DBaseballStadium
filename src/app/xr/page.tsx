'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// クライアントサイドでのみXRシーンを読み込み（SSRを無効化）
const Scene = dynamic(
  () => import('@/components/feature/xr/Scene').then((mod) => ({ default: mod.Scene })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>XR環境を読み込み中...</p>
        </div>
      </div>
    )
  }
);

export default function XRPage() {
  return (
    <div className="w-full h-[calc(100vh-80px)]">
      <Suspense 
        fallback={
          <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p>XR環境を準備中...</p>
            </div>
          </div>
        }
      >
        <Scene debugMode={process.env.NODE_ENV === 'development'} />
      </Suspense>
    </div>
  );
}
