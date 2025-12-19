'use client';

import { useQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, UserType } from '@/lib/auth-context';
import { GET_PROJECTS } from '@/lib/graphql/queries/projects';

interface Project {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function DashboardContent() {
  const router = useRouter();
  const { user } = useAuth();

  const { data, loading } = useQuery(GET_PROJECTS);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const projects: Project[] = data?.projects || [];
  const recentProjects = projects
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.longName || user?.username}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Projects</CardTitle>
              <CardDescription>Active projects in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{projects.filter((p) => p.isActive).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Role</CardTitle>
              <CardDescription>Current user role</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-semibold">
                {user?.userType?.replace('_', ' ') || 'Unknown'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/projects')}
              >
                View Projects
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Recently updated projects</CardDescription>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recent activity. Start by creating a project.
              </p>
            ) : (
              <div className="space-y-3">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">{project.code}</span>
                        <span className="text-sm font-medium">{project.name}</span>
                      </div>
                      {project.description && (
                        <p className="text-xs text-muted-foreground mt-1">{project.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Updated {new Date(project.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute
      allowedRoles={[
        UserType.SUPER_ADMIN,
        UserType.PROJECT_ADMIN,
        UserType.CONTRIBUTOR,
        UserType.REVIEWER,
      ]}
    >
      <DashboardContent />
    </ProtectedRoute>
  );
}
