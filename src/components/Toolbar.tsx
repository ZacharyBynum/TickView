import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, ChevronDown, LineChart } from 'lucide-react';
import type { Timeframe, Speed, InstrumentConfig } from '../types';
import { TIMEFRAME_LABELS, SPEED_OPTIONS } from '../types';

const COMMON_TIMEFRAMES: Timeframe[] = ['1s', '5s', '15s', '30s', '1m', '5m', '15m', '30m', '1h'];

interface ToolbarProps {
  instrument: InstrumentConfig;
  timeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  speed: Speed;
  onSpeedChange: (s: Speed) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  onStepForward: () => void;
  onStepBack: () => void;
  progress: number;
  onSeek: (pct: number) => void;
  currentTime: number;
  totalTicks: number;
  currentTickIndex: number;
  onIndicatorsClick: () => void;
}

function formatTime(timestamp: number): string {
  if (!timestamp) return '--/-- --:--:--';
  const d = new Date(timestamp);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${mm}/${dd} ${hh}:${min}:${ss}`;
}

export default function Toolbar({
  instrument,
  timeframe,
  onTimeframeChange,
  speed,
  onSpeedChange,
  isPlaying,
  onPlayPause,
  onReset,
  onStepForward,
  onStepBack,
  progress,
  onSeek,
  currentTime,
  totalTicks: _totalTicks,
  currentTickIndex: _currentTickIndex,
  onIndicatorsClick,
}: ToolbarProps) {
  const [speedOpen, setSpeedOpen] = useState(false);
  const [tfOpen, setTfOpen] = useState(false);
  const [customUnit, setCustomUnit] = useState<'s' | 'm' | 'h'>('m');
  const [customValue, setCustomValue] = useState(2);
  const speedRef = useRef<HTMLDivElement>(null);
  const tfRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    if (!speedOpen && !tfOpen) return;
    function handleClick(e: MouseEvent) {
      if (speedOpen && speedRef.current && !speedRef.current.contains(e.target as Node)) {
        setSpeedOpen(false);
      }
      if (tfOpen && tfRef.current && !tfRef.current.contains(e.target as Node)) {
        setTfOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [speedOpen, tfOpen]);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(pct);
    },
    [onSeek],
  );

  return (
    <div className="toolbar">
      {/* Brand */}
      <div className="toolbar-brand">
        <span className="brand-name">TickView</span>
      </div>

      <div className="toolbar-separator" />

      {/* Symbol */}
      <div className="toolbar-symbol">
        <span className="symbol-ticker">{instrument.symbol}</span>
        <span className="symbol-name">{instrument.name}</span>
      </div>

      <div className="toolbar-separator" />

      {/* Timeframe dropdown */}
      <div className="tf-selector" ref={tfRef} onClick={() => setTfOpen((o) => !o)}>
        <span>{TIMEFRAME_LABELS[timeframe] ?? timeframe}</span>
        <ChevronDown size={12} />
        {tfOpen && (
          <div className="tf-dropdown" onClick={(e) => e.stopPropagation()}>
            {COMMON_TIMEFRAMES.map((tf) => (
              <div
                key={tf}
                className={`tf-option${tf === timeframe ? ' active' : ''}`}
                onClick={() => {
                  onTimeframeChange(tf);
                  setTfOpen(false);
                }}
              >
                {TIMEFRAME_LABELS[tf]}
              </div>
            ))}
            <div className="tf-custom-divider" />
            <div className="tf-custom-row">
              <input
                type="number"
                className="tf-custom-input"
                min={1}
                max={999}
                value={customValue}
                onChange={(e) => setCustomValue(Math.max(1, Number(e.target.value) || 1))}
                onClick={(e) => e.stopPropagation()}
              />
              <select
                className="tf-custom-select"
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value as 's' | 'm' | 'h')}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="s">sec</option>
                <option value="m">min</option>
                <option value="h">hr</option>
              </select>
              <button
                className="tf-custom-apply"
                onClick={(e) => {
                  e.stopPropagation();
                  const key = `${customValue}${customUnit}` as Timeframe;
                  onTimeframeChange(key);
                  setTfOpen(false);
                }}
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Indicators button */}
      <button className="toolbar-btn" onClick={onIndicatorsClick} title="Indicators">
        <LineChart size={16} />
        <span>Indicators</span>
      </button>

      <div className="toolbar-separator" />

      {/* Replay controls */}
      <div className="replay-controls">
        <button className="replay-btn" onClick={onReset} title="Reset">
          <RotateCcw size={16} />
        </button>
        <button className="replay-btn" onClick={onStepBack} title="Step back">
          <SkipBack size={16} />
        </button>
        <button className="replay-btn play" onClick={onPlayPause} title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button className="replay-btn" onClick={onStepForward} title="Step forward">
          <SkipForward size={16} />
        </button>
      </div>

      {/* Speed selector */}
      <div
        className="speed-selector"
        ref={speedRef}
        onClick={() => setSpeedOpen((o) => !o)}
      >
        <span>{speed}x</span>
        <ChevronDown size={12} />
        {speedOpen && (
          <div className="speed-dropdown">
            {SPEED_OPTIONS.map((s) => (
              <div
                key={s}
                className={`speed-option${s === speed ? ' active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSpeedChange(s);
                  setSpeedOpen(false);
                }}
              >
                {s}x
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="toolbar-separator" />

      {/* Progress bar */}
      <div className="progress-bar-container">
        <div className="progress-bar" onClick={handleProgressClick}>
          <div
            className="progress-fill"
            style={{ width: `${(progress * 100).toFixed(2)}%` }}
          />
        </div>
      </div>

      {/* Time display */}
      <div className="time-display">
        {formatTime(currentTime)}
      </div>
    </div>
  );
}
