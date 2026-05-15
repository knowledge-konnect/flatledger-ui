import { useState } from 'react';

// Mock unread count for MVP - Replace with API data later
export function useNotificationCount() {
  const [unreadCount] = useState(2); // Initial mock count

  // In a real implementation, this would fetch from an API
  // useEffect(() => {
  //   const fetchUnreadCount = async () => {
  //     const count = await notificationsApi.getUnreadCount();
  //     setUnreadCount(count);
  //   };
  //   fetchUnreadCount();
  // }, []);

  return unreadCount;
}
