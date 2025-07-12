import { useEffect, useState } from 'react';

export const usePushNotifications = () => {
  const [permission, setPermission] = useState('default');
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    // Check if the browser supports notifications
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return;
    }

    // Set initial permission state
    setPermission(Notification.permission);

    // Request permission if not granted
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        setPermission(permission);
      });
    }
  }, []);

  // Function to show incoming call notification
  const showIncomingCallNotification = (callerName, callType) => {
    if (Notification.permission === 'granted') {
      const notification = new Notification('Incoming Call', {
        body: `${callerName} is calling you (${callType === 'voice' ? 'Voice' : 'Video'} call)`,
        icon: '/logo192.png', // Use your app's icon
        badge: '/logo192.png',
        tag: 'incoming-call', // Prevents multiple notifications
        requireInteraction: true, // Notification stays until user interacts
        actions: [
          {
            action: 'accept',
            title: 'Accept',
            icon: '/accept-call.png' // You can add custom icons
          },
          {
            action: 'decline',
            title: 'Decline',
            icon: '/decline-call.png'
          }
        ]
      });

      // Handle notification clicks
      notification.onclick = (event) => {
        // Focus the window/tab
        window.focus();
        
        // You can add custom handling here
        console.log('Notification clicked:', event);
      };

      // Handle notification action clicks
      notification.onactionclick = (event) => {
        console.log('Notification action clicked:', event.action);
        // You can trigger accept/decline actions here
      };

      return notification;
    }
  };

  // Function to show general notification
  const showNotification = (title, options = {}) => {
    if (Notification.permission === 'granted') {
      return new Notification(title, {
        icon: '/logo192.png',
        badge: '/logo192.png',
        ...options
      });
    }
  };

  // Function to request notification permission
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  return {
    permission,
    subscription,
    showIncomingCallNotification,
    showNotification,
    requestPermission
  };
}; 