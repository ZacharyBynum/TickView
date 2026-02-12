import { useState, useCallback, useRef } from 'react';
import type {
  Tick, Position, Trade, RoundTrip, TradeStats,
  ReplayState, ChartHandle, ChartTradeMarker,
} from '../types';
import type { ReplayEngine } from '../lib/replayEngine';
import type { TradingEngine } from '../lib/tradingEngine';

const EMPTY_POSITION: Position = { side: 'flat', entryPrice: 0, size: 0, unrealizedPnl: 0 };
const EMPTY_STATS: TradeStats = {
  totalTrades: 0, winners: 0, losers: 0, winRate: 0, totalPnl: 0,
  avgWin: 0, avgLoss: 0, profitFactor: 0, maxDrawdown: 0,
  largestWin: 0, largestLoss: 0, avgHoldingTicks: 0,
};

export function useTrading(
  replayEngineRef: React.RefObject<ReplayEngine | null>,
  tradingEngineRef: React.RefObject<TradingEngine | null>,
  chartRef: React.RefObject<ChartHandle | null>,
  replayStateRef: React.MutableRefObject<ReplayState>,
) {
  const [position, setPosition] = useState<Position>(EMPTY_POSITION);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [roundTrips, setRoundTrips] = useState<RoundTrip[]>([]);
  const [stats, setStats] = useState<TradeStats>(EMPTY_STATS);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [slPrice, setSlPrice] = useState<number | null>(null);
  const [tpPrice, setTpPrice] = useState<number | null>(null);
  const slRef = useRef<number | null>(null);
  const tpRef = useRef<number | null>(null);

  // SL/TP/Trailing config
  const [slEnabled, setSlEnabled] = useState(true);
  const [tpEnabled, setTpEnabled] = useState(true);
  const [trailEnabled, setTrailEnabled] = useState(false);
  const [slPoints, setSlPoints] = useState(20);
  const [tpPoints, setTpPoints] = useState(20);
  const [trailPoints, setTrailPoints] = useState(10);
  const [trailMode, setTrailMode] = useState<'fixed' | '1-step' | '2-step' | '3-step'>('fixed');
  const [trailSteps, setTrailSteps] = useState<{ trigger: number; slMove: number }[]>([]);
  const trailEnabledRef = useRef(false);
  const trailPointsRef = useRef(10);
  const trailModeRef = useRef<string>('fixed');
  const trailStepsRef = useRef<{ trigger: number; slMove: number }[]>([]);
  const trailStepIndexRef = useRef(0);
  const bestPriceRef = useRef(0);
  const entryPriceRef = useRef(0);
  const trailingActiveRef = useRef(false);

  const currentPriceRef = useRef(0);
  const markersRef = useRef<ChartTradeMarker[]>([]);
  const entryLineRef = useRef<string>('');
  const orderSizeRef = useRef(1);

  const addTradeMarker = useCallback((side: 'buy' | 'sell', price: number, time: number) => {
    const marker: ChartTradeMarker = {
      time,
      position: side === 'buy' ? 'belowBar' : 'aboveBar',
      color: side === 'buy' ? '#26a69a' : '#ef5350',
      shape: side === 'buy' ? 'arrowUp' : 'arrowDown',
      text: `${side === 'buy' ? 'B' : 'S'} ${price.toFixed(2)}`,
      size: 1,
    };
    markersRef.current = [...markersRef.current, marker];
    chartRef.current?.setMarkers(markersRef.current);
  }, [chartRef]);

  const updateEntryLine = useCallback((pos: Position) => {
    if (entryLineRef.current) {
      chartRef.current?.removePriceLine(entryLineRef.current);
      entryLineRef.current = '';
    }
    if (pos.side !== 'flat') {
      const color = pos.side === 'long' ? '#26a69a' : '#ef5350';
      const id = chartRef.current?.addPriceLine(pos.entryPrice, color, `Entry ${pos.entryPrice.toFixed(2)}`) ?? '';
      entryLineRef.current = id;
    }
  }, [chartRef]);

  const handleTick = useCallback(
    (tick: Tick, index: number) => {
      currentPriceRef.current = tick.price;
      setCurrentPrice(tick.price);

      const engine = tradingEngineRef.current;
      if (engine) {
        engine.updateUnrealizedPnl(tick.price);
        const pos = engine.getPosition();
        setPosition(pos);

        // Trailing stop logic
        if (pos.side !== 'flat' && trailEnabledRef.current) {
          const p = tick.price;
          const isLong = pos.side === 'long';
          const entry = entryPriceRef.current;
          const profit = isLong ? p - entry : entry - p;

          if (isLong && p > bestPriceRef.current) bestPriceRef.current = p;
          else if (!isLong && (bestPriceRef.current === 0 || p < bestPriceRef.current)) bestPriceRef.current = p;

          const steps = trailStepsRef.current;
          const mode = trailModeRef.current;

          if (mode !== 'fixed' && !trailingActiveRef.current) {
            const idx = trailStepIndexRef.current;
            if (idx < steps.length && profit >= steps[idx].trigger) {
              const slMove = steps[idx].slMove;
              const newSl = isLong ? entry + slMove : entry - slMove;
              if (slRef.current == null || (isLong ? newSl > slRef.current : newSl < slRef.current)) {
                slRef.current = newSl; setSlPrice(newSl);
              }
              trailStepIndexRef.current = idx + 1;
              if (trailStepIndexRef.current >= steps.length) {
                trailingActiveRef.current = true;
              }
            }
          }

          if (mode === 'fixed' || trailingActiveRef.current) {
            const trailDist = trailPointsRef.current;
            const newSl = isLong ? bestPriceRef.current - trailDist : bestPriceRef.current + trailDist;
            if (slRef.current == null || (isLong ? newSl > slRef.current : newSl < slRef.current)) {
              slRef.current = newSl; setSlPrice(newSl);
            }
          }
        }

        // Check SL/TP hits
        if (pos.side !== 'flat') {
          const sl = slRef.current;
          const tp = tpRef.current;
          const p = tick.price;
          const isLong = pos.side === 'long';
          const slHit = sl != null && (isLong ? p <= sl : p >= sl);
          const tpHit = tp != null && (isLong ? p >= tp : p <= tp);

          if (slHit || tpHit) {
            const exitPrice = slHit ? sl! : tp!;
            const cs = replayEngineRef.current?.getCurrentCandles() ?? [];
            const candleTime = cs.length > 0 ? cs[cs.length - 1].time : Math.floor(tick.timestamp / 1000);
            const prevSide = pos.side;
            engine.flatten(exitPrice, tick.timestamp, index);
            const marker: ChartTradeMarker = {
              time: candleTime,
              position: prevSide === 'long' ? 'aboveBar' : 'belowBar',
              color: prevSide === 'long' ? '#ef5350' : '#26a69a',
              shape: prevSide === 'long' ? 'arrowDown' : 'arrowUp',
              text: `${slHit ? 'SL' : 'TP'} ${exitPrice.toFixed(2)}`,
              size: 1,
            };
            markersRef.current = [...markersRef.current, marker];
            chartRef.current?.setMarkers(markersRef.current);

            const newPos = engine.getPosition();
            setPosition(newPos);
            setTrades([...engine.getTrades()]);
            setRoundTrips([...engine.getRoundTrips()]);
            setStats(engine.getStats());
            slRef.current = null; tpRef.current = null;
            setSlPrice(null); setTpPrice(null);
            if (entryLineRef.current) {
              chartRef.current?.removePriceLine(entryLineRef.current);
              entryLineRef.current = '';
            }
          }
        }
      }

      void index;
    },
    [chartRef, replayEngineRef, tradingEngineRef],
  );

  const handleBuy = useCallback(
    (size: number) => {
      const engine = tradingEngineRef.current;
      if (!engine || !currentPriceRef.current) return;
      const price = currentPriceRef.current;
      const time = replayStateRef.current.currentTime;
      const tickIdx = replayStateRef.current.currentTickIndex;

      const cs = replayEngineRef.current?.getCurrentCandles() ?? [];
      const candleTime = cs.length > 0 ? cs[cs.length - 1].time : Math.floor(time / 1000);

      engine.buy(price, size, time, tickIdx);
      addTradeMarker('buy', price, candleTime);

      const pos = engine.getPosition();
      setPosition(pos);
      setTrades([...engine.getTrades()]);
      setRoundTrips([...engine.getRoundTrips()]);
      setStats(engine.getStats());
      updateEntryLine(pos);

      if (pos.side === 'long') {
        const sl = slEnabled ? price - slPoints : null;
        const tp = tpEnabled ? price + tpPoints : null;
        slRef.current = sl; tpRef.current = tp;
        setSlPrice(sl); setTpPrice(tp);
        bestPriceRef.current = price; entryPriceRef.current = price;
        trailStepIndexRef.current = 0; trailingActiveRef.current = (trailMode === 'fixed');
      }
    },
    [addTradeMarker, updateEntryLine, slEnabled, tpEnabled, slPoints, tpPoints, trailMode, replayEngineRef, tradingEngineRef, replayStateRef],
  );

  const handleSell = useCallback(
    (size: number) => {
      const engine = tradingEngineRef.current;
      if (!engine || !currentPriceRef.current) return;
      const price = currentPriceRef.current;
      const time = replayStateRef.current.currentTime;
      const tickIdx = replayStateRef.current.currentTickIndex;

      const cs = replayEngineRef.current?.getCurrentCandles() ?? [];
      const candleTime = cs.length > 0 ? cs[cs.length - 1].time : Math.floor(time / 1000);

      engine.sell(price, size, time, tickIdx);
      addTradeMarker('sell', price, candleTime);

      const pos = engine.getPosition();
      setPosition(pos);
      setTrades([...engine.getTrades()]);
      setRoundTrips([...engine.getRoundTrips()]);
      setStats(engine.getStats());
      updateEntryLine(pos);

      if (pos.side === 'short') {
        const sl = slEnabled ? price + slPoints : null;
        const tp = tpEnabled ? price - tpPoints : null;
        slRef.current = sl; tpRef.current = tp;
        setSlPrice(sl); setTpPrice(tp);
        bestPriceRef.current = price; entryPriceRef.current = price;
        trailStepIndexRef.current = 0; trailingActiveRef.current = (trailMode === 'fixed');
      }
    },
    [addTradeMarker, updateEntryLine, slEnabled, tpEnabled, slPoints, tpPoints, trailMode, replayEngineRef, tradingEngineRef, replayStateRef],
  );

  const handleFlatten = useCallback(() => {
    const engine = tradingEngineRef.current;
    if (!engine || !currentPriceRef.current) return;
    const price = currentPriceRef.current;
    const time = replayStateRef.current.currentTime;
    const tickIdx = replayStateRef.current.currentTickIndex;

    const prevSide = engine.getPosition().side;
    const cs = replayEngineRef.current?.getCurrentCandles() ?? [];
    const candleTime = cs.length > 0 ? cs[cs.length - 1].time : Math.floor(time / 1000);

    engine.flatten(price, time, tickIdx);
    addTradeMarker(prevSide === 'long' ? 'sell' : 'buy', price, candleTime);

    const pos = engine.getPosition();
    setPosition(pos);
    setTrades([...engine.getTrades()]);
    setRoundTrips([...engine.getRoundTrips()]);
    setStats(engine.getStats());
    updateEntryLine(pos);

    slRef.current = null; tpRef.current = null;
    setSlPrice(null); setTpPrice(null);
  }, [addTradeMarker, updateEntryLine, replayEngineRef, tradingEngineRef, replayStateRef]);

  const handleOrderConfigChange = useCallback((cfg: Record<string, unknown>) => {
    if (cfg.slEnabled !== undefined) setSlEnabled(cfg.slEnabled as boolean);
    if (cfg.tpEnabled !== undefined) setTpEnabled(cfg.tpEnabled as boolean);
    if (cfg.trailEnabled !== undefined) { setTrailEnabled(cfg.trailEnabled as boolean); trailEnabledRef.current = cfg.trailEnabled as boolean; }
    if (cfg.slPoints !== undefined) setSlPoints(cfg.slPoints as number);
    if (cfg.tpPoints !== undefined) setTpPoints(cfg.tpPoints as number);
    if (cfg.trailPoints !== undefined) { setTrailPoints(cfg.trailPoints as number); trailPointsRef.current = cfg.trailPoints as number; }
    if (cfg.trailMode !== undefined) { setTrailMode(cfg.trailMode as 'fixed' | '1-step' | '2-step' | '3-step'); trailModeRef.current = cfg.trailMode as string; }
    if (cfg.trailSteps !== undefined) { setTrailSteps(cfg.trailSteps as { trigger: number; slMove: number }[]); trailStepsRef.current = cfg.trailSteps as { trigger: number; slMove: number }[]; }
  }, []);

  return {
    position, setPosition, trades, setTrades, roundTrips, stats, setStats, currentPrice, setCurrentPrice,
    slPrice, setSlPrice, tpPrice, setTpPrice, slRef, tpRef,
    slEnabled, tpEnabled, trailEnabled, slPoints, tpPoints, trailPoints, trailMode, trailSteps,
    markersRef, entryLineRef, currentPriceRef, orderSizeRef,
    handleTick, handleBuy, handleSell, handleFlatten, handleOrderConfigChange,
  };
}
