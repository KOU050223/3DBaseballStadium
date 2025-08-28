import { Scene } from '@/components/feature/xr/Scene';

export default function Play() {
  return (
    <div className="w-full h-[calc(100vh-80px)]">
      <Scene debugMode={process.env.NODE_ENV === 'development'} />
    </div>
  )
}
