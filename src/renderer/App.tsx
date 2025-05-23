import React from "react";
import Layout from "./components/Layout/Layout";
import Chat from "./components/Chat/Chat";
import Settings from "./components/Settings/Settings";
import ZoomControls from "./components/ZoomControls";
import { AppProvider, useAppContext } from "./contexts/AppContext";
import { ShortcutsProvider } from "./contexts/ShortcutsContext";
import styles from "./App.module.css";

const MainContent: React.FC = () => {
  const { currentView, activeChat } = useAppContext();

  return (
    <div className={styles.main}>
      {currentView === "chat" ? (
        <Chat chatId={activeChat || undefined} />
      ) : (
        <Settings />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <ShortcutsProvider>
        <Layout>
          <MainContent />
          <ZoomControls />
        </Layout>
      </ShortcutsProvider>
    </AppProvider>
  );
};

export default App;
