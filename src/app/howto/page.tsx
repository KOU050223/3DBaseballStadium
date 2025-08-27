"use client";

import { useRouter } from "next/navigation";

export default function HowToPage() {
  const router = useRouter();

  const handleBackClick = () => {
    router.push("/");
  };

  return (
    <div className="w-full h-[calc(100vh-80px)] flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold mb-4">この画面は遊び方を説明するページです</h1>
      <button
        onClick={handleBackClick}
        className="mt-8 px-6 py-3 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
      >
        戻る
      </button>
    </div>
  );
}
