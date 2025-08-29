
'use client';
// Joy-Conに標準入力レポートモード(0x30)を設定
const enableJoyconStandardInputReport = async (device: HIDDevice) => {
	try {
		if (!device.opened) {
			try {
				await device.open();
				await new Promise(res => setTimeout(res, 100)); // open直後は少し待つ
			} catch (e) {
				if (e instanceof DOMException && e.name === 'InvalidStateError') {
					console.warn('Joy-Con is already opening/opened. Skipping open.');
				} else {
					throw e;
				}
			}
		}
		// IMU有効化
		try {
			await device.sendReport(0x01, new Uint8Array([0x40, 0x01, 0x01]));
		} catch (e) {
			if (e instanceof DOMException && e.name === 'InvalidStateError') {
				console.warn('sendReport(IMU enable) skipped: device state changing');
			} else {
				throw e;
			}
		}
		await new Promise((res) => setTimeout(res, 100));
		// 標準入力レポートモード(0x30)有効化
		try {
			await device.sendReport(0x01, new Uint8Array([0x03, 0x30]));
		} catch (e) {
			if (e instanceof DOMException && e.name === 'InvalidStateError') {
				console.warn('sendReport(0x30) skipped: device state changing');
			} else {
				throw e;
			}
		}
		await new Promise((res) => setTimeout(res, 100));
		console.log('[JoyCon] IMU有効化+標準入力レポートモード(0x30)を送信しました');
	} catch (e) {
		console.error('[JoyCon] レポートモード送信失敗', e);
	}
};
// Joy-ConのIMU(加速度)有効化コマンド送信
// IMU有効化は不要（Aボタンのみで良い）
// 既存内容を全て置き換え

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Suspense, useState, useRef, useEffect } from 'react';
import { Vector3, Euler } from 'three';
import { ErrorBoundary } from '@/components/common/3DComponent/ErrorBoundary';
import BaseballStadium from '@/components/common/3DComponent/BaseballStadium';
import { BatController, BatControllerRef } from '@/components/common/3DComponent/BatController';
import { BattingMachine } from '@/components/common/3DComponent/BattingMachine';
import { Physics } from '@react-three/rapier';
import { MODEL_CONFIG } from '@/constants/ModelPosition';
import { Scoreboard } from '@/components/game/Scoreboard';
import { GameControls } from '@/components/game/GameControls';


const JOYCON_VENDOR_ID = 0x057e;
const JOYCON_R_PRODUCT_ID = 0x2007; // Joy-Con (R) のproductId

interface SceneProps {
	debugMode?: boolean;
}

export const Scene: React.FC<SceneProps> = ({ debugMode = false }) => {
	const [stadiumScale] = useState<number>(MODEL_CONFIG.STADIUM.scale);
	const [stadiumPosition] = useState<Vector3>(MODEL_CONFIG.STADIUM.position);
	const [stadiumRotation] = useState<Euler>(MODEL_CONFIG.STADIUM.rotation);

	const [batScale, setBatScale] = useState<number>(MODEL_CONFIG.BAT.scale);
	const [batPosition, setBatPosition] = useState<Vector3>(MODEL_CONFIG.BAT.position);
	const [ballSpeed, setBallSpeed] = useState<number>(60);
	const [gravityScale, setGravityScale] = useState<number>(1.5);

	const batRef = useRef<BatControllerRef>(null);

	// ジョイコン加速度でバットを振る

	// ジョイコンデバイス・リスナー管理
	const joyconDeviceRef = useRef<any>(null);
	const joyconListenerRef = useRef<any>({ prevDataRef: { current: null }, prevAButtonRef: { current: false }, listener: null });

	// 初期化時に既存のJoy-Con (R)があれば自動でopenしinputreport登録
	useEffect(() => {
		const connectExistingJoycon = async () => {
			// @ts-ignore
			const devices = await navigator.hid.getDevices();
			const device = devices.find((d: any) => d.vendorId === JOYCON_VENDOR_ID && d.productId === JOYCON_R_PRODUCT_ID);
			if (device) {
				try {
					if (!device.opened) {
						try {
							await device.open();
						} catch (e) {
							// すでにopen中やopen済みの場合は握りつぶす
							if (e instanceof DOMException && e.name === 'InvalidStateError') {
								console.warn('Joy-Con is already opening/opened. Skipping open.');
							} else {
								throw e;
							}
						}
					}
					await enableJoyconStandardInputReport(device);
					joyconDeviceRef.current = device;
					const prevDataRef = joyconListenerRef.current.prevDataRef;
					const prevAButtonRef = joyconListenerRef.current.prevAButtonRef;
					const listener = (event: any) => {
						const data = new Uint8Array(event.data.buffer);
						const prev = prevDataRef.current;
						if (prev) {
							let diff = [];
							for (let i = 0; i < data.length; i++) {
								if (data[i] !== prev[i]) {
									diff.push(`data[${i}]: ${prev[i]} -> ${data[i]}`);
								}
							}
							if (diff.length > 0) {
								console.log('[JoyCon][inputreport] diff:', diff, 'data:', data);
							}
						}
						prevDataRef.current = data;
						// Aボタンの押下立ち上がりでバットを振る
						const aPressed = ((data[2] & 0x08) !== 0) || ((data[3] & 0x08) !== 0);
						let swung = false;
						if (aPressed && !prevAButtonRef.current) {
							batRef.current?.triggerSwing();
							swung = true;
						}
						prevAButtonRef.current = aPressed;
												// Aボタンでバットを振る処理のみ残す
					};
					device.addEventListener('inputreport', listener);
					joyconListenerRef.current.listener = listener;
				} catch (e) {
					console.error('Joy-Con open failed:', e);
				}
			}
		};
		connectExistingJoycon();
		// クリーンアップ: ページ離脱時にリスナー解除
		return () => {
			if (joyconDeviceRef.current && joyconListenerRef.current.listener) {
				joyconDeviceRef.current.removeEventListener('inputreport', joyconListenerRef.current.listener);
			}
		};
	}, []);



	// バットの回転定義
	const startRotation = new Euler(-13 * Math.PI / 180, 0, 13 * Math.PI / 180);
	const endRotation = new Euler(-150 * Math.PI / 180, 0, 80 * Math.PI / 180);

	return (
		<div className="w-full h-full relative">
			<Scoreboard />
			<GameControls />
			<Canvas camera={{ position: [0, 1.5, -4]}}>
				<OrbitControls target={[0, 1.5, 0]} />
				<Environment preset="sunset" />
				<ambientLight intensity={0.5} />
				<pointLight position={[10, 10, 10]} intensity={1} />
				<ErrorBoundary fallback={null}>
					<Suspense fallback={null}>
						<Physics debug={debugMode}>
							<BaseballStadium 
								debugMode={debugMode}
								position={stadiumPosition}
								rotation={stadiumRotation}
								scale={stadiumScale}
								modelPath="/models/BaseballStadium.glb"
								onLoad={() => console.log('Stadium loaded')}
							/>
							<BatController
								ref={batRef}
								position={batPosition}
								scale={batScale}
								startRotation={startRotation}
								endRotation={endRotation}
								modelPath="/models/BaseballBat.glb"
								onLoad={() => console.log('Bat loaded')}
							/>
							<BattingMachine
								position={new Vector3(0, 2, 23)}
								rotation={new Euler(0, Math.PI, 0)}
								launchInterval={2.0}
								ballSpeed={ballSpeed}
								launchAngle={-2}
								autoStart={true}
								debugMode={debugMode}
								gravityScale={gravityScale}
							/>
						</Physics>
					</Suspense>
				</ErrorBoundary>
			</Canvas>
		</div>
	);
};


