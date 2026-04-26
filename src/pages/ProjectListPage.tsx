import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import { STAGE_LABELS } from '../types';

export default function ProjectListPage() {
  const projects = useProjectStore(s => s.getAllProjects());
  const deleteProject = useProjectStore(s => s.deleteProject);
  const navigate = useNavigate();

  useEffect(() => {
    useProjectStore.getState().loadAll();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定要删除项目 "${name}" 吗？`)) return;
    deleteProject(id);
  };

  if (projects.length === 0) {
    return (
      <div style={{ textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎬</div>
        <h2 style={{ color: '#888', marginBottom: 8 }}>暂无项目</h2>
        <p style={{ color: '#666', marginBottom: 24 }}>开始你的第一个 AI 短剧项目吧</p>
        <button
          onClick={() => navigate('/create')}
          style={{
            padding: '12px 24px',
            fontSize: 16,
            background: '#6C63FF',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          + 创建新项目
        </button>
      </div>
    );
  }

  return (
    <div>
      {projects.map(project => (
        <div
          key={project.id}
          style={{
            background: '#16213e',
            borderRadius: 12,
            padding: 16,
            marginBottom: 8,
            cursor: 'pointer',
          }}
          onClick={() => navigate(`/project/${project.id}`)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 16 }}>{project.name}</div>
              <div style={{ color: '#888', fontSize: 12 }}>
                {new Date(project.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                background: '#6C63FF33',
                color: '#6C63FF',
                padding: '4px 10px',
                borderRadius: 12,
                fontSize: 12,
              }}>
                {STAGE_LABELS[project.state]}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(project.id, project.name); }}
                style={{
                  background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 18,
                }}
              >
                🗑
              </button>
            </div>
          </div>
        </div>
      ))}
      <Link
        to="/create"
        style={{
          display: 'block',
          textAlign: 'center',
          padding: '14px 0',
          marginTop: 16,
          background: '#6C63FF',
          color: '#fff',
          borderRadius: 12,
          textDecoration: 'none',
          fontWeight: 'bold',
        }}
      >
        + 创建新项目
      </Link>
    </div>
  );
}
