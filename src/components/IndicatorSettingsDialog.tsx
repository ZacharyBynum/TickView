import { useState, useEffect, useCallback } from 'react';
import type { IndicatorConfig } from '../types';

interface IndicatorSettingsDialogProps {
  indicator: IndicatorConfig;
  onApply: (updated: Partial<IndicatorConfig>) => void;
  onClose: () => void;
}

export default function IndicatorSettingsDialog({
  indicator,
  onApply,
  onClose,
}: IndicatorSettingsDialogProps) {
  const [period, setPeriod] = useState(indicator.period);
  const [color, setColor] = useState(indicator.color);

  const hidePeriod = indicator.type === 'VWAP' || indicator.type === 'OBV' || indicator.type === 'MACD';

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = useCallback(() => {
    onApply({ period, color });
    onClose();
  }, [period, color, onApply, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSubmit();
    },
    [handleSubmit],
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog indicator-settings"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="modal-header">
          <span className="modal-title">
            {indicator.type}{indicator.output ? ` ${indicator.output}` : ''} Settings
          </span>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {!hidePeriod && (
            <div className="settings-field">
              <label className="settings-label">Period</label>
              <input
                className="settings-input"
                type="number"
                min={1}
                max={500}
                value={period}
                onChange={(e) => setPeriod(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
          )}
          <div className="settings-field">
            <label className="settings-label">Color</label>
            <div className="settings-color-row">
              <input
                className="settings-color-picker"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
              <input
                className="settings-input settings-color-text"
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-btn modal-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="modal-btn modal-btn-apply" onClick={handleSubmit}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
