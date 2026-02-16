import { useEffect } from 'react';
import './Notification.css';

interface NotificationProps {
  message: string;
  type: 'error' | 'success' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Notification = ({ message, type, onClose, duration = 5000 }: NotificationProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`notification notification-${type}`}>
      <div className="notification-content">
        <span className="notification-icon">
          {type === 'error' && '⚠️'}
          {type === 'success' && '✓'}
          {type === 'info' && 'ℹ️'}
        </span>
        <span className="notification-message">{message}</span>
        <button className="notification-close" onClick={onClose} aria-label="Закрыть">
          ×
        </button>
      </div>
    </div>
  );
};







