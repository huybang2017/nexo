import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotifications, useMarkAsRead, useMarkAllAsRead, useDeleteNotification } from '@/hooks/useNotification';
import { formatDate } from '@/lib/utils';
import { 
  Bell, 
  BellOff, 
  CheckCircle, 
  CreditCard, 
  FileText, 
  Shield, 
  Wallet,
  Settings,
  Trash2
} from 'lucide-react';

const typeIcons: Record<string, React.ElementType> = {
  SYSTEM: Settings,
  LOAN: FileText,
  INVESTMENT: CreditCard,
  PAYMENT: Wallet,
  KYC: Shield,
  SECURITY: Shield,
};

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = data?.content || [];
  const unreadNotifications = notifications.filter((n: any) => !n.isRead);

  const handleMarkAsRead = (id: number) => {
    markAsRead.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this notification?')) {
      deleteNotification.mutate(id);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadNotifications.length} unread notifications
          </p>
        </div>
        {unreadNotifications.length > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadNotifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-20" />
                </Card>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground">
                  You're all caught up! Check back later for updates.
                </p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification: any) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="unread" className="space-y-4 mt-4">
          {unreadNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">All caught up!</h3>
                <p className="text-muted-foreground">
                  You have no unread notifications.
                </p>
              </CardContent>
            </Card>
          ) : (
            unreadNotifications.map((notification: any) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function NotificationCard({ notification, onMarkAsRead, onDelete }: { 
  notification: any; 
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const Icon = typeIcons[notification.type] || Bell;

  return (
    <Card className={`card-hover ${!notification.isRead ? 'border-primary/50 bg-primary/5' : ''}`}>
      <CardContent className="py-4">
        <div className="flex gap-4">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
            !notification.isRead ? 'bg-primary/10' : 'bg-muted'
          }`}>
            <Icon className={`h-5 w-5 ${!notification.isRead ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className={`font-medium ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {notification.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
              </div>
              {!notification.isRead && (
                <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
              )}
            </div>

            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground">
                {formatDate(notification.createdAt)}
              </span>
              <div className="flex items-center gap-2">
                {!notification.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMarkAsRead(notification.id)}
                  >
                    Mark as read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(notification.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


