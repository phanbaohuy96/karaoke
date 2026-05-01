import type { PlaylistItem } from '../types/session';

interface PlaylistProps {
  playlist: PlaylistItem[];
  nowPlaying: PlaylistItem | null;
  canControl?: boolean;
  canRemove?: boolean;
  onRemoveSong?: (itemId: string) => void;
  onStartSong?: (itemId: string) => void;
}

export function Playlist({ playlist, nowPlaying, canControl = false, canRemove = false, onRemoveSong, onStartSong }: PlaylistProps) {
  return (
    <section className="card playlist-card">
      <div className="section-heading">
        <div>
          <h2>Danh sách chờ</h2>
          <p>{playlist.length} bài đang chờ</p>
        </div>
      </div>

      {nowPlaying ? (
        <article className="now-playing">
          <span>Đang phát</span>
          <strong>{nowPlaying.title}</strong>
          <p>{nowPlaying.channelTitle}</p>
        </article>
      ) : null}

      {playlist.length === 0 ? (
        <div className="empty-state">
          <strong>Chưa có bài hát</strong>
          <p>Tìm bài karaoke trên YouTube và thêm vào hàng chờ của phiên này.</p>
        </div>
      ) : (
        <div className="playlist-list">
          {playlist.map((item, index) => (
            <article className="song-row playlist-row" key={item.id}>
              <span className="queue-number">{index + 1}</span>
              <div className="playlist-media">
                <img src={item.thumbnailUrl} alt="" />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.channelTitle} · Thêm bởi {item.requestedBy === 'guest' ? 'Khách' : 'Chủ phòng'}</p>
                </div>
              </div>
              {canControl ? (
                <div className="row-actions">
                  <button type="button" onClick={() => onStartSong?.(item.id)}>
                    Chọn phát
                  </button>
                  {canRemove ? (
                    <button type="button" className="button-secondary" onClick={() => onRemoveSong?.(item.id)}>
                      Xóa
                    </button>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
