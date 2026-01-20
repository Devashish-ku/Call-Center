'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserPlus, Pencil, Trash2, Power, PowerOff, Loader2, Eye, EyeOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from '@/components/ui/input-group';

interface Employee {
  id: number;
  username: string;
  name?: string;
  email?: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface EmployeeManagementProps {
  onUpdate?: () => void;
}

export default function EmployeeManagement({ onUpdate }: EmployeeManagementProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users?role=employee');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch employees');
      }
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setEmployees(data);
      } else {
        console.error('API returned non-array data:', data);
        setEmployees([]);
        toast.error('Invalid data format received from server');
      }
    } catch (error) {
      console.error('Fetch employees error:', error);
      setEmployees([]);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        username: employee.username,
        password: '',
        name: employee.name || '',
        email: employee.email || '',
        isActive: employee.isActive,
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        username: '',
        password: '',
        name: '',
        email: '',
        isActive: true,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingEmployee(null);
    setFormData({ username: '', password: '', name: '', email: '', isActive: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingEmployee) {
      await handleUpdate();
    } else {
      await handleCreate();
    }
  };

  const handleCreate = async () => {
    if (employees.length >= 20) {
      toast.error('Cannot add more than 20 employees');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: 'employee',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast.success('Employee created successfully');
      handleCloseDialog();
      fetchEmployees();
      onUpdate?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingEmployee) return;

    setSubmitting(true);
    try {
      const updateData: any = {
        username: formData.username,
        name: formData.name,
        email: formData.email,
        isActive: formData.isActive,
      };

      if (formData.password) {
        updateData.password = formData.password;
      }

      const response = await fetch(`/api/users?id=${editingEmployee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast.success('Employee updated successfully');
      handleCloseDialog();
      fetchEmployees();
      onUpdate?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      const response = await fetch(`/api/users?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete employee');
      }

      toast.success('Employee deleted successfully');
      fetchEmployees();
      onUpdate?.();
    } catch (error) {
      toast.error('Failed to delete employee');
    }
  };

  const handleToggleActive = async (employee: Employee) => {
    try {
      const response = await fetch(`/api/users?id=${employee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !employee.isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      toast.success(`Employee ${!employee.isActive ? 'activated' : 'deactivated'}`);
      fetchEmployees();
      onUpdate?.();
    } catch (error) {
      toast.error('Failed to update status');
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
              <CardTitle>Employee Management</CardTitle>
              <CardDescription>
                Manage employee accounts ({employees.length}/20 employees)
              </CardDescription>
            </div>
            <Button 
              onClick={() => handleOpenDialog()} 
              disabled={employees.length >= 20}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!Array.isArray(employees) || employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No employees found. Add your first employee to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.username}</TableCell>
                      <TableCell>{employee.name || '-'}</TableCell>
                      <TableCell>{employee.email || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={employee.isActive ? 'default' : 'secondary'}>
                          {employee.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(employee.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(employee)}
                            title={employee.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {employee.isActive ? (
                              <PowerOff className="h-4 w-4" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(employee)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(employee.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
            <DialogTitle>
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </DialogTitle>
            <DialogDescription>
              {editingEmployee
                ? 'Update employee information. Leave password blank to keep current password.'
                : 'Create a new employee account. Maximum 20 employees allowed.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="John Doe"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="john@example.com"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password {editingEmployee && '(leave blank to keep current)'}
                </Label>
                <InputGroup>
                  <InputGroupInput
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required={!editingEmployee}
                    disabled={submitting}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                  disabled={submitting}
                />
                <Label htmlFor="isActive">Active Account</Label>
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
                    Saving...
                  </>
                ) : editingEmployee ? (
                  'Update'
                ) : (
                  'Create'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
