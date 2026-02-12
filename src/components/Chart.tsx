import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  createSeriesMarkers,
} from 'lightweight-charts';
import type {
  IChartApi,
  ISeriesApi,
  ISeriesMarkersPluginApi,
  UTCTimestamp,
  IPriceLine,
  MouseEventParams,
} from 'lightweight-charts';
import type {
  Candle,
  ChartColors,
  ChartHandle,
  ChartTradeMarker,
  CrosshairData,
  IndicatorConfig,
  IndicatorValue,
  InstrumentConfig,
} from '../types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChartProps {
  candles: Candle[];
  onCrosshairMove?: (data: CrosshairData | null) => void;
  instrument: InstrumentConfig;
  indicators: IndicatorConfig[];
  indicatorValues: Map<string, IndicatorValue[]>;
  chartColors?: ChartColors;
  slPrice?: number | null;
  tpPrice?: number | null;
  onSlChange?: (price: number | null) => void;
  onTpChange?: (price: number | null) => void;
}

// ---------------------------------------------------------------------------
// Oscillator types — rendered on a separate scale at the bottom of the chart
// ---------------------------------------------------------------------------

const OSCILLATOR_TYPES = new Set([
  'RSI', 'ATR', 'CCI', 'WILLR', 'MFI', 'ROC', 'MOM', 'ADX', 'TRIX', 'STOCH', 'MACD', 'OBV',
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(price: number): string {
  return price.toFixed(2);
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return (vol / 1_000_000).toFixed(1) + 'M';
  if (vol >= 1_000) return (vol / 1_000).toFixed(1) + 'K';
  return vol.toString();
}

function formatChange(change: number, pct: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)} (${sign}${pct.toFixed(2)}%)`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DRAG_THRESHOLD_PX = 8;

const Chart = forwardRef<ChartHandle, ChartProps>(function Chart(
  { candles, onCrosshairMove, instrument, indicators, indicatorValues, chartColors, slPrice, tpPrice, onSlChange, onTpChange },
  ref,
) {
  // Refs for DOM and chart instances
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const indicatorSeriesMap = useRef<Map<string, ISeriesApi<'Line'>>>(new Map());
  const priceLinesRef = useRef<Map<string, IPriceLine>>(new Map());
  const priceLineIdCounter = useRef(0);
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<UTCTimestamp> | null>(null);

  // SL/TP price line refs
  const slLineRef = useRef<IPriceLine | null>(null);
  const tpLineRef = useRef<IPriceLine | null>(null);
  const draggingRef = useRef<'sl' | 'tp' | null>(null);
  const onSlChangeRef = useRef(onSlChange);
  onSlChangeRef.current = onSlChange;
  const onTpChangeRef = useRef(onTpChange);
  onTpChangeRef.current = onTpChange;

  // Keep chart colors ref for imperative handle
  const chartColorsRef = useRef(chartColors);
  chartColorsRef.current = chartColors;

  // Track latest crosshair data for the overlay
  const crosshairDataRef = useRef<CrosshairData | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Keep a ref to candles so crosshair callback can access latest
  const candlesRef = useRef<Candle[]>(candles);
  candlesRef.current = candles;

  // Stable callbacks ref
  const onCrosshairMoveRef = useRef(onCrosshairMove);
  onCrosshairMoveRef.current = onCrosshairMove;

  // ------------------------------------------------------------------
  // Chart creation & teardown
  // ------------------------------------------------------------------

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      layout: {
        background: { color: '#0a0a0a' },
        textColor: '#d1d4dc',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: '#1a1a1a' },
        horzLines: { color: '#1a1a1a' },
      },
      crosshair: {
        mode: 0, // Normal
        vertLine: { color: '#5d606b', width: 1, style: 3, labelBackgroundColor: '#2a2e39' },
        horzLine: { color: '#5d606b', width: 1, style: 3, labelBackgroundColor: '#2a2e39' },
      },
      rightPriceScale: {
        borderColor: '#2a2e39',
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: '#2a2e39',
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 5,
      },
      width: el.clientWidth,
      height: el.clientHeight,
    });

    chartRef.current = chart;

    // Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderUpColor: '#26a69a',
      borderDownColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });
    candleSeriesRef.current = candleSeries;

    // Markers plugin
    const markersPlugin = createSeriesMarkers(candleSeries, []);
    markersPluginRef.current = markersPlugin as ISeriesMarkersPluginApi<UTCTimestamp>;

    // Volume histogram series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });
    volumeSeriesRef.current = volumeSeries;

    // Crosshair move subscription
    chart.subscribeCrosshairMove((param: MouseEventParams) => {
      const cs = candlesRef.current;
      if (!param.time || !param.seriesData || cs.length === 0) {
        crosshairDataRef.current = null;
        onCrosshairMoveRef.current?.(null);
        updateOverlay(null, cs, instrument);
        return;
      }

      const candleData = param.seriesData.get(candleSeries);
      if (!candleData || !('open' in candleData)) {
        crosshairDataRef.current = null;
        onCrosshairMoveRef.current?.(null);
        updateOverlay(null, cs, instrument);
        return;
      }

      const d = candleData as { open: number; high: number; low: number; close: number; time: UTCTimestamp };
      // Find matching candle to get volume
      const matchIdx = cs.findIndex(c => c.time === (d.time as number));
      const vol = matchIdx >= 0 ? cs[matchIdx].volume : 0;

      // Compute change from previous candle
      let change = 0;
      let changePercent = 0;
      if (matchIdx > 0) {
        const prev = cs[matchIdx - 1];
        change = d.close - prev.close;
        changePercent = prev.close !== 0 ? (change / prev.close) * 100 : 0;
      }

      const crosshair: CrosshairData = {
        time: d.time as number,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: vol,
        change,
        changePercent,
      };

      crosshairDataRef.current = crosshair;
      onCrosshairMoveRef.current?.(crosshair);
      updateOverlay(crosshair, cs, instrument);
    });

    // ResizeObserver
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        chart.applyOptions({ width, height });
      }
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      markersPluginRef.current = null;
      indicatorSeriesMap.current.clear();
      priceLinesRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------------
  // Apply chart colors without recreating the chart
  // ------------------------------------------------------------------

  useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleSeriesRef.current;
    if (!chart || !candleSeries || !chartColors) return;

    chart.applyOptions({
      layout: {
        background: { color: chartColors.background },
        textColor: chartColors.text,
      },
      grid: {
        vertLines: { color: chartColors.grid },
        horzLines: { color: chartColors.grid },
      },
      crosshair: {
        vertLine: { color: chartColors.crosshair },
        horzLine: { color: chartColors.crosshair },
      },
    });

    candleSeries.applyOptions({
      upColor: chartColors.bullCandle,
      downColor: chartColors.bearCandle,
      borderUpColor: chartColors.bullCandle,
      borderDownColor: chartColors.bearCandle,
      wickUpColor: chartColors.bullCandle,
      wickDownColor: chartColors.bearCandle,
    });

    // Update CSS variables so OHLCV overlay and rest of UI follow
    const root = document.documentElement;
    root.style.setProperty('--color-bull', chartColors.bullCandle);
    root.style.setProperty('--color-bear', chartColors.bearCandle);
    root.style.setProperty('--color-bull-bg', chartColors.bullCandle + '1f');
    root.style.setProperty('--color-bear-bg', chartColors.bearCandle + '1f');
  }, [chartColors]);

  // ------------------------------------------------------------------
  // SL/TP price lines — sync with props
  // ------------------------------------------------------------------

  useEffect(() => {
    const series = candleSeriesRef.current;
    if (!series) return;
    if (slPrice != null) {
      if (slLineRef.current) slLineRef.current.applyOptions({ price: slPrice });
      else slLineRef.current = series.createPriceLine({ price: slPrice, color: '#ef5350', lineWidth: 2, lineStyle: 0, axisLabelVisible: true, title: 'SL' });
    } else if (slLineRef.current) { series.removePriceLine(slLineRef.current); slLineRef.current = null; }
    if (tpPrice != null) {
      if (tpLineRef.current) tpLineRef.current.applyOptions({ price: tpPrice });
      else tpLineRef.current = series.createPriceLine({ price: tpPrice, color: '#26a69a', lineWidth: 2, lineStyle: 0, axisLabelVisible: true, title: 'TP' });
    } else if (tpLineRef.current) { series.removePriceLine(tpLineRef.current); tpLineRef.current = null; }
  }, [slPrice, tpPrice]);

  // ------------------------------------------------------------------
  // SL/TP drag handling
  // ------------------------------------------------------------------

  useEffect(() => {
    const el = containerRef.current;
    const chart = chartRef.current;
    if (!el || !chart) return;
    const getY = (e: MouseEvent) => e.clientY - el.getBoundingClientRect().top;
    const toCoord = (p: number) => candleSeriesRef.current?.priceToCoordinate(p);
    const toPrice = (y: number) => candleSeriesRef.current?.coordinateToPrice(y);

    const onMouseDown = (e: MouseEvent) => {
      if (!candleSeriesRef.current) return;
      const y = getY(e);
      let closest: 'sl' | 'tp' | null = null;
      let best = DRAG_THRESHOLD_PX;
      if (slLineRef.current) { const c = toCoord(slLineRef.current.options().price); if (c != null && Math.abs(y - c) < best) { closest = 'sl'; best = Math.abs(y - c); } }
      if (tpLineRef.current) { const c = toCoord(tpLineRef.current.options().price); if (c != null && Math.abs(y - c) < best) { closest = 'tp'; } }
      if (!closest) return;
      e.preventDefault(); e.stopPropagation();
      draggingRef.current = closest;
      chart.applyOptions({ handleScroll: false, handleScale: false });
      el.style.cursor = 'grabbing';
    };

    const onMouseMove = (e: MouseEvent) => {
      const y = getY(e);
      if (!draggingRef.current) {
        let near = false;
        if (slLineRef.current) { const c = toCoord(slLineRef.current.options().price); if (c != null && Math.abs(y - c) < DRAG_THRESHOLD_PX) near = true; }
        if (tpLineRef.current) { const c = toCoord(tpLineRef.current.options().price); if (c != null && Math.abs(y - c) < DRAG_THRESHOLD_PX) near = true; }
        el.style.cursor = near ? 'grab' : '';
        return;
      }
      const price = toPrice(y);
      if (price == null || price <= 0) return;
      const snapped = Math.round(price / instrument.tickSize) * instrument.tickSize;
      if (draggingRef.current === 'sl') onSlChangeRef.current?.(snapped);
      else onTpChangeRef.current?.(snapped);
    };

    const onMouseUp = () => {
      if (draggingRef.current) {
        draggingRef.current = null;
        chart.applyOptions({ handleScroll: true, handleScale: true });
        el.style.cursor = '';
      }
    };

    el.addEventListener('mousedown', onMouseDown, true);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => { el.removeEventListener('mousedown', onMouseDown, true); window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
  }, [instrument.tickSize]);

  // ------------------------------------------------------------------
  // Helper: update the OHLCV overlay DOM directly (no re-render)
  // ------------------------------------------------------------------

  const updateOverlay = useCallback(
    (data: CrosshairData | null, cs: Candle[], inst: InstrumentConfig) => {
      const el = overlayRef.current;
      if (!el) return;

      // Use provided data, or fall back to the latest candle
      let display = data;
      if (!display && cs.length > 0) {
        const last = cs[cs.length - 1];
        let change = 0;
        let changePercent = 0;
        if (cs.length > 1) {
          const prev = cs[cs.length - 2];
          change = last.close - prev.close;
          changePercent = prev.close !== 0 ? (change / prev.close) * 100 : 0;
        }
        display = {
          time: last.time,
          open: last.open,
          high: last.high,
          low: last.low,
          close: last.close,
          volume: last.volume,
          change,
          changePercent,
        };
      }

      if (!display) {
        el.innerHTML = '';
        return;
      }

      const bull = display.close >= display.open;
      const cls = bull ? 'bull' : 'bear';
      const changeCls = display.change >= 0 ? 'bull' : 'bear';

      // Build indicator values HTML
      let indHtml = '';
      const indMap = indicatorValuesRef.current;
      const indConfigs = indicatorsRef.current;
      for (const cfg of indConfigs) {
        if (!cfg.visible) continue;
        const vals = indMap.get(cfg.id);
        if (!vals || vals.length === 0) continue;
        // Find value at the display time, or latest
        let iv = vals.find(v => v.time === display!.time);
        if (!iv) iv = vals[vals.length - 1];
        const out = cfg.output ? ' ' + cfg.output : '';
        const lbl = cfg.period ? `${cfg.type}${out}(${cfg.period})` : `${cfg.type}${out}`;
        indHtml += `<span class="ohlcv-indicator"><span class="ohlcv-indicator-label">${lbl}</span><span style="color:${cfg.color}">${formatPrice(iv.value)}</span></span>`;
      }

      el.innerHTML = `
        <div class="ohlcv-row">
          <span class="ohlcv-label" style="font-weight:600;color:#d1d4dc">${inst.symbol}</span>
          <span class="ohlcv-label">O</span><span class="ohlcv-value ${cls}">${formatPrice(display.open)}</span>
          <span class="ohlcv-label">H</span><span class="ohlcv-value ${cls}">${formatPrice(display.high)}</span>
          <span class="ohlcv-label">L</span><span class="ohlcv-value ${cls}">${formatPrice(display.low)}</span>
          <span class="ohlcv-label">C</span><span class="ohlcv-value ${cls}">${formatPrice(display.close)}</span>
          <span class="ohlcv-label">V</span><span class="ohlcv-value neutral">${formatVolume(display.volume)}</span>
          <span class="ohlcv-change ${changeCls}">${formatChange(display.change, display.changePercent)}</span>
        </div>
        ${indHtml ? `<div class="ohlcv-row">${indHtml}</div>` : ''}
      `;
    },
    [],
  );

  // ------------------------------------------------------------------
  // Keep indicator refs up to date for the overlay helper
  // ------------------------------------------------------------------

  const indicatorValuesRef = useRef(indicatorValues);
  indicatorValuesRef.current = indicatorValues;
  const indicatorsRef = useRef(indicators);
  indicatorsRef.current = indicators;

  // ------------------------------------------------------------------
  // Update candle + volume data when candles change
  // ------------------------------------------------------------------

  useEffect(() => {
    const candleSeries = candleSeriesRef.current;
    const volumeSeries = volumeSeriesRef.current;
    if (!candleSeries || !volumeSeries || candles.length === 0) return;

    candleSeries.setData(
      candles.map(c => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );

    volumeSeries.setData(
      candles.map(c => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open
          ? (chartColors?.bullCandle ?? '#26a69a') + '4d'
          : (chartColors?.bearCandle ?? '#ef5350') + '4d',
      })),
    );

    // Refresh overlay with latest candle when not hovering
    if (!crosshairDataRef.current) {
      updateOverlay(null, candles, instrument);
    }
  }, [candles, instrument, updateOverlay, chartColors]);

  // ------------------------------------------------------------------
  // Update indicator line series
  // ------------------------------------------------------------------

  const updateIndicatorSeries = useCallback(
    (configs: IndicatorConfig[], values: Map<string, IndicatorValue[]>) => {
      const chart = chartRef.current;
      if (!chart) return;

      const existingIds = new Set(indicatorSeriesMap.current.keys());
      const wantedIds = new Set(configs.filter(c => c.visible).map(c => c.id));

      // Remove series that are no longer wanted
      for (const id of existingIds) {
        if (!wantedIds.has(id)) {
          const series = indicatorSeriesMap.current.get(id)!;
          chart.removeSeries(series);
          indicatorSeriesMap.current.delete(id);
        }
      }

      // Add or update wanted series
      for (const cfg of configs) {
        if (!cfg.visible) continue;

        const isOsc = OSCILLATOR_TYPES.has(cfg.type);
        let series = indicatorSeriesMap.current.get(cfg.id);
        if (!series) {
          series = chart.addSeries(LineSeries, {
            color: cfg.color,
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false,
            ...(isOsc ? { priceScaleId: cfg.type } : {}),
          });
          if (isOsc) {
            series.priceScale().applyOptions({
              scaleMargins: { top: 0.7, bottom: 0 },
            });
          }
          indicatorSeriesMap.current.set(cfg.id, series);
        } else {
          series.applyOptions({ color: cfg.color });
        }

        const vals = values.get(cfg.id);
        if (vals && vals.length > 0) {
          series.setData(
            vals.map(v => ({
              time: v.time as UTCTimestamp,
              value: v.value,
            })),
          );
        }
      }
    },
    [],
  );

  // React to indicator prop changes
  useEffect(() => {
    updateIndicatorSeries(indicators, indicatorValues);
  }, [indicators, indicatorValues, updateIndicatorSeries]);

  // ------------------------------------------------------------------
  // Imperative handle
  // ------------------------------------------------------------------

  useImperativeHandle(
    ref,
    () => ({
      updateCandles(newCandles: Candle[]) {
        const candleSeries = candleSeriesRef.current;
        const volumeSeries = volumeSeriesRef.current;
        if (!candleSeries || !volumeSeries) return;

        candleSeries.setData(
          newCandles.map(c => ({
            time: c.time as UTCTimestamp,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          })),
        );

        volumeSeries.setData(
          newCandles.map(c => ({
            time: c.time as UTCTimestamp,
            value: c.volume,
            color: c.close >= c.open
              ? (chartColorsRef.current?.bullCandle ?? '#26a69a') + '4d'
              : (chartColorsRef.current?.bearCandle ?? '#ef5350') + '4d',
          })),
        );
      },

      setMarkers(markers: ChartTradeMarker[]) {
        const plugin = markersPluginRef.current;
        if (!plugin) return;

        const sorted = [...markers].sort((a, b) => a.time - b.time);
        plugin.setMarkers(
          sorted.map(m => ({
            time: m.time as UTCTimestamp,
            position: m.position,
            color: m.color,
            shape: m.shape,
            text: m.text,
            size: m.size,
          })),
        );
      },

      addPriceLine(price: number, color: string, title: string): string {
        const candleSeries = candleSeriesRef.current;
        if (!candleSeries) return '';

        const id = `pl-${++priceLineIdCounter.current}`;
        const line = candleSeries.createPriceLine({
          price,
          color,
          lineWidth: 1,
          lineStyle: 2, // dashed
          axisLabelVisible: true,
          title,
        });
        priceLinesRef.current.set(id, line);
        return id;
      },

      removePriceLine(id: string) {
        const candleSeries = candleSeriesRef.current;
        if (!candleSeries) return;
        const line = priceLinesRef.current.get(id);
        if (line) {
          candleSeries.removePriceLine(line);
          priceLinesRef.current.delete(id);
        }
      },

      removeAllPriceLines() {
        const candleSeries = candleSeriesRef.current;
        if (!candleSeries) return;
        for (const [id, line] of priceLinesRef.current) {
          candleSeries.removePriceLine(line);
          priceLinesRef.current.delete(id);
        }
      },

      fitContent() {
        chartRef.current?.timeScale().fitContent();
      },

      scrollToRealtime() {
        chartRef.current?.timeScale().scrollToRealTime();
      },

      updateIndicators(configs: IndicatorConfig[], values: Map<string, IndicatorValue[]>) {
        updateIndicatorSeries(configs, values);
      },
    }),
    [updateIndicatorSeries],
  );

  // ------------------------------------------------------------------
  // Overlay: computed display data for initial render
  // ------------------------------------------------------------------

  const latestOverlay = useMemo(() => {
    if (candles.length === 0) return null;
    const last = candles[candles.length - 1];
    let change = 0;
    let changePercent = 0;
    if (candles.length > 1) {
      const prev = candles[candles.length - 2];
      change = last.close - prev.close;
      changePercent = prev.close !== 0 ? (change / prev.close) * 100 : 0;
    }
    return {
      open: last.open,
      high: last.high,
      low: last.low,
      close: last.close,
      volume: last.volume,
      change,
      changePercent,
      bull: last.close >= last.open,
    };
  }, [candles]);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <div className="chart-container">
      <div className="chart-watermark">{instrument.symbol}</div>
      <div ref={overlayRef} className="ohlcv-overlay">
        {/* Server-rendered initial state; will be replaced by direct DOM manipulation */}
        {latestOverlay && (
          <div className="ohlcv-row">
            <span className="ohlcv-label" style={{ fontWeight: 600, color: '#d1d4dc' }}>
              {instrument.symbol}
            </span>
            <span className="ohlcv-label">O</span>
            <span className={`ohlcv-value ${latestOverlay.bull ? 'bull' : 'bear'}`}>
              {formatPrice(latestOverlay.open)}
            </span>
            <span className="ohlcv-label">H</span>
            <span className={`ohlcv-value ${latestOverlay.bull ? 'bull' : 'bear'}`}>
              {formatPrice(latestOverlay.high)}
            </span>
            <span className="ohlcv-label">L</span>
            <span className={`ohlcv-value ${latestOverlay.bull ? 'bull' : 'bear'}`}>
              {formatPrice(latestOverlay.low)}
            </span>
            <span className="ohlcv-label">C</span>
            <span className={`ohlcv-value ${latestOverlay.bull ? 'bull' : 'bear'}`}>
              {formatPrice(latestOverlay.close)}
            </span>
            <span className="ohlcv-label">V</span>
            <span className="ohlcv-value neutral">
              {formatVolume(latestOverlay.volume)}
            </span>
            <span className={`ohlcv-change ${latestOverlay.change >= 0 ? 'bull' : 'bear'}`}>
              {formatChange(latestOverlay.change, latestOverlay.changePercent)}
            </span>
          </div>
        )}
      </div>
      <div ref={containerRef} className="chart-wrapper" />
    </div>
  );
});

export default Chart;
