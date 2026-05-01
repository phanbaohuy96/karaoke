import { useCallback, useEffect, useRef, useState } from 'react';
import { createSession } from '../api/session';
import { QRCodeCard } from '../components/QRCodeCard';
import { YouTubePlayer } from '../components/YouTubePlayer';
import { useSessionSocket } from '../hooks/useSessionSocket';
import type { CreateSessionResponse, PlaylistItem } from '../types/session';

export function HostPage() {
  const sessionRequestRef = useRef<Promise<CreateSessionResponse> | null>(null);
  const previousPlaylistIdsRef = useRef<Set<string>>(new Set());
  const overlayTimerRef = useRef<number | undefined>(undefined);
  const [session, setSession] = useState<CreateSessionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);
  const [latestAdded, setLatestAdded] = useState<PlaylistItem | null>(null);
  const { snapshot, status, error: socketError, removeSong, setNowPlaying, playNext, setPlaying } = useSessionSocket({
    sessionId: session?.sessionId,
    role: 'host',
    hostToken: session?.hostToken,
    enabled: Boolean(session),
  });

  useEffect(() => {
    let isMounted = true;

    sessionRequestRef.current ??= createSession();

    sessionRequestRef.current
      .then((createdSession) => {
        if (isMounted) {
          setSession(createdSession);
        }
      })
      .catch((unknownError) => {
        if (isMounted) {
          setError(unknownError instanceof Error ? unknownError.message : 'Không thể tạo phiên karaoke.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const activeSnapshot = snapshot ?? session?.snapshot;
  const nextSong = activeSnapshot?.playlist[0] ?? null;
  const currentSong = activeSnapshot?.nowPlaying ?? null;
  const isPlaying = activeSnapshot?.isPlaying ?? false;
  const hostStatus = session ? status : 'connecting';

  const showOverlayTemporarily = useCallback(() => {
    window.clearTimeout(overlayTimerRef.current);
    setIsOverlayVisible(true);

    if (currentSong && !isQrOpen) {
      overlayTimerRef.current = window.setTimeout(() => setIsOverlayVisible(false), 2600);
    }
  }, [currentSong, isQrOpen]);

  useEffect(() => {
    showOverlayTemporarily();

    return () => window.clearTimeout(overlayTimerRef.current);
  }, [currentSong?.id, isQrOpen, showOverlayTemporarily]);

  useEffect(() => {
    if (!activeSnapshot) {
      return;
    }

    const previousIds = previousPlaylistIdsRef.current;
    const addedSong = activeSnapshot.playlist.find((item) => !previousIds.has(item.id));
    previousPlaylistIdsRef.current = new Set(activeSnapshot.playlist.map((item) => item.id));

    if (!addedSong) {
      return;
    }

    setLatestAdded(addedSong);
    showOverlayTemporarily();
    const timeout = window.setTimeout(() => setLatestAdded(null), 4500);

    return () => window.clearTimeout(timeout);
  }, [activeSnapshot, showOverlayTemporarily]);

  const handlePlayNext = useCallback(() => {
    showOverlayTemporarily();
    playNext();
  }, [playNext, showOverlayTemporarily]);

  const handlePlayerEnded = useCallback(() => {
    playNext();
  }, [playNext]);

  const togglePlayPause = useCallback(() => {
    if (!currentSong) {
      if (nextSong) {
        handlePlayNext();
      }
      return;
    }

    setPlaying(!isPlaying);
    showOverlayTemporarily();
  }, [currentSong, handlePlayNext, isPlaying, nextSong, setPlaying, showOverlayTemporarily]);

  function handleFullscreen() {
    document.documentElement.requestFullscreen?.();
    showOverlayTemporarily();
  }

  function handlePlayerClick() {
    if (isQrOpen) {
      setIsQrOpen(false);
      return;
    }

    togglePlayPause();
  }

  return (
    <main className={`player-page ${isOverlayVisible || !currentSong ? 'player-page--overlay-visible' : 'player-page--overlay-hidden'}`} onPointerMove={showOverlayTemporarily}>
      <button className="player-click-layer" type="button" onClick={handlePlayerClick} aria-label={isPlaying ? 'Tạm dừng' : 'Phát'}>
        <span className={`play-toggle-indicator ${isOverlayVisible ? 'play-toggle-indicator--visible' : ''}`}>{isPlaying ? 'Tạm dừng' : 'Phát'}</span>
      </button>

      <div className="player-frame">
        <YouTubePlayer videoId={currentSong?.videoId} onEnded={handlePlayerEnded} isPlaying={isPlaying} onPlayingChange={setPlaying} />
        {!currentSong ? (
          <div className="player-empty-state">
            <p>Karaoke Remote</p>
            <h1>Sẵn sàng hát karaoke</h1>
            <span>{nextSong ? 'Bấm phát để bắt đầu bài đầu tiên.' : 'Quét mã QR để thêm bài hát vào hàng chờ.'}</span>
          </div>
        ) : null}
      </div>

      <div className="player-overlay player-top-bar">
        <div className="player-brand">
          <span>Karaoke Remote</span>
          <strong>
            {session?.sessionId ? `Phiên ${session.sessionId}` : 'Đang tạo phiên...'}
            <i className={`host-status-dot host-status-dot--${hostStatus}`} aria-label={socketError ?? error ?? hostStatus} />
          </strong>
        </div>
        {latestAdded ? <div className="song-added-toast">Đã thêm: {latestAdded.title}</div> : null}
        <div className={`player-top-actions ${isQrOpen ? 'player-top-actions--expanded' : ''}`}>
          {session ? <QRCodeCard joinUrl={session.joinUrl} compact onClick={() => setIsQrOpen((value) => !value)} /> : null}
          {isQrOpen && session ? (
            <div className="qr-inline-panel" role="dialog" aria-modal="false" aria-label="Thông tin tham gia">
              <div>
                <span>Quét để chọn bài</span>
                <strong>Phiên {session.sessionId}</strong>
              </div>
              <QRCodeCard joinUrl={session.joinUrl} className="qr-inline-card" />
              <a href={session.joinUrl} target="_blank" rel="noreferrer" onClick={() => setIsQrOpen(false)}>
                {session.joinUrl}
              </a>
            </div>
          ) : null}
        </div>
      </div>

      <div className="player-overlay player-bottom-panel">
        <div className="now-playing-panel">
          <span>{isPlaying ? 'Đang phát' : 'Đang tạm dừng'}</span>
          <h2>{currentSong?.title ?? 'Chưa có bài đang phát'}</h2>
        </div>
        <div className="next-song-panel">
          <span>Tiếp theo</span>
          <strong>{nextSong?.title ?? 'Chưa có bài trong hàng chờ'}</strong>
          <p>{activeSnapshot?.playlist.length ?? 0} bài</p>
        </div>
        <div className="host-controls">
          <button type="button" disabled={!currentSong && !nextSong} onClick={togglePlayPause}>
            {isPlaying ? 'Dừng' : 'Phát'}
          </button>
          <button type="button" disabled={!nextSong} onClick={handlePlayNext}>
            Bài kế
          </button>
          {nextSong ? (
            <button className="button-secondary" type="button" onClick={() => removeSong(nextSong.id)}>
              Bỏ
            </button>
          ) : null}
          {nextSong ? (
            <button className="button-secondary" type="button" onClick={() => setNowPlaying(nextSong.id)}>
              Chọn
            </button>
          ) : null}
          <button className="button-secondary" type="button" onClick={handleFullscreen}>
            ⛶
          </button>
        </div>
      </div>
    </main>
  );
}
