'use client';

import { useQuery, useMutation } from '@apollo/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserType } from '@/lib/auth-context';
import { CREATE_PROJECT, DELETE_PROJECT } from '@/lib/graphql/mutations/projects';
import { GET_PROJECTS } from '@/lib/graphql/queries/projects';

interface Project {
  id: string;
  name: string;
  code: string;
  description: string | null;
  projectTypeId: string;
  isActive: boolean;
  createdAt: string;
}

interface GraphQLError {
  message: string;
}

interface ErrorWithGraphQL extends Error {
  graphQLErrors?: GraphQLError[];
}

function ProjectsContent() {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    projectTypeId: '', // Will need to fetch project types
  });

  const { data, loading, error, refetch } = useQuery(GET_PROJECTS);
  const [createProject, { loading: creating }] = useMutation(CREATE_PROJECT);
  const [deleteProject, { loading: deleting }] = useMutation(DELETE_PROJECT);

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      projectTypeId: '',
    });
  };

  const handleCreate = async () => {
    try {
      await createProject({
        variables: {
          input: {
            name: formData.name,
            code: formData.code,
            description: formData.description || null,
            projectTypeId: formData.projectTypeId || '1', // TODO: Make this selectable
          },
        },
      });
      setIsCreateDialogOpen(false);
      resetForm();
      refetch();
    } catch (err) {
      const error = err as ErrorWithGraphQL;
      alert(error?.graphQLErrors?.[0]?.message || error?.message || 'Failed to create project');
    }
  };

  const handleDelete = async (projectId: string, projectName: string) {
    if (!confirm(`Are you sure you want to delete project "${projectName}"?`)) {
      return;
    }

    try {
      await deleteProject({
        variables: { id: projectId },
      });
      refetch();
    } catch (err) {
      const error = err as ErrorWithGraphQL;
      alert(error?.graphQLErrors?.[0]?.message || error?.message || 'Failed to delete project');
    }
  };

  const handleViewProject = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center text-destructive">
          <p>Error loading projects: {error.message}</p>
        </div>
      </div>
    );
  }

  const projects: Project[] = data?.projects || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground">
              Manage projects and their organizational structure
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>Create Project</Button>
        </div>

        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.code}</TableCell>
                  <TableCell>{project.name}</TableCell>
                  <TableCell>{project.description || '-'}</TableCell>
                  <TableCell>
                    {project.isActive ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-red-600">Inactive</span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(project.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewProject(project.id)}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(project.id, project.name)}
                      disabled={deleting}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {projects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No projects yet. Create your first project to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Create Project Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Create a new project to organize your requirements.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">Project Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., PROJ-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter project name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter project description"
                />
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
              <Button onClick={handleCreate} disabled={creating || !formData.name || !formData.code}>
                {creating ? 'Creating...' : 'Create Project'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <ProtectedRoute allowedRoles={[UserType.SUPER_ADMIN, UserType.PROJECT_ADMIN, UserType.CONTRIBUTOR, UserType.REVIEWER]}>
      <ProjectsContent />
    </ProtectedRoute>
  );
}
