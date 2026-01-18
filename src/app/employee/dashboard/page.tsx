'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, Bell, History, LogOut, Loader2, TrendingUp } from 'lucide-react';
import CallHistoryView from '@/components/employee/CallHistoryView';
import SharedDataView from '@/components/employee/SharedDataView';
import { Badge } from '@/components/ui/badge';

export default function EmployeeDashboard() {
  return (
    <ProtectedRoute allowedRoles={['employee']}>
      <EmployeeDashboardContent />
    </ProtectedRoute>
  );
}

function EmployeeDashboardContent() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalCalls: 0,
    connectedCalls: 0,
    unreadNotifications: 0,
    avgDuration: 0,
  });
  const [loading, setLoading] = useState(true);
  const [sseStatus, setSseStatus] = useState<'connected' | 'retrying' | 'disconnected'>('disconnected');

  useEffect(() => {
    fetchStats();
    // Refresh stats every 30 seconds for real-time updates
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Live updates via SSE: update stats immediately when new call logs arrive
  useEffect(() => {
    if (!user) return;
    let es: EventSource | null = null;
    let retries = 0;
    const connect = () => {
      const url = `/api/events/call-logs?employeeId=${user.id}`;
      es = new EventSource(url);
      es.onopen = () => {
        setSseStatus('connected');
        retries = 0;
      };
      es.onmessage = (e) => {
        try {
          const evt = JSON.parse(e.data) as { status: string; duration: number | null };
          setStats((prev) => {
            const nextTotal = prev.totalCalls + 1;
            let nextConnected = prev.connectedCalls;
            let nextAvg = prev.avgDuration;
            if (evt.status === 'connected') {
              nextConnected = prev.connectedCalls + 1;
              const dur = typeof evt.duration === 'number' ? evt.duration : 0;
              // Recompute avg from previous avg and count
              nextAvg = Math.round(((prev.avgDuration * prev.connectedCalls) + dur) / nextConnected);
            }
            return { ...prev, totalCalls: nextTotal, connectedCalls: nextConnected, avgDuration: nextAvg };
          });
        } catch (err) {
          console.error('SSE parse error:', err);
        }
      };
      es.onerror = () => {
        setSseStatus('retrying');
        try { es && es.close(); } catch {}
        const delay = Math.min(5000, 1000 * Math.pow(2, retries));
        retries += 1;
        setTimeout(connect, delay);
      };
    };
    connect();
    return () => {
      setSseStatus('disconnected');
      try { es && es.close(); } catch {}
    };
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [callLogsRes, dataSharingRes] = await Promise.all([
        fetch(`/api/call-logs?employeeId=${user.id}`),
        fetch(`/api/data-sharing?employeeId=${user.id}&isRead=false`),
      ]);

      const callLogsRaw = await callLogsRes.json().catch(() => null);
      const dataSharingRaw = await dataSharingRes.json().catch(() => null);

      if (!callLogsRes.ok) {
        console.error('Error fetching call logs:', callLogsRaw);
      }
      if (!dataSharingRes.ok) {
        console.error('Error fetching shared data:', dataSharingRaw);
      }

      const callLogs = Array.isArray(callLogsRaw) ? callLogsRaw : [];
      const dataSharing = Array.isArray(dataSharingRaw) ? dataSharingRaw : [];

      const connectedCalls = callLogs.filter((log: any) => log.status === 'connected');
      const totalDuration = connectedCalls.reduce((sum: number, log: any) => sum + (log.duration || 0), 0);
      const avgDuration = connectedCalls.length > 0 ? Math.round(totalDuration / connectedCalls.length) : 0;

      setStats({
        totalCalls: callLogs.length,
        connectedCalls: connectedCalls.length,
        unreadNotifications: dataSharing.length,
        avgDuration,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const successRate = stats.totalCalls > 0 
    ? Math.round((stats.connectedCalls / stats.totalCalls) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Phone className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Employee Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome, {user?.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {stats.unreadNotifications > 0 && (
              <Badge variant="destructive" className="px-2 py-1">
                {stats.unreadNotifications} new
              </Badge>
            )}
            <Badge variant={sseStatus === 'connected' ? 'default' : 'secondary'} className="px-2 py-1">
              {sseStatus === 'connected' ? 'Live' : sseStatus === 'retrying' ? 'Reconnecting…' : 'Offline'}
            </Badge>
            <Button variant="outline" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="text-2xl font-bold">{stats.totalCalls}</div>
              )}
              <p className="text-xs text-muted-foreground">All time records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected Calls</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="text-2xl font-bold">{stats.connectedCalls}</div>
              )}
              <p className="text-xs text-muted-foreground">Success rate: {successRate}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Call Duration</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="text-2xl font-bold">{formatDuration(stats.avgDuration)}</div>
              )}
              <p className="text-xs text-muted-foreground">For connected calls</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="text-2xl font-bold">{stats.unreadNotifications}</div>
              )}
              <p className="text-xs text-muted-foreground">Unread messages</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="history" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto">
            <TabsTrigger value="history">
              <History className="mr-2 h-4 w-4" />
              Call History
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="mr-2 h-4 w-4" />
              Notifications
              {stats.unreadNotifications > 0 && (
                <Badge variant="destructive" className="ml-2 px-1.5 py-0.5 text-xs">
                  {stats.unreadNotifications}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4">
            <CallHistoryView onUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <SharedDataView onUpdate={fetchStats} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
