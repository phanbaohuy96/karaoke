import { HostPage } from './pages/HostPage';
import { JoinPage } from './pages/JoinPage';

function getJoinSessionId(pathname: string): string | null {
  const match = pathname.match(/^\/join\/([^/]+)$/);
  return match?.[1] ?? null;
}

export function App() {
  const joinSessionId = getJoinSessionId(window.location.pathname);

  if (joinSessionId) {
    return <JoinPage sessionId={joinSessionId} />;
  }

  return <HostPage />;
}
