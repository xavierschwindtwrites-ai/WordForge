import React, { useEffect, useRef, useState } from 'react';
import { formatNumber } from '../lib/format';

interface CounterProps {
  value: number;
  /** Animation duration in ms. */
  duration?: number;
  className?: string;
  suffix?: string;
}

// An animated number that eases from its previous value up (or down) to the
// new target whenever `value` changes. Gives the satisfying "tick up" feel.
const Counter: React.FC<CounterProps> = ({ value, duration = 800, className, suffix }) => {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) {
      setDisplay(to);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = to;
    };
  }, [value, duration]);

  return (
    <span className={className}>
      {formatNumber(display)}{suffix}
    </span>
  );
};

export default Counter;
