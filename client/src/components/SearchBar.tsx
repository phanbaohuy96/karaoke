import type { FormEvent } from 'react';

interface SearchBarProps {
  query: string;
  isSearching: boolean;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
}

export function SearchBar({ query, isSearching, onQueryChange, onSearch }: SearchBarProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch();
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <label htmlFor="youtube-search">Bạn muốn hát bài gì?</label>
      <div>
        <input
          id="youtube-search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Nhập tên bài hát hoặc ca sĩ"
          autoComplete="off"
        />
        <button type="submit" disabled={isSearching || !query.trim()}>
          {isSearching ? 'Đang tìm...' : 'Tìm'}
        </button>
      </div>
    </form>
  );
}
