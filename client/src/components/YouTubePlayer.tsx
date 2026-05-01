import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          videoId?: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YouTubePlayerInstance }) => void;
            onStateChange?: (event: { data: number }) => void;
          };
        },
      ) => YouTubePlayerInstance;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubePlayerInstance {
  loadVideoById: (videoId: string) => void;
  stopVideo: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  setVolume: (volume: number) => void;
  destroy: () => void;
}

interface YouTubePlayerProps {
  videoId?: string;
  onEnded: () => void;
  isPlaying: boolean;
  volume: number;
  onPlayingChange: (isPlaying: boolean) => void;
}

let youtubeApiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) {
    return Promise.resolve();
  }

  youtubeApiPromise ??= new Promise((resolve) => {
    const previousReady = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve();
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    }
  });

  return youtubeApiPromise;
}

export function YouTubePlayer({ videoId, onEnded, isPlaying, volume, onPlayingChange }: YouTubePlayerProps) {
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const currentVideoIdRef = useRef<string | undefined>(undefined);
  const loadingVideoIdRef = useRef<string | undefined>(undefined);
  const containerIdRef = useRef(`youtube-player-${Math.random().toString(36).slice(2)}`);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    loadYouTubeApi().then(() => {
      if (!isMounted || playerRef.current || !window.YT?.Player) {
        return;
      }

      playerRef.current = new window.YT.Player(containerIdRef.current, {
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: (event) => {
            event.target.setVolume(volume);

            if (isMounted) {
              setIsReady(true);
            }
          },
          onStateChange: (event) => {
            if (event.data === window.YT?.PlayerState.ENDED) {
              onPlayingChange(false);
              onEnded();
              return;
            }

            if (event.data === window.YT?.PlayerState.PLAYING) {
              loadingVideoIdRef.current = undefined;
              onPlayingChange(true);
              return;
            }

            if (event.data === window.YT?.PlayerState.PAUSED && loadingVideoIdRef.current !== currentVideoIdRef.current) {
              onPlayingChange(false);
            }
          },
        },
      });
    });

    return () => {
      isMounted = false;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [onEnded, onPlayingChange]);

  useEffect(() => {
    const player = playerRef.current;

    if (!player || !isReady) {
      return;
    }

    player.setVolume(volume);
  }, [isReady, volume]);

  useEffect(() => {
    const player = playerRef.current;

    if (!player || !isReady) {
      return;
    }

    if (!videoId) {
      currentVideoIdRef.current = undefined;
      loadingVideoIdRef.current = undefined;
      player.stopVideo();
      return;
    }

    if (currentVideoIdRef.current !== videoId) {
      currentVideoIdRef.current = videoId;
      loadingVideoIdRef.current = isPlaying ? videoId : undefined;
      player.loadVideoById(videoId);

      if (!isPlaying) {
        player.pauseVideo();
      }

      return;
    }

    if (isPlaying) {
      player.playVideo();
    } else {
      player.pauseVideo();
    }
  }, [isPlaying, isReady, videoId]);

  return <div className="youtube-player" id={containerIdRef.current} />;
}
