"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users, UserCheck, ShieldAlert, AlertTriangle, DollarSign,
  Activity, TrendingUp, BarChart3, PieChart as PieChartIcon,
  Download, Calendar,
} from "lucide-react";
import { Card, Button } from "@/components/common";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminService } from "@/services/admin";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, Legend,
} from "recharts";

const COLORS = ["#D4AF37", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];

const MONTHLY_DATA = [
  { month: "Jan", users: 120, revenue: 1200, matches: 15 },
  { month: "Feb", users: 190, revenue: 1900, matches: 28 },
  { month: "Mar", users: 310, revenue: 2800, matches: 42 },
  { month: "Apr", users: 450, revenue: 3600, matches: 55 },
  { month: "May", users: 580, revenue: 4200, matches: 71 },
];

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [revenue, setRevenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminService.getAnalytics(),
      adminService.getRevenueStats(),
    ]).then(([a, r]) => {
      setAnalytics(a.data.analytics);
      setRevenue(r.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const a = analytics || {};
  const rev = revenue || {};

  const currentData = MONTHLY_DATA.map((d, i) => {
    if (i === MONTHLY_DATA.length - 1) {
      return { ...d, users: a.totalUsers ?? d.users, revenue: a.totalRevenue ?? d.revenue };
    }
    return d;
  });

  const statsCards = [
    { label: "Total Users", value: a.totalUsers ?? 0, icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-500/10" },
    { label: "Active Users", value: a.activeUsers ?? 0, icon: Activity, color: "text-green-500", bg: "bg-green-50 dark:bg-green-500/10" },
    { label: "Verified Users", value: a.verifiedUsers ?? 0, icon: UserCheck, color: "text-accent-dark", bg: "bg-amber-50 dark:bg-amber-500/10" },
    { label: "Matches", value: a.totalMatches ?? 0, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-500/10" },
    { label: "Open Reports", value: a.totalReports ?? 0, icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50 dark:bg-red-500/10" },
    { label: "Total Revenue", value: `$${(a.totalRevenue ?? 0).toLocaleString()}`, icon: DollarSign, color: "text-accent", bg: "bg-amber-50 dark:bg-amber-500/10" },
  ];

  const subscriptionData = [
    { name: "Premium", value: rev.premiumSubscriptions ?? 0 },
    { name: "Basic", value: rev.basicSubscriptions ?? 0 },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="h-8 w-48 bg-charcoal-100 dark:bg-charcoal-800 rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-28 bg-charcoal-100 dark:bg-charcoal-800 rounded-2xl animate-pulse" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => <div key={i} className="h-80 bg-charcoal-100 dark:bg-charcoal-800 rounded-2xl animate-pulse" />)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-display font-bold text-charcoal-900 dark:text-white">Analytics</h1>
        <p className="text-sm text-charcoal-500 dark:text-charcoal-400 mt-1">Comprehensive platform analytics and insights</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {statsCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card hover={false} className="relative overflow-hidden">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-charcoal-900 dark:text-white mb-0.5">{stat.value}</p>
              <p className="text-xs text-charcoal-400 dark:text-charcoal-500">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Growth */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-charcoal-900 dark:text-white">User Growth Trend</h3>
              <p className="text-xs text-charcoal-400">Monthly user registrations</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentData}>
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#999" />
                <YAxis tick={{ fontSize: 12 }} stroke="#999" />
                <RechartsTooltip />
                <Area type="monotone" dataKey="users" stroke="#D4AF37" fill="url(#userGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Revenue Trend */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-charcoal-900 dark:text-white">Revenue Trend</h3>
              <p className="text-xs text-charcoal-400">Monthly revenue in USD</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#999" />
                <YAxis tick={{ fontSize: 12 }} stroke="#999" />
                <RechartsTooltip formatter={(value: any) => [`$${value}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="#D4AF37" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Matches */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-charcoal-900 dark:text-white">Matches</h3>
              <p className="text-xs text-charcoal-400">Monthly match count</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#999" />
                <YAxis tick={{ fontSize: 12 }} stroke="#999" />
                <RechartsTooltip />
                <Line type="monotone" dataKey="matches" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: "#8B5CF6", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Subscription Distribution */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-charcoal-900 dark:text-white">Subscription Distribution</h3>
              <p className="text-xs text-charcoal-400">Premium vs Basic breakdown</p>
            </div>
          </div>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subscriptionData.filter(d => d.value > 0).length ? subscriptionData : [{ name: "No Data", value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(subscriptionData.filter(d => d.value > 0).length ? subscriptionData : [{ name: "No Data", value: 1 }]).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Stats Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-charcoal-900 dark:text-white">Platform Statistics</h3>
            <p className="text-xs text-charcoal-400">Detailed metrics breakdown</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: a.totalUsers ?? 0, sub: `+${a.newUsersThisMonth ?? 0} this month` },
            { label: "Active Users", value: a.activeUsers ?? 0, sub: `${Math.round(((a.activeUsers ?? 0) / (a.totalUsers || 1)) * 100)}% engagement rate` },
            { label: "Verified Users", value: a.verifiedUsers ?? 0, sub: `${a.pendingVerifications ?? 0} pending review` },
            { label: "Total Matches", value: a.totalMatches ?? 0, sub: `successful connections` },
            { label: "New Users (30d)", value: a.newUsersThisMonth ?? 0, sub: `this month` },
            { label: "Open Reports", value: a.totalReports ?? 0, sub: `need attention` },
            { label: "Total Revenue", value: `$${(a.totalRevenue ?? 0).toLocaleString()}`, sub: `lifetime revenue` },
            { label: "Active Subs", value: rev.activeSubscriptions ?? 0, sub: `${rev.premiumSubscriptions ?? 0} premium, ${rev.basicSubscriptions ?? 0} basic` },
          ].map((stat) => (
            <div key={stat.label} className="p-4 bg-charcoal-50 dark:bg-charcoal-700/50 rounded-xl">
              <p className="text-xs text-charcoal-400 mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-charcoal-900 dark:text-white">{stat.value}</p>
              <p className="text-[11px] text-charcoal-400 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>
      </Card>
    </AdminLayout>
  );
}
