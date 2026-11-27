import { useEffect, useState } from 'react';
import { useStore } from './lib/store';
import Home from './pages/Home';
import Shopping from './pages/Shopping';
import Knowledge from './pages/Knowledge';
import Training from './pages/Training';
import Settings from './pages/Settings';

const TABS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'shopping', label: 'Shopping', icon: '🛒' },
  { id: 'knowledge', label: 'Knowledge', icon: '📚' },
  { id: 'training', label: 'Training', icon: '🎓' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
] as const;
export type TabId = (typeof TABS)[number]['id'];

function readTab(): TabId {
  const h = window.location.hash.replace('#', '');
  return (TABS.find((t) => t.id === h)?.id ?? 'home') as TabId;
}

const STATUS_LABEL: Record<string, string> = {
  'local-only': 'On this device',
  'signed-out': 'Sync: signed out',
  'no-household': 'Sync: no household',
  syncing: 'Syncing…',
  synced: 'Synced',
  offline: 'Offline — saved locally',
  error: 'Sync error',
};

export default function App() {
  const [tab, setTab] = useState<TabId>(readTab);
  const { syncStatus } = useStore();

  useEffect(() => {
    const onHash = () => setTab(readTab());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (t: TabId) => {
    window.location.hash = t;
    window.scrollTo(0, 0);
  };

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">🐾 Cobberdog Essentials</span>
        <button className={`sync-pill sync-${syncStatus}`} onClick={() => go('settings')}>
          {STATUS_LABEL[syncStatus]}
        </button>
      </header>
      <main className="content">
        {tab === 'home' && <Home go={go} />}
        {tab === 'shopping' && <Shopping />}
        {tab === 'knowledge' && <Knowledge />}
        {tab === 'training' && <Training />}
        {tab === 'settings' && <Settings />}
      </main>
      <nav className="tabbar" aria-label="Sections">
        {TABS.map((t) => (
          <button key={t.id} className={`tab ${tab === t.id ? 'tab-on' : ''}`} onClick={() => go(t.id)} aria-current={tab === t.id}>
            <span aria-hidden="true">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
