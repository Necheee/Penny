import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setHasUnreadNotifications(false);
      setUnreadCount(0);
      return;
    }

    try {
      const userEmail = (user.email || '').toLowerCase().trim();
      const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      const userId = user.id || '';
      const token = localStorage.getItem('penny_customer_token');

      // 1. Fetch cloud notifications state (seen & dismissed)
      let cloudDismissed = [];
      let cloudSeen = [];
      try {
        const stateRes = await fetch(`/api/auth/notifications-state?email=${encodeURIComponent(userEmail)}&userId=${encodeURIComponent(userId)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (stateRes.ok) {
          const stateData = await stateRes.json();
          cloudDismissed = Array.isArray(stateData.dismissedNotifications) ? stateData.dismissedNotifications : [];
          cloudSeen = Array.isArray(stateData.seenNotifications) ? stateData.seenNotifications : [];
          if (cloudDismissed.length > 0) {
            try {
              const currentLocal = JSON.parse(localStorage.getItem('penny_dismissed_notifications') || '[]');
              const merged = Array.from(new Set([...currentLocal, ...cloudDismissed]));
              localStorage.setItem('penny_dismissed_notifications', JSON.stringify(merged));
            } catch {}
          }
        }
      } catch (e) {}

      // 2. Fetch server orders strictly for the authenticated customer
      let backendOrders = [];
      try {
        const queryParams = new URLSearchParams();
        if (userEmail) queryParams.append('email', userEmail);
        if (userId) queryParams.append('userId', userId);
        if (userFullName) queryParams.append('customer', userFullName);

        const res = await fetch(`/api/payments/my-orders?${queryParams.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          backendOrders = Array.isArray(data.data) ? data.data : [];
        }
      } catch (e) {}

      const userOrders = backendOrders.filter(ord => {
        const orderEmail = (ord.email || '').toLowerCase().trim();
        const orderCustomer = (ord.customer || '').toLowerCase().trim();
        if (userId && ord.userId && ord.userId === userId) return true;
        if (userEmail && orderEmail && orderEmail === userEmail) return true;
        if (userFullName && orderCustomer && (orderCustomer === userFullName.toLowerCase() || orderCustomer.includes(userFullName.toLowerCase()) || userFullName.toLowerCase().includes(orderCustomer))) return true;
        return false;
      });

      // Filter out dismissed notifications (merging local + cloud)
      let dismissedIds = new Set(cloudDismissed);
      try {
        const localDismissed = JSON.parse(localStorage.getItem('penny_dismissed_notifications') || '[]');
        localDismissed.forEach(id => dismissedIds.add(id));
      } catch (e) {}

      const activeOrders = userOrders.filter(ord => !dismissedIds.has(ord.id));

      // 4. Fetch customer care inquiries
      let userInquiries = [];
      try {
        const inqRes = await fetch(`/api/contact/my-inquiries?email=${encodeURIComponent(user.email)}&userId=${encodeURIComponent(user.id || '')}`);
        if (inqRes.ok) {
          const inqData = await inqRes.json();
          userInquiries = Array.isArray(inqData.data) ? inqData.data : [];
        }
      } catch (e) {}

      const repliedInquiries = userInquiries.filter(i => (i.reply || i.status === 'replied') && !dismissedIds.has(i.id));

      // Build active notifications list
      const items = [];

      for (const ord of activeOrders) {
        const isBankTransfer = ord.paymentMethod === 'bank_transfer';
        const isPaymentConfirmed = ord.paymentConfirmed || !isBankTransfer;
        const status = ord.status || (isPaymentConfirmed ? 'Processing' : 'Awaiting Payment');
        const versionKey = `order_${ord.id}_${status}_${isPaymentConfirmed ? 'paid' : 'unpaid'}`;

        items.push({
          id: ord.id,
          type: 'order',
          title: `Order #${ord.id}`,
          status,
          date: ord.createdAt || new Date().toISOString(),
          versionKey,
          data: ord
        });
      }

      for (const inq of repliedInquiries) {
        const versionKey = `inquiry_${inq.id}_${inq.repliedAt || inq.reply}`;
        items.push({
          id: inq.id,
          type: 'inquiry',
          title: `Customer Care Response #${inq.id}`,
          status: 'Replied',
          date: inq.repliedAt || inq.createdAt || new Date().toISOString(),
          versionKey,
          data: inq
        });
      }

      // Sort newest first
      items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setNotifications(items);

      // Check against seen notification keys (merging local + cloud)
      let seenKeys = new Set(cloudSeen);
      try {
        const localSeen = JSON.parse(localStorage.getItem('penny_seen_notifications') || '[]');
        localSeen.forEach(k => seenKeys.add(k));
      } catch (e) {}

      const unreadItems = items.filter(item => !seenKeys.has(item.versionKey));
      setUnreadCount(unreadItems.length);
      setHasUnreadNotifications(unreadItems.length > 0);
    } catch (err) {
      console.warn('Error fetching notifications:', err);
    }
  }, [user]);

  // Mark all active notifications as seen with cross-device cloud sync
  const markAllAsSeen = useCallback(() => {
    if (notifications.length === 0) {
      setHasUnreadNotifications(false);
      setUnreadCount(0);
      return;
    }
    try {
      const existing = JSON.parse(localStorage.getItem('penny_seen_notifications') || '[]');
      const updated = Array.from(new Set([...existing, ...notifications.map(n => n.versionKey)]));
      localStorage.setItem('penny_seen_notifications', JSON.stringify(updated));
      setHasUnreadNotifications(false);
      setUnreadCount(0);

      if (user) {
        const token = localStorage.getItem('penny_customer_token');
        fetch('/api/auth/notifications-state', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            email: user.email,
            userId: user.id,
            seenNotifications: updated,
          }),
        }).catch(() => {});
      }
    } catch (e) {}
  }, [notifications, user]);

  // Sync on mount, user change, or update event
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 12000);
    const handleUpdate = () => fetchNotifications();

    window.addEventListener('penny_notifications_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('penny_notifications_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      hasUnreadNotifications,
      markAllAsSeen,
      refreshNotifications: fetchNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    return {
      notifications: [],
      unreadCount: 0,
      hasUnreadNotifications: false,
      markAllAsSeen: () => {},
      refreshNotifications: () => {}
    };
  }
  return context;
}

