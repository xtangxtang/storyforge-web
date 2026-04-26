export interface Project {
  id: string;
  name: string;
  state: WorkflowStage;
  createdAt: number;
  updatedAt: number;
}

export interface Brief {
  projectId: string;
  genre?: string;
  duration?: number;
  aspectRatio?: string;
  mood?: string;
  visualStyle?: string;
  storyOutline?: string;
  createdAt: number;
}

export interface Scene {
  sceneNum: number;
  location: string;
  description: string;
  action: string;
  dialogue: string[];
  duration: number;
}

export interface Asset {
  id: string;
  projectId: string;
  type: 'character' | 'location' | 'style';
  name: string;
  description?: string;
  prompt?: string;
  state: string;
  createdAt: number;
}

export interface Storyboard {
  id: string;
  projectId: string;
  sceneNum: number;
  shotNum: number;
  shotType?: string;
  cameraMove?: string;
  description?: string;
  firstFramePrompt?: string;
  videoPrompt?: string;
  duration?: number;
  state: string;
  createdAt: number;
}

export interface VideoClip {
  id: string;
  projectId: string;
  storyboardId: string;
  videoUrl?: string;
  state: 'generating' | 'completed' | 'failed';
  isSelected: boolean;
  errorReason?: string;
  version: number;
  createdAt: number;
}

export type WorkflowStage =
  | 'planning'
  | 'scripting'
  | 'asseting'
  | 'storyboarding'
  | 'generating'
  | 'cutting'
  | 'done';

export const STAGE_LABELS: Record<WorkflowStage, string> = {
  planning: '策划',
  scripting: '编剧',
  asseting: '资产',
  storyboarding: '分镜',
  generating: '生成视频',
  cutting: '剪辑',
  done: '完成',
};

export const STAGE_ORDER: WorkflowStage[] = [
  'planning', 'scripting', 'asseting',
  'storyboarding', 'generating', 'cutting', 'done',
];
