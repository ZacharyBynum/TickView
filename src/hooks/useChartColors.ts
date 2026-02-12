import { useState, useCallback } from 'react';
import type { ChartColors } from '../types';
import { DEFAULT_CHART_COLORS } from '../types';

export function useChartColors() {
  const [chartColors, setChartColors] = useState<ChartColors>(() => {
    try {
      const stored = localStorage.getItem('tickview-chart-colors');
      if (stored) return JSON.parse(stored) as ChartColors;
    } catch { /* ignore */ }
    return { ...DEFAULT_CHART_COLORS };
  });
  const [showChartSettings, setShowChartSettings] = useState(false);

  const handleChartColorsChange = useCallback((colors: ChartColors) => {
    setChartColors(colors);
    localStorage.setItem('tickview-chart-colors', JSON.stringify(colors));
  }, []);

  return { chartColors, showChartSettings, setShowChartSettings, handleChartColorsChange };
}
