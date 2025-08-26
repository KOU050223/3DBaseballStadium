import { Scene } from '@/components/future/modelTest/Scene';

export default function Home() {
  return (
    <div className="w-full h-[calc(100vh-80px)]">
      <Scene debugMode={process.env.NODE_ENV === 'development'} />
    </div>
  );
}
