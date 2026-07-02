import { api, unwrapData } from "./client";

export interface Notification {
  id: number;
  user_id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export async function getNotifications(limit = 20): Promise<Notification[]> {
  const res = await api.get(`/notifications?limit=${limit}`);
  return unwrapData<Notification[]>(res);
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.put(`/notifications/${id}/read`, {});
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.put(`/notifications/read-all`, {});
}

export async function getUnreadCount(): Promise<number> {
  const res = await api.get("/notifications/unread-count");
  return unwrapData<number>(res);
}
