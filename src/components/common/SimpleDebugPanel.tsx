'use client';

import { useState } from 'react';

interface SimpleDebugPanelProps {
  modelPath: string;
  scale: [number, number, number];
  position: [number, number, number];
  rotation: [number, number, number];
  onScaleChange: (scale: [number, number, number]) => void;
  onPositionChange: (position: [number, number, number]) => void;
  onRotationChange: (rotation: [number, number, number]) => void;
}

export const SimpleDebugPanel: React.FC<SimpleDebugPanelProps> = ({
  modelPath,
  scale,
  position,
  rotation,
  onScaleChange,
  onPositionChange,
  onRotationChange
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-500 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded"
        >
          Debug
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-gray-800 text-white p-3 rounded text-xs w-64">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold">Debug Panel</span>
        <button onClick={() => setIsOpen(false)} className="text-gray-400">×</button>
      </div>
      
      <div className="mb-2">
        <div className="text-gray-300 mb-1">Model: {modelPath.split('/').pop()}</div>
      </div>

      {/* Scale */}
      <div className="mb-2">
        <div className="text-gray-300 mb-1">Scale</div>
        <input
          type="range" min="0.1" max="3" step="0.1" value={scale[0]}
          onChange={(e) => onScaleChange([+e.target.value, +e.target.value, +e.target.value])}
          className="w-full h-1"
        />
        <div className="text-xs text-gray-400">{scale[0].toFixed(1)}</div>
      </div>

      {/* Position Y */}
      <div className="mb-2">
        <div className="text-gray-300 mb-1">Position Y</div>
        <input
          type="range" min="-5" max="5" step="0.1" value={position[1]}
          onChange={(e) => onPositionChange([position[0], +e.target.value, position[2]])}
          className="w-full h-1"
        />
        <div className="text-xs text-gray-400">{position[1].toFixed(1)}</div>
      </div>

      {/* Rotation Y */}
      <div className="mb-2">
        <div className="text-gray-300 mb-1">Rotation Y</div>
        <input
          type="range" min="0" max={Math.PI * 2} step="0.1" value={rotation[1]}
          onChange={(e) => onRotationChange([rotation[0], +e.target.value, rotation[2]])}
          className="w-full h-1"
        />
        <div className="text-xs text-gray-400">{Math.round(rotation[1] * 180 / Math.PI)}°</div>
      </div>
    </div>
  );
};