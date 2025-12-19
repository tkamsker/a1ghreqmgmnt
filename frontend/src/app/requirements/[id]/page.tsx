'use client';

import { useQuery, useMutation } from '@apollo/client';
import { useParams, useRouter } from 'next/navigation';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserType } from '@/lib/auth-context';
import { UPDATE_REQUIREMENT_STATUS } from '@/lib/graphql/mutations/requirements';
import { GET_REQUIREMENT } from '@/lib/graphql/queries/requirements';

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
  status: string;
  priority: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  currentVersion: RequirementVersion | null;
  versions: RequirementVersion[];
  subRequirements: Array<{
    id: string;
    uid: string;
    status: string;
    priority: number;
    currentVersion: {
      id: string;
      versionNumber: number;
      title: string;
      statement: string;
    } | null;
  }>;
  parentRequirement: {
    id: string;
    uid: string;
    currentVersion: {
      id: string;
      title: string;
    } | null;
  } | null;
}

function RequirementDetailContent() {
  const params = useParams();
  const router = useRouter();
  const requirementId = params.id as string;

  const { data, loading, error, refetch } = useQuery(GET_REQUIREMENT, {
    variables: { id: requirementId },
  });

  const [updateRequirementStatus] = useMutation(UPDATE_REQUIREMENT_STATUS);

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateRequirementStatus({
        variables: {
          id: requirementId,
          input: { status: newStatus },
        },
      });
      refetch();
    } catch (err: any) {
      alert(err?.graphQLErrors?.[0]?.message || 'Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading requirement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center text-destructive">
          <p>Error loading requirement: {error.message}</p>
        </div>
      </div>
    );
  }

  const requirement: Requirement = data?.requirement;

  if (!requirement) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center text-muted-foreground">
          <p>Requirement not found</p>
        </div>
      </div>
    );
  }

  const currentVersion = requirement.currentVersion;
  const versionHistory = requirement.versions || [];

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1:
        return 'Critical';
      case 2:
        return 'High';
      case 3:
        return 'Medium';
      case 4:
        return 'Low';
      case 5:
        return 'Trivial';
      default:
        return `Priority ${priority}`;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              ← Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{requirement.uid}</h1>
              <p className="text-muted-foreground">Requirement Details</p>
            </div>
          </div>
          <Button onClick={() => router.push(`/projects/${requirement.projectId}`)}>
            View Project
          </Button>
        </div>

        {/* Current Version Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{currentVersion?.title}</CardTitle>
                <CardDescription>
                  Version {currentVersion?.versionNumber} • Created{' '}
                  {new Date(currentVersion?.createdAt || '').toLocaleDateString()}
                </CardDescription>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Select value={requirement.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="REVIEW">Review</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="DEPRECATED">Deprecated</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                  {getPriorityLabel(requirement.priority)}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Statement</h3>
              <p className="whitespace-pre-wrap text-sm">{currentVersion?.statement}</p>
            </div>
            {currentVersion?.rationale && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Rationale</h3>
                <p className="whitespace-pre-wrap text-sm">{currentVersion.rationale}</p>
              </div>
            )}
            {currentVersion?.tags && currentVersion.tags.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {currentVersion.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Relationships */}
        {(requirement.parentRequirement || requirement.subRequirements.length > 0) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Relationships</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {requirement.parentRequirement && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                    Parent Requirement
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(`/requirements/${requirement.parentRequirement?.id}`)
                    }
                  >
                    {requirement.parentRequirement.uid}:{' '}
                    {requirement.parentRequirement.currentVersion?.title}
                  </Button>
                </div>
              )}
              {requirement.subRequirements.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                    Sub-Requirements ({requirement.subRequirements.length})
                  </h3>
                  <div className="space-y-2">
                    {requirement.subRequirements.map((sub) => (
                      <Button
                        key={sub.id}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => router.push(`/requirements/${sub.id}`)}
                      >
                        <span className="font-mono text-xs">{sub.uid}</span>
                        <span className="ml-2">{sub.currentVersion?.title}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Version History */}
        <Card>
          <CardHeader>
            <CardTitle>Version History</CardTitle>
            <CardDescription>
              {versionHistory.length} version{versionHistory.length !== 1 ? 's' : ''} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {versionHistory.map((version, idx) => {
                const isCurrentVersion = version.id === requirement.currentVersionId;
                const isLatestVersion = idx === 0;

                return (
                  <div
                    key={version.id}
                    className={`rounded-lg border p-4 ${
                      isCurrentVersion ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">Version {version.versionNumber}</h4>
                          {isCurrentVersion && (
                            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                              Current
                            </span>
                          )}
                          {isLatestVersion && !isCurrentVersion && (
                            <span className="rounded-full bg-gray-600 px-2 py-0.5 text-xs font-medium text-white">
                              Latest
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(version.createdAt).toLocaleString()}
                          {version.effectiveTo &&
                            ` • Effective until ${new Date(version.effectiveTo).toLocaleString()}`}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h5 className="mb-1 text-sm font-medium text-muted-foreground">Title</h5>
                        <p className="text-sm">{version.title}</p>
                      </div>

                      <div>
                        <h5 className="mb-1 text-sm font-medium text-muted-foreground">
                          Statement
                        </h5>
                        <p className="whitespace-pre-wrap text-sm">{version.statement}</p>
                      </div>

                      {version.deltaNotes && (
                        <div className="rounded-md border-l-4 border-yellow-400 bg-yellow-50 p-3">
                          <h5 className="mb-1 text-sm font-medium text-yellow-900">What Changed</h5>
                          <p className="whitespace-pre-wrap text-sm text-yellow-800">
                            {version.deltaNotes}
                          </p>
                        </div>
                      )}

                      {version.rationale && (
                        <div>
                          <h5 className="mb-1 text-sm font-medium text-muted-foreground">
                            Rationale
                          </h5>
                          <p className="whitespace-pre-wrap text-sm">{version.rationale}</p>
                        </div>
                      )}

                      {version.tags && version.tags.length > 0 && (
                        <div>
                          <h5 className="mb-1 text-sm font-medium text-muted-foreground">Tags</h5>
                          <div className="flex flex-wrap gap-1">
                            {version.tags.map((tag, tagIdx) => (
                              <span
                                key={tagIdx}
                                className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function RequirementDetailPage() {
  return (
    <ProtectedRoute
      allowedRoles={[
        UserType.SUPER_ADMIN,
        UserType.PROJECT_ADMIN,
        UserType.CONTRIBUTOR,
        UserType.REVIEWER,
      ]}
    >
      <RequirementDetailContent />
    </ProtectedRoute>
  );
}
