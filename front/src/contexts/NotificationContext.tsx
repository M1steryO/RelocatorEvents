import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Notification } from '../components/Notification';

interface NotificationData {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
}

interface NotificationContextType {
  showNotification: (message: string, type?: 'error' | 'success' | 'info') => void;
}

// Global notification handler for use outside React components
let globalNotificationHandler: ((message: string, type?: 'error' | 'success' | 'info') => void) | null = null;

export const setGlobalNotificationHandler = (handler: (message: string, type?: 'error' | 'success' | 'info') => void) => {
  globalNotificationHandler = handler;
};

export const showGlobalNotification = (message: string, type?: 'error' | 'success' | 'info') => {
  if (globalNotificationHandler) {
    globalNotificationHandler(message, type);
  }
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const showNotification = (message: string, type: 'error' | 'success' | 'info' = 'error') => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setNotifications((prev) => [...prev, { id, message, type }]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Set global notification handler on mount
  useEffect(() => {
    setGlobalNotificationHandler(showNotification);
    return () => {
      setGlobalNotificationHandler(() => {});
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="notification-container">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

