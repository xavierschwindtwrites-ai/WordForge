import React from 'react';

interface ProgressBarProps {
  percent: number; // 0–100
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ percent, className }) => {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className={`progress-track${className ? ` ${className}` : ''}`}>
      <div className="progress-fill" style={{ width: `${clamped}%` }} />
    </div>
  );
};

interface ProgressRingProps {
  percent: number; // 0–100
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  percent,
  size = 200,
  stroke = 14,
  children,
}) => {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          className="progress-ring-bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          className="progress-ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="progress-ring-label">{children}</div>
    </div>
  );
};
