import React, { useState, useEffect } from 'react';
import AnalogTimer from './AnalogTimer';

const TimerContainer = () => {
  const [permille, setPermille] = useState(1000);
  const radius = 100;
  const thickness = 15;
  const cc = false;

  // Countdown logic
  useEffect(() => {
    // Set the duration of the countdown
    const duration = 40; // seconds
    const intervalTime = (duration * 1000) / 1000; // milliseconds per permille decrement

    const interval = setInterval(() => {
      setPermille((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0; // Stop at 0
        }
        return prev - 1; // Decrease permille
      });
    }, intervalTime);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  // Calculate remaining time in seconds
  const remainingTime = Math.ceil(permille / 25); // 1000 permille = 40 seconds (1000/40 = 25 permille per second)

  // Calculate value based on permille
  const value = permille / 1000.0;

  return (
    <div id="v" style={{ textAlign: 'center' }}>
      <div id="meter" style={{ position: 'relative' }}>
        <AnalogTimer
          radius={radius}
          value={value}
          cc={cc}
          thickness={thickness}
        />
        {/* Text counter in the middle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '24px', // Adjust font size as needed
            fontWeight: 'bold',
          }}
        >
          {remainingTime} s
        </div>
      </div>
    </div>
  );
};

export default TimerContainer;
