import { useState, useMemo, useRef, useCallback } from 'react';
import type { Trade, InstrumentConfig, RoundTrip } from '../types';

type EquityXAxis = 'trades' | 'daily';

function formatPnl(value: number): { text: string; className: string } {
  if (value > 0) return { text: `+$${value.toFixed(2)}`, className: 'bull' };
  if (value < 0) return { text: `-$${Math.abs(value).toFixed(2)}`, className: 'bear' };
  return { text: '$0.00', className: 'neutral' };
}

function formatTradeTime(timestamp: number): string {
  const d = new Date(timestamp);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min < 60) return `${min}m${sec > 0 ? ` ${sec}s` : ''}`;
  const hr = Math.floor(min / 60);
  const rm = min % 60;
  return `${hr}h${rm > 0 ? ` ${rm}m` : ''}`;
}

function EquityCurve({ trades }: { trades: Trade[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [xAxis, setXAxis] = useState<EquityXAxis>('trades');

  const closedTrades = useMemo(() => trades.filter((t) => t.pnl != null), [trades]);

  const tradePoints = useMemo(() => {
    const pts: number[] = [0];
    let cum = 0;
    for (const t of closedTrades) {
      cum += t.pnl!;
      pts.push(cum);
    }
    return pts;
  }, [closedTrades]);

  const { dailyPoints, dailyLabels } = useMemo(() => {
    if (closedTrades.length === 0) return { dailyPoints: [] as number[], dailyLabels: [] as string[] };
    const dayMap = new Map<string, number>();
    for (const t of closedTrades) {
      const d = new Date(t.timestamp);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      dayMap.set(key, (dayMap.get(key) ?? 0) + t.pnl!);
    }
    const labels: string[] = [];
    const pts: number[] = [0];
    let cum = 0;
    for (const [key, val] of dayMap) {
      cum += val;
      pts.push(cum);
      labels.push(key);
    }
    return { dailyPoints: pts, dailyLabels: labels };
  }, [closedTrades]);

  const points = xAxis === 'trades' ? tradePoints : dailyPoints;
  const cumPnl = points.length > 0 ? points[points.length - 1] : 0;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const padLeft = 50;
      const padRight = 12;
      const plotW = rect.width - padLeft - padRight;
      const relX = e.clientX - rect.left - padLeft;
      if (relX < 0 || relX > plotW || points.length < 2) {
        setHoverIndex(null);
        return;
      }
      const idx = Math.round((relX / plotW) * (points.length - 1));
      setHoverIndex(Math.max(0, Math.min(points.length - 1, idx)));
    },
    [points],
  );

  const handleMouseLeave = useCallback(() => setHoverIndex(null), []);

  if (closedTrades.length === 0) {
    return <div className="equity-empty">No closed trades yet</div>;
  }

  const maxVal = Math.max(...points);
  const minVal = Math.min(...points);
  const range = maxVal - minVal || 1;

  const padLeft = 50;
  const padRight = 12;
  const padTop = 8;
  const padBottom = 20;
  const vbW = 400;
  const vbH = 150;
  const plotW = vbW - padLeft - padRight;
  const plotH = vbH - padTop - padBottom;
  const step = points.length > 1 ? plotW / (points.length - 1) : plotW;

  const toX = (i: number) => padLeft + i * step;
  const toY = (v: number) => padTop + plotH - ((v - minVal) / range) * plotH;

  const coords = points.map((v, i) => ({ x: toX(i), y: toY(v) }));
  let pathD: string;
  if (coords.length < 2) {
    pathD = '';
  } else if (coords.length === 2) {
    pathD = `M${coords[0].x},${coords[0].y}L${coords[1].x},${coords[1].y}`;
  } else {
    const t = 0.3;
    pathD = `M${coords[0].x},${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[Math.max(0, i - 1)];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[Math.min(coords.length - 1, i + 2)];
      const cp1x = p1.x + (p2.x - p0.x) * t / 3;
      const cp1y = p1.y + (p2.y - p0.y) * t / 3;
      const cp2x = p2.x - (p3.x - p1.x) * t / 3;
      const cp2y = p2.y - (p3.y - p1.y) * t / 3;
      pathD += `C${cp1x},${cp1y},${cp2x},${cp2y},${p2.x},${p2.y}`;
    }
  }
  const lineColor = cumPnl >= 0 ? 'var(--color-bull)' : 'var(--color-bear)';

  const yTickCount = Math.min(5, Math.max(3, Math.ceil(plotH / 30)));
  const yTicks: number[] = [];
  for (let i = 0; i < yTickCount; i++) {
    yTicks.push(minVal + (range * i) / (yTickCount - 1));
  }

  const maxIdx = points.length - 1;
  const xTickCount = Math.min(maxIdx + 1, 6);
  const xTicks: number[] = [];
  for (let i = 0; i < xTickCount; i++) {
    xTicks.push(Math.round((maxIdx * i) / (xTickCount - 1)));
  }

  const zeroY = toY(0);
  const showZeroLine = minVal < 0 && maxVal > 0;

  return (
    <div
      className="equity-curve"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="equity-header">
        <button
          className={`equity-axis-btn${xAxis === 'trades' ? ' active' : ''}`}
          onClick={() => setXAxis('trades')}
        >
          Trades
        </button>
        <button
          className={`equity-axis-btn${xAxis === 'daily' ? ' active' : ''}`}
          onClick={() => setXAxis('daily')}
        >
          Daily
        </button>
      </div>
      <svg viewBox={`0 0 ${vbW} ${vbH}`} preserveAspectRatio="none" className="equity-svg">
        {yTicks.map((val, i) => {
          const y = toY(val);
          return (
            <g key={i}>
              <line
                x1={padLeft} x2={vbW - padRight}
                y1={y} y2={y}
                stroke="var(--border-primary)" strokeWidth="0.5"
              />
              <text
                x={padLeft - 4} y={y + 1}
                textAnchor="end"
                dominantBaseline="middle"
                fill="var(--text-tertiary)"
                fontSize="7"
                fontFamily="var(--font-mono)"
              >
                {val >= 0 ? '+' : ''}{val.toFixed(0)}
              </text>
            </g>
          );
        })}

        {showZeroLine && (
          <line
            x1={padLeft} x2={vbW - padRight}
            y1={zeroY} y2={zeroY}
            stroke="var(--text-tertiary)" strokeWidth="0.7" strokeDasharray="3,2"
          />
        )}

        {xTicks.map((idx, i) => {
          let label: string;
          if (xAxis === 'trades') {
            label = `#${idx}`;
          } else {
            label = idx === 0 ? '' : (dailyLabels[idx - 1]?.slice(5) ?? '');
          }
          return (
            <text
              key={i}
              x={toX(idx)}
              y={vbH - 4}
              textAnchor="middle"
              fill="var(--text-tertiary)"
              fontSize="7"
              fontFamily="var(--font-mono)"
            >
              {label}
            </text>
          );
        })}

        <path
          d={pathD}
          fill="none"
          stroke={lineColor}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />

        {hoverIndex != null && (
          <>
            <line
              x1={toX(hoverIndex)} x2={toX(hoverIndex)}
              y1={padTop} y2={padTop + plotH}
              stroke="var(--text-tertiary)" strokeWidth="0.5" strokeDasharray="2,2"
            />
            <circle
              cx={toX(hoverIndex)} cy={toY(points[hoverIndex])}
              r="3" fill={lineColor} stroke="var(--bg-primary)" strokeWidth="1"
            />
          </>
        )}
      </svg>

      {hoverIndex != null && (
        <div
          className="equity-tooltip"
          style={{
            left: `${((toX(hoverIndex) / vbW) * 100)}%`,
            top: `${((toY(points[hoverIndex]) / vbH) * 100)}%`,
          }}
        >
          <span className="equity-tooltip-trade">
            {xAxis === 'trades'
              ? `Trade #${hoverIndex}`
              : hoverIndex === 0
                ? 'Start'
                : dailyLabels[hoverIndex - 1] ?? ''}
          </span>
          <span className={`equity-tooltip-pnl ${points[hoverIndex] >= 0 ? 'bull' : 'bear'}`}>
            Cum: {points[hoverIndex] >= 0 ? '+' : ''}{points[hoverIndex].toFixed(2)}
          </span>
          {hoverIndex > 0 && xAxis === 'trades' && (
            <span className={`equity-tooltip-trade-pnl ${closedTrades[hoverIndex - 1].pnl! >= 0 ? 'bull' : 'bear'}`}>
              Trade P&L: {closedTrades[hoverIndex - 1].pnl! >= 0 ? '+' : ''}{closedTrades[hoverIndex - 1].pnl!.toFixed(2)}
            </span>
          )}
        </div>
      )}

      <div className="equity-label">
        <span className={cumPnl >= 0 ? 'bull' : 'bear'}>
          {cumPnl >= 0 ? '+' : '-'}${Math.abs(cumPnl).toFixed(2)}
        </span>
      </div>
    </div>
  );
}

interface TradeLogProps {
  roundTrips: RoundTrip[];
  trades: Trade[];
  instrument: InstrumentConfig;
}

export default function TradeLog({ roundTrips, trades }: TradeLogProps) {
  const [bottomView, setBottomView] = useState<'log' | 'equity'>('log');

  return (
    <div className="trade-panel">
      <div className="trade-panel-section" style={{ flex: 1 }}>
        <div className="section-title-row">
          <button
            className={`section-tab${bottomView === 'log' ? ' active' : ''}`}
            onClick={() => setBottomView('log')}
          >
            Trade Log
          </button>
          <button
            className={`section-tab${bottomView === 'equity' ? ' active' : ''}`}
            onClick={() => setBottomView('equity')}
          >
            Equity Curve
          </button>
        </div>
        {bottomView === 'log' ? (
          <div className="trade-log">
            <table className="trade-log-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Side</th>
                  <th>Entry</th>
                  <th>Exit</th>
                  <th>Qty</th>
                  <th>P&L</th>
                  <th>MFE</th>
                  <th>MAE</th>
                  <th>Held</th>
                  <th>Date</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {[...roundTrips].reverse().map((rt, i) => {
                  const pnl = formatPnl(rt.pnl);
                  const mfe = formatPnl(rt.mfe);
                  const mae = formatPnl(rt.mae);
                  return (
                    <tr key={roundTrips.length - i}>
                      <td className="trade-log-num">{roundTrips.length - i}</td>
                      <td className={`trade-log-side ${rt.side}`}>{rt.side === 'long' ? 'LONG' : 'SHORT'}</td>
                      <td>{rt.entryPrice.toFixed(2)}</td>
                      <td>{rt.exitPrice.toFixed(2)}</td>
                      <td>{rt.size}</td>
                      <td className={pnl.className}>{pnl.text}</td>
                      <td className="bull">{mfe.text}</td>
                      <td className="bear">{mae.text}</td>
                      <td>{formatDuration(rt.holdingMs)}</td>
                      <td>{formatDate(rt.entryTime)}</td>
                      <td>{formatTradeTime(rt.entryTime)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EquityCurve trades={trades} />
        )}
      </div>
    </div>
  );
}
