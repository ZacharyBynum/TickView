import { useState, useCallback, useRef, useEffect } from 'react';
import type { Tick } from '../types';
import { parseTicks } from '../lib/csvParser';
import { saveFile, loadCachedFile } from '../lib/tickCache';

export function useFileLoader(initFromTicks: (ticks: Tick[]) => void, setFileLoaded: (v: boolean) => void) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const cacheChecked = useRef(false);

  useEffect(() => {
    if (cacheChecked.current) return;
    cacheChecked.current = true;

    (async () => {
      setIsLoading(true);
      setLoadProgress(10);

      let ticks: Tick[] = [];
      const cached = await loadCachedFile();

      if (cached) {
        ticks = await parseTicks(cached.file, (pct) => {
          setLoadProgress(10 + pct * 0.85);
        });
      } else {
        try {
          const res = await fetch('/default-data.txt');
          if (!res.ok || !res.body) { setIsLoading(false); return; }
          const size = Number(res.headers.get('content-length')) || 0;
          ticks = await parseTicks(res.body, (pct) => {
            setLoadProgress(10 + pct * 0.85);
          }, size);
        } catch { setIsLoading(false); return; }
      }

      if (ticks.length > 0) {
        setLoadProgress(96);
        initFromTicks(ticks);
      }

      setLoadProgress(100);
      setIsLoading(false);
    })();
  }, [initFromTicks, setFileLoaded]);

  const loadFile = useCallback(
    async (file: File) => {
      setIsLoading(true);
      setLoadProgress(0);

      await new Promise<void>(r => setTimeout(r, 0));

      setLoadProgress(10);

      const ticks = await parseTicks(file, (pct) => {
        setLoadProgress(10 + pct * 0.85);
      });

      if (ticks.length === 0) {
        setIsLoading(false);
        alert('No valid tick data found in file.');
        return;
      }

      setLoadProgress(96);
      await new Promise<void>(r => setTimeout(r, 0));
      initFromTicks(ticks);
      setLoadProgress(100);
      await new Promise<void>(r => setTimeout(r, 0));
      setIsLoading(false);

      saveFile(file.name, file).catch(() => {});
    },
    [initFromTicks],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) loadFile(file);
    },
    [loadFile],
  );

  const handleFileSelect = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.csv';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) loadFile(file);
    };
    input.click();
  }, [loadFile]);

  return {
    isLoading, loadProgress, isDragging,
    handleDragOver, handleDragLeave, handleDrop, handleFileSelect,
  };
}
