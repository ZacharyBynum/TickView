import { useState } from 'react';
import { Eye, EyeOff, Settings, X } from 'lucide-react';
import type { IndicatorConfig } from '../types';

interface IndicatorLegendProps {
  indicators: IndicatorConfig[];
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function IndicatorLegend({
  indicators,
  onToggle,
  onEdit,
  onRemove,
}: IndicatorLegendProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (indicators.length === 0) return null;

  return (
    <div className="indicator-legend">
      {indicators.map((ind) => {
        const out = ind.output ? ` ${ind.output}` : '';
        const label = ind.period === 0
          ? `${ind.type}${out}`
          : `${ind.type}${out} (${ind.period})`;
        const isHovered = hoveredId === ind.id;

        return (
          <div
            key={ind.id}
            className={`indicator-legend-row${ind.visible ? '' : ' hidden-indicator'}`}
            onMouseEnter={() => setHoveredId(ind.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <span className="indicator-legend-dot" style={{ background: ind.color }} />
            <span className="indicator-legend-name">{label}</span>
            {isHovered && (
              <div className="indicator-legend-controls">
                <button
                  className="indicator-legend-btn"
                  onClick={() => onToggle(ind.id)}
                  title={ind.visible ? 'Hide' : 'Show'}
                >
                  {ind.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
                <button
                  className="indicator-legend-btn"
                  onClick={() => onEdit(ind.id)}
                  title="Settings"
                >
                  <Settings size={12} />
                </button>
                <button
                  className="indicator-legend-btn"
                  onClick={() => onRemove(ind.id)}
                  title="Remove"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
