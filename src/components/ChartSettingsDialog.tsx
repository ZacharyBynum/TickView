import { useState, useEffect, useCallback } from 'react';
import type { ChartColors } from '../types';
import { DEFAULT_CHART_COLORS } from '../types';

interface ChartSettingsDialogProps {
  colors: ChartColors;
  onApply: (colors: ChartColors) => void;
  onClose: () => void;
}

const COLOR_FIELDS: { key: keyof ChartColors; label: string }[] = [
  { key: 'background', label: 'Background' },
  { key: 'text', label: 'Text' },
  { key: 'grid', label: 'Grid Lines' },
  { key: 'crosshair', label: 'Crosshair' },
  { key: 'bullCandle', label: 'Bull Candle' },
  { key: 'bearCandle', label: 'Bear Candle' },
];

export default function ChartSettingsDialog({
  colors,
  onApply,
  onClose,
}: ChartSettingsDialogProps) {
  const [draft, setDraft] = useState<ChartColors>({ ...colors });

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSubmit = useCallback(() => {
    onApply(draft);
    onClose();
  }, [draft, onApply, onClose]);

  const handleReset = useCallback(() => {
    setDraft({ ...DEFAULT_CHART_COLORS });
  }, []);

  const updateField = (key: keyof ChartColors, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog indicator-settings"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span className="modal-title">Chart Settings</span>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {COLOR_FIELDS.map(({ key, label }) => (
            <div className="settings-field" key={key}>
              <label className="settings-label">{label}</label>
              <div className="settings-color-row">
                <input
                  className="settings-color-picker"
                  type="color"
                  value={draft[key]}
                  onChange={(e) => updateField(key, e.target.value)}
                />
                <input
                  className="settings-input settings-color-text"
                  type="text"
                  value={draft[key]}
                  onChange={(e) => updateField(key, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="modal-btn modal-btn-cancel" onClick={handleReset}>
            Reset to Defaults
          </button>
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
