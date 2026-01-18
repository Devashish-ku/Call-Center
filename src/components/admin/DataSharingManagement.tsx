'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Share2, Loader2, Trash2, FileUp, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import FileUpload from '@/components/FileUpload';

interface DataSharing {
  id: number;
  adminId: number;
  employeeId: number;
  sharedDataType: string;
  sharedData: any;
  message: string | null;
  isRead: boolean;
  createdAt: string;
}

interface Employee {
  id: number;
  username: string;
  isActive: boolean;
}

interface UploadedFile {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  description?: string;
  createdAt: string;
}

interface DataSharingManagementProps {
  onUpdate?: () => void;
}

export default function DataSharingManagement({ onUpdate }: DataSharingManagementProps) {
  const { user } = useAuth();
  const [dataSharing, setDataSharing] = useState<DataSharing[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    sharedDataType: 'announcement',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<number[]>([]);
  const [fileUploadDialogOpen, setFileUploadDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dataSharingRes, employeesRes, filesRes] = await Promise.all([
        fetch('/api/data-sharing'),
        fetch('/api/users?role=employee'),
        fetch('/api/files'),
      ]);
      const dataSharingData = await dataSharingRes.json();
      const employeesData = await employeesRes.json();
      const filesData = await filesRes.json();
      setDataSharing(dataSharingData);
      setEmployees(employeesData.filter((e: Employee) => e.isActive));
      setFiles(filesData);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      employeeId: '',
      sharedDataType: 'announcement',
      message: '',
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({
      employeeId: '',
      sharedDataType: 'announcement',
      message: '',
    });
    setSelectedFiles([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    setSubmitting(true);
    try {
      let sharedData: any = {
        timestamp: new Date().toISOString(),
        type: formData.sharedDataType,
      };

      // If sharing files, include file information
      if (formData.sharedDataType === 'file' && selectedFiles.length > 0) {
        const selectedFileData = files.filter(f => selectedFiles.includes(f.id));
        sharedData = {
          ...sharedData,
          files: selectedFileData,
          fileCount: selectedFileData.length,
        };
      }

      const response = await fetch('/api/data-sharing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: user.id,
          employeeId: parseInt(formData.employeeId),
          sharedDataType: formData.sharedDataType,
          message: formData.message,
          sharedData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast.success('Data shared successfully');
      handleCloseDialog();
      fetchData();
      onUpdate?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to share data');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this shared data?')) return;

    try {
      const response = await fetch(`/api/data-sharing?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      toast.success('Shared data deleted successfully');
      fetchData();
      onUpdate?.();
    } catch (error) {
      toast.error('Failed to delete shared data');
    }
  };

  const getEmployeeName = (employeeId: number) => {
    const employee = employees.find((e) => e.id === employeeId);
    return employee?.username || `Employee ${employeeId}`;
  };

  const handleFileUploadSuccess = (uploadedFiles: UploadedFile[]) => {
    setFiles(prev => [...prev, ...uploadedFiles]);
    toast.success(`${uploadedFiles.length} file(s) uploaded successfully`);
    setFileUploadDialogOpen(false);
  };

  const handleFileSelect = (fileId: number) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadFile = async (fileId: number, filename: string) => {
    try {
      const response = await fetch(`/api/files/download?fileId=${fileId}&userId=${user?.id}`);
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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Data Sharing</CardTitle>
              <CardDescription>
                Share reports, announcements, and call logs with employees
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleOpenDialog}>
                <Share2 className="mr-2 h-4 w-4" />
                Share Data
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dataSharing.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No shared data yet. Click "Share Data" to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  dataSharing.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {getEmployeeName(item.employeeId)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.sharedDataType.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {item.message || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.isRead ? 'secondary' : 'default'}>
                          {item.isRead ? 'Read' : 'Unread'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Data with Employee</DialogTitle>
            <DialogDescription>
              Send reports, announcements, or call logs to an employee
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Select Employee</Label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, employeeId: value })
                  }
                  required
                >
                  <SelectTrigger id="employee">
                    <SelectValue placeholder="Choose an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem
                        key={employee.id}
                        value={employee.id.toString()}
                      >
                        {employee.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataType">Data Type</Label>
                <Select
                  value={formData.sharedDataType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, sharedDataType: value })
                  }
                >
                  <SelectTrigger id="dataType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="reports">Reports</SelectItem>
                    <SelectItem value="call_logs">Call Logs</SelectItem>
                    <SelectItem value="file">File</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.sharedDataType === 'file' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Select Files to Share</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFileUploadDialogOpen(true)}
                    >
                      <FileUp className="mr-2 h-4 w-4" />
                      Upload New File
                    </Button>
                  </div>
                  <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                    {files.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground mb-4">
                          No files available. Upload files to share them.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setFileUploadDialogOpen(true)}
                        >
                          <FileUp className="mr-2 h-4 w-4" />
                          Upload Files
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {files.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center space-x-3 p-2 rounded border hover:bg-muted cursor-pointer"
                            onClick={() => handleFileSelect(file.id)}
                          >
                            <input
                              type="checkbox"
                              checked={selectedFiles.includes(file.id)}
                              onChange={() => handleFileSelect(file.id)}
                              className="rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {file.originalName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadFile(file.id, file.originalName);
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedFiles.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {selectedFiles.length} file(s) selected
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Enter your message..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  rows={4}
                  required
                  disabled={submitting}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={fileUploadDialogOpen} onOpenChange={setFileUploadDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Upload & Share Files</DialogTitle>
            <DialogDescription>
              Upload files up to 50MB to share with employees. Files will be available for sharing in your data sharing messages.
            </DialogDescription>
          </DialogHeader>
          <FileUpload
            onUploadSuccess={handleFileUploadSuccess}
            onUploadError={(error) => toast.error(error)}
            maxFiles={10}
            maxFileSize={50}
            uploadedBy={user?.id}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
