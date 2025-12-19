'use client';

import { useQuery, useMutation } from '@apollo/client';
import { useState } from 'react';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserType } from '@/lib/auth-context';
import { CREATE_USER, UPDATE_USER, REMOVE_USER } from '@/lib/graphql/mutations/users';
import { GET_USERS } from '@/lib/graphql/queries/users';

interface User {
  id: string;
  username: string;
  email: string | null;
  longName: string;
  userType: UserType;
  isActive: boolean;
  createdAt: string;
}

interface GraphQLError {
  message: string;
}

interface ErrorWithGraphQL extends Error {
  graphQLErrors?: GraphQLError[];
}

function UserManagementContent() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    longName: '',
    password: '',
    userType: UserType.CONTRIBUTOR,
  });

  const { data, loading, error, refetch } = useQuery(GET_USERS);
  const [createUser, { loading: creating }] = useMutation(CREATE_USER);
  const [updateUser, { loading: updating }] = useMutation(UPDATE_USER);
  const [removeUser, { loading: deleting }] = useMutation(REMOVE_USER);

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      longName: '',
      password: '',
      userType: UserType.CONTRIBUTOR,
    });
  };

  const handleCreate = async () => {
    try {
      await createUser({
        variables: {
          input: {
            username: formData.username,
            email: formData.email || null,
            longName: formData.longName,
            password: formData.password,
            userType: formData.userType,
            loginType: 'EMAIL_PASSWORD',
          },
        },
      });
      setIsCreateDialogOpen(false);
      resetForm();
      refetch();
    } catch (err) {
      const error = err as ErrorWithGraphQL;
      alert(error?.graphQLErrors?.[0]?.message || error?.message || 'Failed to create user');
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      longName: user.longName,
      password: '',
      userType: user.userType,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;

    try {
      const updateInput: Record<string, string> = {
        longName: formData.longName,
        userType: formData.userType,
      };

      if (formData.email) {
        updateInput.email = formData.email;
      }

      if (formData.password) {
        updateInput.password = formData.password;
      }

      await updateUser({
        variables: {
          id: selectedUser.id,
          input: updateInput,
        },
      });
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      resetForm();
      refetch();
    } catch (err) {
      const error = err as ErrorWithGraphQL;
      alert(error?.graphQLErrors?.[0]?.message || error?.message || 'Failed to update user');
    }
  };

  const handleDelete = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    try {
      await removeUser({
        variables: { id: userId },
      });
      refetch();
    } catch (err) {
      const error = err as ErrorWithGraphQL;
      alert(error?.graphQLErrors?.[0]?.message || error?.message || 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 max-w-md">
          <h2 className="text-lg font-semibold text-destructive mb-2">Error Loading Users</h2>
          <p className="text-sm text-destructive/90">{error.message}</p>
          <Button onClick={() => refetch()} variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const users: User[] = data?.users || [];

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.longName.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage system users and their roles</p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>Create User</Button>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <Input
            placeholder="Search by username, email, or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          {searchQuery && (
            <p className="text-sm text-muted-foreground">
              Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.longName}</TableCell>
                  <TableCell>{user.email || '-'}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700">
                      {user.userType.replace('_', ' ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    {user.isActive ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-red-600">Inactive</span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(user.id, user.username)}
                      disabled={deleting}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {searchQuery
                      ? `No users found matching "${searchQuery}"`
                      : 'No users yet. Create your first user to get started.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Create User Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system. All fields are required.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Enter username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longName">Full Name</Label>
                <Input
                  id="longName"
                  value={formData.longName}
                  onChange={(e) => setFormData({ ...formData, longName: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password (min 8 characters)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userType">Role</Label>
                <Select
                  value={formData.userType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, userType: value as UserType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserType.SUPER_ADMIN}>Super Admin</SelectItem>
                    <SelectItem value={UserType.PROJECT_ADMIN}>Project Admin</SelectItem>
                    <SelectItem value={UserType.CONTRIBUTOR}>Contributor</SelectItem>
                    <SelectItem value={UserType.REVIEWER}>Reviewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information. Username cannot be changed.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-username">Username</Label>
                <Input id="edit-username" value={formData.username} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-longName">Full Name</Label>
                <Input
                  id="edit-longName"
                  value={formData.longName}
                  onChange={(e) => setFormData({ ...formData, longName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">New Password</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave blank to keep current password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-userType">Role</Label>
                <Select
                  value={formData.userType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, userType: value as UserType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserType.SUPER_ADMIN}>Super Admin</SelectItem>
                    <SelectItem value={UserType.PROJECT_ADMIN}>Project Admin</SelectItem>
                    <SelectItem value={UserType.CONTRIBUTOR}>Contributor</SelectItem>
                    <SelectItem value={UserType.REVIEWER}>Reviewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedUser(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updating}>
                {updating ? 'Updating...' : 'Update User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

export default function UsersPage() {
  return (
    <ProtectedRoute allowedRoles={[UserType.SUPER_ADMIN]}>
      <UserManagementContent />
    </ProtectedRoute>
  );
}
