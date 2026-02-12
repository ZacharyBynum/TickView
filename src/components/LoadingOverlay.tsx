import { useState, useEffect, useMemo } from 'react';

interface LoadingOverlayProps {
  loadProgress: number;
}

const LOADING_MESSAGES = [
  'Hold on.', 'Working on it.', 'Bear with.', 'One sec.',
  'Almost there. Allegedly.', 'Doing math.', 'Thinking real hard.',
  'Please enjoy this progress bar.', 'Not frozen. Promise.',
  'Wrangling rectangles.', 'Reading. A lot.', 'This part\'s boring. Sorry.',
  'Sorting chaos.', 'Trust the process.', 'Crunching.', 'Getting there.',
  'Rectangles incoming.', 'Hang tight.',
];

export default function LoadingOverlay({ loadProgress }: LoadingOverlayProps) {
  const msgCount = LOADING_MESSAGES.length;
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(() => Math.floor(Math.random() * msgCount));
  const [loadingMsgVisible, setLoadingMsgVisible] = useState(true);

  const loadingMessages = useMemo(() => LOADING_MESSAGES, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingMsgVisible(false);
      setTimeout(() => {
        setLoadingMsgIdx(i => (i + 1) % msgCount);
        setLoadingMsgVisible(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, [msgCount]);

  return (
    <div className="app">
      <div className="loading-overlay">
        <div className="loading-pct">{loadProgress.toFixed(0)}%</div>
        <div className="loading-progress">
          <div className="loading-progress-fill" style={{ width: `${loadProgress}%` }} />
        </div>
        <div className={`loading-msg${loadingMsgVisible ? ' visible' : ''}`}>
          {loadingMessages[loadingMsgIdx]}
        </div>
      </div>
    </div>
  );
}
