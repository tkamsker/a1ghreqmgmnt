'use client';

import { useQuery, useMutation } from '@apollo/client';
import { useState } from 'react';
import { useParams } from 'next/navigation';

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
import { UserType } from '@/lib/auth-context';
import {
  CREATE_PROJECT_GROUP,
  CREATE_SUBJECT,
  DELETE_PROJECT_GROUP,
  DELETE_SUBJECT,
} from '@/lib/graphql/mutations/projects';
import { GET_PROJECT } from '@/lib/graphql/queries/projects';

interface Subject {
  id: string;
  name: string;
  description: string | null;
  orderIndex: number;
}

interface ProjectGroup {
  id: string;
  name: string;
  description: string | null;
  orderIndex: number;
  subjects: Subject[];
}

interface Project {
  id: string;
  name: string;
  code: string;
  description: string | null;
  groups: ProjectGroup[];
  subjects: Subject[];
}

function ProjectDetailContent() {
  const params = useParams();
  const projectId = params.id as string;

  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const [groupForm, setGroupForm] = useState({ name: '', description: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', description: '' });

  const { data, loading, error, refetch } = useQuery(GET_PROJECT, {
    variables: { id: projectId },
  });

  const [createGroup] = useMutation(CREATE_PROJECT_GROUP);
  const [deleteGroup] = useMutation(DELETE_PROJECT_GROUP);
  const [createSubject] = useMutation(CREATE_SUBJECT);
  const [deleteSubject] = useMutation(DELETE_SUBJECT);

  const handleCreateGroup = async () => {
    try {
      await createGroup({
        variables: {
          input: {
            projectId,
            name: groupForm.name,
            description: groupForm.description || null,
          },
        },
      });
      setIsGroupDialogOpen(false);
      setGroupForm({ name: '', description: '' });
      refetch();
    } catch (err: any) {
      alert(err?.graphQLErrors?.[0]?.message || 'Failed to create group');
    }
  };

  const handleCreateSubject = async () => {
    try {
      await createSubject({
        variables: {
          input: {
            projectId,
            groupId: selectedGroupId,
            name: subjectForm.name,
            description: subjectForm.description || null,
          },
        },
      });
      setIsSubjectDialogOpen(false);
      setSubjectForm({ name: '', description: '' });
      setSelectedGroupId(null);
      refetch();
    } catch (err: any) {
      alert(err?.graphQLErrors?.[0]?.message || 'Failed to create subject');
    }
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`Delete group "${groupName}"?`)) return;

    try {
      await deleteGroup({ variables: { id: groupId } });
      refetch();
    } catch (err: any) {
      alert(err?.graphQLErrors?.[0]?.message || 'Failed to delete group');
    }
  };

  const handleDeleteSubject = async (subjectId: string, subjectName: string) {
    if (!confirm(`Delete subject "${subjectName}"?`)) return;

    try {
      await deleteSubject({ variables: { id: subjectId } });
      refetch();
    } catch (err: any) {
      alert(err?.graphQLErrors?.[0]?.message || 'Failed to delete subject');
    }
  };

  const openSubjectDialog = (groupId: string | null = null) => {
    setSelectedGroupId(groupId);
    setIsSubjectDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">Error loading project: {error.message}</p>
      </div>
    );
  }

  const project: Project = data?.project;

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Project not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">
            {project.code} {project.description && `• ${project.description}`}
          </p>
        </div>

        <div className="mb-4 flex gap-4">
          <Button onClick={() => setIsGroupDialogOpen(true)}>Create Group</Button>
          <Button onClick={() => openSubjectDialog(null)} variant="outline">
            Create Top-Level Subject
          </Button>
        </div>

        {/* Project Groups and Subjects */}
        <div className="space-y-4">
          {/* Top-level subjects (not in groups) */}
          {project.subjects.length > 0 && (
            <div className="rounded-lg border bg-white p-4">
              <h3 className="mb-3 font-semibold">Top-Level Subjects</h3>
              <div className="space-y-2">
                {project.subjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="flex items-center justify-between rounded border p-2"
                  >
                    <div>
                      <p className="font-medium">{subject.name}</p>
                      {subject.description && (
                        <p className="text-sm text-muted-foreground">{subject.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSubject(subject.id, subject.name)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Groups with their subjects */}
          {project.groups.map((group) => (
            <div key={group.id} className="rounded-lg border bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{group.name}</h3>
                  {group.description && (
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openSubjectDialog(group.id)}
                  >
                    Add Subject
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteGroup(group.id, group.name)}
                  >
                    Delete Group
                  </Button>
                </div>
              </div>

              {group.subjects.length > 0 ? (
                <div className="space-y-2 pl-4">
                  {group.subjects.map((subject) => (
                    <div
                      key={subject.id}
                      className="flex items-center justify-between rounded border p-2"
                    >
                      <div>
                        <p className="font-medium">{subject.name}</p>
                        {subject.description && (
                          <p className="text-sm text-muted-foreground">{subject.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSubject(subject.id, subject.name)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="pl-4 text-sm text-muted-foreground">No subjects in this group</p>
              )}
            </div>
          ))}

          {project.groups.length === 0 && project.subjects.length === 0 && (
            <div className="rounded-lg border bg-white p-8 text-center text-muted-foreground">
              <p>No groups or subjects yet.</p>
              <p className="text-sm">Create a group or subject to organize your requirements.</p>
            </div>
          )}
        </div>

        {/* Create Group Dialog */}
        <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project Group</DialogTitle>
              <DialogDescription>
                Groups help organize subjects within a project.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="group-name">Group Name</Label>
                <Input
                  id="group-name"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  placeholder="Enter group name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="group-description">Description</Label>
                <Input
                  id="group-description"
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  placeholder="Enter description (optional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsGroupDialogOpen(false);
                  setGroupForm({ name: '', description: '' });
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateGroup} disabled={!groupForm.name}>
                Create Group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Subject Dialog */}
        <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Subject</DialogTitle>
              <DialogDescription>
                {selectedGroupId
                  ? 'Create a subject within the selected group.'
                  : 'Create a top-level subject (not in a group).'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="subject-name">Subject Name</Label>
                <Input
                  id="subject-name"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  placeholder="Enter subject name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject-description">Description</Label>
                <Input
                  id="subject-description"
                  value={subjectForm.description}
                  onChange={(e) =>
                    setSubjectForm({ ...subjectForm, description: e.target.value })
                  }
                  placeholder="Enter description (optional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsSubjectDialogOpen(false);
                  setSubjectForm({ name: '', description: '' });
                  setSelectedGroupId(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateSubject} disabled={!subjectForm.name}>
                Create Subject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

export default function ProjectDetailPage() {
  return (
    <ProtectedRoute
      allowedRoles={[
        UserType.SUPER_ADMIN,
        UserType.PROJECT_ADMIN,
        UserType.CONTRIBUTOR,
        UserType.REVIEWER,
      ]}
    >
      <ProjectDetailContent />
    </ProtectedRoute>
  );
}
