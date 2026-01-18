'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Phone, Users, Database, LogOut, Loader2 } from 'lucide-react';
import EmployeeManagement from '@/components/admin/EmployeeManagement';
import CallLogsManagement from '@/components/admin/CallLogsManagement';
import DataSharingManagement from '@/components/admin/DataSharingManagement';

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}

function AdminDashboardContent() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    totalCalls: 0,
    sharedData: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [employeesRes, callLogsRes, dataSharingRes] = await Promise.all([
        fetch('/api/users?role=employee'),
        fetch('/api/call-logs'),
        fetch('/api/data-sharing'),
      ]);

      const employees = await employeesRes.json();
      const callLogs = await callLogsRes.json();
      const dataSharing = await dataSharingRes.json();

      setStats({
        totalEmployees: employees.length,
        activeEmployees: employees.filter((e: any) => e.isActive).length,
        totalCalls: callLogs.length,
        sharedData: dataSharing.length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

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
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome, {user?.username}</p>
            </div>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="text-2xl font-bold">{stats.totalEmployees}</div>
              )}
              <p className="text-xs text-muted-foreground">Active: {stats.activeEmployees}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Call Logs</CardTitle>
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
              <CardTitle className="text-sm font-medium">Data Shared</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="text-2xl font-bold">{stats.sharedData}</div>
              )}
              <p className="text-xs text-muted-foreground">Total shared items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employee Limit</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="text-2xl font-bold">{stats.totalEmployees}/20</div>
              )}
              <p className="text-xs text-muted-foreground">
                {20 - stats.totalEmployees} slots remaining
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="employees" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="employees">
              <Users className="mr-2 h-4 w-4" />
              Employees
            </TabsTrigger>
            <TabsTrigger value="calls">
              <Phone className="mr-2 h-4 w-4" />
              Call Logs
            </TabsTrigger>
            <TabsTrigger value="sharing">
              <Database className="mr-2 h-4 w-4" />
              Data Sharing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-4">
            <EmployeeManagement onUpdate={fetchStats} />
          </TabsContent>

          <TabsContent value="calls" className="space-y-4">
            <CallLogsManagement />
          </TabsContent>

          <TabsContent value="sharing" className="space-y-4">
            <DataSharingManagement onUpdate={fetchStats} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
