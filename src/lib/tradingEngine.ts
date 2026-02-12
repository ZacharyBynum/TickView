import type { InstrumentConfig, Position, PositionSide, Trade, TradeStats } from '../types';

const EMPTY_STATS: TradeStats = {
  totalTrades: 0,
  winners: 0,
  losers: 0,
  winRate: 0,
  totalPnl: 0,
  avgWin: 0,
  avgLoss: 0,
  profitFactor: 0,
  maxDrawdown: 0,
  largestWin: 0,
  largestLoss: 0,
  avgHoldingTicks: 0,
};

const FLAT_POSITION: Position = {
  side: 'flat',
  entryPrice: 0,
  size: 0,
  unrealizedPnl: 0,
};

export class TradingEngine {
  private instrument: InstrumentConfig;
  private position: Position;
  private trades: Trade[];
  private stats: TradeStats;
  private cumulativePnl: number;
  private peakPnl: number;
  private maxDrawdown: number;
  private grossWins: number;
  private grossLosses: number;
  private totalHoldingTicks: number;
  private tradeCounter: number;
  private entryTickIndex: number;

  constructor(instrument: InstrumentConfig) {
    this.instrument = instrument;
    this.position = { ...FLAT_POSITION };
    this.trades = [];
    this.stats = { ...EMPTY_STATS };
    this.cumulativePnl = 0;
    this.peakPnl = 0;
    this.maxDrawdown = 0;
    this.grossWins = 0;
    this.grossLosses = 0;
    this.totalHoldingTicks = 0;
    this.tradeCounter = 0;
    this.entryTickIndex = 0;
  }

  buy(price: number, size: number, timestamp: number, tickIndex?: number): void {
    if (this.position.side === 'short') {
      this.closePosition(price, timestamp, tickIndex);
    } else {
      this.openPosition('long', price, size, timestamp, tickIndex);
    }
  }

  sell(price: number, size: number, timestamp: number, tickIndex?: number): void {
    if (this.position.side === 'long') {
      this.closePosition(price, timestamp, tickIndex);
    } else {
      this.openPosition('short', price, size, timestamp, tickIndex);
    }
  }

  flatten(price: number, timestamp: number, tickIndex?: number): void {
    if (this.position.side !== 'flat') {
      this.closePosition(price, timestamp, tickIndex);
    }
  }

  updateUnrealizedPnl(currentPrice: number): void {
    if (this.position.side === 'flat') {
      this.position.unrealizedPnl = 0;
      return;
    }

    const direction = this.position.side === 'long' ? 1 : -1;
    this.position.unrealizedPnl =
      (currentPrice - this.position.entryPrice) * direction * this.position.size * this.instrument.pointValue;
  }

  getPosition(): Position {
    return { ...this.position };
  }

  getTrades(): Trade[] {
    return this.trades;
  }

  getStats(): TradeStats {
    return { ...this.stats };
  }

  reset(): void {
    this.position = { ...FLAT_POSITION };
    this.trades = [];
    this.stats = { ...EMPTY_STATS };
    this.cumulativePnl = 0;
    this.peakPnl = 0;
    this.maxDrawdown = 0;
    this.grossWins = 0;
    this.grossLosses = 0;
    this.totalHoldingTicks = 0;
    this.tradeCounter = 0;
    this.entryTickIndex = 0;
  }

  private openPosition(
    side: PositionSide,
    price: number,
    size: number,
    timestamp: number,
    tickIndex?: number,
  ): void {
    if (this.position.side === 'flat') {
      this.position = {
        side,
        entryPrice: price,
        size,
        unrealizedPnl: 0,
      };
      this.entryTickIndex = tickIndex ?? 0;
    } else {
      // Adding to existing position — compute weighted average entry
      const totalSize = this.position.size + size;
      this.position.entryPrice =
        (this.position.entryPrice * this.position.size + price * size) / totalSize;
      this.position.size = totalSize;
    }

    const trade = this.createTrade(
      side === 'long' ? 'buy' : 'sell',
      price,
      size,
      timestamp,
    );
    this.trades.push(trade);
  }

  private closePosition(price: number, timestamp: number, tickIndex?: number): void {
    const direction = this.position.side === 'long' ? 1 : -1;
    const pnl =
      (price - this.position.entryPrice) * direction * this.position.size * this.instrument.pointValue;

    this.cumulativePnl += pnl;

    const closeSide = this.position.side === 'long' ? 'sell' : 'buy';
    const trade = this.createTrade(closeSide, price, this.position.size, timestamp, pnl);
    this.trades.push(trade);

    // Update holding ticks
    const holdingTicks = (tickIndex ?? 0) - this.entryTickIndex;
    this.totalHoldingTicks += Math.max(holdingTicks, 0);

    // Update stats incrementally
    this.updateStats(pnl);

    // Reset to flat
    this.position = { ...FLAT_POSITION };
  }

  private createTrade(
    side: 'buy' | 'sell',
    price: number,
    size: number,
    timestamp: number,
    pnl?: number,
  ): Trade {
    this.tradeCounter++;
    const trade: Trade = {
      id: `trade-${this.tradeCounter}`,
      side,
      price,
      size,
      timestamp,
    };
    if (pnl !== undefined) {
      trade.pnl = pnl;
      trade.cumulativePnl = this.cumulativePnl;
    }
    return trade;
  }

  private updateStats(pnl: number): void {
    const closedTrades = this.trades.filter((t) => t.pnl !== undefined);
    const totalTrades = closedTrades.length;

    if (pnl > 0) {
      this.stats.winners++;
      this.grossWins += pnl;
      if (pnl > this.stats.largestWin) this.stats.largestWin = pnl;
    } else if (pnl < 0) {
      this.stats.losers++;
      this.grossLosses += Math.abs(pnl);
      if (pnl < this.stats.largestLoss) this.stats.largestLoss = pnl;
    }

    this.stats.totalTrades = totalTrades;
    this.stats.totalPnl = this.cumulativePnl;
    this.stats.winRate = totalTrades > 0 ? this.stats.winners / totalTrades : 0;
    this.stats.avgWin = this.stats.winners > 0 ? this.grossWins / this.stats.winners : 0;
    this.stats.avgLoss = this.stats.losers > 0 ? -(this.grossLosses / this.stats.losers) : 0;
    this.stats.profitFactor = this.grossLosses > 0 ? this.grossWins / this.grossLosses : this.grossWins > 0 ? Infinity : 0;

    // Max drawdown: largest peak-to-trough of cumulative P&L
    if (this.cumulativePnl > this.peakPnl) {
      this.peakPnl = this.cumulativePnl;
    }
    const currentDrawdown = this.peakPnl - this.cumulativePnl;
    if (currentDrawdown > this.maxDrawdown) {
      this.maxDrawdown = currentDrawdown;
    }
    this.stats.maxDrawdown = this.maxDrawdown;

    // Average holding ticks
    this.stats.avgHoldingTicks = totalTrades > 0 ? this.totalHoldingTicks / totalTrades : 0;
  }
}
