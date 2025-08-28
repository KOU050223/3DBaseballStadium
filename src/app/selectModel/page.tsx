'use client';
import React, { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import FileInputComponent from "react-file-input-previews-base64";

interface ModelItem {
  name: string;
  path: string; // base64 文字列 or URL
}

const screenSize = { width: 800, height: 600 };

const ModelSelectPage: React.FC = () => {
  const [models, setModels] = useState<ModelItem[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelItem | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !selectedModel) return;

    // サイズ
    const width = screenSize.width;
    const height = screenSize.height;

    // シーン作成
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 1, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor("#ffffff");
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // ライト
    const lights = [
      new THREE.DirectionalLight(0xffffff, 1),
      new THREE.DirectionalLight(0xffffff, 1),
      new THREE.DirectionalLight(0xffffff, 1),
      new THREE.DirectionalLight(0xffffff, 1),
    ];
    lights[0].position.set(5, 5, 5);
    lights[1].position.set(5, 0, -10);
    lights[2].position.set(-5, 0, -10);
    lights[3].position.set(-5, 0, 0);
    lights.forEach((l) => scene.add(l));

    let model: THREE.Object3D | null = null;
    const loader = new GLTFLoader();

    if (selectedModel.path.startsWith("data:")) {
      // base64 の場合
      const arrayBuffer = Uint8Array.from(atob(selectedModel.path.split(",")[1]), c =>
        c.charCodeAt(0)
      ).buffer;
      loader.parse(arrayBuffer, "", (gltf) => {
        model = gltf.scene;
        scene.add(model);
      });
    } else {
      // 通常の URL の場合
      loader.load(selectedModel.path, (gltf) => {
        model = gltf.scene;
        scene.add(model);
      });
    }

    const animate = () => {
      requestAnimationFrame(animate);
      if (model) model.rotation.y += 0.01;
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.dispose();
      controls.dispose();
      scene.clear();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [selectedModel]);

  function SelectedModel() {
    if (!selectedModel) return;
    localStorage.setItem("selectedModel", JSON.stringify(selectedModel));
    alert(`選択したモデル: ${selectedModel.name}`);
  }

  return (
    <div style={{ textAlign: "center", padding: "20px",alignSelf:"center" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>モデル選択画面</h1>
        <FileInputComponent 
        labelText="モデルを選ぶ"
        labelStyle={{ color: "black", fontSize: 20, fontWeight: "bold" }}
        buttonComponent={
          <div
            style={{
              width: 200,
              height: 50,
              backgroundColor: "blue",
              color: "white",
              lineHeight: "50px",
            }}
          >
            ファイルを選ぶ
          </div>
        }
        accept=".glb"
        callbackFunction={(fileArr: any) => {
          const file = fileArr[0];
          setModels((prev) => [
            { name: file.name, path: file.base64 },
            ...prev,
          ]);
          setSelectedModel({ name: file.name, path: file.base64 });
        }}
      />
      {/* モデル表示用 */}
      <div
        onClick={SelectedModel}
        ref={containerRef}
        style={{
          width: screenSize.width,
          height: screenSize.height,
          margin: "0 auto",
          border: "1px solid gray",
          cursor: "pointer",
        }}
      />

      {/* モデル選択ボタン */}
      <div
        style={{
          marginTop: "20px",
          display: "flex",
          justifyContent: "center",
          gap: "10px",
        }}
      >
        {models.map((model) => (
          <button
            key={model.name}
            onClick={() => setSelectedModel(model)}
            style={{
              padding: "10px",
              border:
                selectedModel?.name === model.name
                  ? "2px solid blue"
                  : "1px solid gray",
              cursor: "pointer",
            }}
          >
            {model.name}
          </button>
        ))}
      </div>

      {/* ファイル選択 */}
      
    </div>
  );
};

export default ModelSelectPage;
