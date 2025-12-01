import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  CreditCard,
  FileCheck,
  Ban,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { useAdminUser, useUpdateUserStatus, useBanUser, useUnbanUser } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn, formatDate, formatCurrency, getInitials } from '@/lib/utils';
import { useState } from 'react';
import type { UserStatus } from '@/types';

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  SUSPENDED: 'bg-red-500/10 text-red-400 border-red-500/30',
  BANNED: 'bg-red-500/10 text-red-400 border-red-500/30',
};

const roleColors: Record<string, string> = {
  ADMIN: 'bg-violet-500/10 text-violet-400',
  BORROWER: 'bg-blue-500/10 text-blue-400',
  LENDER: 'bg-emerald-500/10 text-emerald-400',
};

export const UserDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: user, isLoading } = useAdminUser(Number(id));
  const updateStatus = useUpdateUserStatus();
  const banUser = useBanUser();
  const unbanUser = useUnbanUser();

  const [showBanDialog, setShowBanDialog] = useState(false);
  const [banReason, setBanReason] = useState('');

  const handleBan = () => {
    if (!banReason.trim()) {
      return;
    }
    banUser.mutate(
      { id: Number(id), reason: banReason },
      {
        onSuccess: () => {
          setShowBanDialog(false);
          setBanReason('');
        },
      }
    );
  };

  const handleUnban = () => {
    unbanUser.mutate(Number(id));
  };

  const handleStatusChange = (status: UserStatus) => {
    updateStatus.mutate({ id: Number(id), status });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">User not found</p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/admin/users">Back to Users</Link>
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/users')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">User Details</h1>
            <p className="text-slate-400 mt-1">View and manage user information</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user.status === 'BANNED' ? (
            <Button
              variant="outline"
              onClick={handleUnban}
              disabled={unbanUser.isPending}
              className="border-emerald-500 text-emerald-400 hover:bg-emerald-500/10"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {unbanUser.isPending ? 'Unbanning...' : 'Unban User'}
            </Button>
          ) : (
            <>
              {user.status === 'ACTIVE' && (
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange('SUSPENDED')}
                  disabled={updateStatus.isPending}
                  className="border-amber-500 text-amber-400 hover:bg-amber-500/10"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Suspend
                </Button>
              )}
              {user.status === 'SUSPENDED' && (
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange('ACTIVE')}
                  disabled={updateStatus.isPending}
                  className="border-emerald-500 text-emerald-400 hover:bg-emerald-500/10"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Activate
                </Button>
              )}
              {user.role !== 'ADMIN' && (
                <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
                  <DialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={banUser.isPending}
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Ban User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-800">
                    <DialogHeader>
                      <DialogTitle className="text-white">Ban User</DialogTitle>
                      <DialogDescription className="text-slate-400">
                        Are you sure you want to ban this user? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="reason" className="text-slate-300">
                          Reason (Optional)
                        </Label>
                        <Textarea
                          id="reason"
                          placeholder="Enter reason for banning..."
                          value={banReason}
                          onChange={(e) => setBanReason(e.target.value)}
                          className="bg-slate-800 border-slate-700 text-white"
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowBanDialog(false);
                          setBanReason('');
                        }}
                        className="border-slate-700"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleBan}
                        disabled={banUser.isPending}
                      >
                        {banUser.isPending ? 'Banning...' : 'Ban User'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </>
          )}
        </div>
      </div>

      {/* User Info Card */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-xl">
                {getInitials(user.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-white text-2xl">{user.fullName}</CardTitle>
              <CardDescription className="text-slate-400 mt-1">{user.email}</CardDescription>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={cn('border', roleColors[user.role])}>
                  {user.role}
                </Badge>
                <Badge className={cn('border', statusColors[user.status])}>
                  {user.status}
                </Badge>
                {user.kycStatus && (
                  <Badge
                    className={cn(
                      'border',
                      user.kycStatus === 'APPROVED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : user.kycStatus === 'PENDING'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                    )}
                  >
                    KYC: {user.kycStatus}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="bg-slate-800 border-slate-700">
              <TabsTrigger value="info" className="data-[state=active]:bg-slate-700">
                Information
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-slate-700">
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-4 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-slate-400 text-sm">Email</p>
                      <p className="text-white font-medium">{user.email}</p>
                    </div>
                  </div>
                  {user.phoneNumber && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-slate-400 text-sm">Phone</p>
                        <p className="text-white font-medium">{user.phoneNumber}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-slate-400 text-sm">Joined</p>
                      <p className="text-white font-medium">{formatDate(user.createdAt)}</p>
                    </div>
                  </div>
                  {user.lastLoginAt && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-slate-400 text-sm">Last Login</p>
                        <p className="text-white font-medium">{formatDate(user.lastLoginAt)}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-slate-400 text-sm">Status</p>
                      <Badge className={cn('border mt-1', statusColors[user.status])}>
                        {user.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-slate-400 text-sm">Role</p>
                      <Badge className={cn('mt-1', roleColors[user.role])}>
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                  {user.oauthProvider && (
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-slate-400 text-sm">OAuth Provider</p>
                        <p className="text-white font-medium">{user.oauthProvider}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4 mt-6">
              <div className="text-center py-8 text-slate-400">
                <Activity className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                <p>Activity logs will be displayed here</p>
                <p className="text-sm mt-1">This feature is coming soon</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default UserDetailPage;

