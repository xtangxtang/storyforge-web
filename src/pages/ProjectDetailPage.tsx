import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import { STAGE_LABELS } from '../types';
import { generateImage, generateVideo } from '../api/dashscopeService';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const data = useProjectStore(s => s.getProjectData(id || ''));
  const updateProjectState = useProjectStore(s => s.updateProjectState);
  const saveProject = useProjectStore(s => s.saveProject);

  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState('');

  useEffect(() => {
    useProjectStore.getState().loadAll();
  }, []);

  if (!data) {
    return <div style={{ textAlign: 'center', paddingTop: 80, color: '#888' }}>项目不存在</div>;
  }

  const { project, brief, assets = [], storyboards = [], videoClips = [] } = data;

  const handleGenerateVideos = async () => {
    if (!storyboards.length) return;
    setGenerating(true);
    setGenStatus('正在生成视频...');

    const newClips = [...videoClips];

    for (const sb of storyboards) {
      const clipId = `clip_${Date.now().toString(36)}_${sb.id.slice(0, 4)}`;
      newClips.push({
        id: clipId,
        projectId: project.id,
        storyboardId: sb.id,
        state: 'generating',
        isSelected: false,
        version: 1,
        createdAt: Date.now(),
      });
      saveProject(project, { videoClips: newClips });

      try {
        setGenStatus(`生成 ${sb.description?.substring(0, 15) || '...'} 的首帧图...`);
        const imageUrl = await generateImage(sb.firstFramePrompt || sb.description || '');

        setGenStatus('正在生成视频...');
        const videoUrl = await generateVideo({
          prompt: sb.videoPrompt || '',
          firstFrameUrl: imageUrl,
          duration: sb.duration || 5,
        });

        const idx = newClips.findIndex(c => c.id === clipId);
        if (idx >= 0) {
          newClips[idx] = { ...newClips[idx], videoUrl, state: 'completed' };
        }
      } catch (e) {
        const idx = newClips.findIndex(c => c.id === clipId);
        if (idx >= 0) {
          newClips[idx] = {
            ...newClips[idx],
            state: 'failed',
            errorReason: e instanceof Error ? e.message : String(e),
          };
        }
      }

      saveProject(project, { videoClips: newClips });
    }

    updateProjectState(project.id, 'cutting');
    setGenStatus('视频生成完成！');
    setGenerating(false);
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        background: '#16213e',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
      }}>
        <h2 style={{ marginBottom: 4 }}>{project.name}</h2>
        <span style={{
          background: '#6C63FF33',
          color: '#6C63FF',
          padding: '4px 10px',
          borderRadius: 12,
          fontSize: 12,
        }}>
          {STAGE_LABELS[project.state]}
        </span>
      </div>

      {/* Brief */}
      {brief && (
        <Section title="策划" icon="💡">
          <InfoRow label="类型" value={brief.genre || '-'} />
          <InfoRow label="时长" value={`${brief.duration || 0}s`} />
          <InfoRow label="情绪" value={brief.mood || '-'} />
          <InfoRow label="故事" value={brief.storyOutline || '-'} />
        </Section>
      )}

      {/* Assets */}
      {assets.length > 0 && (
        <Section title={`资产 (${assets.length})`} icon="👥">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {assets.map(a => (
              <span key={a.id} style={{
                background: '#1a1a2e',
                padding: '6px 12px',
                borderRadius: 16,
                fontSize: 13,
              }}>
                {a.type === 'character' ? '👤' : '📍'} {a.name}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Storyboards + Video clips */}
      {storyboards.length > 0 && (
        <Section title={`分镜 (${storyboards.length})`} icon="🎞">
          <div style={{ marginBottom: 12 }}>
            {project.state === 'generating' && storyboards.length > 0 && (
              <button
                onClick={handleGenerateVideos}
                disabled={generating}
                style={{
                  width: '100%',
                  padding: '12px 0',
                  background: generating ? '#444' : '#6C63FF',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 'bold',
                  cursor: generating ? 'not-allowed' : 'pointer',
                  marginBottom: 12,
                }}
              >
                {generating ? genStatus : '🎬 生成所有视频'}
              </button>
            )}

            {generating && (
              <div style={{
                background: '#16213e',
                padding: 12,
                borderRadius: 8,
                marginBottom: 12,
                color: '#888',
                fontSize: 13,
              }}>
                {genStatus}
              </div>
            )}
          </div>

          {storyboards.map(sb => {
            const clip = videoClips.find(c => c.storyboardId === sb.id);
            return (
              <div key={sb.id} style={{
                background: '#1a1a2e',
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
              }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{
                    background: '#6C63FF33',
                    color: '#6C63FF',
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontSize: 12,
                    flexShrink: 0,
                  }}>
                    S{sb.sceneNum} T{sb.shotNum}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, marginBottom: 4 }}>{sb.description}</div>
                    <div style={{ color: '#666', fontSize: 12 }}>
                      {sb.shotType} | {sb.cameraMove} | {sb.duration}s
                    </div>
                  </div>
                  <div>
                    {clip ? (
                      clip.state === 'completed' ? (
                        <span style={{ color: '#4caf50', fontSize: 12 }}>✅ 已完成</span>
                      ) : clip.state === 'failed' ? (
                        <span style={{ color: '#f44336', fontSize: 12 }}>❌ 失败</span>
                      ) : (
                        <span style={{ color: '#ff9800', fontSize: 12 }}>⏳ 生成中</span>
                      )
                    ) : (
                      <span style={{ color: '#666', fontSize: 12 }}>未生成</span>
                    )}
                  </div>
                </div>
                {clip?.errorReason && (
                  <div style={{ color: '#f44336', fontSize: 11, marginTop: 4 }}>
                    {clip.errorReason}
                  </div>
                )}
              </div>
            );
          })}
        </Section>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#16213e',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    }}>
      <div style={{ fontWeight: 'bold', marginBottom: 12 }}>
        {icon} {title}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', marginBottom: 4, fontSize: 14 }}>
      <span style={{ color: '#888', width: 50, flexShrink: 0 }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
