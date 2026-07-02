"use client";

import { useEffect, useState } from "react";
import { Bell, Check, X, Presentation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { getNotifications, markNotificationRead, type Notification } from "@/lib/api/notifications";
import { toast } from "sonner";

export function NotificationDrawer() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [presentationNotification, setPresentationNotification] = useState<Notification | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadNotifications();
    // Poll every 10 seconds
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications(10);
      setNotifications(data || []);

      // Check for unread presentation notifications
      const unreadPresentation = data?.find(
        n => !n.is_read && n.type === "presentation"
      );
      if (unreadPresentation) {
        setPresentationNotification(unreadPresentation);
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    try {
      await markNotificationRead(notif.id);
      setNotifications(prev =>
        prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n)
      );
      if (notif.link) {
        router.push(notif.link);
        setShowDrawer(false);
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handlePresentationAcknowledge = async () => {
    if (presentationNotification) {
      try {
        await markNotificationRead(presentationNotification.id);
        setPresentationNotification(null);
        loadNotifications();
        toast.info("Siapkan materimu untuk presentasi!");
      } catch (error) {
        console.error("Failed to acknowledge:", error);
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      {/* Notification Bell Button */}
      <button
        onClick={() => setShowDrawer(!showDrawer)}
        className="relative p-2 hover:bg-muted rounded-lg transition"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Presentation Notification Modal */}
      {presentationNotification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Presentation className="h-5 w-5 text-primary" />
                {presentationNotification.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {presentationNotification.message}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handlePresentationAcknowledge}
                  className="flex-1"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Baik, Saya Siap
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPresentationNotification(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notification Drawer */}
      {showDrawer && (
        <div className="fixed right-0 top-0 h-full w-80 bg-background border-l shadow-lg z-40 overflow-y-auto">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">Notifikasi</h2>
            <button
              onClick={() => setShowDrawer(false)}
              className="p-1 hover:bg-muted rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-2">
            {notifications.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Tidak ada notifikasi
              </p>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3 rounded-lg mb-2 cursor-pointer transition ${
                    notif.is_read
                      ? "bg-muted/50"
                      : "bg-primary/10 hover:bg-primary/20"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!notif.is_read && (
                      <Badge variant="default" className="mt-1">Baru</Badge>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{notif.title}</p>
                      {notif.message && (
                        <p className="text-sm text-muted-foreground">
                          {notif.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
