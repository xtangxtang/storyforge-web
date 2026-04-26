import { useState, useEffect } from 'react';
import { useConfigStore } from '../store/configStore';

export default function SettingsPage() {
  const config = useConfigStore();
  const [llmKey, setLlmKey] = useState('');
  const [dsKey, setDsKey] = useState('');
  const [proxy, setProxy] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLlmKey(config.llmApiKey);
    setDsKey(config.dashscopeApiKey);
    setProxy(config.httpsProxy);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await config.save({ llmApiKey: llmKey.trim(), dashscopeApiKey: dsKey.trim(), httpsProxy: proxy.trim() });
    setSaving(false);
    alert('设置已保存');
  };

  const handleClearData = () => {
    if (!confirm('确定要清除所有本地项目数据吗？此操作不可撤销。')) return;
    localStorage.removeItem('sf_projects');
    window.location.reload();
  };

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>设置</h2>

      <label style={{ display: 'block', marginBottom: 4, color: '#888', fontSize: 13 }}>
        DashScope LLM API Key
      </label>
      <input
        type="password"
        value={llmKey}
        onChange={e => setLlmKey(e.target.value)}
        placeholder="sk-...（用于 qwen3.6-plus 文本生成）"
        style={inputStyle}
      />

      <label style={{ display: 'block', marginTop: 16, marginBottom: 4, color: '#888', fontSize: 13 }}>
        DashScope 图视频 API Key
      </label>
      <input
        type="password"
        value={dsKey}
        onChange={e => setDsKey(e.target.value)}
        placeholder="sk-...（用于 wan2.7 图像/视频生成）"
        style={inputStyle}
      />

      <label style={{ display: 'block', marginTop: 16, marginBottom: 4, color: '#888', fontSize: 13 }}>
        代理地址（可选）
      </label>
      <input
        type="text"
        value={proxy}
        onChange={e => setProxy(e.target.value)}
        placeholder="http://proxy.company.com:912"
        style={inputStyle}
      />

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%',
          marginTop: 24,
          padding: '14px 0',
          background: '#6C63FF',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          fontSize: 16,
          fontWeight: 'bold',
          cursor: saving ? 'not-allowed' : 'pointer',
        }}
      >
        {saving ? '保存中...' : '保存'}
      </button>

      <div style={{
        marginTop: 32,
        padding: 16,
        background: '#16213e',
        borderRadius: 12,
      }}>
        <h3 style={{ marginBottom: 8 }}>说明</h3>
        <ul style={{ color: '#888', fontSize: 13, lineHeight: 1.8, paddingLeft: 20 }}>
          <li>LLM API Key 用于调用 qwen3.6-plus（策划、编剧、分镜生成）</li>
          <li>图视频 API Key 用于调用 wan2.7-image 和 wan2.7-i2v</li>
          <li>两个 Key 可以相同</li>
          <li>API Key 仅保存在本地浏览器存储中</li>
        </ul>
      </div>

      <button
        onClick={handleClearData}
        style={{
          width: '100%',
          marginTop: 16,
          padding: '12px 0',
          background: 'transparent',
          color: '#f44336',
          border: '1px solid #f44336',
          borderRadius: 12,
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        🗑 清除所有本地数据
      </button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  background: '#16213e',
  color: '#eee',
  border: '1px solid #333',
  borderRadius: 8,
  fontSize: 14,
  outline: 'none',
};
