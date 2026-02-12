# TickView

A browser-based tick replay and trading simulator. Load historical tick data, replay it at any speed, and practice trading with real-time charting and performance tracking.

## Features

- **Tick Replay** — Play, pause, step, and seek through historical tick data with adjustable speed (1x–100x)
- **Multi-Timeframe Charting** — Aggregate ticks into candles from 1s up to 1h using lightweight-charts
- **20 Technical Indicators** — Moving averages (SMA, EMA, WMA, DEMA, TEMA, HMA, VWAP), volatility (Bollinger Bands, ATR), momentum (RSI, MACD, Stochastic, CCI, Williams %R, ADX, ROC, Momentum, TRIX), and volume (MFI, OBV)
- **Simulated Trading** — Place buy/sell orders, track open positions with live P&L, and review full trade history
- **Performance Stats** — Win rate, profit factor, max drawdown, average win/loss, and more
- **Drag-and-Drop Data Loading** — Drop a CSV/TXT tick file to get started instantly
- **IndexedDB Caching** — Previously loaded files are cached for fast reload

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and drag in a tick data file (CSV or TXT with timestamp, price, bid, ask, volume columns).

## Tech Stack

React 19, TypeScript, Vite, [lightweight-charts](https://github.com/nicholastan9797/lightweight-charts) v5
