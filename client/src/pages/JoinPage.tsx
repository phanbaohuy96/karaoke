import { useEffect, useMemo, useRef, useState } from 'react';
import { getSession } from '../api/session';
import { searchYouTube } from '../api/youtube';
import { Playlist } from '../components/Playlist';
import { SearchBar } from '../components/SearchBar';
import { SearchResults } from '../components/SearchResults';
import { useSessionSocket } from '../hooks/useSessionSocket';
import type { SessionSnapshot, YouTubeSearchResult } from '../types/session';

interface JoinPageProps {
  sessionId: string;
}

export function JoinPage({ sessionId }: JoinPageProps) {
  const normalizedSessionId = useMemo(() => sessionId.toUpperCase(), [sessionId]);
  const [initialSnapshot, setInitialSnapshot] = useState<SessionSnapshot | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [isCountAnimating, setIsCountAnimating] = useState(false);
  const addTimersRef = useRef<number[]>([]);
  const { snapshot, status, addSong, removeSong, setNowPlaying, playNext, setPlaying } = useSessionSocket({
    sessionId: normalizedSessionId,
    role: 'guest',
    enabled: Boolean(normalizedSessionId),
  });

  useEffect(() => {
    let isMounted = true;

    getSession(normalizedSessionId)
      .then((loadedSnapshot) => {
        if (isMounted) {
          setInitialSnapshot(loadedSnapshot);
        }
      })
      .catch((unknownError) => {
        if (isMounted) {
          setError(unknownError instanceof Error ? unknownError.message : 'Không thể tham gia phiên karaoke.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [normalizedSessionId]);

  useEffect(() => {
    return () => {
      addTimersRef.current.forEach(window.clearTimeout);
      addTimersRef.current = [];
    };
  }, []);

  async function handleSearch() {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return;
    }

    const searchQuery = /\bkaraoke\b/i.test(trimmedQuery) ? trimmedQuery : `${trimmedQuery} karaoke`;

    setIsSearching(true);
    setError(null);
    setSuccessMessage(null);

    try {
      setResults(await searchYouTube(searchQuery));
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : 'Tìm kiếm thất bại.');
    } finally {
      setIsSearching(false);
    }
  }

  async function handleAddSong(song: YouTubeSearchResult) {
    addTimersRef.current.forEach(window.clearTimeout);
    setIsAdding(true);
    setError(null);
    setSuccessMessage(`Đã thêm “${song.title}”.`);
    setIsCountAnimating(true);
    addSong(song);
    addTimersRef.current = [
      window.setTimeout(() => setIsAdding(false), 350),
      window.setTimeout(() => setIsCountAnimating(false), 650),
      window.setTimeout(() => setSuccessMessage(null), 2600),
    ];
  }

  const activeSnapshot = snapshot ?? initialSnapshot;
  const playlistCount = activeSnapshot?.playlist.length ?? 0;
  const addedVideoIds = useMemo(() => {
    const ids = new Set(activeSnapshot?.playlist.map((item) => item.videoId) ?? []);

    if (activeSnapshot?.nowPlaying) {
      ids.add(activeSnapshot.nowPlaying.videoId);
    }

    return ids;
  }, [activeSnapshot]);

  return (
    <main className="guest-page guest-remote guest-remote--focused">
      <button className={`playlist-count-button ${isCountAnimating ? 'playlist-count-button--bump' : ''}`} type="button" onClick={() => setIsPlaylistOpen(true)}>
        <span>{playlistCount}</span>
        <strong>Danh sách</strong>
      </button>

      <section className="guest-search-only">
        <div className="guest-hero-panel">
          <div className="guest-session-line">Phiên {normalizedSessionId}</div>
          <p>Remote karaoke</p>
          <h1>Chọn bài thật nhanh</h1>
          <span>Tìm tên bài hoặc ca sĩ, hệ thống tự thêm từ khóa karaoke.</span>
        </div>
        {activeSnapshot?.nowPlaying ? (
          <button className="guest-now-playing-chip" type="button" onClick={() => setIsPlaylistOpen(true)}>
            <span>{activeSnapshot.isPlaying ? 'Đang phát' : 'Đang tạm dừng'}</span>
            <strong>{activeSnapshot.nowPlaying.title}</strong>
          </button>
        ) : null}
        <SearchBar query={query} isSearching={isSearching} onQueryChange={setQuery} onSearch={handleSearch} />
        {error ? <div className="alert alert-error">{error}</div> : null}
        {successMessage ? <div className="alert alert-success">{successMessage}</div> : null}
      </section>

      <div className="guest-content">
        <SearchResults results={results} addedVideoIds={addedVideoIds} isAdding={isAdding || status !== 'connected'} onAddSong={handleAddSong} />
      </div>

      {isPlaylistOpen ? (
        <div className="playlist-drawer-backdrop" role="presentation" onClick={() => setIsPlaylistOpen(false)}>
          <aside className="playlist-drawer" role="dialog" aria-modal="true" aria-label="Danh sách chờ" onClick={(event) => event.stopPropagation()}>
            <div className="playlist-drawer-header">
              <div>
                <span>Điều khiển danh sách</span>
                <strong>{playlistCount} bài</strong>
              </div>
              <button type="button" onClick={() => setIsPlaylistOpen(false)}>
                Đóng
              </button>
            </div>
            <div className="client-playlist-actions">
              <button type="button" disabled={!activeSnapshot?.nowPlaying || status !== 'connected'} onClick={() => setPlaying(!activeSnapshot?.isPlaying)}>
                {activeSnapshot?.isPlaying ? 'Tạm dừng' : 'Tiếp tục phát'}
              </button>
              <button type="button" disabled={!playlistCount || status !== 'connected'} onClick={playNext}>
                Phát bài kế
              </button>
            </div>
            <Playlist playlist={activeSnapshot?.playlist ?? []} nowPlaying={activeSnapshot?.nowPlaying ?? null} canControl canRemove onRemoveSong={removeSong} onStartSong={setNowPlaying} />
          </aside>
        </div>
      ) : null}
    </main>
  );
}
