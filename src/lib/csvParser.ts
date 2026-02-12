import type { Tick } from '../types';

function parseDateTimeToMs(date: string, time: string): number {
  const year = +date.slice(0, 4);
  const month = +date.slice(4, 6) - 1;
  const day = +date.slice(6, 8);
  const hour = +time.slice(0, 2);
  const min = +time.slice(2, 4);
  const sec = +time.slice(4, 6);
  return Date.UTC(year, month, day, hour, min, sec);
}

/**
 * Auto-detect and parse a single line.
 *
 * Supported formats:
 *   A) "YYYYMMDD HHmmss;O;H;L;C;V"          (standard NinjaTrader)
 *   B) "YYYYMMDD HHmmss ???;Last;Bid;Ask;V"  (extended with sub-second field)
 */
function parseLine(line: string): Tick | null {
  if (line.length < 16) return null;

  const c0 = line.charCodeAt(0);
  if (c0 < 48 || c0 > 57) return null; // must start with digit

  const datePart = line.slice(0, 8);
  const timePart = line.slice(9, 15);

  // Everything after "YYYYMMDD HHmmss" — could start with ';' or ' '
  const rest = line.slice(15);

  let fields: string[];

  if (rest.charCodeAt(0) === 59) {
    // Format A: semicolon right after time → "YYYYMMDD HHmmss;O;H;L;C;V"
    fields = rest.slice(1).split(';');
  } else if (rest.charCodeAt(0) === 32) {
    // Format B: space then "???;Last;Bid;Ask;V"
    fields = rest.slice(1).split(';');
  } else {
    return null;
  }

  if (fields.length < 5) return null;

  // Trim trailing \r from last field
  let lastField = fields[fields.length - 1];
  if (lastField.charCodeAt(lastField.length - 1) === 13) {
    lastField = lastField.slice(0, -1);
    fields[fields.length - 1] = lastField;
  }

  const timestamp = parseDateTimeToMs(datePart, timePart);

  if (fields.length === 5 && rest.charCodeAt(0) === 59) {
    // Format A: O;H;L;C;V — use close as price
    const high = +fields[1];
    const low = +fields[2];
    const close = +fields[3];
    const volume = +fields[4];
    if (close !== close) return null;
    return { timestamp, price: close, bid: low, ask: high, volume };
  }

  // Format B: ???;Last;Bid;Ask;V (6 fields with sub-second prefix)
  if (fields.length >= 5) {
    const price = +fields[1];
    if (price !== price) return null;
    const bid = +fields[2];
    const ask = +fields[3];
    const volume = +fields[4];
    return { timestamp, price, bid, ask, volume };
  }

  return null;
}

/**
 * Stream-parse a File/Blob/ReadableStream into Tick[].
 */
export async function parseTicks(
  source: Blob | ReadableStream<Uint8Array>,
  onProgress?: (pct: number) => void,
  totalSize?: number,
): Promise<Tick[]> {
  const ticks: Tick[] = [];
  const stream = source instanceof Blob ? source.stream() : source;
  const reader = (stream as ReadableStream<Uint8Array>).getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let bytesRead = 0;
  const totalBytes = totalSize ?? (source instanceof Blob ? source.size : 0);
  let stripBom = true;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;

    bytesRead += value.byteLength;
    buffer += decoder.decode(value, { stream: true });

    // Strip BOM from start of file
    if (stripBom) {
      if (buffer.charCodeAt(0) === 0xfeff) buffer = buffer.slice(1);
      stripBom = false;
    }

    // Split into lines; last element may be a partial line
    const lines = buffer.split(/\r?\n|\r/);
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const tick = parseLine(line);
      if (tick) ticks.push(tick);
    }

    const pct = (bytesRead / totalBytes) * 100;
    onProgress?.(pct);

    // Yield to UI thread so progress bar updates
    await new Promise<void>((r) => setTimeout(r, 0));
  }

  // Process remaining buffer
  if (buffer.length > 0) {
    const tick = parseLine(buffer);
    if (tick) ticks.push(tick);
  }

  onProgress?.(100);
  return ticks;
}
