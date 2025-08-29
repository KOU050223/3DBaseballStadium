"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const [controlType, setControlType] = useState<'space' | 'joycon'>('space');

  useEffect(() => {
    const saved = localStorage.getItem('controlType');
    if (saved === 'joycon' || saved === 'space') setControlType(saved);
  }, []);

  const handleChange = (type: 'space' | 'joycon') => {
    setControlType(type);
  };

  // 保存ボタンでlocalStorageに保存
  const [saveStatus, setSaveStatus] = useState('');
  const router = useRouter();
  const handleSave = () => {
    localStorage.setItem('controlType', controlType);
    // ジョイコンの状態もログ出力
    console.log('[Settings] 保存: controlType =', controlType, ', joyconStatus =', joyconStatus);
    setSaveStatus('保存しました');
    setTimeout(() => {
      setSaveStatus('');
      router.push('/');
    }, 800);
  };

  // ジョイコン接続
  const [joyconStatus, setJoyconStatus] = useState<string>('未接続');

  // 初期化時に接続済みか確認
  useEffect(() => {
    const checkJoycon = async () => {
  const devices: HIDDevice[] = await navigator.hid.getDevices();
  const joycon = devices.find((d: HIDDevice) => d.vendorId === 0x057e);
      if (joycon && joycon.opened) {
        setJoyconStatus('接続済み');
      } else {
        setJoyconStatus('未接続');
      }
    };
    checkJoycon();
  }, []);

  const handleJoyconConnect = async () => {
    try {
      // Joy-Con(R) のみフィルタ
      const filters = [{ vendorId: 0x057e, productId: 0x2007 }];
  const devices: HIDDevice[] = await navigator.hid.requestDevice({ filters });
      console.log('[JoyCon] requestDevice result:', devices);
      if (devices && devices.length > 0) {
        const device = devices[0];
        if (device.opened) {
          console.log('[JoyCon] 既にopen状態です:', device);
          setJoyconStatus('接続済み');
        } else {
          await device.open();
          console.log('[JoyCon] device.opened:', device.opened, 'productId:', device.productId, 'productName:', device.productName);
          setJoyconStatus(device.opened ? '接続済み' : '未接続');
        }
      } else {
        setJoyconStatus('未接続');
        console.log('[JoyCon] No device selected');
      }
    } catch (e) {
      setJoyconStatus('接続失敗');
      console.error('[JoyCon] 接続失敗', e);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="mb-6 text-xl font-bold">操作方法の設定</h2>
      <button
        className={`mb-4 px-6 py-3 rounded ${controlType === 'space' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        onClick={() => handleChange('space')}
      >
        スペースキーでバットを振る
      </button>
      <button
        className={`px-6 py-3 rounded ${controlType === 'joycon' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        onClick={() => handleChange('joycon')}
      >
        ジョイコンでバットを振る
      </button>
      <button
        className="mt-6 px-6 py-3 bg-blue-700 text-white rounded hover:bg-blue-800 transition"
        onClick={handleSave}
      >
        保存
      </button>
      {saveStatus && <div className="mt-2 text-green-600">{saveStatus}</div>}
      {controlType === 'joycon' && (
        <>
          <button
            className="mt-6 px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition"
            onClick={handleJoyconConnect}
          >
            ジョイコン接続
          </button>
          <div className="mt-2 text-sm text-gray-700">状態: {joyconStatus}</div>
        </>
      )}
    </div>
  );
}
