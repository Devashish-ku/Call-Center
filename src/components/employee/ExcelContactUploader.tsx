'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, Phone, User, FileSpreadsheet } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DetectedContact {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  rowIndex: number;
  isValid: boolean;
  isIndian: boolean;
}

interface ExcelContactUploaderProps {
  onContactsDetected?: (contacts: DetectedContact[]) => void;
  onContactSelect?: (contact: DetectedContact) => void;
}

export default function ExcelContactUploader({ 
  onContactsDetected, 
  onContactSelect 
}: ExcelContactUploaderProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [contacts, setContacts] = useState<DetectedContact[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);

  const normalizePhone = (phone: string): string => {
    // Remove all non-digit and non-plus characters
    const cleaned = phone.replace(/[^\d+]/g, '');
    
    // Handle different Indian phone formats
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return '+' + cleaned;
    } else if (cleaned.startsWith('0') && cleaned.length === 11) {
      return '+91' + cleaned.substring(1);
    } else if (cleaned.length === 10) {
      return '+91' + cleaned;
    } else if (cleaned.startsWith('+91') && cleaned.length === 13) {
      return cleaned;
    }
    
    return cleaned;
  };

  const isValidIndianPhone = (phone: string): boolean => {
    return /^\+91\d{10}$/.test(phone);
  };

  const detectContactsFromCSV = (text: string): DetectedContact[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    
    // Detect column indices for name and phone
    const nameIndices = header.reduce((acc, col, idx) => {
      if (col.includes('name') || col.includes('contact') || col.includes('customer')) {
        acc.push(idx);
      }
      return acc;
    }, [] as number[]);

    const phoneIndices = header.reduce((acc, col, idx) => {
      if (col.includes('phone') || col.includes('mobile') || col.includes('contact') || col.includes('number')) {
        acc.push(idx);
      }
      return acc;
    }, [] as number[]);

    const emailIndices = header.reduce((acc, col, idx) => {
      if (col.includes('email') || col.includes('mail')) {
        acc.push(idx);
      }
      return acc;
    }, [] as number[]);

    const companyIndices = header.reduce((acc, col, idx) => {
      if (col.includes('company') || col.includes('organization') || col.includes('business')) {
        acc.push(idx);
      }
      return acc;
    }, [] as number[]);

    const detectedContacts: DetectedContact[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      
      // Find name (prefer first name column found)
      let name = '';
      for (const idx of nameIndices) {
        if (cols[idx] && cols[idx].length > 1) {
          name = cols[idx];
          break;
        }
      }

      // Find phone (prefer first phone column found)
      let phone = '';
      for (const idx of phoneIndices) {
        if (cols[idx] && cols[idx].length > 5) {
          phone = normalizePhone(cols[idx]);
          break;
        }
      }

      // Skip if no phone found
      if (!phone) continue;

      // Find email
      let email = '';
      for (const idx of emailIndices) {
        if (cols[idx] && cols[idx].includes('@')) {
          email = cols[idx];
          break;
        }
      }

      // Find company
      let company = '';
      for (const idx of companyIndices) {
        if (cols[idx] && cols[idx].length > 1) {
          company = cols[idx];
          break;
        }
      }

      const normalizedPhone = normalizePhone(phone);
      const isIndian = isValidIndianPhone(normalizedPhone);

      detectedContacts.push({
        name: name || 'Unknown',
        phone: normalizedPhone,
        email,
        company,
        rowIndex: i,
        isValid: normalizedPhone.length > 5,
        isIndian
      });
    }

    return detectedContacts;
  };

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (selectedFile.type !== 'text/csv') {
      setError('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setError('');
    setSuccess('');
    setContacts([]);

    // Auto-process the file
    await processFile(selectedFile);
  }, []);

  const processFile = async (file: File) => {
    setProcessing(true);
    setError('');

    try {
      let text = '';
      
      if (file.type === 'text/csv') {
        text = await file.text();
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        const header = lines.length > 0 ? lines[0].split(',').map((h) => h.trim()) : [];
        setHeaders(header);
        const detectedContacts = detectContactsFromCSV(text);
        setContacts(detectedContacts);
        setSuccess(`Found ${detectedContacts.length} contacts (${detectedContacts.filter(c => c.isIndian).length} Indian numbers)`);
        
        if (onContactsDetected) {
          onContactsDetected(detectedContacts);
        }
      } else {
        // For Excel files, show message and allow upload
        setSuccess('Excel file selected. Click "Upload & Save Contacts" to process.');
      }
    } catch (err) {
      setError('Error processing file: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setProcessing(false);
    }
  };

  const uploadAndProcess = async () => {
    if (!file || !user || file.type !== 'text/csv' || contacts.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const validContacts = contacts.filter(c => c.isIndian && c.isValid);
      
      const results = await Promise.allSettled(
        validContacts.map(contact => 
          fetch('/api/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: contact.name,
              phoneNumber: contact.phone,
              assignedEmployeeId: user.id,
            }),
          }).then(res => {
            if (!res.ok) throw new Error(`Failed to save ${contact.name}`);
            return res.json();
          })
        )
      );
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      if (failed > 0) {
        setError(`Saved ${successful} contacts, ${failed} failed`);
      } else {
        setSuccess(`Successfully saved ${successful} contacts!`);
      }
      
      if (onContactsDetected) {
        onContactsDetected(contacts);
      }
    } catch (err) {
      setError('Save failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const handleContactSelect = (contact: DetectedContact) => {
    if (contact.isIndian && onContactSelect) {
      onContactSelect(contact);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Upload Contact List (CSV)
        </CardTitle>
        <CardDescription>
          Upload a CSV file with contact information. We'll automatically detect names and phone numbers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="excel-upload"
          />
          <Label htmlFor="excel-upload" className="cursor-pointer">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium">Click to upload CSV file</p>
            <p className="text-sm text-gray-500 mt-2">
              Supports CSV files with contact information
            </p>
          </Label>
        </div>

        {file && (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              <span className="font-medium">{file.name}</span>
              <Badge variant="secondary">{(file.size / 1024).toFixed(1)} KB</Badge>
            </div>
            <div className="flex gap-2">
              {file.type === 'text/csv' && contacts.length === 0 && (
                <Button 
                  size="sm" 
                  onClick={() => processFile(file)}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Process CSV
                </Button>
              )}
              <Button 
                size="sm" 
                onClick={uploadAndProcess}
                disabled={uploading}
                variant={file.type === 'text/csv' ? 'outline' : 'default'}
              >
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {file.type === 'text/csv' ? 'Upload & Save' : 'Process & Save'}
              </Button>
            </div>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Processing Indicator */}
        {processing && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span>Processing file and detecting contacts...</span>
          </div>
        )}

        {/* Detected Contacts */}
        {contacts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Detected Contacts</h3>
              <Badge variant="outline">
                {contacts.filter(c => c.isIndian).length} Indian numbers
              </Badge>
            </div>

            <div className="rounded-md border max-h-64 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          {contact.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {contact.phone}
                        </div>
                      </TableCell>
                      <TableCell>{contact.email || '-'}</TableCell>
                      <TableCell>{contact.company || '-'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={contact.isIndian ? "default" : "secondary"}
                          className={contact.isIndian ? "bg-green-100 text-green-800" : ""}
                        >
                          {contact.isIndian ? "Indian" : "Foreign"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleContactSelect(contact)}
                          disabled={!contact.isIndian}
                        >
                          Call
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={uploadAndProcess}
                disabled={uploading || contacts.length === 0}
                className="flex-1"
              >
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Save Contacts to Database
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
