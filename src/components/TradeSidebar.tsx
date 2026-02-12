import { useState, useCallback } from 'react';
import type { Position, Trade, TradeStats, InstrumentConfig, RoundTrip } from '../types';
import type { OrderConfig, TrailMode } from './TradePanel';

type RiskUnit = 'points' | 'ticks' | 'dollars';

interface TradeSidebarProps {
  position: Position;
  trades: Trade[];
  roundTrips: RoundTrip[];
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

export default function TradeSidebar({
  position,
  trades: _trades,
  roundTrips,
  stats,
  instrument,
  currentPrice,
  onBuy,
  onSell,
  onFlatten,
  orderConfig,
  onOrderConfigChange,
}: TradeSidebarProps) {
  const [orderSize, setOrderSize] = useState(1);
  const [riskUnit, setRiskUnit] = useState<RiskUnit>('points');
  const [statsExpanded, setStatsExpanded] = useState(false);

  const pointsToDisplay = useCallback((pts: number): number => {
    if (riskUnit === 'points') return pts;
    if (riskUnit === 'ticks') return pts / instrument.tickSize;
    return pts * instrument.pointValue;
  }, [riskUnit, instrument.tickSize, instrument.pointValue]);

  const displayToPoints = useCallback((val: number): number => {
    if (riskUnit === 'points') return val;
    if (riskUnit === 'ticks') return val * instrument.tickSize;
    return val / instrument.pointValue;
  }, [riskUnit, instrument.tickSize, instrument.pointValue]);

  const unitLabel = riskUnit === 'points' ? 'pts' : riskUnit === 'ticks' ? 'tks' : '$';
  const unitStep = riskUnit === 'points' ? 0.25 : riskUnit === 'ticks' ? 1 : instrument.tickValue;
  const unitMin = riskUnit === 'points' ? 0.25 : riskUnit === 'ticks' ? 1 : instrument.tickValue;

  const spread = instrument.tickSize;
  const bid = currentPrice - spread / 2;
  const ask = currentPrice + spread / 2;

  const unrealizedPnl = formatPnl(position.unrealizedPnl);
  const realizedPnl = formatPnl(stats.totalPnl);

  return (
    <div className="trade-sidebar">
      {/* Order Entry */}
      <div className="trade-sidebar-section">
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

      {/* Risk Management */}
      <div className="trade-sidebar-section">
        <div className="section-title-row" style={{ marginBottom: 4 }}>
          <span className="section-title" style={{ marginBottom: 0 }}>Risk Management</span>
          <div className="risk-unit-toggle">
            {(['points', 'ticks', 'dollars'] as RiskUnit[]).map((u) => (
              <button key={u} className={`risk-unit-btn${riskUnit === u ? ' active' : ''}`} onClick={() => setRiskUnit(u)}>
                {u === 'points' ? 'pts' : u === 'ticks' ? 'tks' : '$'}
              </button>
            ))}
          </div>
        </div>
        <div className="risk-config">
          {([
            { label: 'Stop Loss', enabled: orderConfig.slEnabled, points: orderConfig.slPoints, enabledKey: 'slEnabled' as const, pointsKey: 'slPoints' as const },
            { label: 'Take Profit', enabled: orderConfig.tpEnabled, points: orderConfig.tpPoints, enabledKey: 'tpEnabled' as const, pointsKey: 'tpPoints' as const },
          ]).map(({ label, enabled, points, enabledKey, pointsKey }) => (
            <div key={enabledKey} className="risk-row">
              <label className="risk-toggle">
                <input type="checkbox" checked={enabled} onChange={(e) => onOrderConfigChange({ [enabledKey]: e.target.checked })} />
                <span className="risk-label">{label}</span>
              </label>
              <input type="number" className="risk-input" min={unitMin} step={unitStep}
                value={parseFloat(pointsToDisplay(points).toFixed(4))} disabled={!enabled}
                onChange={(e) => {
                  const raw = Number(e.target.value) || unitMin;
                  onOrderConfigChange({ [pointsKey]: Math.max(0.25, displayToPoints(Math.max(unitMin, raw))) });
                }} />
              <span className="risk-unit">{unitLabel}</span>
            </div>
          ))}

          <div className="risk-row">
            <label className="risk-toggle">
              <input type="checkbox" checked={orderConfig.trailEnabled} onChange={(e) => onOrderConfigChange({ trailEnabled: e.target.checked })} />
              <span className="risk-label">Trail Stop</span>
            </label>
            <select className="risk-select" value={orderConfig.trailMode} disabled={!orderConfig.trailEnabled}
              onChange={(e) => {
                const mode = e.target.value as TrailMode;
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

          {orderConfig.trailEnabled && (
            <div className="risk-row risk-sub">
              <span className="risk-label">Trail Dist</span>
              <input type="number" className="risk-input" min={unitMin} step={unitStep}
                value={parseFloat(pointsToDisplay(orderConfig.trailPoints).toFixed(4))}
                onChange={(e) => {
                  const raw = Number(e.target.value) || unitMin;
                  onOrderConfigChange({ trailPoints: Math.max(0.25, displayToPoints(Math.max(unitMin, raw))) });
                }} />
              <span className="risk-unit">{unitLabel}</span>
            </div>
          )}

          {orderConfig.trailEnabled && orderConfig.trailSteps.map((step, i) => (
            <div key={i} className="risk-step">
              <span className="risk-step-label">Step {i + 1}</span>
              <div className="risk-step-fields">
                <span className="risk-label">@</span>
                <input type="number" className="risk-input risk-input-sm" min={unitMin} step={unitStep}
                  value={parseFloat(pointsToDisplay(step.trigger).toFixed(4))}
                  onChange={(e) => {
                    const steps = [...orderConfig.trailSteps];
                    const raw = Number(e.target.value) || unitMin;
                    steps[i] = { ...steps[i], trigger: Math.max(0.25, displayToPoints(Math.max(unitMin, raw))) };
                    onOrderConfigChange({ trailSteps: steps });
                  }} />
                <span className="risk-unit">{unitLabel}</span>
                <span className="risk-label">SL→</span>
                <input type="number" className="risk-input risk-input-sm" step={unitStep}
                  value={parseFloat(pointsToDisplay(step.slMove).toFixed(4))}
                  onChange={(e) => {
                    const steps = [...orderConfig.trailSteps];
                    steps[i] = { ...steps[i], slMove: displayToPoints(Number(e.target.value) || 0) };
                    onOrderConfigChange({ trailSteps: steps });
                  }} />
                <span className="risk-unit">{unitLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Position & P&L */}
      <div className="trade-sidebar-section">
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

      {/* Statistics */}
      <div className="trade-sidebar-section">
        <div className="section-title-row" style={{ marginBottom: 4 }}>
          <span className="section-title" style={{ marginBottom: 0 }}>Statistics</span>
          <button className="stats-expand-btn" onClick={() => setStatsExpanded(!statsExpanded)} title={statsExpanded ? 'Collapse' : 'Expand'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: statsExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
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
        <div className={`stats-expanded${statsExpanded ? ' open' : ''}`}>
          <div className="stats-grid">
            <div className="stat-row">
              <span className="stat-label">W / L</span>
              <span className="stat-value">{stats.winners} / {stats.losers}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Avg Hold</span>
              <span className="stat-value">
                {roundTrips.length > 0
                  ? formatDuration(roundTrips.reduce((s, r) => s + r.holdingMs, 0) / roundTrips.length)
                  : '—'}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Avg MFE</span>
              <span className="stat-value" style={{ color: 'var(--color-bull)' }}>
                {roundTrips.length > 0
                  ? `+$${(roundTrips.reduce((s, r) => s + r.mfe, 0) / roundTrips.length).toFixed(2)}`
                  : '$0.00'}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Avg MAE</span>
              <span className="stat-value" style={{ color: 'var(--color-bear)' }}>
                {roundTrips.length > 0
                  ? `-$${Math.abs(roundTrips.reduce((s, r) => s + r.mae, 0) / roundTrips.length).toFixed(2)}`
                  : '$0.00'}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Consec W</span>
              <span className="stat-value">
                {(() => {
                  let max = 0, cur = 0;
                  for (const r of roundTrips) { if (r.pnl > 0) { cur++; if (cur > max) max = cur; } else cur = 0; }
                  return max;
                })()}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Consec L</span>
              <span className="stat-value">
                {(() => {
                  let max = 0, cur = 0;
                  for (const r of roundTrips) { if (r.pnl <= 0) { cur++; if (cur > max) max = cur; } else cur = 0; }
                  return max;
                })()}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Expectancy</span>
              <span className="stat-value">
                {stats.totalTrades > 0
                  ? `$${(stats.avgWin * stats.winRate + stats.avgLoss * (1 - stats.winRate)).toFixed(2)}`
                  : '$0.00'}
              </span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Sharpe</span>
              <span className="stat-value">
                {(() => {
                  if (roundTrips.length < 2) return '—';
                  const pnls = roundTrips.map(r => r.pnl);
                  const mean = pnls.reduce((a, b) => a + b, 0) / pnls.length;
                  const variance = pnls.reduce((s, p) => s + (p - mean) ** 2, 0) / (pnls.length - 1);
                  const std = Math.sqrt(variance);
                  return std > 0 ? (mean / std).toFixed(2) : '—';
                })()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
