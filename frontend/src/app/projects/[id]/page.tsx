'use client';

import { useQuery, useMutation } from '@apollo/client';
import { useParams } from 'next/navigation';
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
import { UserType } from '@/lib/auth-context';
import {
  CREATE_PROJECT_GROUP,
  CREATE_SUBJECT,
  DELETE_PROJECT_GROUP,
  DELETE_SUBJECT,
} from '@/lib/graphql/mutations/projects';
import {
  CREATE_REQUIREMENT,
  UPDATE_REQUIREMENT,
  DELETE_REQUIREMENT,
} from '@/lib/graphql/mutations/requirements';
import { GET_PROJECT } from '@/lib/graphql/queries/projects';
import { GET_REQUIREMENTS } from '@/lib/graphql/queries/requirements';

interface RequirementVersion {
  id: string;
  versionNumber: number;
  title: string;
  statement: string;
  rationale: string | null;
  tags: string[];
  deltaNotes: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdBy: string;
  createdAt: string;
}

interface Requirement {
  id: string;
  uid: string;
  projectId: string;
  subjectId: string | null;
  parentRequirementId: string | null;
  currentVersionId: string | null;
  status: 'DRAFT' | 'REVIEW' | 'APPROVED' | 'DEPRECATED' | 'ARCHIVED';
  priority: number | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  currentVersion: RequirementVersion | null;
  versions?: RequirementVersion[];
  subRequirements?: Requirement[];
  parentRequirement?: Requirement | null;
}

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
  const [requirementForm, setRequirementForm] = useState({
    title: '',
    statement: '',
    rationale: '',
    tags: [] as string[],
    priority: 1,
    subjectId: null as string | null,
    parentRequirementId: null as string | null,
  });
  const [isRequirementDialogOpen, setIsRequirementDialogOpen] = useState(false);
  const [isEditRequirementDialogOpen, setIsEditRequirementDialogOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_PROJECT, {
    variables: { id: projectId },
  });

  const {
    data: requirementsData,
    loading: _requirementsLoading,
    refetch: refetchRequirements,
  } = useQuery(GET_REQUIREMENTS, {
    variables: { projectId },
  });

  const [createGroup] = useMutation(CREATE_PROJECT_GROUP);
  const [deleteGroup] = useMutation(DELETE_PROJECT_GROUP);
  const [createSubject] = useMutation(CREATE_SUBJECT);
  const [deleteSubject] = useMutation(DELETE_SUBJECT);
  const [createRequirement] = useMutation(CREATE_REQUIREMENT);
  const [updateRequirement] = useMutation(UPDATE_REQUIREMENT);
  const [deleteRequirement] = useMutation(DELETE_REQUIREMENT);

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

  const handleDeleteSubject = async (subjectId: string, subjectName: string) => {
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

  const handleCreateRequirement = async () => {
    try {
      await createRequirement({
        variables: {
          input: {
            projectId,
            subjectId: requirementForm.subjectId,
            parentRequirementId: requirementForm.parentRequirementId,
            title: requirementForm.title,
            statement: requirementForm.statement,
            rationale: requirementForm.rationale || null,
            tags: requirementForm.tags,
            priority: requirementForm.priority,
          },
        },
      });
      setIsRequirementDialogOpen(false);
      setRequirementForm({
        title: '',
        statement: '',
        rationale: '',
        tags: [],
        priority: 1,
        subjectId: null,
        parentRequirementId: null,
      });
      refetchRequirements();
    } catch (err: any) {
      alert(err?.graphQLErrors?.[0]?.message || 'Failed to create requirement');
    }
  };

  const handleEditRequirement = async () => {
    if (!editingRequirement) return;

    try {
      await updateRequirement({
        variables: {
          id: editingRequirement.id,
          input: {
            title: requirementForm.title,
            statement: requirementForm.statement,
            rationale: requirementForm.rationale || null,
            tags: requirementForm.tags,
            priority: requirementForm.priority,
            deltaNotes: requirementForm.rationale, // Using rationale field for delta notes in edit
          },
        },
      });
      setIsEditRequirementDialogOpen(false);
      setEditingRequirement(null);
      setRequirementForm({
        title: '',
        statement: '',
        rationale: '',
        tags: [],
        priority: 1,
        subjectId: null,
        parentRequirementId: null,
      });
      refetchRequirements();
    } catch (err: any) {
      alert(err?.graphQLErrors?.[0]?.message || 'Failed to update requirement');
    }
  };

  const handleDeleteRequirement = async (requirementId: string, requirementUid: string) => {
    if (!confirm(`Delete requirement "${requirementUid}"?`)) return;

    try {
      await deleteRequirement({ variables: { id: requirementId } });
      refetchRequirements();
    } catch (err: any) {
      alert(err?.graphQLErrors?.[0]?.message || 'Failed to delete requirement');
    }
  };

  const openEditRequirementDialog = (requirement: Requirement) => {
    setEditingRequirement(requirement);
    setRequirementForm({
      title: requirement.currentVersion?.title || '',
      statement: requirement.currentVersion?.statement || '',
      rationale: '', // Delta notes - starts empty for edit
      tags: requirement.currentVersion?.tags || [],
      priority: requirement.priority || 1,
      subjectId: requirement.subjectId,
      parentRequirementId: requirement.parentRequirementId,
    });
    setIsEditRequirementDialogOpen(true);
  };

  const openRequirementDialog = (
    subjectId: string | null = null,
    parentRequirementId: string | null = null,
  ) => {
    setRequirementForm({
      ...requirementForm,
      subjectId,
      parentRequirementId,
    });
    setIsRequirementDialogOpen(true);
  };

  const requirements: Requirement[] = requirementsData?.requirements || [];

  const getRequirementsForSubject = (subjectId: string) => {
    return requirements.filter((req) => req.subjectId === subjectId && !req.parentRequirementId);
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
              <div className="space-y-4">
                {project.subjects.map((subject) => {
                  const subjectRequirements = getRequirementsForSubject(subject.id);
                  return (
                    <div key={subject.id} className="rounded border bg-gray-50 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{subject.name}</p>
                          {subject.description && (
                            <p className="text-sm text-muted-foreground">{subject.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRequirementDialog(subject.id)}
                          >
                            Add Requirement
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSubject(subject.id, subject.name)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>

                      {/* Requirements for this subject */}
                      {subjectRequirements.length > 0 ? (
                        <div className="mt-2 space-y-1 pl-4">
                          {subjectRequirements.map((req) => (
                            <div key={req.id}>
                              <div className="flex items-center justify-between rounded border bg-white p-2 text-sm">
                                <div className="flex-1">
                                  <span className="font-mono text-xs text-muted-foreground">
                                    {req.uid}
                                  </span>
                                  <span className="ml-2">
                                    {req.currentVersion?.title || 'Untitled'}
                                  </span>
                                  <span
                                    className={`ml-2 rounded px-2 py-0.5 text-xs ${
                                      req.status === 'DRAFT'
                                        ? 'bg-gray-100 text-gray-700'
                                        : req.status === 'REVIEW'
                                          ? 'bg-yellow-100 text-yellow-700'
                                          : req.status === 'APPROVED'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                    }`}
                                  >
                                    {req.status}
                                  </span>
                                  {req.subRequirements && req.subRequirements.length > 0 && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                      ({req.subRequirements.length} sub)
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => router.push(`/requirements/${req.id}`)}
                                  >
                                    View
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openRequirementDialog(subject.id, req.id)}
                                  >
                                    + Sub
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditRequirementDialog(req)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteRequirement(req.id, req.uid)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                              {req.subRequirements && req.subRequirements.length > 0 && (
                                <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
                                  {req.subRequirements.map((subReq) => (
                                    <div
                                      key={subReq.id}
                                      className="flex items-center justify-between rounded border bg-gray-50 p-2 text-sm"
                                    >
                                      <div className="flex-1">
                                        <span className="font-mono text-xs text-muted-foreground">
                                          {subReq.uid}
                                        </span>
                                        <span className="ml-2">
                                          {subReq.currentVersion?.title || 'Untitled'}
                                        </span>
                                        <span
                                          className={`ml-2 rounded px-2 py-0.5 text-xs ${
                                            subReq.status === 'DRAFT'
                                              ? 'bg-gray-100 text-gray-700'
                                              : subReq.status === 'REVIEW'
                                                ? 'bg-yellow-100 text-yellow-700'
                                                : subReq.status === 'APPROVED'
                                                  ? 'bg-green-100 text-green-700'
                                                  : 'bg-red-100 text-red-700'
                                          }`}
                                        >
                                          {subReq.status}
                                        </span>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => router.push(`/requirements/${subReq.id}`)}
                                        >
                                          View
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => openEditRequirementDialog(subReq)}
                                        >
                                          Edit
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleDeleteRequirement(subReq.id, subReq.uid)
                                          }
                                        >
                                          Delete
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="pl-4 text-sm text-muted-foreground">
                          No requirements yet. Click "Add Requirement" to create one.
                        </p>
                      )}
                    </div>
                  );
                })}
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
                  <Button variant="outline" size="sm" onClick={() => openSubjectDialog(group.id)}>
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
                <div className="space-y-4 pl-4">
                  {group.subjects.map((subject) => {
                    const subjectRequirements = getRequirementsForSubject(subject.id);
                    return (
                      <div key={subject.id} className="rounded border bg-gray-50 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <p className="font-medium">{subject.name}</p>
                            {subject.description && (
                              <p className="text-sm text-muted-foreground">{subject.description}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRequirementDialog(subject.id)}
                            >
                              Add Requirement
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSubject(subject.id, subject.name)}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>

                        {/* Requirements for this subject */}
                        {subjectRequirements.length > 0 ? (
                          <div className="mt-2 space-y-1 pl-4">
                            {subjectRequirements.map((req) => (
                              <div key={req.id}>
                                <div className="flex items-center justify-between rounded border bg-white p-2 text-sm">
                                  <div className="flex-1">
                                    <span className="font-mono text-xs text-muted-foreground">
                                      {req.uid}
                                    </span>
                                    <span className="ml-2">
                                      {req.currentVersion?.title || 'Untitled'}
                                    </span>
                                    <span
                                      className={`ml-2 rounded px-2 py-0.5 text-xs ${
                                        req.status === 'DRAFT'
                                          ? 'bg-gray-100 text-gray-700'
                                          : req.status === 'REVIEW'
                                            ? 'bg-yellow-100 text-yellow-700'
                                            : req.status === 'APPROVED'
                                              ? 'bg-green-100 text-green-700'
                                              : 'bg-red-100 text-red-700'
                                      }`}
                                    >
                                      {req.status}
                                    </span>
                                    {req.subRequirements && req.subRequirements.length > 0 && (
                                      <span className="ml-2 text-xs text-muted-foreground">
                                        ({req.subRequirements.length} sub)
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => router.push(`/requirements/${req.id}`)}
                                    >
                                      View
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openRequirementDialog(subject.id, req.id)}
                                    >
                                      + Sub
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openEditRequirementDialog(req)}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteRequirement(req.id, req.uid)}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                                {req.subRequirements && req.subRequirements.length > 0 && (
                                  <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
                                    {req.subRequirements.map((subReq) => (
                                      <div
                                        key={subReq.id}
                                        className="flex items-center justify-between rounded border bg-gray-50 p-2 text-sm"
                                      >
                                        <div className="flex-1">
                                          <span className="font-mono text-xs text-muted-foreground">
                                            {subReq.uid}
                                          </span>
                                          <span className="ml-2">
                                            {subReq.currentVersion?.title || 'Untitled'}
                                          </span>
                                          <span
                                            className={`ml-2 rounded px-2 py-0.5 text-xs ${
                                              subReq.status === 'DRAFT'
                                                ? 'bg-gray-100 text-gray-700'
                                                : subReq.status === 'REVIEW'
                                                  ? 'bg-yellow-100 text-yellow-700'
                                                  : subReq.status === 'APPROVED'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-red-100 text-red-700'
                                            }`}
                                          >
                                            {subReq.status}
                                          </span>
                                        </div>
                                        <div className="flex gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              router.push(`/requirements/${subReq.id}`)
                                            }
                                          >
                                            View
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEditRequirementDialog(subReq)}
                                          >
                                            Edit
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                              handleDeleteRequirement(subReq.id, subReq.uid)
                                            }
                                          >
                                            Delete
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="pl-4 text-sm text-muted-foreground">
                            No requirements yet. Click "Add Requirement" to create one.
                          </p>
                        )}
                      </div>
                    );
                  })}
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
              <DialogDescription>Groups help organize subjects within a project.</DialogDescription>
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
                  onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
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

        {/* Create Requirement Dialog */}
        <Dialog open={isRequirementDialogOpen} onOpenChange={setIsRequirementDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {requirementForm.parentRequirementId
                  ? 'Create Sub-Requirement'
                  : 'Create Requirement'}
              </DialogTitle>
              <DialogDescription>
                {requirementForm.parentRequirementId
                  ? 'Add a sub-requirement that is linked to the parent requirement.'
                  : 'Add a new requirement to track functional or non-functional needs.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {requirementForm.parentRequirementId && (
                <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-900">
                  <p className="font-medium">Creating Sub-Requirement</p>
                  <p className="text-xs mt-1">
                    This requirement will be linked to the selected parent requirement.
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="req-title">Title *</Label>
                <Input
                  id="req-title"
                  value={requirementForm.title}
                  onChange={(e) =>
                    setRequirementForm({ ...requirementForm, title: e.target.value })
                  }
                  placeholder="Enter requirement title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="req-statement">Statement *</Label>
                <textarea
                  id="req-statement"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  rows={4}
                  value={requirementForm.statement}
                  onChange={(e) =>
                    setRequirementForm({ ...requirementForm, statement: e.target.value })
                  }
                  placeholder="Describe what this requirement specifies"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="req-rationale">Rationale</Label>
                <textarea
                  id="req-rationale"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  rows={3}
                  value={requirementForm.rationale}
                  onChange={(e) =>
                    setRequirementForm({ ...requirementForm, rationale: e.target.value })
                  }
                  placeholder="Why is this requirement needed? (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="req-priority">Priority</Label>
                <Input
                  id="req-priority"
                  type="number"
                  min="1"
                  max="5"
                  value={requirementForm.priority}
                  onChange={(e) =>
                    setRequirementForm({ ...requirementForm, priority: parseInt(e.target.value) })
                  }
                />
                <p className="text-xs text-muted-foreground">1 (highest) to 5 (lowest)</p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsRequirementDialogOpen(false);
                  setRequirementForm({
                    title: '',
                    statement: '',
                    rationale: '',
                    tags: [],
                    priority: 1,
                    subjectId: null,
                    parentRequirementId: null,
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateRequirement}
                disabled={!requirementForm.title || !requirementForm.statement}
              >
                Create Requirement
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Requirement Dialog */}
        <Dialog open={isEditRequirementDialogOpen} onOpenChange={setIsEditRequirementDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Requirement {editingRequirement?.uid}</DialogTitle>
              <DialogDescription>
                Editing will create a new version (v
                {(editingRequirement?.currentVersion?.versionNumber || 0) + 1}). Changes are tracked
                in version history.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-900">
                <p className="font-medium">
                  Current Version: v{editingRequirement?.currentVersion?.versionNumber}
                </p>
                <p className="text-xs mt-1">
                  This edit will create version{' '}
                  {(editingRequirement?.currentVersion?.versionNumber || 0) + 1}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-req-title">Title *</Label>
                <Input
                  id="edit-req-title"
                  value={requirementForm.title}
                  onChange={(e) =>
                    setRequirementForm({ ...requirementForm, title: e.target.value })
                  }
                  placeholder="Enter requirement title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-req-statement">Statement *</Label>
                <textarea
                  id="edit-req-statement"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  rows={4}
                  value={requirementForm.statement}
                  onChange={(e) =>
                    setRequirementForm({ ...requirementForm, statement: e.target.value })
                  }
                  placeholder="Describe what this requirement specifies"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-req-delta">Delta Notes (What Changed?)</Label>
                <textarea
                  id="edit-req-delta"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  rows={3}
                  value={requirementForm.rationale}
                  onChange={(e) =>
                    setRequirementForm({ ...requirementForm, rationale: e.target.value })
                  }
                  placeholder="Describe what changed in this version (optional but recommended)"
                />
                <p className="text-xs text-muted-foreground">
                  These notes will help track why the requirement was modified
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-req-priority">Priority</Label>
                <Input
                  id="edit-req-priority"
                  type="number"
                  min="1"
                  max="5"
                  value={requirementForm.priority}
                  onChange={(e) =>
                    setRequirementForm({ ...requirementForm, priority: parseInt(e.target.value) })
                  }
                />
                <p className="text-xs text-muted-foreground">1 (highest) to 5 (lowest)</p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditRequirementDialogOpen(false);
                  setEditingRequirement(null);
                  setRequirementForm({
                    title: '',
                    statement: '',
                    rationale: '',
                    tags: [],
                    priority: 1,
                    subjectId: null,
                    parentRequirementId: null,
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditRequirement}
                disabled={!requirementForm.title || !requirementForm.statement}
              >
                Save New Version
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
