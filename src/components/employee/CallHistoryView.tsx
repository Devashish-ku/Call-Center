'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Filter, Calendar, Upload, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ExcelContactUploader from './ExcelContactUploader';
 

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

interface Contact {
  id: number;
  name: string;
  phoneNumber: string;
  assignedEmployeeId?: number | null;
}

interface CallHistoryViewProps {
  onUpdate?: () => void;
}

export default function CallHistoryView({ onUpdate }: CallHistoryViewProps) {
  const { user } = useAuth();
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sseStatus, setSseStatus] = useState<'connected' | 'retrying' | 'disconnected'>('disconnected');
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    date: '',
  });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [phone, setPhone] = useState('');
  const [isStopping, setIsStopping] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeCallSid, setActiveCallSid] = useState<string | null>(null);
  const [isDialing, setIsDialing] = useState(false);
  const [showExcelUploader, setShowExcelUploader] = useState(false);
  const [hasUploadedData, setHasUploadedData] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCallLogs();
    }
  }, [user, filters]);

  useEffect(() => {
    if (!user) return;
    fetchContacts();
    checkIfDataExists();
  }, [user]);

  // Subscribe to live updates via SSE with simple reconnection
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
          const evt = JSON.parse(e.data) as CallLog;
          // Respect current filters client-side before appending
          if (filters.status && evt.status !== filters.status) return;
          if (filters.search && evt.customerPhone && !evt.customerPhone.includes(filters.search)) return;
          if (filters.date && evt.callDate !== filters.date) return;
          setCallLogs((prev) => [evt, ...prev]);
          onUpdate?.();
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
  }, [user, filters.status, filters.search, filters.date, onUpdate]);

  const fetchCallLogs = async () => {
    if (!user) return;

    try {
      const params = new URLSearchParams({ employeeId: user.id.toString() });
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.date) params.append('callDate', filters.date);

      const response = await fetch(`/api/call-logs?${params}`);
      const data = await response.json();
      // Ensure data is always an array
      setCallLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching call logs:', error);
      setCallLogs([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const checkIfDataExists = async () => {
    try {
      const res = await fetch(`/api/contacts?assignedEmployeeId=${user?.id}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setHasUploadedData(true);
      }
    } catch {}
  };

  const fetchContacts = async () => {
    try {
      const res = await fetch(`/api/contacts?assignedEmployeeId=${user?.id}`);
      const data = await res.json();
      if (Array.isArray(data)) setContacts(data);
    } catch {}
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

  const clearFilters = () => {
    setFilters({ status: '', search: '', date: '' });
  };

  const startCall = async () => {
    if (!user || !phone) return;
    try {
      setIsDialing(true);
      const res = await fetch(`/api/dial?to=${encodeURIComponent(phone)}&employeeId=${user.id}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data?.sid) {
        setActiveCallSid(data.sid as string);
      }
    } catch (e) {
    } finally {
      setIsDialing(false);
    }
  };

  const stopCall = async () => {
    if (!activeCallSid) return;
    try {
      setIsStopping(true);
      const res = await fetch('/api/call-control/hangup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sid: activeCallSid }),
      });
      if (res.ok) {
        setActiveCallSid(null);
      }
    } catch (e) {
    } finally {
      setIsStopping(false);
    }
  };

  const deleteAllContacts = async () => {
    if (!user || !confirm('Delete all uploaded contacts? This cannot be undone.')) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/contacts?assignedEmployeeId=${user.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setContacts([]);
        setHasUploadedData(false);
        fetchContacts();
      }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExcelContactSelect = (contact: any) => {
    // Set the phone number from the detected contact
    setPhone(contact.phone);
    setSelectedContactId(''); // Clear any existing selection
  };

  const handleExcelContactsDetected = (detectedContacts: any[]) => {
    // Refresh contacts list after Excel processing
    fetchContacts();
    setHasUploadedData(true);
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
          My Call History
          <Badge variant={sseStatus === 'connected' ? 'default' : 'secondary'} className="text-xs">
            {sseStatus === 'connected' ? 'Live' : sseStatus === 'retrying' ? 'Reconnecting…' : 'Offline'}
          </Badge>
        </CardTitle>
        <CardDescription>View and filter your call records</CardDescription>
        <div className="flex gap-2 mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowExcelUploader(!showExcelUploader)}
          >
            <Upload className="mr-2 h-4 w-4" />
            {showExcelUploader ? 'Hide' : 'Show'} Excel Upload
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Excel Contact Uploader */}
        {showExcelUploader && (
          <div className="mb-6">
            <ExcelContactUploader
              onContactsDetected={handleExcelContactsDetected}
              onContactSelect={handleExcelContactSelect}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {!hasUploadedData && (
            <div className="col-span-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                📋 Please upload contact data first to enable calling functionality.
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label>Contact</Label>
            <Select
              value={selectedContactId}
              onValueChange={(value) => {
                setSelectedContactId(value);
                const selected = contacts.find((c) => c.id.toString() === value);
                if (selected) setPhone(selected.phoneNumber);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select contact" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name} — {c.phoneNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              placeholder="+15551234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button size="sm" onClick={startCall} disabled={!phone || isDialing || !/^\+91\d{10}$/.test(phone) || !hasUploadedData}>
              {isDialing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Start Call
            </Button>
            <Button variant="destructive" size="sm" onClick={stopCall} disabled={!activeCallSid || isStopping}>
              {isStopping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Stop
            </Button>
          </div>
        </div>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) =>
                setFilters({ ...filters, status: value === 'all' ? '' : value })
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
            <Label>Date</Label>
            <div className="relative">
              <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="pl-8"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Search Phone</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by phone..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
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
        </div>

        {/* Statistics Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-muted-foreground">Connected</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {Array.isArray(callLogs) ? callLogs.filter((log) => log.status === 'connected').length : 0}
            </p>
          </div>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-muted-foreground">Not Answered</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {Array.isArray(callLogs) ? callLogs.filter((log) => log.status === 'not_answered').length : 0}
            </p>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <p className="text-sm text-muted-foreground">Not Connected</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {Array.isArray(callLogs) ? callLogs.filter((log) => log.status === 'not_connected').length : 0}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!Array.isArray(callLogs) || callLogs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No call logs found. Your call history will appear here.
                  </TableCell>
                </TableRow>
              ) : (
                callLogs.map((log) => (
                  <TableRow key={log.id}>
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
          Showing {Array.isArray(callLogs) ? callLogs.length : 0} call log{(!Array.isArray(callLogs) || callLogs.length !== 1) ? 's' : ''}
        </div>
      </CardContent>
    </Card>
  );
}
