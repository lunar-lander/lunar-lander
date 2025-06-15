import React, { useState, useRef, useCallback, useEffect } from "react";
import Sidebar from "../Sidebar/Sidebar";
import styles from "./Layout.module.css";
import { useConfig } from "../../hooks/useConfig";

interface LayoutProps {
  children: React.ReactNode;
}

// Mobile detection
const isMobile = () => {
  return window.innerWidth <= 768;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { sidebarWidth: configSidebarWidth, setSidebarWidthPersistent } = useConfig();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile()); // Start collapsed on mobile
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const [showMobileOverlay, setShowMobileOverlay] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Sync with config
  useEffect(() => {
    if (configSidebarWidth) {
      setSidebarWidth(configSidebarWidth);
    }
  }, [configSidebarWidth]);

  const toggleSidebar = () => {
    const mobile = isMobile();
    setSidebarCollapsed(prev => {
      const newCollapsed = !prev;
      if (mobile) {
        setShowMobileOverlay(!newCollapsed);
      }
      return newCollapsed;
    });
  };

  const closeMobileSidebar = () => {
    if (isMobile()) {
      setSidebarCollapsed(true);
      setShowMobileOverlay(false);
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = isMobile();
      if (mobile && !sidebarCollapsed) {
        setShowMobileOverlay(true);
      } else if (!mobile) {
        setShowMobileOverlay(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarCollapsed]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = Math.max(200, Math.min(500, e.clientX));
    setSidebarWidth(newWidth);
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    // Save the final width to config
    if (setSidebarWidthPersistent) {
      setSidebarWidthPersistent(sidebarWidth);
    }
  }, [sidebarWidth, setSidebarWidthPersistent]);

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div className={styles.container}>
      {/* Mobile overlay */}
      {showMobileOverlay && (
        <div 
          className={`${styles.mobileOverlay} ${showMobileOverlay ? styles.visible : ''}`}
          onClick={closeMobileSidebar}
        />
      )}
      
      <aside 
        ref={sidebarRef}
        className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}
        style={{ width: sidebarCollapsed ? 0 : sidebarWidth }}
      >
        <Sidebar collapsed={sidebarCollapsed} onMobileClose={closeMobileSidebar} />
      </aside>
      
      {!sidebarCollapsed && !isMobile() && (
        <div 
          className={styles.resizeHandle}
          onMouseDown={handleMouseDown}
          style={{ left: sidebarWidth }}
        />
      )}
      
      <div 
        className={styles.sidebarToggle} 
        onClick={toggleSidebar}
        style={{ left: sidebarCollapsed ? 0 : (isMobile() ? 0 : sidebarWidth) }}
        title={sidebarCollapsed ? 'Show Sidebar' : 'Hide Sidebar'}
      >
        {sidebarCollapsed ? '☰' : '‹'}
      </div>
      
      <main className={styles.content}>{children}</main>
    </div>
  );
};

export default Layout;
