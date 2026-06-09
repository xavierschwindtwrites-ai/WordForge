import React from 'react';
import type { DayCount } from '../../types/models';
import { formatNumber, formatDate } from '../lib/format';

interface ContributionGridProps {
  days: DayCount[]; // oldest → newest, ~365 entries
}

function level(words: number): number {
  if (words <= 0) return 0;
  if (words < 250) return 1;
  if (words < 500) return 2;
  if (words < 1000) return 3;
  return 4;
}

const ContributionGrid: React.FC<ContributionGridProps> = ({ days }) => {
  if (days.length === 0) return null;

  // Pad the front so the first column aligns to the correct weekday (Sun=0).
  const firstWeekday = new Date(days[0].date + 'T00:00:00').getDay();
  const cells: (DayCount | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...days,
  ];

  // Group into week columns of 7.
  const weeks: (DayCount | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <div className="contrib">
      <div className="contrib-grid">
        {weeks.map((week, wi) => (
          <div key={wi} className="contrib-week">
            {Array.from({ length: 7 }, (_, di) => {
              const cell = week[di];
              if (!cell) return <span key={di} className="contrib-cell contrib-empty" />;
              return (
                <span
                  key={di}
                  className={`contrib-cell contrib-l${level(cell.words)}`}
                  title={`${formatDate(cell.date)}: ${formatNumber(cell.words)} words`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="contrib-legend">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map(l => <span key={l} className={`contrib-cell contrib-l${l}`} />)}
        <span>More</span>
      </div>
    </div>
  );
};

export default ContributionGrid;
