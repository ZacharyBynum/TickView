import { useState, useRef, useCallback, useMemo } from 'react';
import type { Tick, Candle, ChartHandle, ReplayState } from './types';
import { NQ_CONFIG } from './types';
import { ReplayEngine } from './lib/replayEngine';
import { TradingEngine } from './lib/tradingEngine';
import Chart from './components/Chart';
import Toolbar from './components/Toolbar';
import TradeSidebar from './components/TradeSidebar';
import TradeLog from './components/TradeLog';
import IndicatorPickerDialog from './components/IndicatorPickerDialog';
import IndicatorSettingsDialog from './components/IndicatorSettingsDialog';
import IndicatorLegend from './components/IndicatorLegend';
import ChartSettingsDialog from './components/ChartSettingsDialog';
import FileDropZone from './components/FileDropZone';
import LoadingOverlay from './components/LoadingOverlay';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useFileLoader } from './hooks/useFileLoader';
import { useReplayControls } from './hooks/useReplayControls';
import { useTrading } from './hooks/useTrading';
import { useIndicators } from './hooks/useIndicators';
import { useBottomPanelResize } from './hooks/useBottomPanelResize';
import { useChartColors } from './hooks/useChartColors';


const EMPTY_REPLAY: ReplayState = {
  isPlaying: false, speed: 1, currentTickIndex: 0,
  totalTicks: 0, currentTime: 0, progress: 0,
};

export default function App() {
  // --- Shared refs & state ---
  const [candles, setCandles] = useState<Candle[]>([]);
  const [fileLoaded, setFileLoaded] = useState(false);
  const replayEngineRef = useRef<ReplayEngine | null>(null);
  const tradingEngineRef = useRef<TradingEngine | null>(null);
  const chartRef = useRef<ChartHandle>(null);
  const ticksRef = useRef<Tick[]>([]);
  const replayStateRef = useRef<ReplayState>(EMPTY_REPLAY);

  // --- Feature hooks ---
  const { chartColors, showChartSettings, setShowChartSettings, handleChartColorsChange } = useChartColors();
  const { bottomPanelHeight, handleResizeMouseDown } = useBottomPanelResize();

  const {
    indicators, indicatorValues, setIndicatorValues,
    showIndicatorPicker, setShowIndicatorPicker,
    editingIndicator, setEditingIndicator,
    recalcIndicators, updateCandles,
    handleAddIndicator, handleRemoveIndicator, handleToggleIndicator, handleUpdateIndicator,
  } = useIndicators();

  const {
    position, setPosition, trades, setTrades, roundTrips, stats, setStats,
    currentPrice, setCurrentPrice,
    slPrice, setSlPrice, tpPrice, setTpPrice, slRef, tpRef,
    slEnabled, tpEnabled, trailEnabled, slPoints, tpPoints, trailPoints, trailMode, trailSteps,
    markersRef, entryLineRef, currentPriceRef, orderSizeRef,
    handleTick, handleBuy, handleSell, handleFlatten, handleOrderConfigChange,
  } = useTrading(replayEngineRef, tradingEngineRef, chartRef, replayStateRef);

  const {
    timeframe, replayState,
    handleStateChange, handlePlayPause, handleReset,
    handleStepForward, handleStepForward10, handleStepBack,
    handleTimeframeChange, handleSpeedChange, handleSeek,
    handleSpeedUp, handleSpeedDown,
  } = useReplayControls(replayEngineRef, replayStateRef, {
    tradingEngineRef, chartRef, markersRef, entryLineRef, slRef, tpRef,
    setPosition, setTrades: setTrades as (t: never[]) => void, setStats, setCandles,
    setIndicatorValues, setSlPrice, setTpPrice,
  });

  // --- Candle update callback ---
  const handleCandleUpdate = useCallback(
    (newCandles: Candle[]) => {
      const copy = [...newCandles];
      setCandles(copy);
      updateCandles(copy);
      recalcIndicators(copy);
    },
    [recalcIndicators, updateCandles],
  );

  // --- Engine initialization ---
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
    [handleTick, handleCandleUpdate, handleStateChange, setCurrentPrice, currentPriceRef],
  );

  const {
    isLoading, loadProgress, isDragging,
    handleDragOver, handleDragLeave, handleDrop, handleFileSelect,
  } = useFileLoader(initFromTicks, setFileLoaded);

  // --- Keyboard shortcuts ---
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
      handleBuy, handleSell, handleFlatten, orderSizeRef,
    ],
  );

  useKeyboardShortcuts(keyboardActions);

  // --- Render ---
  if (!fileLoaded && !isLoading) {
    return (
      <FileDropZone
        isDragging={isDragging}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onFileSelect={handleFileSelect}
      />
    );
  }

  if (isLoading) {
    return <LoadingOverlay loadProgress={loadProgress} />;
  }

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

      <div className="app-body">
        <div className="chart-column">
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
            <IndicatorLegend
              indicators={indicators}
              onToggle={handleToggleIndicator}
              onEdit={(id) => {
                const ind = indicators.find((i) => i.id === id);
                if (ind) setEditingIndicator(ind);
              }}
              onRemove={handleRemoveIndicator}
              onChartSettings={() => setShowChartSettings(true)}
            />
          </div>

          <div className="resize-handle" onMouseDown={handleResizeMouseDown} />
          <div className="bottom-panel" style={{ height: bottomPanelHeight, minHeight: bottomPanelHeight }}>
            <TradeLog
              roundTrips={roundTrips}
              trades={trades}
              instrument={NQ_CONFIG}
            />
          </div>
        </div>

        <TradeSidebar
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
          onOrderConfigChange={handleOrderConfigChange}
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
