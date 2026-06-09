import React, { useState } from 'react';
import SprintTimer from './sprint-timer';

interface SprintScreenProps {
  onLogSession: (projectId?: number) => void;
}

const SprintScreen: React.FC<SprintScreenProps> = ({ onLogSession }) => {
  const [done, setDone] = useState(false);

  return (
    <div className="screen sprint-screen">
      <header className="screen-header">
        <div>
          <p className="screen-eyebrow">Focused writing</p>
          <h1 className="screen-title">Sprint</h1>
        </div>
      </header>

      <div className="sprint-stage">
        <SprintTimer onComplete={() => setDone(true)} />
        {done && (
          <div className="sprint-complete">
            <p className="sprint-complete-text">Time’s up — how did it go?</p>
            <button className="primary-btn" onClick={() => { setDone(false); onLogSession(); }}>
              Log your words
            </button>
          </div>
        )}
        <p className="sprint-hint">
          Pick a length, hit start, and write until the chime. When you’re done, log the words you wrote.
        </p>
      </div>
    </div>
  );
};

export default SprintScreen;
