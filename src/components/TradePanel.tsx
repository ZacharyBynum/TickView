import { useState, useMemo, useRef, useCallback } from 'react';
import type { Position, Trade, TradeStats, InstrumentConfig } from '../types';

type EquityXAxis = 'trades' | 'daily';

function EquityCurve({ trades }: { trades: Trade[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [xAxis, setXAxis] = useState<EquityXAxis>('trades');

  const closedTrades = useMemo(() => trades.filter((t) => t.pnl != null), [trades]);

  // Per-trade cumulative points
  const tradePoints = useMemo(() => {
    const pts: number[] = [0];
    let cum = 0;
    for (const t of closedTrades) {
      cum += t.pnl!;
      pts.push(cum);
    }
    return pts;
  }, [closedTrades]);

  // Daily cumulative points
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

  // Layout constants (percentages of viewBox)
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

  // Build smooth cubic bezier path (monotone spline)
  const coords = points.map((v, i) => ({ x: toX(i), y: toY(v) }));
  let pathD: string;
  if (coords.length < 2) {
    pathD = '';
  } else if (coords.length === 2) {
    pathD = `M${coords[0].x},${coords[0].y}L${coords[1].x},${coords[1].y}`;
  } else {
    // Catmull-Rom to cubic bezier (tension ~0.3 for subtle smoothing)
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

  // Y-axis ticks (3-5 values)
  const yTickCount = Math.min(5, Math.max(3, Math.ceil(plotH / 30)));
  const yTicks: number[] = [];
  for (let i = 0; i < yTickCount; i++) {
    yTicks.push(minVal + (range * i) / (yTickCount - 1));
  }

  // X-axis ticks
  const maxIdx = points.length - 1;
  const xTickCount = Math.min(maxIdx + 1, 6);
  const xTicks: number[] = [];
  for (let i = 0; i < xTickCount; i++) {
    xTicks.push(Math.round((maxIdx * i) / (xTickCount - 1)));
  }

  // Zero line
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
        {/* Y-axis grid lines & labels */}
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

        {/* Zero line */}
        {showZeroLine && (
          <line
            x1={padLeft} x2={vbW - padRight}
            y1={zeroY} y2={zeroY}
            stroke="var(--text-tertiary)" strokeWidth="0.7" strokeDasharray="3,2"
          />
        )}

        {/* X-axis labels */}
        {xTicks.map((idx, i) => {
          let label: string;
          if (xAxis === 'trades') {
            label = `#${idx}`;
          } else {
            // idx 0 = origin, idx 1+ maps to dailyLabels
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

        {/* Equity line */}
        <path
          d={pathD}
          fill="none"
          stroke={lineColor}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
        />

        {/* Hover crosshair & dot */}
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

      {/* Tooltip */}
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

      {/* Current total label */}
      <div className="equity-label">
        <span className={cumPnl >= 0 ? 'bull' : 'bear'}>
          {cumPnl >= 0 ? '+' : '-'}${Math.abs(cumPnl).toFixed(2)}
        </span>
      </div>
    </div>
  );
}

export interface TrailStep {
  trigger: number; // profit points to activate this step
  slMove: number;  // move SL to entry +/- this many points (0 = breakeven)
}

export type TrailMode = 'fixed' | '1-step' | '2-step' | '3-step';

export interface OrderConfig {
  slEnabled: boolean;
  tpEnabled: boolean;
  trailEnabled: boolean;
  slPoints: number;
  tpPoints: number;
  trailPoints: number;
  trailMode: TrailMode;
  trailSteps: TrailStep[]; // up to 3 steps
}

interface TradePanelProps {
  position: Position;
  trades: Trade[];
  stats: TradeStats;
  instrument: InstrumentConfig;
  currentPrice: number;
  onBuy: (size: number) => void;
  onSell: (size: number) => void;
  onFlatten: () => void;
  orderConfig: OrderConfig;
  onOrderConfigChange: (cfg: Partial<OrderConfig>) => void;
}

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

export default function TradePanel({
  position,
  trades,
  stats,
  instrument,
  currentPrice,
  onBuy,
  onSell,
  onFlatten,
  orderConfig,
  onOrderConfigChange,
}: TradePanelProps) {
  const [orderSize, setOrderSize] = useState(1);
  const [bottomView, setBottomView] = useState<'log' | 'equity'>('log');

  const spread = instrument.tickSize;
  const bid = currentPrice - spread / 2;
  const ask = currentPrice + spread / 2;

  const unrealizedPnl = formatPnl(position.unrealizedPnl);
  const realizedPnl = formatPnl(stats.totalPnl);

  return (
    <div className="trade-panel">
      {/* Position & P&L */}
      <div className="trade-panel-section" style={{ minWidth: 180 }}>
        <div className="section-title">Position &amp; P&amp;L</div>
        <div className="position-display">
          <span className={`position-badge ${position.side}`}>
            {position.side.toUpperCase()}
          </span>
          <div className="position-info">
            <span className="position-label">Entry</span>
            <span className="position-value">
              {position.side === 'flat' ? '—' : position.entryPrice.toFixed(2)}
            </span>
            <span className="position-label">Size</span>
            <span className="position-value">
              {position.side === 'flat' ? '—' : position.size}
            </span>
            <span className="position-label">Unreal P&L</span>
            <span className={`position-value ${unrealizedPnl.className}`}>
              {unrealizedPnl.text}
            </span>
            <span className="position-label">Real P&L</span>
            <span className={`position-value ${realizedPnl.className}`}>
              {realizedPnl.text}
            </span>
          </div>
        </div>
      </div>

      {/* Order Entry */}
      <div className="trade-panel-section">
        <div className="section-title">Order Entry</div>
        <div className="order-entry">
          <div className="size-buttons">
            {[1, 2, 5, 10, 25].map((s) => (
              <button
                key={s}
                className={`size-btn${s === orderSize ? ' active' : ''}`}
                onClick={() => setOrderSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="size-input-row">
            <label className="size-label">Qty</label>
            <input
              type="number"
              className="size-input"
              min={1}
              max={100}
              value={orderSize}
              onChange={(e) => {
                const v = Math.max(1, Math.min(100, Number(e.target.value) || 1));
                setOrderSize(v);
              }}
            />
          </div>
          <div className="order-buttons">
            <button className="order-btn buy" onClick={() => onBuy(orderSize)}>
              <span className="order-btn-label">BUY</span>
              <span className="order-btn-price">{ask.toFixed(2)}</span>
            </button>
            <button className="order-btn sell" onClick={() => onSell(orderSize)}>
              <span className="order-btn-label">SELL</span>
              <span className="order-btn-price">{bid.toFixed(2)}</span>
            </button>
          </div>
          <button
            className="flatten-btn"
            disabled={position.side === 'flat'}
            onClick={onFlatten}
          >
            FLATTEN
          </button>
        </div>
      </div>

      {/* SL / TP / Trail Config */}
      <div className="trade-panel-section" style={{ minWidth: 220 }}>
        <div className="section-title">Risk Management</div>
        <div className="risk-config">
          {/* SL & TP rows */}
          {([
            { label: 'Stop Loss', enabled: orderConfig.slEnabled, points: orderConfig.slPoints, enabledKey: 'slEnabled' as const, pointsKey: 'slPoints' as const },
            { label: 'Take Profit', enabled: orderConfig.tpEnabled, points: orderConfig.tpPoints, enabledKey: 'tpEnabled' as const, pointsKey: 'tpPoints' as const },
          ]).map(({ label, enabled, points, enabledKey, pointsKey }) => (
            <div key={enabledKey} className="risk-row">
              <label className="risk-toggle">
                <input type="checkbox" checked={enabled} onChange={(e) => onOrderConfigChange({ [enabledKey]: e.target.checked })} />
                <span className="risk-label">{label}</span>
              </label>
              <input type="number" className="risk-input" min={0.25} step={0.25} value={points} disabled={!enabled}
                onChange={(e) => onOrderConfigChange({ [pointsKey]: Math.max(0.25, Number(e.target.value) || 0.25) })} />
              <span className="risk-unit">pts</span>
            </div>
          ))}

          {/* Trail toggle + mode selector */}
          <div className="risk-row">
            <label className="risk-toggle">
              <input type="checkbox" checked={orderConfig.trailEnabled} onChange={(e) => onOrderConfigChange({ trailEnabled: e.target.checked })} />
              <span className="risk-label">Trail Stop</span>
            </label>
            <select className="risk-select" value={orderConfig.trailMode} disabled={!orderConfig.trailEnabled}
              onChange={(e) => {
                const mode = e.target.value as TrailMode;
                // Auto-populate steps for the mode
                const stepCount = mode === 'fixed' ? 0 : mode === '1-step' ? 1 : mode === '2-step' ? 2 : 3;
                const existing = orderConfig.trailSteps;
                const steps = Array.from({ length: stepCount }, (_, i) =>
                  existing[i] ?? { trigger: (i + 1) * 10, slMove: i * 5 }
                );
                onOrderConfigChange({ trailMode: mode, trailSteps: steps });
              }}>
              <option value="fixed">Fixed</option>
              <option value="1-step">1-Step</option>
              <option value="2-step">2-Step</option>
              <option value="3-step">3-Step</option>
            </select>
          </div>

          {/* Trail distance (always shown when trail enabled) */}
          {orderConfig.trailEnabled && (
            <div className="risk-row risk-sub">
              <span className="risk-label">Trail Dist</span>
              <input type="number" className="risk-input" min={0.25} step={0.25} value={orderConfig.trailPoints}
                onChange={(e) => onOrderConfigChange({ trailPoints: Math.max(0.25, Number(e.target.value) || 0.25) })} />
              <span className="risk-unit">pts</span>
            </div>
          )}

          {/* Step triggers & SL move levels */}
          {orderConfig.trailEnabled && orderConfig.trailSteps.map((step, i) => (
            <div key={i} className="risk-step">
              <span className="risk-step-label">Step {i + 1}</span>
              <div className="risk-step-fields">
                <span className="risk-label">@</span>
                <input type="number" className="risk-input risk-input-sm" min={0.25} step={0.25} value={step.trigger}
                  onChange={(e) => {
                    const steps = [...orderConfig.trailSteps];
                    steps[i] = { ...steps[i], trigger: Math.max(0.25, Number(e.target.value) || 0.25) };
                    onOrderConfigChange({ trailSteps: steps });
                  }} />
                <span className="risk-unit">pts</span>
                <span className="risk-label">SL→</span>
                <input type="number" className="risk-input risk-input-sm" step={0.25} value={step.slMove}
                  onChange={(e) => {
                    const steps = [...orderConfig.trailSteps];
                    steps[i] = { ...steps[i], slMove: Number(e.target.value) || 0 };
                    onOrderConfigChange({ trailSteps: steps });
                  }} />
                <span className="risk-unit">pts</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div className="trade-panel-section" style={{ minWidth: 220 }}>
        <div className="section-title">Statistics</div>
        <div className="stats-grid">
          <div className="stat-row">
            <span className="stat-label">Trades</span>
            <span className="stat-value">{stats.totalTrades}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Win Rate</span>
            <span className="stat-value">{(stats.winRate * 100).toFixed(1)}%</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Avg Win</span>
            <span className="stat-value" style={{ color: 'var(--color-bull)' }}>
              {stats.avgWin > 0 ? `+$${stats.avgWin.toFixed(2)}` : '$0.00'}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Avg Loss</span>
            <span className="stat-value" style={{ color: 'var(--color-bear)' }}>
              {stats.avgLoss < 0 ? `-$${Math.abs(stats.avgLoss).toFixed(2)}` : '$0.00'}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">P. Factor</span>
            <span className="stat-value">{stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Max DD</span>
            <span className="stat-value" style={{ color: 'var(--color-bear)' }}>
              {stats.maxDrawdown < 0 ? `-$${Math.abs(stats.maxDrawdown).toFixed(2)}` : '$0.00'}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Best</span>
            <span className="stat-value" style={{ color: 'var(--color-bull)' }}>
              {stats.largestWin > 0 ? `+$${stats.largestWin.toFixed(2)}` : '$0.00'}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Worst</span>
            <span className="stat-value" style={{ color: 'var(--color-bear)' }}>
              {stats.largestLoss < 0 ? `-$${Math.abs(stats.largestLoss).toFixed(2)}` : '$0.00'}
            </span>
          </div>
        </div>
      </div>

      {/* Trade Log / Equity Curve */}
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
            {[...trades].reverse().map((trade) => {
              const pnl = trade.pnl != null ? formatPnl(trade.pnl) : null;
              return (
                <div key={trade.id} className="trade-log-entry">
                  <span className={`trade-log-side ${trade.side}`}>
                    {trade.side.toUpperCase()}
                  </span>
                  <span className="trade-log-price">{trade.price.toFixed(2)}</span>
                  <span className="trade-log-size">x{trade.size}</span>
                  <span className="trade-log-time">{formatTradeTime(trade.timestamp)}</span>
                  {pnl && (
                    <span className={`trade-log-pnl ${pnl.className}`}>{pnl.text}</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EquityCurve trades={trades} />
        )}
      </div>
    </div>
  );
}
