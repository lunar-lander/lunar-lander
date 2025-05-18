import React, { useState } from "react";
import Sidebar from "../Sidebar/Sidebar";
import styles from "./Layout.module.css";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  return (
    <div className={styles.container}>
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
        <Sidebar collapsed={sidebarCollapsed} />
      </aside>
      <div className={styles.sidebarToggle} onClick={toggleSidebar}>
        {sidebarCollapsed ? '›' : '‹'}
      </div>
      <main className={styles.content}>{children}</main>
    </div>
  );
};

export default Layout;
