// DebugInfo型を定義
export interface DebugInfo {
  glbLoaded: boolean;
  glbError: boolean;
  loadingTimeout: boolean;
  modelPath: string;
  // 必要に応じて追加
}
