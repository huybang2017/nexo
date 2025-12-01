import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  CreditCard,
  FileCheck,
  MessageSquare,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { useDashboardStats } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatCurrency } from '@/lib/utils';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export const AdminDashboard = () => {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-2xl md:text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 mt-1">Platform overview and management</p>
      </motion.div>

      {/* Quick Actions - Items needing attention */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-300 text-sm font-medium">Pending KYC</p>
                {isLoading ? (
                  <Skeleton className="h-10 w-16 mt-1 bg-amber-500/20" />
                ) : (
                  <p className="text-4xl font-bold text-white">{stats?.kyc.pending || 0}</p>
                )}
                <p className="text-amber-400/70 text-sm mt-1">Requires review</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                <FileCheck className="w-7 h-7 text-amber-400" />
              </div>
            </div>
            <Button asChild size="sm" className="mt-4 bg-amber-500 hover:bg-amber-600 text-black">
              <Link to="/admin/kyc">Review Now</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm font-medium">Pending Loans</p>
                {isLoading ? (
                  <Skeleton className="h-10 w-16 mt-1 bg-blue-500/20" />
                ) : (
                  <p className="text-4xl font-bold text-white">{stats?.loans.pending || 0}</p>
                )}
                <p className="text-blue-400/70 text-sm mt-1">Awaiting approval</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                <CreditCard className="w-7 h-7 text-blue-400" />
              </div>
            </div>
            <Button asChild size="sm" className="mt-4 bg-blue-500 hover:bg-blue-600 text-white">
              <Link to="/admin/loans?status=PENDING_REVIEW">Review Now</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm font-medium">Open Tickets</p>
                {isLoading ? (
                  <Skeleton className="h-10 w-16 mt-1 bg-purple-500/20" />
                ) : (
                  <p className="text-4xl font-bold text-white">{stats?.support.openTickets || 0}</p>
                )}
                <p className="text-purple-400/70 text-sm mt-1">Need response</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-purple-400" />
              </div>
            </div>
            <Button asChild size="sm" className="mt-4 bg-purple-500 hover:bg-purple-600 text-white">
              <Link to="/admin/tickets">View Tickets</Link>
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Overview */}
      <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Total Users</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-16 mt-1" />
                ) : (
                  <p className="text-xl font-bold text-white">{stats?.users.total || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Active Loans</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-16 mt-1" />
                ) : (
                  <p className="text-xl font-bold text-white">{stats?.loans.active || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Funding</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-16 mt-1" />
                ) : (
                  <p className="text-xl font-bold text-white">{stats?.loans.funding || 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">Total Volume</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-24 mt-1" />
                ) : (
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(stats?.loans.totalVolume || 0, true)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* User & KYC Stats */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Breakdown */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              User Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Borrowers</p>
                      <p className="text-slate-400 text-sm">Total registered</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats?.users.borrowers || 0}</p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Lenders</p>
                      <p className="text-slate-400 text-sm">Active investors</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats?.users.lenders || 0}</p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <Activity className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Active Users</p>
                      <p className="text-slate-400 text-sm">Last 30 days</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white">{stats?.users.active || 0}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* KYC Stats */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-amber-400" />
              KYC Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Pending Review</p>
                      <p className="text-amber-400/70 text-sm">Needs attention</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-amber-400">{stats?.kyc.pending || 0}</p>
                    <Link to="/admin/kyc?status=PENDING" className="text-amber-400 text-xs hover:underline">
                      Review →
                    </Link>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Approved</p>
                      <p className="text-slate-400 text-sm">Verified users</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">{stats?.kyc.approved || 0}</p>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                      <ArrowDownRight className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Rejected</p>
                      <p className="text-slate-400 text-sm">Failed verification</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-red-400">{stats?.kyc.rejected || 0}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts & Graphs */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* KYC Status Distribution - Pie Chart */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-amber-400" />
              KYC Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Pending', value: stats?.kyc.pending || 0 },
                      { name: 'Approved', value: stats?.kyc.approved || 0 },
                      { name: 'Rejected', value: stats?.kyc.rejected || 0 },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#f59e0b" /> {/* Pending - Amber */}
                    <Cell fill="#10b981" /> {/* Approved - Emerald */}
                    <Cell fill="#ef4444" /> {/* Rejected - Red */}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ color: '#cbd5e1' }}
                    formatter={(value) => <span style={{ color: '#cbd5e1' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Loan Status Distribution - Pie Chart */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-400" />
              Loan Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Pending', value: stats?.loans.pending || 0 },
                      { name: 'Funding', value: stats?.loans.funding || 0 },
                      { name: 'Active', value: stats?.loans.active || 0 },
                      { name: 'Completed', value: stats?.loans.completed || 0 },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#3b82f6" /> {/* Pending - Blue */}
                    <Cell fill="#8b5cf6" /> {/* Funding - Purple */}
                    <Cell fill="#10b981" /> {/* Active - Emerald */}
                    <Cell fill="#06b6d4" /> {/* Completed - Cyan */}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ color: '#cbd5e1' }}
                    formatter={(value) => <span style={{ color: '#cbd5e1' }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* User Roles Distribution - Bar Chart */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              User Roles Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { name: 'Borrowers', value: stats?.users.borrowers || 0 },
                    { name: 'Lenders', value: stats?.users.lenders || 0 },
                    { name: 'Total', value: stats?.users.total || 0 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Support Tickets Status - Bar Chart */}
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              Support Tickets Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { name: 'Open', value: stats?.support.openTickets || 0 },
                    { name: 'In Progress', value: stats?.support.inProgress || 0 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="value" fill="#a855f7" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Links */}
      <motion.div variants={item}>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2 border-slate-700 hover:bg-slate-800">
                <Link to="/admin/users">
                  <Users className="w-6 h-6 text-emerald-400" />
                  <span>Manage Users</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2 border-slate-700 hover:bg-slate-800">
                <Link to="/admin/loans">
                  <CreditCard className="w-6 h-6 text-blue-400" />
                  <span>All Loans</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2 border-slate-700 hover:bg-slate-800">
                <Link to="/admin/withdrawals">
                  <DollarSign className="w-6 h-6 text-amber-400" />
                  <span>Withdrawals</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2 border-slate-700 hover:bg-slate-800">
                <Link to="/admin/reports">
                  <Activity className="w-6 h-6 text-purple-400" />
                  <span>Reports</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;

