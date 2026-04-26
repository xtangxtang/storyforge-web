import { Outlet, Link, useLocation } from 'react-router-dom';
import { useConfigStore } from './store/configStore';

export default function App() {
  const location = useLocation();
  const isConfigured = useConfigStore(s => s.isConfigured);

  const navItems = [
    { path: '/', label: '项目', icon: '🎬' },
    { path: '/settings', label: '设置', icon: '⚙️' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', maxWidth: 800, margin: '0 auto' }}>
      {/* Top bar */}
      <header style={{
        background: '#16213e',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #333',
      }}>
        <Link to="/" style={{
          color: '#fff',
          fontSize: 20,
          fontWeight: 'bold',
          textDecoration: 'none',
        }}>
          Storyforge
        </Link>
        {!isConfigured && location.pathname !== '/settings' && (
          <span style={{ color: '#ff6b6b', fontSize: 12 }}>
            ⚠️ 请先配置 API Key
          </span>
        )}
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: 16 }}>
        <Outlet />
      </main>

      {/* Bottom nav */}
      <nav style={{
        display: 'flex',
        borderTop: '1px solid #333',
        background: '#16213e',
      }}>
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              flex: 1,
              padding: '10px 0',
              textAlign: 'center',
              textDecoration: 'none',
              color: location.pathname === item.path ? '#6C63FF' : '#888',
              fontSize: 12,
            }}
          >
            <div style={{ fontSize: 20 }}>{item.icon}</div>
            <div>{item.label}</div>
          </Link>
        ))}
      </nav>
    </div>
  );
}
