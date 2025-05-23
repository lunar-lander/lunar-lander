import React, { useState, useRef, useCallback } from "react";
import Sidebar from "../Sidebar/Sidebar";
import styles from "./Layout.module.css";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

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
  }, []);

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
      <aside 
        ref={sidebarRef}
        className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}
        style={{ width: sidebarCollapsed ? 0 : sidebarWidth }}
      >
        <Sidebar collapsed={sidebarCollapsed} />
      </aside>
      {!sidebarCollapsed && (
        <div 
          className={styles.resizeHandle}
          onMouseDown={handleMouseDown}
          style={{ left: sidebarWidth }}
        />
      )}
      <div 
        className={styles.sidebarToggle} 
        onClick={toggleSidebar}
        style={{ left: sidebarCollapsed ? 0 : sidebarWidth }}
      >
        {sidebarCollapsed ? '›' : '‹'}
      </div>
      <main className={styles.content}>{children}</main>
    </div>
  );
};

export default Layout;
