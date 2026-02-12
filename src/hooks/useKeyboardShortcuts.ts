import { useEffect } from 'react';

export interface KeyboardActions {
  onPlayPause?: () => void;
  onReset?: () => void;
  onStepForward?: () => void;
  onStepForward10?: () => void;
  onStepBack?: () => void;
  onTimeframe1?: () => void;
  onTimeframe2?: () => void;
  onTimeframe3?: () => void;
  onTimeframe4?: () => void;
  onTimeframe5?: () => void;
  onSpeedUp?: () => void;
  onSpeedDown?: () => void;
  onBuy?: () => void;
  onSell?: () => void;
  onFlatten?: () => void;
}

export function useKeyboardShortcuts(actions: KeyboardActions): void {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't fire shortcuts when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          actions.onPlayPause?.();
          break;
        case 'KeyR':
          actions.onReset?.();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            actions.onStepForward10?.();
          } else {
            actions.onStepForward?.();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          actions.onStepBack?.();
          break;
        case 'Digit1':
          actions.onTimeframe1?.();
          break;
        case 'Digit2':
          actions.onTimeframe2?.();
          break;
        case 'Digit3':
          actions.onTimeframe3?.();
          break;
        case 'Digit4':
          actions.onTimeframe4?.();
          break;
        case 'Digit5':
          actions.onTimeframe5?.();
          break;
        case 'Equal':
        case 'NumpadAdd':
          actions.onSpeedUp?.();
          break;
        case 'Minus':
        case 'NumpadSubtract':
          actions.onSpeedDown?.();
          break;
        case 'KeyB':
          actions.onBuy?.();
          break;
        case 'KeyS':
          actions.onSell?.();
          break;
        case 'KeyF':
          actions.onFlatten?.();
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions]);
}
