import React, { useEffect, useState } from 'react';

interface TimerProps {
  durationInSeconds: number; // Timer duration in seconds
  resetTimer: boolean; // Prop to reset timer
}

const Timer: React.FC<TimerProps> = ({ durationInSeconds, resetTimer }) => {
  const [timeLeft, setTimeLeft] = useState<number>(durationInSeconds);

  useEffect(() => {
    if (resetTimer) {
      setTimeLeft(durationInSeconds); // Reset the timer if resetTimer is true
    }
  }, [resetTimer, durationInSeconds]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setTimeout(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);

      return () => clearTimeout(timerId);
    }
  }, [timeLeft]);

  return (
    <div>
      <p>Time Left: {timeLeft} seconds</p>
    </div>
  );
};

export default Timer;
