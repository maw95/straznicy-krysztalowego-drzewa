// "Zainstaluj grę" in the options: a button where the browser can install the game (Chrome, Edge, Android), the steps on an iPhone, nothing when the game
// already runs installed.

import { useEffect, useState } from 'react';
import { canInstall, isIos, isStandalone, onInstallChange, promptInstall } from '../pwa';

export function InstallHint() {
  const [, tick] = useState(0);
  useEffect(() => onInstallChange(() => tick((n) => n + 1)), []);
  if (isStandalone()) return null;
  if (canInstall()) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} data-install>
        Aplikacja <button className="btn plate parch" style={{ padding: '4px 14px' }} onClick={() => void promptInstall()}>Zainstaluj grę</button>
      </div>
    );
  }
  if (isIos()) {
    return <div style={{ fontSize: 14, color: 'var(--muted)' }} data-install>Instalacja na iPhonie: w Safari dotknij „Udostępnij”, potem „Dodaj do ekranu początkowego”. Gra otworzy się wtedy na pełnym ekranie i będzie działać także bez internetu (przeciw komputerowi).</div>;
  }
  return null;
}
