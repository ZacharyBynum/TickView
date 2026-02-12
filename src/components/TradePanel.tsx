// TradePanel.tsx — Type exports only. UI split into TradeSidebar.tsx and TradeLog.tsx.

export interface TrailStep {
  trigger: number;
  slMove: number;
}

export type TrailMode = 'fixed' | '1-step' | '2-step' | '3-step';

export interface OrderConfig {
  slEnabled: boolean;
  tpEnabled: boolean;
  trailEnabled: boolean;
  slPoints: number;
  tpPoints: number;
  trailPoints: number;
  trailMode: TrailMode;
  trailSteps: TrailStep[];
}
