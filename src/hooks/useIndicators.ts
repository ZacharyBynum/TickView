import { useState, useCallback, useRef, useEffect } from 'react';
import type { IndicatorConfig, IndicatorType, IndicatorValue, Candle } from '../types';
import { calculateIndicator } from '../lib/indicators';

const DEFAULT_INDICATORS: IndicatorConfig[] = [
  { id: 'sma20', type: 'SMA', period: 20, color: '#ff9800', visible: true },
  { id: 'ema9', type: 'EMA', period: 9, color: '#e040fb', visible: true },
];

export function useIndicators() {
  const [indicators, setIndicators] = useState<IndicatorConfig[]>(DEFAULT_INDICATORS);
  const indicatorsRef = useRef<IndicatorConfig[]>(DEFAULT_INDICATORS);
  const [indicatorValues, setIndicatorValues] = useState<Map<string, IndicatorValue[]>>(new Map());
  const [showIndicatorPicker, setShowIndicatorPicker] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState<IndicatorConfig | null>(null);

  const candlesRef = useRef<Candle[]>([]);

  const recalcIndicators = useCallback((newCandles: Candle[]) => {
    const newValues = new Map<string, IndicatorValue[]>();
    for (const cfg of indicatorsRef.current) {
      if (cfg.visible) {
        newValues.set(cfg.id, calculateIndicator(newCandles, cfg));
      }
    }
    setIndicatorValues(newValues);
  }, []);

  // Keep candlesRef updated (called externally via updateCandles)
  const updateCandles = useCallback((c: Candle[]) => {
    candlesRef.current = c;
  }, []);

  // Keep indicatorsRef in sync
  useEffect(() => {
    indicatorsRef.current = indicators;
    if (candlesRef.current.length > 0) {
      recalcIndicators(candlesRef.current);
    }
  }, [indicators, recalcIndicators]);

  const nextIndicatorId = useRef(1);

  const handleAddIndicator = useCallback((type: IndicatorType) => {
    const gid = `${type.toLowerCase()}_${nextIndicatorId.current++}`;
    if (type === 'BB') {
      setIndicators((prev) => [...prev,
        { id: `${gid}_u`, type, period: 20, color: '#2196f3', visible: true, output: 'upper', groupId: gid },
        { id: `${gid}_m`, type, period: 20, color: '#787b86', visible: true, output: 'middle', groupId: gid },
        { id: `${gid}_l`, type, period: 20, color: '#2196f3', visible: true, output: 'lower', groupId: gid },
      ]);
      return;
    }
    if (type === 'MACD') {
      setIndicators((prev) => [...prev,
        { id: `${gid}_m`, type, period: 0, color: '#2196f3', visible: true, output: 'macd', groupId: gid },
        { id: `${gid}_s`, type, period: 0, color: '#ff5722', visible: true, output: 'signal', groupId: gid },
      ]);
      return;
    }
    if (type === 'STOCH') {
      setIndicators((prev) => [...prev,
        { id: `${gid}_k`, type, period: 14, color: '#2196f3', visible: true, output: 'k', groupId: gid },
        { id: `${gid}_d`, type, period: 14, color: '#ff5722', visible: true, output: 'd', groupId: gid },
      ]);
      return;
    }
    const defaults: Record<IndicatorType, { period: number; color: string }> = {
      SMA: { period: 20, color: '#ff9800' }, EMA: { period: 9, color: '#e040fb' },
      WMA: { period: 20, color: '#ff5722' }, DEMA: { period: 20, color: '#00bcd4' },
      TEMA: { period: 20, color: '#8bc34a' }, HMA: { period: 9, color: '#ffeb3b' },
      VWAP: { period: 0, color: '#2196f3' }, BB: { period: 20, color: '#2196f3' },
      ATR: { period: 14, color: '#ff9800' }, RSI: { period: 14, color: '#4caf50' },
      MACD: { period: 0, color: '#2196f3' }, STOCH: { period: 14, color: '#2196f3' },
      CCI: { period: 20, color: '#9c27b0' }, WILLR: { period: 14, color: '#e91e63' },
      MOM: { period: 10, color: '#3f51b5' }, ROC: { period: 12, color: '#795548' },
      ADX: { period: 14, color: '#ff4081' }, TRIX: { period: 15, color: '#00e676' },
      MFI: { period: 14, color: '#009688' }, OBV: { period: 0, color: '#607d8b' },
    };
    const cfg = defaults[type];
    setIndicators((prev) => [...prev, { id: gid, type, period: cfg.period, color: cfg.color, visible: true }]);
  }, []);

  const handleRemoveIndicator = useCallback((id: string) => {
    setIndicators((prev) => {
      const t = prev.find((i) => i.id === id);
      if (t?.groupId) return prev.filter((i) => i.groupId !== t.groupId);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const handleToggleIndicator = useCallback((id: string) => {
    setIndicators((prev) => {
      const t = prev.find((i) => i.id === id);
      if (t?.groupId) {
        const vis = !t.visible;
        return prev.map((i) => (i.groupId === t.groupId ? { ...i, visible: vis } : i));
      }
      return prev.map((i) => (i.id === id ? { ...i, visible: !i.visible } : i));
    });
  }, []);

  const handleUpdateIndicator = useCallback((id: string, updates: Partial<IndicatorConfig>) => {
    setIndicators((prev) => {
      const t = prev.find((i) => i.id === id);
      if (t?.groupId && updates.period != null) {
        return prev.map((i) => {
          if (i.id === id) return { ...i, ...updates };
          if (i.groupId === t.groupId) return { ...i, period: updates.period! };
          return i;
        });
      }
      return prev.map((i) => (i.id === id ? { ...i, ...updates } : i));
    });
  }, []);

  return {
    indicators, indicatorValues, setIndicatorValues,
    showIndicatorPicker, setShowIndicatorPicker,
    editingIndicator, setEditingIndicator,
    recalcIndicators, updateCandles,
    handleAddIndicator, handleRemoveIndicator, handleToggleIndicator, handleUpdateIndicator,
  };
}
