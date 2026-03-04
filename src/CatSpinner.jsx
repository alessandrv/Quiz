import React from 'react';
import './App.css';

function CatSpinner({ size = 96 }) {
  return (
    <div
      className="box"
      style={{
        width: `${size}px`,
        '--cat-sprite': `url('${process.env.PUBLIC_URL}/gattospinner.png')`,
      }}
    >
      <div className="cat" aria-label="Caricamento" role="img">
        <div className="cat__body" />
        <div className="cat__body" />
        <div className="cat__tail" />
        <div className="cat__head" />
      </div>
    </div>
  );
}

export default CatSpinner;
