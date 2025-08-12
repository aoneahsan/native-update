import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UpdateLog {
  timestamp: Date;
  level: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

interface UpdateContextType {
  logs: UpdateLog[];
  addLog: (level: UpdateLog['level'], message: string) => void;
  clearLogs: () => void;
  downloadProgress: number;
  setDownloadProgress: (progress: number) => void;
}

const UpdateContext = createContext<UpdateContextType | undefined>(undefined);

export function UpdateProvider({ children }: { children: ReactNode }) {
  const [logs, setLogs] = useState<UpdateLog[]>([]);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const addLog = (level: UpdateLog['level'], message: string) => {
    setLogs(prev => [...prev, { timestamp: new Date(), level, message }]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <UpdateContext.Provider value={{ logs, addLog, clearLogs, downloadProgress, setDownloadProgress }}>
      {children}
    </UpdateContext.Provider>
  );
}

export function useUpdateContext() {
  const context = useContext(UpdateContext);
  if (!context) {
    throw new Error('useUpdateContext must be used within UpdateProvider');
  }
  return context;
}