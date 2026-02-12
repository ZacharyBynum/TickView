import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import type {
  Tick,
  Candle,
  Timeframe,
  Speed,
  ReplayState,
  Position,
  Trade,
  RoundTrip,
  TradeStats,
  IndicatorConfig,
  IndicatorType,
  IndicatorValue,
  ChartHandle,
  ChartTradeMarker,
  ChartColors,
} from './types';
import { NQ_CONFIG, SPEED_OPTIONS, DEFAULT_CHART_COLORS } from './types';
import { parseTicks } from './lib/csvParser';
import { ReplayEngine } from './lib/replayEngine';
import { TradingEngine } from './lib/tradingEngine';
import { calculateIndicator } from './lib/indicators';
import { saveFile, loadCachedFile } from './lib/tickCache';
import Chart from './components/Chart';
import Toolbar from './components/Toolbar';
import TradePanel from './components/TradePanel';
import IndicatorPickerDialog from './components/IndicatorPickerDialog';
import IndicatorSettingsDialog from './components/IndicatorSettingsDialog';
import IndicatorLegend from './components/IndicatorLegend';
import ChartSettingsDialog from './components/ChartSettingsDialog';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Upload, Settings } from 'lucide-react';

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const EMPTY_POSITION: Position = { side: 'flat', entryPrice: 0, size: 0, unrealizedPnl: 0 };
const EMPTY_STATS: TradeStats = {
  totalTrades: 0, winners: 0, losers: 0, winRate: 0, totalPnl: 0,
  avgWin: 0, avgLoss: 0, profitFactor: 0, maxDrawdown: 0,
  largestWin: 0, largestLoss: 0, avgHoldingTicks: 0,
};
const EMPTY_REPLAY: ReplayState = {
  isPlaying: false, speed: 1, currentTickIndex: 0,
  totalTicks: 0, currentTime: 0, progress: 0,
};

const DEFAULT_INDICATORS: IndicatorConfig[] = [
  { id: 'sma20', type: 'SMA', period: 20, color: '#ff9800', visible: true },
  { id: 'ema9', type: 'EMA', period: 9, color: '#e040fb', visible: true },
];

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  // --- Loading state ---
  const [fileLoaded, setFileLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // --- Core data ---
  const ticksRef = useRef<Tick[]>([]);
  const [candles, setCandles] = useState<Candle[]>([]);

  // --- Replay state ---
  const [timeframe, setTimeframe] = useState<Timeframe>('5m');
  const [replayState, setReplayState] = useState<ReplayState>(EMPTY_REPLAY);

  // --- Trading state ---
  const [position, setPosition] = useState<Position>(EMPTY_POSITION);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [roundTrips, setRoundTrips] = useState<RoundTrip[]>([]);
  const [stats, setStats] = useState<TradeStats>(EMPTY_STATS);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [slPrice, setSlPrice] = useState<number | null>(null);
  const [tpPrice, setTpPrice] = useState<number | null>(null);
  const slRef = useRef<number | null>(null);
  const tpRef = useRef<number | null>(null);

  // SL/TP/Trailing config (points)
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
  const trailingActiveRef = useRef(false); // true once all steps done, fixed trail begins

  const orderSizeState = useRef(1);

  // --- Indicator state ---
  const [indicators, setIndicators] = useState<IndicatorConfig[]>(DEFAULT_INDICATORS);
  const indicatorsRef = useRef<IndicatorConfig[]>(DEFAULT_INDICATORS);
  const [indicatorValues, setIndicatorValues] = useState<Map<string, IndicatorValue[]>>(new Map());

  // --- Bottom panel resize ---
  const [bottomPanelHeight, setBottomPanelHeight] = useState(200);
  const isResizingRef = useRef(false);

  // --- Indicator UI state ---
  const [showIndicatorPicker, setShowIndicatorPicker] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<IndicatorConfig | null>(null);

  // --- Chart colors ---
  const [chartColors, setChartColors] = useState<ChartColors>(() => {
    try {
      const stored = localStorage.getItem('tickview-chart-colors');
      if (stored) return JSON.parse(stored) as ChartColors;
    } catch { /* ignore */ }
    return { ...DEFAULT_CHART_COLORS };
  });
  const [showChartSettings, setShowChartSettings] = useState(false);

  const handleChartColorsChange = useCallback((colors: ChartColors) => {
    setChartColors(colors);
    localStorage.setItem('tickview-chart-colors', JSON.stringify(colors));
  }, []);

  // --- Trade markers ---
  const markersRef = useRef<ChartTradeMarker[]>([]);
  const entryLineRef = useRef<string>('');

  // --- Engine refs ---
  const replayEngineRef = useRef<ReplayEngine | null>(null);
  const tradingEngineRef = useRef<TradingEngine | null>(null);
  const chartRef = useRef<ChartHandle>(null);

  // --- Stable ref for current price (used in callbacks) ---
  const currentPriceRef = useRef(0);
  const replayStateRef = useRef(EMPTY_REPLAY);
  const orderSizeRef = orderSizeState;

  // -------------------------------------------------------------------------
  // Indicator recalculation
  // -------------------------------------------------------------------------

  const recalcIndicators = useCallback(
    (newCandles: Candle[]) => {
      const newValues = new Map<string, IndicatorValue[]>();
      for (const cfg of indicatorsRef.current) {
        if (cfg.visible) {
          newValues.set(cfg.id, calculateIndicator(newCandles, cfg));
        }
      }
      setIndicatorValues(newValues);
    },
    [],
  );

  // -------------------------------------------------------------------------
  // ReplayEngine callbacks
  // -------------------------------------------------------------------------

  const handleTick = useCallback(
    (tick: Tick, index: number) => {
      currentPriceRef.current = tick.price;
      setCurrentPrice(tick.price);

      const engine = tradingEngineRef.current;
      if (engine) {
        engine.updateUnrealizedPnl(tick.price);
        const pos = engine.getPosition();
        setPosition(pos);

        // Trailing stop logic (fixed / 1-step / 2-step / 3-step)
        if (pos.side !== 'flat' && trailEnabledRef.current) {
          const p = tick.price;
          const isLong = pos.side === 'long';
          const entry = entryPriceRef.current;
          const profit = isLong ? p - entry : entry - p;

          // Update best price
          if (isLong && p > bestPriceRef.current) bestPriceRef.current = p;
          else if (!isLong && (bestPriceRef.current === 0 || p < bestPriceRef.current)) bestPriceRef.current = p;

          const steps = trailStepsRef.current;
          const mode = trailModeRef.current;

          // Process step triggers (only for non-fixed modes)
          if (mode !== 'fixed' && !trailingActiveRef.current) {
            const idx = trailStepIndexRef.current;
            if (idx < steps.length && profit >= steps[idx].trigger) {
              // Activate this step: move SL to entry +/- slMove
              const slMove = steps[idx].slMove;
              const newSl = isLong ? entry + slMove : entry - slMove;
              // Only move SL if it's more favorable
              if (slRef.current == null || (isLong ? newSl > slRef.current : newSl < slRef.current)) {
                slRef.current = newSl; setSlPrice(newSl);
              }
              trailStepIndexRef.current = idx + 1;
              // If all steps done, activate fixed trailing from here
              if (trailStepIndexRef.current >= steps.length) {
                trailingActiveRef.current = true;
              }
            }
          }

          // Fixed trailing (always active in 'fixed' mode, or after all steps done)
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
            // Add marker
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
            // Clear SL/TP and entry line
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
    [],
  );

  const handleCandleUpdate = useCallback(
    (newCandles: Candle[]) => {
      // Spread to create new reference so React detects the change
      const copy = [...newCandles];
      setCandles(copy);
      recalcIndicators(copy);
    },
    [recalcIndicators],
  );

  const handleStateChange = useCallback(
    (state: ReplayState) => {
      replayStateRef.current = state;
      setReplayState(state);
    },
    [],
  );

  // -------------------------------------------------------------------------
  // Engine initialization (shared by file load and cache restore)
  // -------------------------------------------------------------------------

  const initFromTicks = useCallback(
    (ticks: Tick[]) => {
      ticksRef.current = ticks;

      const tradingEngine = new TradingEngine(NQ_CONFIG);
      tradingEngineRef.current = tradingEngine;

      const replayEngine = new ReplayEngine(ticks, {
        onTick: handleTick,
        onCandleUpdate: handleCandleUpdate,
        onStateChange: handleStateChange,
      });
      replayEngineRef.current = replayEngine;

      // Seek to 1 day after the earliest tick
      const oneDayMs = 24 * 60 * 60 * 1000;
      const targetTime = ticks[0].timestamp + oneDayMs;
      const totalRange = ticks[ticks.length - 1].timestamp - ticks[0].timestamp;
      const seekPct = totalRange > 0 ? Math.min(1, (targetTime - ticks[0].timestamp) / totalRange) : 1;
      replayEngine.seekToProgress(seekPct);
      const seekIdx = Math.min(Math.floor(seekPct * ticks.length), ticks.length - 1);
      setCurrentPrice(ticks[seekIdx].price);
      currentPriceRef.current = ticks[seekIdx].price;

      setFileLoaded(true);

      requestAnimationFrame(() => {
        chartRef.current?.fitContent();
      });
    },
    [handleTick, handleCandleUpdate, handleStateChange],
  );

  // -------------------------------------------------------------------------
  // Auto-restore from IndexedDB cache on mount
  // -------------------------------------------------------------------------

  const cacheChecked = useRef(false);

  useEffect(() => {
    if (cacheChecked.current) return;
    cacheChecked.current = true;

    (async () => {
      setIsLoading(true);
      setLoadProgress(10);

      let ticks: Tick[] = [];
      const cached = await loadCachedFile();

      if (cached) {
        ticks = await parseTicks(cached.file, (pct) => {
          setLoadProgress(10 + pct * 0.85);
        });
      } else {
        try {
          const res = await fetch('/default-data.txt');
          if (!res.ok || !res.body) { setIsLoading(false); return; }
          const size = Number(res.headers.get('content-length')) || 0;
          ticks = await parseTicks(res.body, (pct) => {
            setLoadProgress(10 + pct * 0.85);
          }, size);
        } catch { setIsLoading(false); return; }
      }

      if (ticks.length > 0) {
        setLoadProgress(96);
        initFromTicks(ticks);
      }

      setLoadProgress(100);
      setIsLoading(false);
    })();
  }, [initFromTicks]);

  // -------------------------------------------------------------------------
  // File loading
  // -------------------------------------------------------------------------

  const loadFile = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setLoadProgress(0);

      await new Promise<void>(r => setTimeout(r, 0));

      setLoadProgress(10);

      const ticks = await parseTicks(file, (pct) => {
        setLoadProgress(10 + pct * 0.85);
      });

      if (ticks.length === 0) {
        setIsLoading(false);
        alert('No valid tick data found in file.');
        return;
      }

      setLoadProgress(96);
      // Yield so progress bar updates before heavy sync work
      await new Promise<void>(r => setTimeout(r, 0));
      initFromTicks(ticks);
      setLoadProgress(100);
      await new Promise<void>(r => setTimeout(r, 0));
      setIsLoading(false);

      // Cache raw file in IndexedDB for next session
      saveFile(file.name, file).catch(() => {});
    },
    [initFromTicks],
  );

  // -------------------------------------------------------------------------
  // Drag & drop handlers
  // -------------------------------------------------------------------------

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) loadFile(file);
    },
    [loadFile],
  );

  const handleFileSelect = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.csv';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) loadFile(file);
    };
    input.click();
  }, [loadFile]);

  // -------------------------------------------------------------------------
  // Replay controls
  // -------------------------------------------------------------------------

  const handlePlayPause = useCallback(() => {
    const engine = replayEngineRef.current;
    if (!engine) return;
    if (replayStateRef.current.isPlaying) {
      engine.pause();
    } else {
      engine.play();
    }
  }, []);

  const handleReset = useCallback(() => {
    const engine = replayEngineRef.current;
    if (!engine) return;
    engine.reset();
    tradingEngineRef.current?.reset();
    setPosition(EMPTY_POSITION);
    setTrades([]);
    setStats(EMPTY_STATS);
    setCandles([]);
    setIndicatorValues(new Map());
    markersRef.current = [];
    if (entryLineRef.current) {
      chartRef.current?.removePriceLine(entryLineRef.current);
      entryLineRef.current = '';
    }
    chartRef.current?.setMarkers([]);
    chartRef.current?.removeAllPriceLines();
    slRef.current = null; tpRef.current = null;
    setSlPrice(null); setTpPrice(null);
  }, []);

  const handleStepForward = useCallback(() => {
    replayEngineRef.current?.step();
  }, []);

  const handleStepForward10 = useCallback(() => {
    const engine = replayEngineRef.current;
    if (!engine) return;
    for (let i = 0; i < 10; i++) engine.step();
  }, []);

  const handleStepBack = useCallback(() => {
    replayEngineRef.current?.stepBack();
  }, []);

  const handleTimeframeChange = useCallback((tf: Timeframe) => {
    setTimeframe(tf);
    replayEngineRef.current?.setTimeframe(tf);
    // Fit chart to show all data after timeframe change
    setTimeout(() => chartRef.current?.fitContent(), 50);
  }, []);

  const handleSpeedChange = useCallback((s: Speed) => {
    replayEngineRef.current?.setSpeed(s);
  }, []);

  const handleSeek = useCallback((pct: number) => {
    replayEngineRef.current?.seekToProgress(pct);
  }, []);

  // -------------------------------------------------------------------------
  // Speed up / down
  // -------------------------------------------------------------------------

  const handleSpeedUp = useCallback(() => {
    const current = replayStateRef.current.speed;
    const idx = SPEED_OPTIONS.indexOf(current);
    if (idx < SPEED_OPTIONS.length - 1) {
      const next = SPEED_OPTIONS[idx + 1];
      replayEngineRef.current?.setSpeed(next);
    }
  }, []);

  const handleSpeedDown = useCallback(() => {
    const current = replayStateRef.current.speed;
    const idx = SPEED_OPTIONS.indexOf(current);
    if (idx > 0) {
      const prev = SPEED_OPTIONS[idx - 1];
      replayEngineRef.current?.setSpeed(prev);
    }
  }, []);

  // -------------------------------------------------------------------------
  // Indicator management
  // -------------------------------------------------------------------------

  const candlesRef = useRef<Candle[]>([]);
  candlesRef.current = candles;

  // Keep indicatorsRef in sync
  useEffect(() => {
    indicatorsRef.current = indicators;
    // Recalculate values when indicator config changes
    if (candlesRef.current.length > 0) {
      recalcIndicators(candlesRef.current);
    }
  }, [indicators, recalcIndicators]);

  const nextIndicatorId = useRef(1);

  const handleAddIndicator = useCallback((type: IndicatorType) => {
    const gid = `${type.toLowerCase()}_${nextIndicatorId.current++}`;
    if (type === 'BB') {
      setIndicators((prev) => [...prev,
        { id: `${gid}_u`, type, period: 20, color: '#2196f3', visible: true, output: 'upper', groupId: gid },
        { id: `${gid}_m`, type, period: 20, color: '#787b86', visible: true, output: 'middle', groupId: gid },
        { id: `${gid}_l`, type, period: 20, color: '#2196f3', visible: true, output: 'lower', groupId: gid },
      ]);
      return;
    }
    if (type === 'MACD') {
      setIndicators((prev) => [...prev,
        { id: `${gid}_m`, type, period: 0, color: '#2196f3', visible: true, output: 'macd', groupId: gid },
        { id: `${gid}_s`, type, period: 0, color: '#ff5722', visible: true, output: 'signal', groupId: gid },
      ]);
      return;
    }
    if (type === 'STOCH') {
      setIndicators((prev) => [...prev,
        { id: `${gid}_k`, type, period: 14, color: '#2196f3', visible: true, output: 'k', groupId: gid },
        { id: `${gid}_d`, type, period: 14, color: '#ff5722', visible: true, output: 'd', groupId: gid },
      ]);
      return;
    }
    const defaults: Record<IndicatorType, { period: number; color: string }> = {
      SMA: { period: 20, color: '#ff9800' }, EMA: { period: 9, color: '#e040fb' },
      WMA: { period: 20, color: '#ff5722' }, DEMA: { period: 20, color: '#00bcd4' },
      TEMA: { period: 20, color: '#8bc34a' }, HMA: { period: 9, color: '#ffeb3b' },
      VWAP: { period: 0, color: '#2196f3' }, BB: { period: 20, color: '#2196f3' },
      ATR: { period: 14, color: '#ff9800' }, RSI: { period: 14, color: '#4caf50' },
      MACD: { period: 0, color: '#2196f3' }, STOCH: { period: 14, color: '#2196f3' },
      CCI: { period: 20, color: '#9c27b0' }, WILLR: { period: 14, color: '#e91e63' },
      MOM: { period: 10, color: '#3f51b5' }, ROC: { period: 12, color: '#795548' },
      ADX: { period: 14, color: '#ff4081' }, TRIX: { period: 15, color: '#00e676' },
      MFI: { period: 14, color: '#009688' }, OBV: { period: 0, color: '#607d8b' },
    };
    const cfg = defaults[type];
    setIndicators((prev) => [...prev, { id: gid, type, period: cfg.period, color: cfg.color, visible: true }]);
  }, []);

  const handleRemoveIndicator = useCallback((id: string) => {
    setIndicators((prev) => {
      const t = prev.find((i) => i.id === id);
      if (t?.groupId) return prev.filter((i) => i.groupId !== t.groupId);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const handleToggleIndicator = useCallback((id: string) => {
    setIndicators((prev) => {
      const t = prev.find((i) => i.id === id);
      if (t?.groupId) {
        const vis = !t.visible;
        return prev.map((i) => (i.groupId === t.groupId ? { ...i, visible: vis } : i));
      }
      return prev.map((i) => (i.id === id ? { ...i, visible: !i.visible } : i));
    });
  }, []);

  const handleUpdateIndicator = useCallback((id: string, updates: Partial<IndicatorConfig>) => {
    setIndicators((prev) => {
      const t = prev.find((i) => i.id === id);
      if (t?.groupId && updates.period != null) {
        return prev.map((i) => {
          if (i.id === id) return { ...i, ...updates };
          if (i.groupId === t.groupId) return { ...i, period: updates.period! };
          return i;
        });
      }
      return prev.map((i) => (i.id === id ? { ...i, ...updates } : i));
    });
  }, []);

  // -------------------------------------------------------------------------
  // Trading actions
  // -------------------------------------------------------------------------

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
  }, []);

  const updateEntryLine = useCallback((pos: Position) => {
    // Remove old entry line
    if (entryLineRef.current) {
      chartRef.current?.removePriceLine(entryLineRef.current);
      entryLineRef.current = '';
    }
    // Add new one if in a position
    if (pos.side !== 'flat') {
      const color = pos.side === 'long' ? '#26a69a' : '#ef5350';
      const id = chartRef.current?.addPriceLine(pos.entryPrice, color, `Entry ${pos.entryPrice.toFixed(2)}`) ?? '';
      entryLineRef.current = id;
    }
  }, []);

  const handleBuy = useCallback(
    (size: number) => {
      const engine = tradingEngineRef.current;
      if (!engine || !currentPriceRef.current) return;
      const price = currentPriceRef.current;
      const time = replayStateRef.current.currentTime;
      const tickIdx = replayStateRef.current.currentTickIndex;

      // Get the current candle time for the marker
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

      // Set SL/TP based on config when opening a new long
      if (pos.side === 'long') {
        const sl = slEnabled ? price - slPoints : null;
        const tp = tpEnabled ? price + tpPoints : null;
        slRef.current = sl; tpRef.current = tp;
        setSlPrice(sl); setTpPrice(tp);
        bestPriceRef.current = price; entryPriceRef.current = price;
        trailStepIndexRef.current = 0; trailingActiveRef.current = (trailMode === 'fixed');
      }
    },
    [addTradeMarker, updateEntryLine, slEnabled, tpEnabled, slPoints, tpPoints, trailMode],
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

      // Set SL/TP based on config when opening a new short
      if (pos.side === 'short') {
        const sl = slEnabled ? price + slPoints : null;
        const tp = tpEnabled ? price - tpPoints : null;
        slRef.current = sl; tpRef.current = tp;
        setSlPrice(sl); setTpPrice(tp);
        bestPriceRef.current = price; entryPriceRef.current = price;
        trailStepIndexRef.current = 0; trailingActiveRef.current = (trailMode === 'fixed');
      }
    },
    [addTradeMarker, updateEntryLine, slEnabled, tpEnabled, slPoints, tpPoints, trailMode],
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

    // Clear SL/TP
    slRef.current = null; tpRef.current = null;
    setSlPrice(null); setTpPrice(null);
  }, [addTradeMarker, updateEntryLine]);

  // -------------------------------------------------------------------------
  // Keyboard shortcuts
  // -------------------------------------------------------------------------

  const keyboardActions = useMemo(
    () => ({
      onPlayPause: handlePlayPause,
      onReset: handleReset,
      onStepForward: handleStepForward,
      onStepForward10: handleStepForward10,
      onStepBack: handleStepBack,
      onTimeframe1: () => handleTimeframeChange('1s'),
      onTimeframe2: () => handleTimeframeChange('5s'),
      onTimeframe3: () => handleTimeframeChange('1m'),
      onTimeframe4: () => handleTimeframeChange('5m'),
      onTimeframe5: () => handleTimeframeChange('15m'),
      onSpeedUp: handleSpeedUp,
      onSpeedDown: handleSpeedDown,
      onBuy: () => handleBuy(orderSizeRef.current),
      onSell: () => handleSell(orderSizeRef.current),
      onFlatten: handleFlatten,
    }),
    [
      handlePlayPause, handleReset, handleStepForward, handleStepForward10,
      handleStepBack, handleTimeframeChange, handleSpeedUp, handleSpeedDown,
      handleBuy, handleSell, handleFlatten,
    ],
  );

  useKeyboardShortcuts(keyboardActions);

  // -------------------------------------------------------------------------
  // Bottom panel resize
  // -------------------------------------------------------------------------

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    const startY = e.clientY;
    const startHeight = bottomPanelHeight;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizingRef.current) return;
      const delta = startY - ev.clientY;
      const maxH = window.innerHeight * 0.5;
      setBottomPanelHeight(Math.max(120, Math.min(maxH, startHeight + delta)));
    };

    const onMouseUp = () => {
      isResizingRef.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [bottomPanelHeight]);

  // -------------------------------------------------------------------------
  // Render: File Drop Zone
  // -------------------------------------------------------------------------

  const loadingMessages = useMemo(() => [
    'Hold on.', 'Working on it.', 'Bear with.', 'One sec.',
    'Almost there. Allegedly.', 'Doing math.', 'Thinking real hard.',
    'Please enjoy this progress bar.', 'Not frozen. Promise.',
    'Wrangling rectangles.', 'Reading. A lot.', 'This part\'s boring. Sorry.',
    'Sorting chaos.', 'Trust the process.', 'Crunching.', 'Getting there.',
    'Rectangles incoming.', 'Hang tight.',
  ], []);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(() => Math.floor(Math.random() * 18));
  const [loadingMsgVisible, setLoadingMsgVisible] = useState(true);
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLoadingMsgVisible(false);
      setTimeout(() => {
        setLoadingMsgIdx(i => (i + 1) % 18);
        setLoadingMsgVisible(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, [isLoading]);

  if (!fileLoaded && !isLoading) {
    return (
      <div className="app">
        <div
          className="file-drop-zone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div
            className={`file-drop-area${isDragging ? ' dragging' : ''}`}
            onClick={handleFileSelect}
          >
            <Upload size={48} className="file-drop-icon" />
            <div className="file-drop-title">Load Tick Data</div>
            <div className="file-drop-subtitle">
              Drag & drop a tick data file here, or click to browse
            </div>
            <div className="file-drop-hint">
              Supports NinjaTrader .txt exports (YYYYMMDD HHmmss format)
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="app">
        <div className="loading-overlay">
          <div className="loading-pct">{loadProgress.toFixed(0)}%</div>
          <div className="loading-progress">
            <div className="loading-progress-fill" style={{ width: `${loadProgress}%` }} />
          </div>
          <div className={`loading-msg${loadingMsgVisible ? ' visible' : ''}`}>
            {loadingMessages[loadingMsgIdx]}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Main App
  // -------------------------------------------------------------------------

  return (
    <div className="app">
      <Toolbar
        instrument={NQ_CONFIG}
        timeframe={timeframe}
        onTimeframeChange={handleTimeframeChange}
        speed={replayState.speed}
        onSpeedChange={handleSpeedChange}
        isPlaying={replayState.isPlaying}
        onPlayPause={handlePlayPause}
        onReset={handleReset}
        onStepForward={handleStepForward}
        onStepBack={handleStepBack}
        progress={replayState.progress}
        onSeek={handleSeek}
        currentTime={replayState.currentTime}
        totalTicks={replayState.totalTicks}
        currentTickIndex={replayState.currentTickIndex}
        onIndicatorsClick={() => setShowIndicatorPicker(true)}
      />

      <div className="main-content">
        <Chart
          ref={chartRef}
          candles={candles}
          onCrosshairMove={undefined}
          instrument={NQ_CONFIG}
          indicators={indicators}
          indicatorValues={indicatorValues}
          chartColors={chartColors}
          slPrice={slPrice}
          tpPrice={tpPrice}
          onSlChange={(p) => { slRef.current = p; setSlPrice(p); }}
          onTpChange={(p) => { tpRef.current = p; setTpPrice(p); }}
        />
        <button
          className="chart-settings-btn"
          onClick={() => setShowChartSettings(true)}
          title="Chart Settings"
        >
          <Settings size={14} />
        </button>
        <IndicatorLegend
          indicators={indicators}
          onToggle={handleToggleIndicator}
          onEdit={(id) => {
            const ind = indicators.find((i) => i.id === id);
            if (ind) setEditingIndicator(ind);
          }}
          onRemove={handleRemoveIndicator}
        />
      </div>

      <div className="resize-handle" onMouseDown={handleResizeMouseDown} />
      <div className="bottom-panel" style={{ height: bottomPanelHeight, minHeight: bottomPanelHeight }}>
        <TradePanel
          position={position}
          trades={trades}
          roundTrips={roundTrips}
          stats={stats}
          instrument={NQ_CONFIG}
          currentPrice={currentPrice}
          onBuy={handleBuy}
          onSell={handleSell}
          onFlatten={handleFlatten}
          orderConfig={{ slEnabled, tpEnabled, trailEnabled, slPoints, tpPoints, trailPoints, trailMode, trailSteps }}
          onOrderConfigChange={(cfg) => {
            if (cfg.slEnabled !== undefined) setSlEnabled(cfg.slEnabled);
            if (cfg.tpEnabled !== undefined) setTpEnabled(cfg.tpEnabled);
            if (cfg.trailEnabled !== undefined) { setTrailEnabled(cfg.trailEnabled); trailEnabledRef.current = cfg.trailEnabled; }
            if (cfg.slPoints !== undefined) setSlPoints(cfg.slPoints);
            if (cfg.tpPoints !== undefined) setTpPoints(cfg.tpPoints);
            if (cfg.trailPoints !== undefined) { setTrailPoints(cfg.trailPoints); trailPointsRef.current = cfg.trailPoints; }
            if (cfg.trailMode !== undefined) { setTrailMode(cfg.trailMode); trailModeRef.current = cfg.trailMode; }
            if (cfg.trailSteps !== undefined) { setTrailSteps(cfg.trailSteps); trailStepsRef.current = cfg.trailSteps; }
          }}
        />
      </div>

      {showIndicatorPicker && (
        <IndicatorPickerDialog
          onAdd={handleAddIndicator}
          onClose={() => setShowIndicatorPicker(false)}
        />
      )}

      {editingIndicator && (
        <IndicatorSettingsDialog
          indicator={editingIndicator}
          onApply={(updates) => handleUpdateIndicator(editingIndicator.id, updates)}
          onClose={() => setEditingIndicator(null)}
        />
      )}

      {showChartSettings && (
        <ChartSettingsDialog
          colors={chartColors}
          onApply={handleChartColorsChange}
          onClose={() => setShowChartSettings(false)}
        />
      )}
    </div>
  );
}
