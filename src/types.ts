// ============================================================================
// TickView — Core Type Definitions
// ============================================================================

// --- Raw Tick Data ---

export interface Tick {
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Last traded price */
  price: number;
  /** Best bid price */
  bid: number;
  /** Best ask price */
  ask: number;
  /** Trade size (contracts) */
  volume: number;
}

// --- Candle / Bar Data ---

export interface Candle {
  /** Unix timestamp in seconds (lightweight-charts UTCTimestamp) */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  tickCount: number;
}

// --- Timeframes ---

export type Timeframe = string;

const BUILTIN_TIMEFRAME_SECONDS: Record<string, number> = {
  '1s': 1,
  '5s': 5,
  '15s': 15,
  '30s': 30,
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '30m': 1800,
  '1h': 3600,
};

/** Parse any timeframe string (e.g. "2m", "6s", "5h") into seconds */
export function timeframeToSeconds(tf: Timeframe): number {
  if (BUILTIN_TIMEFRAME_SECONDS[tf] != null) return BUILTIN_TIMEFRAME_SECONDS[tf];
  const match = tf.match(/^(\d+)(s|m|h)$/);
  if (!match) return 5; // fallback
  const val = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === 's') return val;
  if (unit === 'm') return val * 60;
  return val * 3600;
}

export const TIMEFRAME_LABELS: Record<string, string> = {
  '1s': '1s',
  '5s': '5s',
  '15s': '15s',
  '30s': '30s',
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
  '30m': '30m',
  '1h': '1H',
};

// --- Speed Presets ---

export const SPEED_OPTIONS = [1, 5, 10, 50, 100, 500, 1000] as const;
export type Speed = (typeof SPEED_OPTIONS)[number];

// --- Replay State ---

export interface ReplayState {
  isPlaying: boolean;
  speed: Speed;
  currentTickIndex: number;
  totalTicks: number;
  /** Current replay timestamp (ms) */
  currentTime: number;
  /** Progress 0–1 */
  progress: number;
}

// --- Trading ---

export type OrderSide = 'buy' | 'sell';
export type PositionSide = 'long' | 'short' | 'flat';

export interface Trade {
  id: string;
  side: OrderSide;
  price: number;
  size: number;
  timestamp: number;
  /** Set when the trade closes a position */
  pnl?: number;
  /** Running cumulative P&L after this trade */
  cumulativePnl?: number;
}

export interface Position {
  side: PositionSide;
  entryPrice: number;
  size: number;
  unrealizedPnl: number;
}

export interface TradeStats {
  totalTrades: number;
  winners: number;
  losers: number;
  winRate: number;
  totalPnl: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  largestWin: number;
  largestLoss: number;
  avgHoldingTicks: number;
}

// --- Indicators ---

export type IndicatorType =
  | 'SMA' | 'EMA' | 'WMA' | 'DEMA' | 'TEMA' | 'HMA' | 'VWAP'
  | 'BB' | 'ATR'
  | 'RSI' | 'MACD' | 'STOCH' | 'CCI' | 'WILLR' | 'MOM' | 'ROC' | 'ADX' | 'TRIX'
  | 'MFI' | 'OBV';

export interface IndicatorConfig {
  id: string;
  type: IndicatorType;
  period: number;
  color: string;
  visible: boolean;
  /** For multi-output indicators: which line to render (e.g. 'upper'/'lower' for BB) */
  output?: string;
  /** Links multi-output entries so toggle/remove affects the whole group */
  groupId?: string;
}

export interface IndicatorValue {
  time: number;
  value: number;
}

// --- Instrument ---

export interface InstrumentConfig {
  symbol: string;
  name: string;
  /** Minimum price increment (0.25 for NQ) */
  tickSize: number;
  /** Dollar value per tick ($5.00 for NQ E-mini) */
  tickValue: number;
  /** Dollar value per full point ($20 for NQ E-mini) */
  pointValue: number;
}

export const NQ_CONFIG: InstrumentConfig = {
  symbol: 'NQ',
  name: 'E-mini NASDAQ 100',
  tickSize: 0.25,
  tickValue: 5.0,
  pointValue: 20.0,
};

// --- Chart Colors ---

export interface ChartColors {
  background: string;
  text: string;
  grid: string;
  crosshair: string;
  bullCandle: string;
  bearCandle: string;
}

export const DEFAULT_CHART_COLORS: ChartColors = {
  background: '#0a0a0a',
  text: '#d1d4dc',
  grid: '#1a1a1a',
  crosshair: '#5d606b',
  bullCandle: '#26a69a',
  bearCandle: '#ef5350',
};

// --- Chart Marker ---

export interface ChartTradeMarker {
  time: number;
  position: 'aboveBar' | 'belowBar';
  color: string;
  shape: 'arrowUp' | 'arrowDown' | 'circle';
  text: string;
  size: number;
}

// --- OHLCV overlay data ---

export interface CrosshairData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
}

// --- App-level State ---

export interface AppState {
  /** Whether a data file has been loaded */
  fileLoaded: boolean;
  /** File name */
  fileName: string;
  /** Instrument config */
  instrument: InstrumentConfig;
  /** Current timeframe */
  timeframe: Timeframe;
  /** All parsed ticks */
  ticks: Tick[];
  /** Current candles (aggregated from ticks up to current replay position) */
  candles: Candle[];
  /** Replay state */
  replay: ReplayState;
  /** Current position */
  position: Position;
  /** Trade history */
  trades: Trade[];
  /** Trading statistics */
  stats: TradeStats;
  /** Active indicator configs */
  indicators: IndicatorConfig[];
  /** Crosshair OHLCV data */
  crosshairData: CrosshairData | null;
}

// --- CSV Parser Worker Messages ---

export interface ParseWorkerRequest {
  type: 'parse';
  content: string;
}

export interface ParseWorkerProgress {
  type: 'progress';
  percent: number;
  ticksParsed: number;
}

export interface ParseWorkerComplete {
  type: 'complete';
  ticks: Tick[];
  totalTicks: number;
}

export interface ParseWorkerError {
  type: 'error';
  message: string;
}

export type ParseWorkerResponse = ParseWorkerProgress | ParseWorkerComplete | ParseWorkerError;

// --- Replay Engine Events ---

export interface ReplayCallbacks {
  onTick: (tick: Tick, index: number) => void;
  onCandleUpdate: (candles: Candle[]) => void;
  onStateChange: (state: ReplayState) => void;
}

// --- Chart Handle (imperative API) ---

export interface ChartHandle {
  updateCandles: (candles: Candle[]) => void;
  setMarkers: (markers: ChartTradeMarker[]) => void;
  addPriceLine: (price: number, color: string, title: string) => string;
  removePriceLine: (id: string) => void;
  removeAllPriceLines: () => void;
  fitContent: () => void;
  scrollToRealtime: () => void;
  updateIndicators: (configs: IndicatorConfig[], values: Map<string, IndicatorValue[]>) => void;
}
