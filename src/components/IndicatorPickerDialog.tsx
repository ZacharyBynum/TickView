import { useState, useCallback, useEffect, useRef } from 'react';
import type { IndicatorType } from '../types';

interface IndicatorPickerDialogProps {
  onAdd: (type: IndicatorType) => void;
  onClose: () => void;
}

const INDICATOR_LIST: { type: IndicatorType; name: string; description: string }[] = [
  // Moving Averages
  { type: 'SMA',   name: 'SMA',            description: 'Simple Moving Average' },
  { type: 'EMA',   name: 'EMA',            description: 'Exponential Moving Average' },
  { type: 'WMA',   name: 'WMA',            description: 'Weighted Moving Average' },
  { type: 'DEMA',  name: 'DEMA',           description: 'Double Exponential Moving Average' },
  { type: 'TEMA',  name: 'TEMA',           description: 'Triple Exponential Moving Average' },
  { type: 'HMA',   name: 'HMA',            description: 'Hull Moving Average' },
  { type: 'VWAP',  name: 'VWAP',           description: 'Volume Weighted Average Price' },
  // Volatility
  { type: 'BB',    name: 'Bollinger Bands', description: 'Volatility bands around SMA' },
  { type: 'ATR',   name: 'ATR',            description: 'Average True Range' },
  // Momentum / Oscillators
  { type: 'RSI',   name: 'RSI',            description: 'Relative Strength Index' },
  { type: 'MACD',  name: 'MACD',           description: 'Moving Average Convergence Divergence' },
  { type: 'STOCH', name: 'Stochastic',     description: 'Stochastic Oscillator (%K/%D)' },
  { type: 'CCI',   name: 'CCI',            description: 'Commodity Channel Index' },
  { type: 'WILLR', name: 'Williams %R',    description: 'Williams Percent Range' },
  { type: 'MOM',   name: 'Momentum',       description: 'Price Momentum' },
  { type: 'ROC',   name: 'ROC',            description: 'Rate of Change' },
  { type: 'ADX',   name: 'ADX',            description: 'Average Directional Index' },
  { type: 'TRIX',  name: 'TRIX',           description: 'Triple EMA Oscillator' },
  // Volume
  { type: 'MFI',   name: 'MFI',            description: 'Money Flow Index' },
  { type: 'OBV',   name: 'OBV',            description: 'On Balance Volume' },
];

export default function IndicatorPickerDialog({ onAdd, onClose }: IndicatorPickerDialogProps) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const filtered = INDICATOR_LIST.filter(
    (ind) =>
      ind.name.toLowerCase().includes(search.toLowerCase()) ||
      ind.description.toLowerCase().includes(search.toLowerCase()),
  );

  const handleSelect = useCallback(
    (type: IndicatorType) => {
      onAdd(type);
      onClose();
    },
    [onAdd, onClose],
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog indicator-picker" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Add Indicator</span>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <input
            ref={inputRef}
            className="indicator-search"
            type="text"
            placeholder="Search indicators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="indicator-list">
            {filtered.map((ind) => (
              <div
                key={ind.type}
                className="indicator-list-item"
                onClick={() => handleSelect(ind.type)}
              >
                <span className="indicator-item-name">{ind.name}</span>
                <span className="indicator-item-desc">{ind.description}</span>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="indicator-list-empty">No indicators found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
