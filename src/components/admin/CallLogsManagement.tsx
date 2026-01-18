'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CallLog {
  id: number;
  employeeId: number;
  callDate: string;
  callTime: string;
  status: string;
  duration: number | null;
  customerPhone: string | null;
  notes: string | null;
}

interface Employee {
  id: number;
  username: string;
}

export default function CallLogsManagement() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    employeeId: '',
    status: '',
    search: '',
  });
  const [sseStatus, setSseStatus] = useState<'connected' | 'retrying' | 'disconnected'>('disconnected');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchCallLogs();
  }, [filters]);

  // Subscribe to live call log updates via SSE with reconnection
  useEffect(() => {
    let es: EventSource | null = null;
    let retries = 0;
    const connect = () => {
      const isNumeric = (v: string) => v && v !== 'all' && !Number.isNaN(Number(v));
      const params = new URLSearchParams();
      if (isNumeric(filters.employeeId)) params.append('employeeId', filters.employeeId);
      const url = `/api/events/call-logs${params.toString() ? `?${params.toString()}` : ''}`;
      es = new EventSource(url);
      es.onopen = () => {
        setSseStatus('connected');
        retries = 0;
      };
      es.onmessage = (e) => {
        try {
          const evt = JSON.parse(e.data) as CallLog;
          // Respect current filters client-side before appending
          if (filters.status && filters.status !== 'all' && evt.status !== filters.status) return;
          if (filters.search && evt.customerPhone && !evt.customerPhone.includes(filters.search)) return;
          setCallLogs((prev) => [evt, ...prev]);
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
  }, [filters.employeeId, filters.status, filters.search]);

  const fetchData = async () => {
    try {
      const [callLogsRes, employeesRes] = await Promise.all([
        fetch('/api/call-logs'),
        fetch('/api/users?role=employee'),
      ]);
      const callLogsData = await callLogsRes.json();
      const employeesData = await employeesRes.json();
      setCallLogs(callLogsData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCallLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.employeeId) params.append('employeeId', filters.employeeId);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/call-logs?${params}`);
      const data = await response.json();
      setCallLogs(data);
    } catch (error) {
      console.error('Error fetching call logs:', error);
    }
  };

  const getEmployeeName = (employeeId: number) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee?.username || `Employee ${employeeId}`;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
      connected: 'default',
      not_answered: 'secondary',
      not_connected: 'destructive',
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const params = new URLSearchParams();
      if (filters.employeeId) params.append('employeeId', filters.employeeId);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/call-logs/download?${params}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'call-logs.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error('Error downloading call logs:', error);
    } finally {
      setDownloading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      employeeId: '',
      status: '',
      search: '',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Call Logs
          <Badge variant={sseStatus === 'connected' ? 'default' : 'secondary'} className="text-xs">
            {sseStatus === 'connected' ? 'Live' : sseStatus === 'retrying' ? 'Reconnecting…' : 'Offline'}
          </Badge>
        </CardTitle>
        <CardDescription>View and filter all call records</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="space-y-2">
            <Label>Employee</Label>
            <Select
              value={filters.employeeId}
              onValueChange={(value) =>
                setFilters({ ...filters, employeeId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All employees</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id.toString()}>
                    {employee.username}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters({ ...filters, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="connected">Connected</SelectItem>
                <SelectItem value="not_answered">Not Answered</SelectItem>
                <SelectItem value="not_connected">Not Connected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Search Phone</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by phone..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>&nbsp;</Label>
            <Button variant="outline" onClick={clearFilters} className="w-full">
              <Filter className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          </div>
          <div className="space-y-2">
            <Label>&nbsp;</Label>
            <Button variant="outline" onClick={handleDownload} disabled={downloading} className="w-full">
              {downloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {callLogs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No call logs found.
                  </TableCell>
                </TableRow>
              ) : (
                callLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">
                      {getEmployeeName(log.employeeId)}
                    </TableCell>
                    <TableCell>{log.callDate}</TableCell>
                    <TableCell>{log.callTime}</TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell>{formatDuration(log.duration)}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.customerPhone || 'N/A'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {log.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {callLogs.length} call log{callLogs.length !== 1 ? 's' : ''}
        </div>
      </CardContent>
    </Card>
  );
}
