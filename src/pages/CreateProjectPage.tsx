import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { DirectorAgent } from '../core/directorAgent';
import type { AgentContext } from '../core/agent';
import { useProjectStore } from '../store/projectStore';
import { useConfigStore } from '../store/configStore';
import type { Project, Brief, Asset, Storyboard } from '../types';

export default function CreateProjectPage() {
  const [prompt, setPrompt] = useState('');
  const [creating, setCreating] = useState(false);
  const [stage, setStage] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();
  const saveProject = useProjectStore(s => s.saveProject);
  const isConfigured = useConfigStore(s => s.isConfigured);

  const handleCreate = async () => {
    if (!prompt.trim()) return alert('请输入创意描述');
    if (!isConfigured) return alert('请先在设置页面配置 API Key');

    setCreating(true);
    setStage('策划');
    setStatus('正在生成策划方案...');

    try {
      const projectId = `proj_${uuidv4().slice(0, 8)}`;
      const project: Project = {
        id: projectId,
        name: prompt.trim().substring(0, 20),
        state: 'planning',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const director = new DirectorAgent();

      // Stage 1: Planning
      let ctx: AgentContext = {
        projectId,
        data: { prompt: prompt.trim(), currentStage: 'planning' },
      };

      let result = await director.runPlanning(ctx);
      if (!result.success) return alert(`策划失败: ${result.error}`);

      const briefData = result.data as Record<string, unknown>;
      const brief: Brief = {
        projectId,
        genre: briefData?.genre as string,
        duration: briefData?.duration as number,
        aspectRatio: briefData?.aspectRatio as string,
        mood: briefData?.mood as string,
        visualStyle: briefData?.visualStyle as string,
        storyOutline: briefData?.storyOutline as string,
        createdAt: Date.now(),
      };
      ctx.data.brief = brief;

      // Stage 2: Scripting
      setStage('编剧');
      setStatus('正在生成剧本...');
      ctx.data.currentStage = 'scripting';
      result = await director.runScripting(ctx);
      if (!result.success) return alert(`编剧失败: ${result.error}`);

      const scriptData = result.data as Record<string, unknown>;
      const assets = (scriptData?.assets as Asset[]) || [];

      // Stage 3: Storyboarding
      setStage('分镜');
      setStatus('正在生成分镜...');
      ctx.data.currentStage = 'storyboarding';
      result = await director.runStoryboarding(ctx);
      if (!result.success) return alert(`分镜失败: ${result.error}`);

      const storyboardData = result.data as Record<string, unknown>;
      const storyboards = (storyboardData?.storyboards as Storyboard[]) || [];

      // Save all
      saveProject(project, {
        brief,
        assets,
        storyboards,
      });

      navigate(`/project/${projectId}`);
    } catch (e) {
      alert(`创建失败: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setCreating(false);
    }
  };

  if (creating) {
    const progress = { '策划': 0.2, '编剧': 0.5, '分镜': 0.8 }[stage] || 0.1;
    return (
      <div style={{ textAlign: 'center', paddingTop: 40 }}>
        <h2>{stage}</h2>
        <div style={{
          background: '#333',
          borderRadius: 8,
          overflow: 'hidden',
          margin: '16px 0',
        }}>
          <div style={{
            width: `${progress * 100}%`,
            height: 8,
            background: '#6C63FF',
            transition: 'width 0.5s',
          }} />
        </div>
        <p style={{ color: '#888' }}>{status}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>创建项目</h2>
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="输入你的创意描述...&#10;例如：一个都市白领女孩在咖啡店遇到了她的初恋"
        style={{
          width: '100%',
          minHeight: 120,
          background: '#16213e',
          color: '#eee',
          border: '1px solid #333',
          borderRadius: 8,
          padding: 12,
          fontSize: 14,
          resize: 'vertical',
        }}
      />
      <button
        onClick={handleCreate}
        style={{
          width: '100%',
          marginTop: 16,
          padding: '14px 0',
          background: '#6C63FF',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 'bold',
          cursor: 'pointer',
        }}
      >
        ✨ 开始生成
      </button>
    </div>
  );
}
