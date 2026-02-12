import type { Tick, Candle, ReplayState, ReplayCallbacks, Timeframe, Speed } from '../types';
import { timeframeToSeconds } from '../types';

export class ReplayEngine {
  private ticks: Tick[];
  private callbacks: ReplayCallbacks;

  private currentIndex = 0;
  private speed: Speed = 1;
  private timeframe: Timeframe = '5m';
  private playing = false;
  private rafId: number | null = null;

  // Ticks-per-frame playback (speed = ticks per rAF frame)

  // Candle state
  private candles: Candle[] = [];
  private candleMap: Map<number, number> = new Map(); // candle time -> index in candles[]

  // Checkpoints: tick indices where new candles start, for stepBack
  private candleBoundaryIndices: number[] = [];

  constructor(ticks: Tick[], callbacks: ReplayCallbacks) {
    this.ticks = ticks;
    this.callbacks = callbacks;
    this.emitState();
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  play(): void {
    if (this.playing || this.currentIndex >= this.ticks.length) return;
    this.playing = true;
    this.emitState();
    this.scheduleFrame();
  }

  pause(): void {
    if (!this.playing) return;
    this.playing = false;
    this.cancelFrame();
    this.emitState();
  }

  reset(): void {
    this.playing = false;
    this.cancelFrame();
    this.currentIndex = 0;
    this.candles = [];
    this.candleMap.clear();
    this.candleBoundaryIndices = [];
    this.emitState();
    this.callbacks.onCandleUpdate(this.candles);
  }

  setSpeed(speed: Speed): void {
    this.speed = speed;
    this.emitState();
  }

  setTimeframe(tf: Timeframe): void {
    if (tf === this.timeframe) return;
    this.timeframe = tf;
    this.rebuildCandles();
    this.callbacks.onCandleUpdate(this.candles);
    this.emitState();
  }

  step(): void {
    if (this.currentIndex >= this.ticks.length) return;
    this.processTick(this.currentIndex);
    this.currentIndex++;
    this.callbacks.onCandleUpdate(this.candles);
    this.emitState();
  }

  stepBack(): void {
    if (this.candleBoundaryIndices.length === 0) return;

    // Find the boundary to step back to.
    // If current index is at a boundary, go to the one before it.
    // Otherwise go to the most recent boundary.
    let targetBoundary: number;

    const lastBoundary = this.candleBoundaryIndices[this.candleBoundaryIndices.length - 1];

    if (this.currentIndex <= lastBoundary) {
      // We're at or before the last boundary — go to the one before
      if (this.candleBoundaryIndices.length < 2) {
        // Only one boundary, go to start
        targetBoundary = 0;
      } else {
        targetBoundary = this.candleBoundaryIndices[this.candleBoundaryIndices.length - 2];
      }
    } else {
      // We're past the last boundary — go back to it
      targetBoundary = lastBoundary;
    }

    // Rebuild from scratch up to the target boundary
    this.currentIndex = targetBoundary;
    this.rebuildCandles();
    this.callbacks.onCandleUpdate(this.candles);
    this.emitState();
  }

  seekToProgress(pct: number): void {
    const wasPlaying = this.playing;
    if (wasPlaying) {
      this.playing = false;
      this.cancelFrame();
    }

    const targetIndex = Math.min(
      Math.max(Math.floor(pct * this.ticks.length), 0),
      this.ticks.length,
    );

    this.currentIndex = targetIndex;
    this.rebuildCandles();
    this.callbacks.onCandleUpdate(this.candles);
    this.emitState();

    if (wasPlaying) {
      this.playing = true;
      this.emitState();
      this.scheduleFrame();
    }
  }

  getCurrentCandles(): Candle[] {
    return this.candles;
  }

  destroy(): void {
    this.playing = false;
    this.cancelFrame();
  }

  // ---------------------------------------------------------------------------
  // Internal — frame loop
  // ---------------------------------------------------------------------------

  private scheduleFrame(): void {
    this.rafId = requestAnimationFrame(this.onFrame);
  }

  private cancelFrame(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private onFrame = (): void => {
    if (!this.playing) return;

    // Process `speed` ticks per animation frame
    const count = Math.min(this.speed, this.ticks.length - this.currentIndex);
    for (let i = 0; i < count; i++) {
      this.processTick(this.currentIndex);
      this.callbacks.onTick(this.ticks[this.currentIndex], this.currentIndex);
      this.currentIndex++;
    }

    if (count > 0) this.callbacks.onCandleUpdate(this.candles);
    this.emitState();

    if (this.currentIndex >= this.ticks.length) {
      this.playing = false;
      this.emitState();
      return;
    }

    this.scheduleFrame();
  };

  // ---------------------------------------------------------------------------
  // Internal — tick processing & candle aggregation
  // ---------------------------------------------------------------------------

  /**
   * Process a single tick at the given index, aggregating it into candles.
   * Returns true if a NEW candle was created (boundary event).
   */
  private processTick(index: number): boolean {
    const tick = this.ticks[index];
    const tfSeconds = timeframeToSeconds(this.timeframe);
    const tfMs = tfSeconds * 1000;

    // Candle time = floor(tickTimestamp / tfMs) * tfSeconds
    // This gives us a UTC timestamp in seconds aligned to the timeframe
    const candleTime = Math.floor(tick.timestamp / tfMs) * tfSeconds;

    const existingIdx = this.candleMap.get(candleTime);

    if (existingIdx !== undefined) {
      // Update existing candle
      const candle = this.candles[existingIdx];
      if (tick.price > candle.high) candle.high = tick.price;
      if (tick.price < candle.low) candle.low = tick.price;
      candle.close = tick.price;
      candle.volume += tick.volume;
      candle.tickCount++;
      return false;
    } else {
      // New candle
      const candle: Candle = {
        time: candleTime,
        open: tick.price,
        high: tick.price,
        low: tick.price,
        close: tick.price,
        volume: tick.volume,
        tickCount: 1,
      };
      const newIdx = this.candles.length;
      this.candles.push(candle);
      this.candleMap.set(candleTime, newIdx);
      this.candleBoundaryIndices.push(index);
      return true;
    }
  }

  /**
   * Rebuild all candles from scratch up to this.currentIndex.
   * Used after timeframe change or seek.
   */
  private rebuildCandles(): void {
    this.candles = [];
    this.candleMap.clear();
    this.candleBoundaryIndices = [];

    const tfSeconds = timeframeToSeconds(this.timeframe);
    const tfMs = tfSeconds * 1000;

    for (let i = 0; i < this.currentIndex; i++) {
      const tick = this.ticks[i];
      const candleTime = Math.floor(tick.timestamp / tfMs) * tfSeconds;

      const existingIdx = this.candleMap.get(candleTime);

      if (existingIdx !== undefined) {
        const candle = this.candles[existingIdx];
        if (tick.price > candle.high) candle.high = tick.price;
        if (tick.price < candle.low) candle.low = tick.price;
        candle.close = tick.price;
        candle.volume += tick.volume;
        candle.tickCount++;
      } else {
        const candle: Candle = {
          time: candleTime,
          open: tick.price,
          high: tick.price,
          low: tick.price,
          close: tick.price,
          volume: tick.volume,
          tickCount: 1,
        };
        this.candles.push(candle);
        this.candleMap.set(candleTime, this.candles.length - 1);
        this.candleBoundaryIndices.push(i);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Internal — state emission
  // ---------------------------------------------------------------------------

  private emitState(): void {
    const total = this.ticks.length;
    const state: ReplayState = {
      isPlaying: this.playing,
      speed: this.speed,
      currentTickIndex: this.currentIndex,
      totalTicks: total,
      currentTime: this.currentIndex > 0 ? this.ticks[this.currentIndex - 1].timestamp : 0,
      progress: total > 0 ? this.currentIndex / total : 0,
    };
    this.callbacks.onStateChange(state);
  }
}
