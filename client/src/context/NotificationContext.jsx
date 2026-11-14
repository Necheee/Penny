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
      // 1. Fetch server orders
      let backendOrders = [];
      try {
        const res = await fetch('/api/payments/orders');
        if (res.ok) {
          const data = await res.json();
          backendOrders = Array.isArray(data.data) ? data.data : [];
        }
      } catch (e) {
        // Fallback silently to localStorage
      }

      // 2. Fetch local orders
      let localOrders = [];
      try {
        localOrders = JSON.parse(localStorage.getItem('penny_orders') || '[]');
      } catch (e) {}

      // Combine & deduplicate orders by id
      const combined = [...backendOrders, ...localOrders];
      const seen = new Set();
      const uniqueOrders = [];
      for (const ord of combined) {
        if (ord && ord.id && !seen.has(ord.id)) {
          seen.add(ord.id);
          uniqueOrders.push(ord);
        }
      }

      // Filter by current user
      const userEmail = (user.email || '').toLowerCase().trim();
      const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().trim();

      const userOrders = uniqueOrders.filter(ord => {
        const orderEmail = (ord.email || '').toLowerCase().trim();
        const orderCustomer = (ord.customer || '').toLowerCase().trim();
        if (userEmail && orderEmail && orderEmail === userEmail) return true;
        if (userFullName && orderCustomer && (orderCustomer === userFullName || orderCustomer.includes(userFullName) || userFullName.includes(orderCustomer))) return true;
        if (ord.userId && ord.userId === user.id) return true;
        return false;
      });

      // Filter out deleted orders & dismissed notifications
      let deletedIds = new Set();
      let dismissedIds = new Set();
      try {
        deletedIds = new Set(JSON.parse(localStorage.getItem('penny_deleted_order_ids') || '[]'));
        dismissedIds = new Set(JSON.parse(localStorage.getItem('penny_dismissed_notifications') || '[]'));
      } catch (e) {}

      const activeOrders = userOrders.filter(ord => !deletedIds.has(ord.id) && !dismissedIds.has(ord.id));

      // 3. Fetch customer care inquiries
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

      // Check against seen notification keys
      let seenKeys = new Set();
      try {
        seenKeys = new Set(JSON.parse(localStorage.getItem('penny_seen_notifications') || '[]'));
      } catch (e) {}

      const unreadItems = items.filter(item => !seenKeys.has(item.versionKey));
      setUnreadCount(unreadItems.length);
      setHasUnreadNotifications(unreadItems.length > 0);
    } catch (err) {
      console.warn('Error fetching notifications:', err);
    }
  }, [user]);

  // Mark all active notifications as seen
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
    } catch (e) {}
  }, [notifications]);

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

