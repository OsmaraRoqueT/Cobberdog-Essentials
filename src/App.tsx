import { useEffect, useState } from 'react';
import { breedById } from './content/breeds';
import { pick, useI18n, type MessageKey } from './i18n';
import { getProfile, useStore } from './lib/store';
import { isRecovery } from './lib/sync';
import Health from './pages/Health';
import Home from './pages/Home';
import Knowledge from './pages/Knowledge';
import Onboarding, { isOnboarded } from './pages/Onboarding';
import Settings, { KeepAwake } from './pages/Settings';
import Shopping from './pages/Shopping';
import Training from './pages/Training';

const TABS = [
  { id: 'home', icon: '🏠' },
  { id: 'health', icon: '🩺' },
  { id: 'shopping', icon: '🛒' },
  { id: 'training', icon: '🎓' },
  { id: 'knowledge', icon: '📚' },
  { id: 'settings', icon: '⚙️' },
] as const;
export type TabId = (typeof TABS)[number]['id'];

function readTab(): TabId {
  if (isRecovery()) return 'settings';
  const h = window.location.hash.replace('#', '').split('/')[0];
  return (TABS.find((t) => t.id === h)?.id ?? 'home') as TabId;
}

export default function App() {
  const [tab, setTab] = useState<TabId>(readTab);
  const { syncStatus, data, household } = useStore();
  const { t, lang } = useI18n();
  const profile = getProfile(data);
  const [onboarded, setOnboarded] = useState(() => isOnboarded() || Boolean(profile?.country) || Boolean(household));

  useEffect(() => {
    const onHash = () => setTab(readTab());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  // A household synced down a profile with a country: setup is done on this device.
  useEffect(() => {
    if (profile?.country) setOnboarded(true);
  }, [profile?.country]);

  const breed = breedById(profile?.breed);
  const appName = breed.appName ? pick(breed.appName, lang) : t('app.name');
  useEffect(() => {
    document.title = appName;
  }, [appName]);

  const go = (target: TabId, sub?: string) => {
    window.location.hash = sub ? `${target}/${sub}` : target;
    window.scrollTo(0, 0);
  };

  if (!onboarded) return <Onboarding onDone={(joining) => (setOnboarded(true), go(joining ? 'settings' : 'home'))} />;

  return (
    <div className="app">
      <KeepAwake />
      <header className="topbar">
        <span className="brand">🐾 {appName}</span>
        <button className={`sync-pill sync-${syncStatus}`} onClick={() => go('settings')}>
          {t(`sync.${syncStatus}` as MessageKey)}
        </button>
      </header>
      <nav className="tabbar" aria-label="Sections">
        {TABS.map((x) => (
          <button key={x.id} className={`tab ${tab === x.id ? 'tab-on' : ''}`} onClick={() => go(x.id)} aria-current={tab === x.id}>
            <span aria-hidden="true">{x.icon}</span>
            <span>{t(`nav.${x.id}` as MessageKey)}</span>
          </button>
        ))}
      </nav>
      <main className="content">
        {tab === 'home' && <Home go={go} />}
        {tab === 'health' && <Health />}
        {tab === 'shopping' && <Shopping />}
        {tab === 'knowledge' && <Knowledge key={window.location.hash} initialCat={window.location.hash.split('/')[1]} />}
        {tab === 'training' && <Training />}
        {tab === 'settings' && <Settings />}
      </main>
    </div>
  );
}
