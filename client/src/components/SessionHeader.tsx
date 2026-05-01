interface SessionHeaderProps {
  title: string;
  subtitle: string;
  sessionId?: string;
}

export function SessionHeader({ title, subtitle, sessionId }: SessionHeaderProps) {
  return (
    <header className="session-header">
      <div>
        <p className="eyebrow">Karaoke Remote</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {sessionId ? (
        <div className="session-code" aria-label={`Mã phiên ${sessionId}`}>
          <span>Phiên</span>
          <strong>{sessionId}</strong>
        </div>
      ) : null}
    </header>
  );
}
