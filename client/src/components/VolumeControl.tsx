import { useEffect, useRef, useState } from 'react';

export const DEFAULT_VOLUME = 100;
export const MIN_VOLUME = 0;
export const MAX_VOLUME = 100;

const volumeChangeIntervalMs = 120;

interface VolumeControlProps {
  value: number;
  onChange: (volume: number) => void;
  className?: string;
  disabled?: boolean;
}

export function VolumeControl({ value, onChange, className = '', disabled = false }: VolumeControlProps) {
  const [draftValue, setDraftValue] = useState(value);
  const latestVolumeRef = useRef(value);
  const lastSentAtRef = useRef(0);
  const sendTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    setDraftValue(value);
    latestVolumeRef.current = value;
  }, [value]);

  useEffect(() => () => window.clearTimeout(sendTimerRef.current), []);

  function publishVolume(nextVolume: number, immediate = false) {
    latestVolumeRef.current = nextVolume;

    if (immediate) {
      window.clearTimeout(sendTimerRef.current);
      sendTimerRef.current = undefined;
      lastSentAtRef.current = window.performance.now();
      onChange(nextVolume);
      return;
    }

    const now = window.performance.now();
    const waitMs = lastSentAtRef.current + volumeChangeIntervalMs - now;

    if (waitMs <= 0) {
      window.clearTimeout(sendTimerRef.current);
      sendTimerRef.current = undefined;
      lastSentAtRef.current = now;
      onChange(nextVolume);
      return;
    }

    window.clearTimeout(sendTimerRef.current);
    sendTimerRef.current = window.setTimeout(() => {
      sendTimerRef.current = undefined;
      lastSentAtRef.current = window.performance.now();
      onChange(latestVolumeRef.current);
    }, waitMs);
  }

  function handleChange(nextVolume: number) {
    setDraftValue(nextVolume);
    publishVolume(nextVolume);
  }

  function handleCommit() {
    publishVolume(draftValue, true);
  }

  return (
    <label className={`volume-control ${className}`.trim()}>
      <span>Âm lượng</span>
      <input
        type="range"
        min={MIN_VOLUME}
        max={MAX_VOLUME}
        value={draftValue}
        disabled={disabled}
        onChange={(event) => handleChange(Number(event.currentTarget.value))}
        onPointerUp={handleCommit}
        onKeyUp={handleCommit}
        onBlur={handleCommit}
      />
      <strong>{draftValue}%</strong>
    </label>
  );
}
