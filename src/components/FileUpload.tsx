'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  InsertDriveFile,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';

interface FileUploadProps {
  onUploadSuccess?: (files: UploadedFile[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  uploadedBy?: number; // User ID who is uploading
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

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  uploadedFile?: UploadedFile;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  maxFiles = 10,
  maxFileSize = 50, // 50MB default
  acceptedTypes = [
    'image/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'text/comma-separated-values',
    'application/csv',
    'application/octet-stream',
    'application/x-excel',
    'application/x-msexcel',
    'text/vcard',
    'text/x-vcard',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/*',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt', '.jpg', '.jpeg', '.png', '.gif', '.vcf', '.xml', '.json', '.heic', '.heif',
  ],
  uploadedBy,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isMimeTypeAccepted = acceptedTypes.includes(file.type);
    const isExtensionAccepted = acceptedTypes.includes(fileExtension);

    if (!isMimeTypeAccepted && !isExtensionAccepted) {
      return 'File type not supported';
    }
    return null;
  };

  const uploadFile = async (file: File, index: number): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', `Uploaded file: ${file.name}`);
    if (uploadedBy !== undefined && uploadedBy !== null) {
      formData.append('uploadedBy', uploadedBy.toString());
    }
    if (uploadedBy === undefined || uploadedBy === null) {
      // Server requires uploadedBy; surface friendly error if missing
      const errorMessage = 'Uploader information missing. Please log in again.';
      setFiles(prev => prev.map((f, i) => 
        i === index 
          ? { ...f, status: 'error', error: errorMessage }
          : f
      ));
      onUploadError?.(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Ensure cookies/session are sent from other devices
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadedFile: UploadedFile = (await response.json()) as UploadedFile;

      setFiles(prev => prev.map((f, i) => 
        i === index 
          ? { ...f, progress: 100, status: 'success', uploadedFile }
          : f
      ));

      return uploadedFile;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setFiles(prev => prev.map((f, i) => 
        i === index 
          ? { ...f, status: 'error', error: errorMessage }
          : f
      ));
      throw error;
    }
  };

  const handleFiles = useCallback(async (fileList: FileList) => {
    const newFiles = Array.from(fileList);
    
    if (files.length + newFiles.length > maxFiles) {
      onUploadError?.(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const processedFiles: FileWithProgress[] = newFiles.map(file => {
      const error = validateFile(file);
      if (error) {
        onUploadError?.(error);
        return {
          file,
          progress: 0,
          status: 'error',
          error,
        };
      }
      return {
        file,
        progress: 0,
        status: 'uploading',
      };
    });

    if (processedFiles.length === 0) return;

    const startIndex = files.length;
    setFiles(prev => [...prev, ...processedFiles]);
    
    const filesToUpload = processedFiles
      .map((f, i) => ({ file: f.file, index: startIndex + i, status: f.status }))
      .filter(f => f.status === 'uploading');

    if (filesToUpload.length === 0) return;

    setIsUploading(true);
    const uploadPromises = filesToUpload.map(({ file, index }) => 
      uploadFile(file, index)
    );

    try {
      const uploadedFiles = await Promise.allSettled(uploadPromises);
      const successfulUploads = uploadedFiles
        .filter((result): result is { status: 'fulfilled'; value: UploadedFile } => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);

      if (successfulUploads.length > 0) {
        onUploadSuccess?.(successfulUploads);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  }, [files.length, maxFiles, maxFileSize, acceptedTypes, onUploadSuccess, onUploadError, uploadedBy]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  }, [handleFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    if (mimeType.includes('text')) return '📄';
    return '📁';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      {(uploadedBy === undefined || uploadedBy === null) && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Authentication required. Please log in to upload files.
        </Alert>
      )}

      <label style={{ display: 'block', width: '100%', cursor: (uploadedBy !== undefined && uploadedBy !== null) ? 'pointer' : 'not-allowed' }}>
        <Paper
          elevation={isDragOver ? 8 : 2}
          sx={{
            p: 3,
            border: isDragOver ? '2px dashed #1976d2' : '2px dashed #ccc',
            backgroundColor: isDragOver ? '#f3f7ff' : '#fafafa',
            textAlign: 'center',
            cursor: (uploadedBy !== undefined && uploadedBy !== null) ? 'pointer' : 'not-allowed',
            opacity: (uploadedBy !== undefined && uploadedBy !== null) ? 1 : 0.6,
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: '#f5f5f5',
              borderColor: '#1976d2',
            },
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CloudUpload sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Drag & Drop Files Here
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            or click to browse files
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Max {maxFiles} files, {maxFileSize}MB each • Files will be available for sharing
          </Typography>
          <Box sx={{ mt: 2 }}>
            {acceptedTypes.map((type, index) => (
              <Chip
                key={index}
                label={type.split('/')[1]?.toUpperCase() || type}
                size="small"
                variant="outlined"
                sx={{ m: 0.5 }}
              />
            ))}
          </Box>
        </Paper>
        <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        disabled={(uploadedBy === undefined || uploadedBy === null) || isUploading}
        onChange={handleFileSelect}
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          border: 0,
        }}
      />
      </label>

      {files.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Upload Progress
          </Typography>
          <List>
            {files.map((fileWithProgress, index) => (
              <ListItem key={index} divider>
                <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                  {fileWithProgress.status === 'success' ? (
                    <CheckCircle color="success" />
                  ) : fileWithProgress.status === 'error' ? (
                    <ErrorIcon color="error" />
                  ) : (
                    <InsertDriveFile color="primary" />
                  )}
                </Box>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>{getFileIcon(fileWithProgress.file.type)}</span>
                      <span>{fileWithProgress.file.name}</span>
                      <Chip
                        label={formatFileSize(fileWithProgress.file.size)}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ mt: 1 }}>
                      {fileWithProgress.status === 'uploading' && (
                        <LinearProgress
                          variant="indeterminate"
                          sx={{ width: '100%' }}
                        />
                      )}
                      {fileWithProgress.status === 'error' && (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          {fileWithProgress.error}
                        </Alert>
                      )}
                      {fileWithProgress.status === 'success' && (
                        <Alert severity="success" sx={{ mt: 1 }}>
                          Upload successful
                        </Alert>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={() => removeFile(index)}
                    disabled={fileWithProgress.status === 'uploading'}
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {isUploading && (
        <Box sx={{ mt: 2 }}>
          <Alert severity="info">
            Uploading files... Please wait.
          </Alert>
        </Box>
      )}
    </Box>
  );
};

export default FileUpload;
