import React from 'react';
import type { Milestone } from '../../types/models';
import { formatNumber } from '../lib/format';

interface MilestoneModalProps {
  milestones: Milestone[];
  onClose: () => void;
}

const MilestoneModal: React.FC<MilestoneModalProps> = ({ milestones, onClose }) => {
  const top = milestones[milestones.length - 1];
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--celebrate" onClick={e => e.stopPropagation()}>
        <div className="celebrate-spark">✦</div>
        <h2 className="celebrate-title">Milestone reached</h2>
        <p className="celebrate-words">{formatNumber(top.words_at_milestone)} words</p>
        <p className="celebrate-sub">{top.label}</p>
        {milestones.length > 1 && (
          <p className="celebrate-multi">
            +{milestones.length - 1} more milestone{milestones.length - 1 === 1 ? '' : 's'} crossed at once!
          </p>
        )}
        <button className="primary-btn" onClick={onClose}>Keep writing →</button>
      </div>
    </div>
  );
};

export default MilestoneModal;
