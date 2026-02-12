import { useState, useCallback } from 'react';
import type { Timeframe, Speed, ReplayState, ChartHandle } from '../types';
import { SPEED_OPTIONS } from '../types';
import type { ReplayEngine } from '../lib/replayEngine';
import type { TradingEngine } from '../lib/tradingEngine';
import type { Position, TradeStats, Candle, IndicatorValue, ChartTradeMarker } from '../types';

const EMPTY_POSITION: Position = { side: 'flat', entryPrice: 0, size: 0, unrealizedPnl: 0 };
const EMPTY_STATS: TradeStats = {
  totalTrades: 0, winners: 0, losers: 0, winRate: 0, totalPnl: 0,
  avgWin: 0, avgLoss: 0, profitFactor: 0, maxDrawdown: 0,
  largestWin: 0, largestLoss: 0, avgHoldingTicks: 0,
};

interface ResetRefs {
  tradingEngineRef: React.RefObject<TradingEngine | null>;
  chartRef: React.RefObject<ChartHandle | null>;
  markersRef: React.MutableRefObject<ChartTradeMarker[]>;
  entryLineRef: React.MutableRefObject<string>;
  slRef: React.MutableRefObject<number | null>;
  tpRef: React.MutableRefObject<number | null>;
  setPosition: (p: Position) => void;
  setTrades: (t: never[]) => void;
  setStats: (s: TradeStats) => void;
  setCandles: (c: Candle[]) => void;
  setIndicatorValues: (v: Map<string, IndicatorValue[]>) => void;
  setSlPrice: (p: number | null) => void;
  setTpPrice: (p: number | null) => void;
}

export function useReplayControls(
  replayEngineRef: React.RefObject<ReplayEngine | null>,
  replayStateRef: React.MutableRefObject<ReplayState>,
  resetRefs: ResetRefs,
) {
  const [timeframe, setTimeframe] = useState<Timeframe>('5m');
  const [replayState, setReplayState] = useState<ReplayState>({
    isPlaying: false, speed: 1, currentTickIndex: 0,
    totalTicks: 0, currentTime: 0, progress: 0,
  });

  const handleStateChange = useCallback((state: ReplayState) => {
    replayStateRef.current = state;
    setReplayState(state);
  }, [replayStateRef]);

  const handlePlayPause = useCallback(() => {
    const engine = replayEngineRef.current;
    if (!engine) return;
    if (replayStateRef.current.isPlaying) {
      engine.pause();
    } else {
      engine.play();
    }
  }, [replayEngineRef, replayStateRef]);

  const handleReset = useCallback(() => {
    const engine = replayEngineRef.current;
    if (!engine) return;
    engine.reset();
    resetRefs.tradingEngineRef.current?.reset();
    resetRefs.setPosition(EMPTY_POSITION);
    resetRefs.setTrades([]);
    resetRefs.setStats(EMPTY_STATS);
    resetRefs.setCandles([]);
    resetRefs.setIndicatorValues(new Map());
    resetRefs.markersRef.current = [];
    if (resetRefs.entryLineRef.current) {
      resetRefs.chartRef.current?.removePriceLine(resetRefs.entryLineRef.current);
      resetRefs.entryLineRef.current = '';
    }
    resetRefs.chartRef.current?.setMarkers([]);
    resetRefs.chartRef.current?.removeAllPriceLines();
    resetRefs.slRef.current = null; resetRefs.tpRef.current = null;
    resetRefs.setSlPrice(null); resetRefs.setTpPrice(null);
  }, [replayEngineRef, resetRefs]);

  const handleStepForward = useCallback(() => {
    replayEngineRef.current?.step();
  }, [replayEngineRef]);

  const handleStepForward10 = useCallback(() => {
    const engine = replayEngineRef.current;
    if (!engine) return;
    for (let i = 0; i < 10; i++) engine.step();
  }, [replayEngineRef]);

  const handleStepBack = useCallback(() => {
    replayEngineRef.current?.stepBack();
  }, [replayEngineRef]);

  const handleTimeframeChange = useCallback((tf: Timeframe) => {
    setTimeframe(tf);
    replayEngineRef.current?.setTimeframe(tf);
    setTimeout(() => resetRefs.chartRef.current?.fitContent(), 50);
  }, [replayEngineRef, resetRefs]);

  const handleSpeedChange = useCallback((s: Speed) => {
    replayEngineRef.current?.setSpeed(s);
  }, [replayEngineRef]);

  const handleSeek = useCallback((pct: number) => {
    replayEngineRef.current?.seekToProgress(pct);
  }, [replayEngineRef]);

  const handleSpeedUp = useCallback(() => {
    const current = replayStateRef.current.speed;
    const idx = SPEED_OPTIONS.indexOf(current);
    if (idx < SPEED_OPTIONS.length - 1) {
      replayEngineRef.current?.setSpeed(SPEED_OPTIONS[idx + 1]);
    }
  }, [replayEngineRef, replayStateRef]);

  const handleSpeedDown = useCallback(() => {
    const current = replayStateRef.current.speed;
    const idx = SPEED_OPTIONS.indexOf(current);
    if (idx > 0) {
      replayEngineRef.current?.setSpeed(SPEED_OPTIONS[idx - 1]);
    }
  }, [replayEngineRef, replayStateRef]);

  return {
    timeframe, replayState,
    handleStateChange, handlePlayPause, handleReset,
    handleStepForward, handleStepForward10, handleStepBack,
    handleTimeframeChange, handleSpeedChange, handleSeek,
    handleSpeedUp, handleSpeedDown,
  };
}
