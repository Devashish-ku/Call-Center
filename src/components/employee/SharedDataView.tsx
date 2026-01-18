'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, MailOpen, FileText, Bell, Calendar, Download, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface SharedData {
  id: number;
  adminId: number;
  employeeId: number;
  sharedDataType: string;
  sharedData: any;
  message: string | null;
  isRead: boolean;
  createdAt: string;
}

interface SharedDataViewProps {
  onUpdate?: () => void;
}

export default function SharedDataView({ onUpdate }: SharedDataViewProps) {
  const { user } = useAuth();
  const [sharedData, setSharedData] = useState<SharedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<SharedData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSharedData();
      // Auto-refresh every 30 seconds for real-time updates
      const interval = setInterval(fetchSharedData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchSharedData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/data-sharing?employeeId=${user.id}`);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        console.error('Error fetching shared data:', data);
        toast.error('Failed to load shared data');
        setSharedData([]);
      } else {
        setSharedData(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching shared data:', error);
      toast.error('Failed to load shared data');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      const response = await fetch(`/api/data-sharing?id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }

      fetchSharedData();
      onUpdate?.();
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleOpenDialog = async (item: SharedData) => {
    setSelectedItem(item);
    setDialogOpen(true);

    if (!item.isRead) {
      await handleMarkAsRead(item.id);
    }
  };

  const downloadFile = async (fileId: number, filename: string) => {
    try {
      const response = await fetch(`/api/files/download?id=${fileId}&userId=${user?.id}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('File downloaded successfully');
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Bell className="h-5 w-5" />;
      case 'reports':
        return <FileText className="h-5 w-5" />;
      case 'call_logs':
        return <Calendar className="h-5 w-5" />;
      case 'file':
        return <File className="h-5 w-5" />;
      default:
        return <Mail className="h-5 w-5" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      announcement: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      reports: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      call_logs: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      file: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    };

    return (
      <Badge className={colors[type] || ''} variant="outline">
        {type.replace('_', ' ')}
      </Badge>
    );
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

  const unreadCount = sharedData.filter((item) => !item.isRead).length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Notifications & Shared Data</CardTitle>
              <CardDescription>
                Messages and data shared by your admin
              </CardDescription>
            </div>
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount} unread</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {sharedData.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No notifications yet. When your admin shares data with you, it will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sharedData.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleOpenDialog(item)}
                  className={`w-full text-left p-4 rounded-lg border transition-all hover:shadow-md ${
                    item.isRead
                      ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        item.isRead
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {item.isRead ? (
                        <MailOpen className="h-5 w-5" />
                      ) : (
                        getTypeIcon(item.sharedDataType)
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getTypeBadge(item.sharedDataType)}
                        {!item.isRead && (
                          <Badge variant="destructive" className="text-xs px-1.5 py-0">
                            NEW
                          </Badge>
                        )}
                      </div>

                      <p
                        className={`text-sm line-clamp-2 ${
                          item.isRead
                            ? 'text-muted-foreground'
                            : 'text-foreground font-medium'
                        }`}
                      >
                        {item.message || 'No message provided'}
                      </p>

                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {!item.isRead && (
                      <div className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 mt-2" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {selectedItem && getTypeIcon(selectedItem.sharedDataType)}
              <DialogTitle>
                {selectedItem?.sharedDataType.replace('_', ' ').toUpperCase()}
              </DialogTitle>
            </div>
            <DialogDescription>
              Received on{' '}
              {selectedItem &&
                new Date(selectedItem.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Message:</h4>
                <p className="text-sm whitespace-pre-wrap">
                  {selectedItem.message || 'No message provided'}
                </p>
              </div>

              {selectedItem.sharedData && (
                <div className="p-4 bg-muted rounded-lg">
                  {selectedItem.sharedDataType === 'file' ? (
                    <>
                      <h4 className="font-medium mb-2">
                        Shared Files ({selectedItem.sharedData.fileCount || 0}):
                      </h4>
                      {selectedItem.sharedData.files && selectedItem.sharedData.files.length > 0 ? (
                        <div className="space-y-2">
                          {selectedItem.sharedData.files.map((file: any) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-3 bg-background rounded border"
                            >
                              <div className="flex items-center gap-3">
                                <File className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-sm">{file.originalName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadFile(file.id, file.originalName)}
                                className="flex items-center gap-2"
                              >
                                <Download className="h-4 w-4" />
                                Download
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No files available</p>
                      )}
                    </>
                  ) : (
                    <>
                      <h4 className="font-medium mb-2">Additional Data:</h4>
                      <pre className="text-xs overflow-auto max-h-60 p-2 bg-background rounded">
                        {JSON.stringify(selectedItem.sharedData, null, 2)}
                      </pre>
                    </>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2">
                {!selectedItem.isRead && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleMarkAsRead(selectedItem.id);
                      setDialogOpen(false);
                    }}
                  >
                    Mark as Read
                  </Button>
                )}
                <Button onClick={() => setDialogOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
