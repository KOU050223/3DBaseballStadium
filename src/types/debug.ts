// DebugInfo型を定義
export interface DebugInfo {
  fbxLoaded: boolean;
  fbxError: boolean;
  loadingTimeout: boolean;
  modelPath: string;
  // 必要に応じて追加
}
