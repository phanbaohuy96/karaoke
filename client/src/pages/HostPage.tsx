import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createSession } from '../api/session';
import { QRCodeCard } from '../components/QRCodeCard';
import { DEFAULT_VOLUME, VolumeControl } from '../components/VolumeControl';
import { YouTubePlayer } from '../components/YouTubePlayer';
import { useSessionSocket } from '../hooks/useSessionSocket';
import type { CreateSessionResponse } from '../types/session';

export function HostPage() {
  const sessionRequestRef = useRef<Promise<CreateSessionResponse> | null>(null);
  const previousPlaylistIdsRef = useRef<Set<string>>(new Set());
  const overlayTimerRef = useRef<number | undefined>(undefined);
  const lastOverlayRevealRef = useRef(0);
  const isOverlayVisibleRef = useRef(true);
  const [session, setSession] = useState<CreateSessionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);
  const { snapshot, status, error: socketError, removeSong, setNowPlaying, playNext, setPlaying, setVolume } = useSessionSocket({
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
  const playlist = activeSnapshot?.playlist;
  const playlistCount = playlist?.length ?? 0;
  const queuedSongs = useMemo(() => playlist?.slice(0, 3) ?? [], [playlist]);
  const tickerSongs = useMemo(() => (queuedSongs.length > 1 ? [...queuedSongs, ...queuedSongs] : queuedSongs), [queuedSongs]);
  const nextSong = playlist?.[0] ?? null;
  const currentSong = activeSnapshot?.nowPlaying ?? null;
  const isPlaying = activeSnapshot?.isPlaying ?? false;
  const volume = activeSnapshot?.volume ?? DEFAULT_VOLUME;
  const hostStatus = session ? status : 'connecting';

  const showOverlayTemporarily = useCallback(() => {
    const now = window.performance.now();

    if (isOverlayVisibleRef.current && now - lastOverlayRevealRef.current < 250) {
      return;
    }

    lastOverlayRevealRef.current = now;
    window.clearTimeout(overlayTimerRef.current);
    isOverlayVisibleRef.current = true;
    setIsOverlayVisible(true);

    if (currentSong && !isQrOpen) {
      overlayTimerRef.current = window.setTimeout(() => {
        isOverlayVisibleRef.current = false;
        setIsOverlayVisible(false);
      }, 2600);
    }
  }, [currentSong, isQrOpen]);

  useEffect(() => {
    isOverlayVisibleRef.current = isOverlayVisible;
  }, [isOverlayVisible]);

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

    showOverlayTemporarily();
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
      isOverlayVisibleRef.current = true;
      setIsOverlayVisible(true);
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
        <YouTubePlayer videoId={currentSong?.videoId} onEnded={handlePlayerEnded} isPlaying={isPlaying} volume={volume} onPlayingChange={setPlaying} />
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
        <div className="playlist-banner" aria-label="Danh sách bài tiếp theo">
          <div className="playlist-banner__header">
            <span>Tiếp theo</span>
            <strong>{playlistCount} bài chờ</strong>
          </div>
          <div className="playlist-banner__viewport">
            {tickerSongs.length ? (
              <div className={`playlist-banner__track ${queuedSongs.length > 1 ? 'playlist-banner__track--animated' : ''}`}>
                {tickerSongs.map((song, index) => (
                  <div className="playlist-banner__item" key={`${song.id}-${index}`}>
                    <span>{(index % queuedSongs.length) + 1}</span>
                    <strong>{song.title}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="playlist-banner__empty">Chưa có bài trong hàng chờ</div>
            )}
          </div>
        </div>
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
        <div className="host-controls">
          <VolumeControl className="host-volume-control" value={volume} onChange={setVolume} />
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
