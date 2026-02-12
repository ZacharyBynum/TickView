import { useState, useCallback, useRef } from 'react';

export function useBottomPanelResize(initialHeight = 200) {
  const [bottomPanelHeight, setBottomPanelHeight] = useState(initialHeight);
  const isResizingRef = useRef(false);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    const startY = e.clientY;
    const startHeight = bottomPanelHeight;

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizingRef.current) return;
      const delta = startY - ev.clientY;
      const maxH = window.innerHeight * 0.5;
      setBottomPanelHeight(Math.max(120, Math.min(maxH, startHeight + delta)));
    };

    const onMouseUp = () => {
      isResizingRef.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [bottomPanelHeight]);

  return { bottomPanelHeight, handleResizeMouseDown };
}
