import React, { useEffect } from 'react';
import { useConfig } from '../hooks/useConfig';

// Component to handle zoom keyboard shortcuts
const ZoomControls: React.FC = () => {
  const { zoomLevel, setZoom } = useConfig();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle Ctrl/Cmd + Plus to zoom in
      if ((event.ctrlKey || event.metaKey) && (event.key === '=' || event.key === '+')) {
        event.preventDefault();
        if (zoomLevel < 2.0) {
          setZoom(Math.min(2.0, Math.round((zoomLevel + 0.1) * 10) / 10));
        }
      }
      
      // Handle Ctrl/Cmd + Minus to zoom out
      if ((event.ctrlKey || event.metaKey) && event.key === '-') {
        event.preventDefault();
        if (zoomLevel > 0.5) {
          setZoom(Math.max(0.5, Math.round((zoomLevel - 0.1) * 10) / 10));
        }
      }
      
      // Handle Ctrl/Cmd + 0 to reset zoom
      if ((event.ctrlKey || event.metaKey) && event.key === '0') {
        event.preventDefault();
        setZoom(1.0);
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);
    
    // Remove event listener on cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [zoomLevel, setZoom]);

  // This is an invisible component that only handles keyboard events
  return null;
};

export default ZoomControls;