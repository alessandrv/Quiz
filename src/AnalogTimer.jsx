import React, { useState, useEffect } from 'react';
import { Progress, Button } from 'antd';
import { PauseOutlined, PlayCircleOutlined } from '@ant-design/icons';
import './AnalogTimer.css';

const TimerComponent = ({ totalSeconds, onComplete }) => {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const [isPaused, setIsPaused] = useState(true); // Timer starts paused

  useEffect(() => {
    let timer;

    if (!isPaused && secondsLeft > 0) {
      timer = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000);
    } else if (secondsLeft === 0) {
      onComplete(); // Call onComplete when timer reaches 0
    }

    return () => clearTimeout(timer); // Cleanup the timer on unmount
  }, [isPaused, secondsLeft, onComplete]);

  // Toggle the paused state
  const toggleTimer = () => {
    setIsPaused(!isPaused);
  };

  // Calculate percent remaining (from 100% to 0%)
  const percent = (secondsLeft / totalSeconds) * 100;

  const formatTime = () => <span style={{ color: '#ffffff' }}>{secondsLeft}</span>;

  return (
    <div className="absolute top-4 right-4 w-24 h-24">
      <Progress
        type="circle"
        percent={percent}
        format={formatTime}
        strokeColor={{
          '0%': 'red',
          '100%': 'red',
        }}
      />
      
      {/* Pause/Play Button below the timer */}
      <Button
        type="primary"
        icon={isPaused ? <PlayCircleOutlined /> : <PauseOutlined />}
        onClick={toggleTimer}
        style={{ marginTop: '10px', width:'100%', background:'rgb(248 38 29)'}}
      >
      </Button>
    </div>
  );
};

export default TimerComponent;
