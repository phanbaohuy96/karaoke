import type { YouTubeSearchResult } from '../types/session';

interface SearchResultsProps {
  results: YouTubeSearchResult[];
  addedVideoIds?: Set<string>;
  isAdding: boolean;
  onAddSong: (song: YouTubeSearchResult) => void;
}

export function SearchResults({ results, addedVideoIds = new Set(), isAdding, onAddSong }: SearchResultsProps) {
  if (results.length === 0) {
    return null;
  }

  return (
    <section className="card search-results">
      <div className="section-heading">
        <div>
          <h2>Kết quả phù hợp</h2>
          <p>Chạm thêm để đưa bài vào hàng chờ.</p>
        </div>
      </div>
      <div className="result-list">
        {results.map((result) => {
          const isAdded = addedVideoIds.has(result.videoId);

          return (
            <article className="song-row" key={result.videoId}>
              <img src={result.thumbnailUrl} alt="" />
              <div>
                <h3>{result.title}</h3>
                <p>{result.channelTitle}</p>
              </div>
              <button type="button" disabled={isAdding || isAdded} onClick={() => onAddSong(result)}>
                {isAdded ? 'Đã thêm' : 'Thêm'}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
