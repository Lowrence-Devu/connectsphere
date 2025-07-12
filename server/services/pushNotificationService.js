const admin = require('firebase-admin');

// Initialize Firebase Admin
let messaging = null;

try {
  let serviceAccount;
  
  // Check if we have the required environment variables
  const hasFirebaseConfig = process.env.FIREBASE_PROJECT_ID && 
                           process.env.FIREBASE_CLIENT_EMAIL && 
                           process.env.FIREBASE_PRIVATE_KEY;
  
  if (!hasFirebaseConfig) {
    console.log('Firebase credentials not found in environment variables');
    console.log('Push notifications will be disabled');
    throw new Error('Firebase credentials not configured');
  }

  try {
    serviceAccount = require('../config/firebase-service-account.json');
  } catch (error) {
    console.log('Firebase service account file not found, using environment variables');
    serviceAccount = {
      type: process.env.FIREBASE_TYPE || 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
      token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
    };
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });
  }

  messaging = admin.messaging();
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.log('Firebase Admin SDK initialization failed:', error.message);
  console.log('Push notifications will be disabled');
  messaging = null;
}

// Send notification to a single user
const sendNotification = async (fcmToken, notification) => {
  if (!messaging) {
    console.log('Firebase messaging not initialized, skipping notification');
    return { success: false, message: 'Firebase not configured' };
  }

  try {
    const message = {
      token: fcmToken,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#4CAF50',
          sound: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      },
      webpush: {
        notification: {
          icon: '/logo192.png',
          badge: '/logo192.png',
          actions: [
            {
              action: 'open',
              title: 'Open App'
            },
            {
              action: 'close',
              title: 'Close'
            }
          ]
        }
      }
    };

    const response = await messaging.send(message);
    console.log('Successfully sent notification:', response);
    return response;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// Send notification to multiple users
const sendNotificationToMultipleUsers = async (fcmTokens, notification) => {
  if (!messaging) {
    console.log('Firebase messaging not initialized, skipping notifications');
    return { success: false, message: 'Firebase not configured' };
  }

  try {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#4CAF50',
          sound: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      },
      webpush: {
        notification: {
          icon: '/logo192.png',
          badge: '/logo192.png',
          actions: [
            {
              action: 'open',
              title: 'Open App'
            },
            {
              action: 'close',
              title: 'Close'
            }
          ]
        }
      }
    };

    const response = await messaging.sendMulticast({
      tokens: fcmTokens,
      ...message
    });

    console.log('Successfully sent notifications:', response.successCount, 'of', fcmTokens.length);
    return response;
  } catch (error) {
    console.error('Error sending notifications:', error);
    throw error;
  }
};

// Send notification to a topic
const sendNotificationToTopic = async (topic, notification) => {
  if (!messaging) {
    console.log('Firebase messaging not initialized, skipping topic notification');
    return { success: false, message: 'Firebase not configured' };
  }

  try {
    const message = {
      topic: topic,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {},
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#4CAF50',
          sound: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      },
      webpush: {
        notification: {
          icon: '/logo192.png',
          badge: '/logo192.png',
          actions: [
            {
              action: 'open',
              title: 'Open App'
            },
            {
              action: 'close',
              title: 'Close'
            }
          ]
        }
      }
    };

    const response = await messaging.send(message);
    console.log('Successfully sent topic notification:', response);
    return response;
  } catch (error) {
    console.error('Error sending topic notification:', error);
    throw error;
  }
};

// Subscribe user to a topic
const subscribeToTopic = async (fcmToken, topic) => {
  if (!messaging) {
    console.log('Firebase messaging not initialized, skipping topic subscription');
    return { success: false, message: 'Firebase not configured' };
  }

  try {
    const response = await messaging.subscribeToTopic(fcmToken, topic);
    console.log('Successfully subscribed to topic:', response);
    return response;
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    throw error;
  }
};

// Unsubscribe user from a topic
const unsubscribeFromTopic = async (fcmToken, topic) => {
  if (!messaging) {
    console.log('Firebase messaging not initialized, skipping topic unsubscription');
    return { success: false, message: 'Firebase not configured' };
  }

  try {
    const response = await messaging.unsubscribeFromTopic(fcmToken, topic);
    console.log('Successfully unsubscribed from topic:', response);
    return response;
  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
    throw error;
  }
};

module.exports = {
  sendNotification,
  sendNotificationToMultipleUsers,
  sendNotificationToTopic,
  subscribeToTopic,
  unsubscribeFromTopic
}; 