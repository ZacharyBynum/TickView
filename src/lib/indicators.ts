import type { Candle, IndicatorConfig, IndicatorValue } from '../types';

// ===========================================================================
// Internal array helpers — operate on raw number[] for easy chaining
// ===========================================================================

function smaArr(data: number[], period: number): number[] {
  if (data.length < period) return [];
  const r: number[] = [];
  let s = 0;
  for (let i = 0; i < period; i++) s += data[i];
  r.push(s / period);
  for (let i = period; i < data.length; i++) {
    s += data[i] - data[i - period];
    r.push(s / period);
  }
  return r;
}

function emaArr(data: number[], period: number): number[] {
  if (data.length < period) return [];
  const k = 2 / (period + 1);
  const r: number[] = [];
  let s = 0;
  for (let i = 0; i < period; i++) s += data[i];
  let e = s / period;
  r.push(e);
  for (let i = period; i < data.length; i++) {
    e = data[i] * k + e * (1 - k);
    r.push(e);
  }
  return r;
}

function wmaArr(data: number[], period: number): number[] {
  if (data.length < period) return [];
  const denom = (period * (period + 1)) / 2;
  const r: number[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let s = 0;
    for (let j = 0; j < period; j++) s += data[i - period + 1 + j] * (j + 1);
    r.push(s / denom);
  }
  return r;
}

function wilderSmooth(data: number[], period: number): number[] {
  if (data.length < period) return [];
  const r: number[] = [];
  let s = 0;
  for (let i = 0; i < period; i++) s += data[i];
  let v = s / period;
  r.push(v);
  for (let i = period; i < data.length; i++) {
    v = (v * (period - 1) + data[i]) / period;
    r.push(v);
  }
  return r;
}

/** Map number[] values to IndicatorValue[] using candle timestamps from `offset` */
function toIV(candles: Candle[], values: number[], offset: number): IndicatorValue[] {
  const r: IndicatorValue[] = [];
  for (let i = 0; i < values.length; i++) {
    r.push({ time: candles[offset + i].time, value: values[i] });
  }
  return r;
}

/** Extract a day key from a UTC timestamp in seconds. */
function getDayFromTimestamp(ts: number): number {
  return Math.floor(ts / 86400);
}

// ===========================================================================
// Moving Averages
// ===========================================================================

export function calculateSMA(candles: Candle[], period: number): IndicatorValue[] {
  if (candles.length < period) return [];
  const result: IndicatorValue[] = [];
  let sum = 0;
  for (let i = 0; i < period; i++) sum += candles[i].close;
  result.push({ time: candles[period - 1].time, value: sum / period });
  for (let i = period; i < candles.length; i++) {
    sum += candles[i].close - candles[i - period].close;
    result.push({ time: candles[i].time, value: sum / period });
  }
  return result;
}

export function calculateEMA(candles: Candle[], period: number): IndicatorValue[] {
  if (candles.length < period) return [];
  const k = 2 / (period + 1);
  const result: IndicatorValue[] = [];
  let sum = 0;
  for (let i = 0; i < period; i++) sum += candles[i].close;
  let ema = sum / period;
  result.push({ time: candles[period - 1].time, value: ema });
  for (let i = period; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k);
    result.push({ time: candles[i].time, value: ema });
  }
  return result;
}

export function calculateWMA(candles: Candle[], period: number): IndicatorValue[] {
  return toIV(candles, wmaArr(candles.map(c => c.close), period), period - 1);
}

export function calculateDEMA(candles: Candle[], period: number): IndicatorValue[] {
  const closes = candles.map(c => c.close);
  const ema1 = emaArr(closes, period);
  const ema2 = emaArr(ema1, period);
  if (ema2.length === 0) return [];
  const skip = period - 1; // align ema1 to ema2
  const offset = 2 * (period - 1);
  const r: IndicatorValue[] = [];
  for (let i = 0; i < ema2.length; i++) {
    r.push({ time: candles[offset + i].time, value: 2 * ema1[skip + i] - ema2[i] });
  }
  return r;
}

export function calculateTEMA(candles: Candle[], period: number): IndicatorValue[] {
  const closes = candles.map(c => c.close);
  const ema1 = emaArr(closes, period);
  const ema2 = emaArr(ema1, period);
  const ema3 = emaArr(ema2, period);
  if (ema3.length === 0) return [];
  const s1 = 2 * (period - 1); // skip in ema1 to align with ema3
  const s2 = period - 1;        // skip in ema2 to align with ema3
  const offset = 3 * (period - 1);
  const r: IndicatorValue[] = [];
  for (let i = 0; i < ema3.length; i++) {
    r.push({ time: candles[offset + i].time, value: 3 * ema1[s1 + i] - 3 * ema2[s2 + i] + ema3[i] });
  }
  return r;
}

export function calculateHMA(candles: Candle[], period: number): IndicatorValue[] {
  const closes = candles.map(c => c.close);
  const half = Math.max(1, Math.floor(period / 2));
  const sqr = Math.max(1, Math.round(Math.sqrt(period)));
  const wma1 = wmaArr(closes, half);
  const wma2 = wmaArr(closes, period);
  if (wma2.length === 0) return [];
  const skip = (period - 1) - (half - 1);
  const raw: number[] = [];
  for (let i = 0; i < wma2.length; i++) raw.push(2 * wma1[skip + i] - wma2[i]);
  const hma = wmaArr(raw, sqr);
  return toIV(candles, hma, period - 1 + sqr - 1);
}

export function calculateVWAP(candles: Candle[]): IndicatorValue[] {
  if (candles.length === 0) return [];
  const result: IndicatorValue[] = [];
  let cumTPV = 0, cumVol = 0, day = getDayFromTimestamp(candles[0].time);
  for (const c of candles) {
    const d = getDayFromTimestamp(c.time);
    if (d !== day) { cumTPV = 0; cumVol = 0; day = d; }
    const tp = (c.high + c.low + c.close) / 3;
    cumTPV += tp * c.volume;
    cumVol += c.volume;
    result.push({ time: c.time, value: cumVol > 0 ? cumTPV / cumVol : c.close });
  }
  return result;
}

// ===========================================================================
// Volatility
// ===========================================================================

function calculateBBAll(candles: Candle[], period: number) {
  if (candles.length < period) return { upper: [] as IndicatorValue[], middle: [] as IndicatorValue[], lower: [] as IndicatorValue[] };
  const closes = candles.map(c => c.close);
  const sma = smaArr(closes, period);
  const upper: IndicatorValue[] = [], middle: IndicatorValue[] = [], lower: IndicatorValue[] = [];
  for (let i = 0; i < sma.length; i++) {
    let sumSq = 0;
    for (let j = i; j < i + period; j++) { const d = closes[j] - sma[i]; sumSq += d * d; }
    const std = Math.sqrt(sumSq / period);
    const t = candles[i + period - 1].time;
    upper.push({ time: t, value: sma[i] + 2 * std });
    middle.push({ time: t, value: sma[i] });
    lower.push({ time: t, value: sma[i] - 2 * std });
  }
  return { upper, middle, lower };
}

export function calculateATR(candles: Candle[], period: number): IndicatorValue[] {
  if (candles.length < period + 1) return [];
  const tr: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const h = candles[i].high, l = candles[i].low, pc = candles[i - 1].close;
    tr.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
  }
  return toIV(candles, wilderSmooth(tr, period), period);
}

// ===========================================================================
// Momentum / Oscillators
// ===========================================================================

export function calculateRSI(candles: Candle[], period: number): IndicatorValue[] {
  if (candles.length < period + 1) return [];
  const result: IndicatorValue[] = [];
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const ch = candles[i].close - candles[i - 1].close;
    if (ch > 0) avgGain += ch; else avgLoss += Math.abs(ch);
  }
  avgGain /= period;
  avgLoss /= period;
  result.push({ time: candles[period].time, value: avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss) });
  for (let i = period + 1; i < candles.length; i++) {
    const ch = candles[i].close - candles[i - 1].close;
    avgGain = (avgGain * (period - 1) + (ch > 0 ? ch : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (ch < 0 ? -ch : 0)) / period;
    result.push({ time: candles[i].time, value: avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss) });
  }
  return result;
}

function calculateMACDAll(candles: Candle[]) {
  const empty = { macd: [] as IndicatorValue[], signal: [] as IndicatorValue[] };
  if (candles.length < 26) return empty;
  const closes = candles.map(c => c.close);
  const ema12 = emaArr(closes, 12);
  const ema26 = emaArr(closes, 26);
  const macdLine: number[] = [];
  const ema12Offset = 26 - 12;
  for (let i = 0; i < ema26.length; i++) macdLine.push(ema12[ema12Offset + i] - ema26[i]);
  const sig = emaArr(macdLine, 9);
  return { macd: toIV(candles, macdLine, 25), signal: toIV(candles, sig, 33) };
}

function calculateSTOCHAll(candles: Candle[], period: number) {
  const empty = { k: [] as IndicatorValue[], d: [] as IndicatorValue[] };
  if (candles.length < period) return empty;
  const rawK: number[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    let hh = -Infinity, ll = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      if (candles[j].high > hh) hh = candles[j].high;
      if (candles[j].low < ll) ll = candles[j].low;
    }
    const range = hh - ll;
    rawK.push(range === 0 ? 50 : ((candles[i].close - ll) / range) * 100);
  }
  const kSmooth = smaArr(rawK, 3);
  const dValues = smaArr(kSmooth, 3);
  return { k: toIV(candles, kSmooth, period + 1), d: toIV(candles, dValues, period + 3) };
}

export function calculateCCI(candles: Candle[], period: number): IndicatorValue[] {
  if (candles.length < period) return [];
  const tp = candles.map(c => (c.high + c.low + c.close) / 3);
  const sma = smaArr(tp, period);
  const r: IndicatorValue[] = [];
  for (let i = 0; i < sma.length; i++) {
    let md = 0;
    for (let j = i; j < i + period; j++) md += Math.abs(tp[j] - sma[i]);
    md /= period;
    r.push({ time: candles[i + period - 1].time, value: md === 0 ? 0 : (tp[i + period - 1] - sma[i]) / (0.015 * md) });
  }
  return r;
}

export function calculateWILLR(candles: Candle[], period: number): IndicatorValue[] {
  if (candles.length < period) return [];
  const r: IndicatorValue[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    let hh = -Infinity, ll = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      if (candles[j].high > hh) hh = candles[j].high;
      if (candles[j].low < ll) ll = candles[j].low;
    }
    const range = hh - ll;
    r.push({ time: candles[i].time, value: range === 0 ? -50 : ((hh - candles[i].close) / range) * -100 });
  }
  return r;
}

export function calculateMOM(candles: Candle[], period: number): IndicatorValue[] {
  if (candles.length <= period) return [];
  const r: IndicatorValue[] = [];
  for (let i = period; i < candles.length; i++) {
    r.push({ time: candles[i].time, value: candles[i].close - candles[i - period].close });
  }
  return r;
}

export function calculateROC(candles: Candle[], period: number): IndicatorValue[] {
  if (candles.length <= period) return [];
  const r: IndicatorValue[] = [];
  for (let i = period; i < candles.length; i++) {
    const prev = candles[i - period].close;
    r.push({ time: candles[i].time, value: prev === 0 ? 0 : ((candles[i].close - prev) / prev) * 100 });
  }
  return r;
}

export function calculateADX(candles: Candle[], period: number): IndicatorValue[] {
  if (candles.length < 2 * period) return [];
  const plusDM: number[] = [], minusDM: number[] = [], tr: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const up = candles[i].high - candles[i - 1].high;
    const dn = candles[i - 1].low - candles[i].low;
    plusDM.push(up > dn && up > 0 ? up : 0);
    minusDM.push(dn > up && dn > 0 ? dn : 0);
    const h = candles[i].high, l = candles[i].low, pc = candles[i - 1].close;
    tr.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
  }
  const sPDM = wilderSmooth(plusDM, period);
  const sMDM = wilderSmooth(minusDM, period);
  const atr = wilderSmooth(tr, period);
  const dx: number[] = [];
  for (let i = 0; i < sPDM.length; i++) {
    const pdi = atr[i] === 0 ? 0 : (sPDM[i] / atr[i]) * 100;
    const mdi = atr[i] === 0 ? 0 : (sMDM[i] / atr[i]) * 100;
    const sum = pdi + mdi;
    dx.push(sum === 0 ? 0 : (Math.abs(pdi - mdi) / sum) * 100);
  }
  return toIV(candles, wilderSmooth(dx, period), 2 * period - 1);
}

export function calculateTRIX(candles: Candle[], period: number): IndicatorValue[] {
  const closes = candles.map(c => c.close);
  const ema3 = emaArr(emaArr(emaArr(closes, period), period), period);
  if (ema3.length < 2) return [];
  const offset = 3 * (period - 1);
  const r: IndicatorValue[] = [];
  for (let i = 1; i < ema3.length; i++) {
    r.push({ time: candles[offset + i].time, value: ema3[i - 1] === 0 ? 0 : ((ema3[i] - ema3[i - 1]) / ema3[i - 1]) * 100 });
  }
  return r;
}

// ===========================================================================
// Volume
// ===========================================================================

export function calculateMFI(candles: Candle[], period: number): IndicatorValue[] {
  if (candles.length < period + 1) return [];
  const r: IndicatorValue[] = [];
  for (let i = period; i < candles.length; i++) {
    let pos = 0, neg = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const tp = (candles[j].high + candles[j].low + candles[j].close) / 3;
      const ptp = (candles[j - 1].high + candles[j - 1].low + candles[j - 1].close) / 3;
      const mf = tp * candles[j].volume;
      if (tp > ptp) pos += mf; else if (tp < ptp) neg += mf;
    }
    r.push({ time: candles[i].time, value: neg === 0 ? 100 : 100 - 100 / (1 + pos / neg) });
  }
  return r;
}

export function calculateOBV(candles: Candle[]): IndicatorValue[] {
  if (candles.length < 2) return [];
  const r: IndicatorValue[] = [{ time: candles[0].time, value: 0 }];
  let obv = 0;
  for (let i = 1; i < candles.length; i++) {
    if (candles[i].close > candles[i - 1].close) obv += candles[i].volume;
    else if (candles[i].close < candles[i - 1].close) obv -= candles[i].volume;
    r.push({ time: candles[i].time, value: obv });
  }
  return r;
}

// ===========================================================================
// Dispatcher
// ===========================================================================

export function calculateIndicator(candles: Candle[], config: IndicatorConfig): IndicatorValue[] {
  switch (config.type) {
    case 'SMA':   return calculateSMA(candles, config.period);
    case 'EMA':   return calculateEMA(candles, config.period);
    case 'WMA':   return calculateWMA(candles, config.period);
    case 'DEMA':  return calculateDEMA(candles, config.period);
    case 'TEMA':  return calculateTEMA(candles, config.period);
    case 'HMA':   return calculateHMA(candles, config.period);
    case 'VWAP':  return calculateVWAP(candles);
    case 'BB': {
      const bb = calculateBBAll(candles, config.period);
      return bb[(config.output as 'upper' | 'middle' | 'lower') ?? 'middle'] ?? [];
    }
    case 'ATR':   return calculateATR(candles, config.period);
    case 'RSI':   return calculateRSI(candles, config.period);
    case 'MACD': {
      const m = calculateMACDAll(candles);
      return m[(config.output as 'macd' | 'signal') ?? 'macd'] ?? [];
    }
    case 'STOCH': {
      const s = calculateSTOCHAll(candles, config.period);
      return s[(config.output as 'k' | 'd') ?? 'k'] ?? [];
    }
    case 'CCI':   return calculateCCI(candles, config.period);
    case 'WILLR': return calculateWILLR(candles, config.period);
    case 'MOM':   return calculateMOM(candles, config.period);
    case 'ROC':   return calculateROC(candles, config.period);
    case 'ADX':   return calculateADX(candles, config.period);
    case 'TRIX':  return calculateTRIX(candles, config.period);
    case 'MFI':   return calculateMFI(candles, config.period);
    case 'OBV':   return calculateOBV(candles);
    default:      return [];
  }
}
