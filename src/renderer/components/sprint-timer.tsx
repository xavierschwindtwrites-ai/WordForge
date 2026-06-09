import React, { useEffect, useRef, useState } from 'react';
import { playChime } from '../lib/chime';

interface SprintTimerProps {
  /** Called once when the countdown reaches zero. */
  onComplete?: () => void;
  compact?: boolean;
}

const PRESETS = [15, 25, 45, 60];

const SprintTimer: React.FC<SprintTimerProps> = ({ onComplete, compact }) => {
  const [minutes, setMinutes] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60); // seconds
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = window.setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          window.clearInterval(intervalRef.current as number);
          setRunning(false);
          playChime();
          onComplete?.();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running, onComplete]);

  const selectPreset = (m: number) => {
    setMinutes(m);
    setRemaining(m * 60);
    setRunning(false);
  };

  const reset = () => {
    setRunning(false);
    setRemaining(minutes * 60);
  };

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const progress = 1 - remaining / (minutes * 60);

  return (
    <div className={`sprint-timer${compact ? ' sprint-timer--compact' : ''}`}>
      {!compact && (
        <div className="sprint-presets">
          {PRESETS.map(m => (
            <button
              key={m}
              className={`sprint-preset${minutes === m ? ' active' : ''}`}
              onClick={() => selectPreset(m)}
            >
              {m}m
            </button>
          ))}
        </div>
      )}

      <div className="sprint-display" style={{ ['--sprint-progress' as string]: progress }}>
        <span className="sprint-time">
          {mm.toString().padStart(2, '0')}:{ss.toString().padStart(2, '0')}
        </span>
      </div>

      <div className="sprint-controls">
        {!running ? (
          <button className="primary-btn" onClick={() => setRunning(true)} disabled={remaining === 0}>
            {remaining === minutes * 60 ? 'Start sprint' : 'Resume'}
          </button>
        ) : (
          <button className="ghost-btn" onClick={() => setRunning(false)}>Pause</button>
        )}
        <button className="ghost-btn" onClick={reset}>Reset</button>
      </div>
    </div>
  );
};

export default SprintTimer;
