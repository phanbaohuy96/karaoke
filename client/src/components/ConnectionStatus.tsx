import type { ConnectionStatus as Status } from '../types/session';

interface ConnectionStatusProps {
  status: Status;
  error?: string | null;
  onClick?: () => void;
}

const statusLabels: Record<Status, string> = {
  connecting: 'Đang kết nối phiên',
  connected: 'Đã kết nối trực tiếp',
  disconnected: 'Mất kết nối phiên',
  error: 'Lỗi kết nối phiên',
};

export function ConnectionStatus({ status, error, onClick }: ConnectionStatusProps) {
  const content = (
    <>
      <span className="connection__dot" />
      <span>{statusLabels[status]}</span>
      {error ? <strong>{error}</strong> : null}
    </>
  );

  if (onClick) {
    return (
      <button className={`connection connection--${status}`} type="button" onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className={`connection connection--${status}`}>{content}</div>;
}
