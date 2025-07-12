import { useState, useEffect, useCallback } from 'react';
import { requestNotificationPermission, onMessageListener } from '../firebase';

const usePushNotifications = (user, token) => {
  const [fcmToken, setFcmToken] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [isLoading, setIsLoading] = useState(false);

  // Request notification permission and get FCM token
  const requestPermission = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await requestNotificationPermission();
      if (token) {
        setFcmToken(token);
        setNotificationPermission('granted');
        
        // Send FCM token to server
        if (user && token) {
          await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/push-notifications/fcm-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ fcmToken: token })
          });
        }
        
        return token;
      } else {
        setNotificationPermission('denied');
        return null;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setNotificationPermission('denied');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  // Handle foreground messages
  useEffect(() => {
    if (notificationPermission === 'granted') {
      onMessageListener()
        .then((payload) => {
          console.log('Received foreground message:', payload);
          
          // Show custom notification
          if (payload.notification) {
            const { title, body } = payload.notification;
            const notification = new Notification(title, {
              body,
              icon: '/logo192.png',
              badge: '/logo192.png',
              data: payload.data
            });

            // Handle notification click
            notification.onclick = () => {
              window.focus();
              notification.close();
              
              // Handle different notification types
              if (payload.data?.type) {
                handleNotificationClick(payload.data);
              }
            };
          }
        })
        .catch((error) => {
          console.error('Error handling foreground message:', error);
        });
    }
  }, [notificationPermission]);

  // Handle notification clicks
  const handleNotificationClick = (data) => {
    switch (data.type) {
      case 'like':
      case 'comment':
        // Navigate to post
        if (data.postId) {
          // You can implement navigation logic here
          console.log('Navigate to post:', data.postId);
        }
        break;
      case 'follow':
        // Navigate to user profile
        if (data.senderId) {
          console.log('Navigate to user profile:', data.senderId);
        }
        break;
      case 'message':
        // Navigate to messages
        console.log('Navigate to messages');
        break;
      case 'video_call':
        // Handle video call notification
        console.log('Handle video call notification');
        break;
      default:
        console.log('Unknown notification type:', data.type);
    }
  };

  // Update notification settings
  const updateNotificationSettings = async (settings) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/push-notifications/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notificationSettings: settings })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update notification settings');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  };

  // Get notification settings
  const getNotificationSettings = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/push-notifications/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get notification settings');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting notification settings:', error);
      throw error;
    }
  };

  // Send test notification
  const sendTestNotification = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/push-notifications/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  };

  // Subscribe to topic
  const subscribeToTopic = async (topic) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/push-notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ topic })
      });
      
      if (!response.ok) {
        throw new Error('Failed to subscribe to topic');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      throw error;
    }
  };

  // Unsubscribe from topic
  const unsubscribeFromTopic = async (topic) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/push-notifications/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ topic })
      });
      
      if (!response.ok) {
        throw new Error('Failed to unsubscribe from topic');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      throw error;
    }
  };

  return {
    fcmToken,
    notificationPermission,
    isLoading,
    requestPermission,
    updateNotificationSettings,
    getNotificationSettings,
    sendTestNotification,
    subscribeToTopic,
    unsubscribeFromTopic
  };
};

export default usePushNotifications; 