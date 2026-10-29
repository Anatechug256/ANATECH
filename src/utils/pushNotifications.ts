/**
 * Push Notification Utility for ANATECH MARKET Search Alerts
 * Integrates Web Notifications API to alert users when new listings matching their saved search criteria are posted.
 */

export interface PushPermissionStatus {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
}

/**
 * Checks the current push notification capability and permission state.
 */
export function getPushNotificationStatus(): PushPermissionStatus {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { supported: false, permission: 'unsupported' };
  }
  return {
    supported: true,
    permission: Notification.permission
  };
}

/**
 * Requests push notification permission from the user's browser.
 */
export async function requestPushNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return Notification.permission;
  }
}

/**
 * Displays a native push notification in the browser / operating system.
 */
export function showSearchAlertPushNotification(params: {
  title: string;
  body: string;
  listingId?: string;
  searchName?: string;
  icon?: string;
}): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission !== 'granted') {
    return false;
  }

  try {
    const notification = new Notification(params.title, {
      body: params.body,
      icon: params.icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: `anatech-alert-${params.listingId || Date.now()}`,
      data: {
        listingId: params.listingId,
        url: window.location.href
      }
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return true;
  } catch (err) {
    console.warn('Could not display native notification:', err);
    return false;
  }
}
