import React, { useState, useEffect } from "react";
import { useConfig } from "../../hooks/useConfig";
import styles from "./ZoomSettings.module.css";

const ZoomSettings: React.FC = () => {
  const { zoomLevel, setZoom } = useConfig();
  const [localZoom, setLocalZoom] = useState<number>(1.0);
  
  // Initialize local zoom from config
  useEffect(() => {
    if (zoomLevel) {
      setLocalZoom(zoomLevel);
    }
  }, [zoomLevel]);

  // Predefined zoom levels
  const zoomLevels = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.5];

  // Handle slider change
  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZoom = parseFloat(e.target.value);
    setLocalZoom(newZoom);
    setZoom(newZoom);
  };

  // Handle preset zoom level click
  const handleZoomPreset = (preset: number) => {
    setLocalZoom(preset);
    setZoom(preset);
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Zoom Level</h3>
      
      <div className={styles.zoomControls}>
        <button 
          className={styles.zoomButton}
          onClick={() => handleZoomPreset(Math.max(0.5, localZoom - 0.1))}
          title="Zoom Out"
        >
          −
        </button>
        
        <div className={styles.sliderContainer}>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={localZoom}
            onChange={handleZoomChange}
            className={styles.slider}
          />
          <div className={styles.zoomValue}>{Math.round(localZoom * 100)}%</div>
        </div>
        
        <button 
          className={styles.zoomButton}
          onClick={() => handleZoomPreset(Math.min(2.0, localZoom + 0.1))}
          title="Zoom In"
        >
          +
        </button>
      </div>
      
      <div className={styles.presets}>
        {zoomLevels.map(level => (
          <button
            key={level}
            className={`${styles.presetButton} ${localZoom === level ? styles.active : ''}`}
            onClick={() => handleZoomPreset(level)}
          >
            {Math.round(level * 100)}%
          </button>
        ))}
      </div>
    </div>
  );
};

export default ZoomSettings;