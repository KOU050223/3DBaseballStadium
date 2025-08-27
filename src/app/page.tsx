
'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  const handlePlayClick = () => {
    router.push('/play');
  };

  const handleHowToClick = () => {
    router.push('/howto');
  };

  return (
    <div className="w-full h-[calc(100vh-80px)] flex flex-col items-center justify-center">
      <button
        onClick={handlePlayClick}
        className="mt-8 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        ゲームプレイ
      </button>
      <button
        onClick={handleHowToClick}
        className="mt-4 px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition"
      >
        遊び方
      </button>
    </div>
  );
}
