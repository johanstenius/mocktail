"use client";

import { CreateProjectModal } from "@/components/create-project-modal";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { ProjectCardSkeleton } from "@/components/skeleton";
import { Button } from "@/components/ui/button";
import {
	createSampleProject,
	deleteProject,
	getEndpoints,
	getProjects,
	getUsage,
} from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import type { Project } from "@/types";
import {
	useMutation,
	useQueries,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import {
	AlertCircle,
	FolderOpen,
	FolderPlus,
	Plus,
	Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

function ProjectCard({
	project,
	endpointCount,
	onDelete,
}: {
	project: Project;
	endpointCount?: number;
	onDelete: () => void;
}) {
	const [showConfirm, setShowConfirm] = useState(false);

	return (
		<div className="group relative flex items-center justify-between p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-highlight)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer">
			<Link
				href={`/project/${project.id}`}
				className="absolute inset-0 rounded-xl"
			/>
			<div className="flex items-center gap-4">
				<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--glow-violet)]/20 to-[var(--glow-blue)]/20 border border-white/10 flex items-center justify-center text-sm font-bold text-white font-['Outfit']">
					{project.name.charAt(0).toUpperCase()}
				</div>
				<div>
					<div className="flex items-center gap-2">
						<h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--glow-violet)] transition-colors font-['Outfit']">
							{project.name}
						</h3>
					</div>
					<div className="text-sm text-[var(--text-secondary)] font-['JetBrains_Mono'] mt-0.5">
						/mock/{project.slug}
					</div>
				</div>
			</div>

			<div className="flex items-center gap-6 relative z-10">
				<div className="text-right hidden sm:block">
					<div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">
						Endpoints
					</div>
					<div className="font-['JetBrains_Mono'] text-sm">
						{endpointCount ?? 0}
					</div>
				</div>

				<div className="w-px h-8 bg-[var(--border-subtle)] mx-2 hidden sm:block" />

				<div className="flex items-center gap-2">
					{showConfirm ? (
						<div
							className="flex items-center gap-2"
							onClick={(e) => e.stopPropagation()}
							onKeyDown={(e) => e.stopPropagation()}
						>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setShowConfirm(false)}
							>
								Cancel
							</Button>
							<Button variant="destructive" size="sm" onClick={onDelete}>
								Delete
							</Button>
						</div>
					) : (
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 text-[var(--text-muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
							onClick={(e) => {
								e.stopPropagation();
								e.preventDefault();
								setShowConfirm(true);
							}}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}

export default function ProjectsPage() {
	const { data: session } = useSession();
	const router = useRouter();
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const queryClient = useQueryClient();

	const isAuthenticated = !!session;
	const user = session?.user;
	const isVerified = Boolean(user?.emailVerified);

	const { data: projects = [], isLoading } = useQuery({
		queryKey: ["projects"],
		queryFn: getProjects,
		enabled: isAuthenticated && isVerified,
	});

	const { data: usage } = useQuery({
		queryKey: ["billing", "usage"],
		queryFn: getUsage,
		enabled: isAuthenticated && isVerified,
	});

	const projectLimitReached =
		usage?.projects.limit !== null &&
		usage?.projects.current !== undefined &&
		usage.projects.current >= usage.projects.limit;

	const endpointQueries = useQueries({
		queries: projects.map((project) => ({
			queryKey: ["endpoints", project.id],
			queryFn: () => getEndpoints(project.id),
			enabled: isAuthenticated && projects.length > 0,
		})),
	});

	const endpointCounts = new Map<string, number>();
	projects.forEach((project, index) => {
		const query = endpointQueries[index];
		if (query?.data) {
			endpointCounts.set(project.id, query.data.length);
		}
	});

	const deleteMutation = useMutation({
		mutationFn: deleteProject,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["projects"] });
			toast.success("Project deleted");
		},
		onError: () => {
			toast.error("Failed to delete project");
		},
	});

	const sampleProjectMutation = useMutation({
		mutationFn: createSampleProject,
		onSuccess: (result) => {
			queryClient.invalidateQueries({ queryKey: ["projects"] });
			toast.success("Demo project created");
			router.push(`/project/${result.project.id}`);
		},
		onError: () => {
			toast.error("Failed to create demo project");
		},
	});

	return (
		<main className="flex-1 flex flex-col overflow-hidden">
			<PageHeader
				title="Projects"
				icon={<FolderOpen className="h-4 w-4 text-[var(--glow-violet)]" />}
				actions={
					<div className="flex items-center gap-3">
						{projectLimitReached && (
							<span className="text-xs text-[var(--status-warning)] flex items-center gap-1">
								<AlertCircle className="h-3 w-3" />
								Limit reached
							</span>
						)}
						<Button
							onClick={() => setCreateModalOpen(true)}
							disabled={projectLimitReached}
							className="bg-[var(--glow-violet)] hover:bg-[#7c3aed] text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] border border-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<Plus className="h-4 w-4 mr-2" />
							Create Project
						</Button>
					</div>
				}
			/>

			<div className="flex-1 overflow-y-auto p-8">
				<div className="max-w-4xl mx-auto">
					<div className="mb-8">
						<h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent font-['Outfit']">
							Projects
						</h1>
						<p className="text-[var(--text-muted)] font-['JetBrains_Mono'] text-sm">
							Manage your mock API projects
						</p>
					</div>

					{isLoading ? (
						<div className="space-y-3">
							<ProjectCardSkeleton />
							<ProjectCardSkeleton />
							<ProjectCardSkeleton />
						</div>
					) : projects.length === 0 ? (
						<EmptyState
							icon={FolderPlus}
							title="No projects yet"
							description="Create your first mock API project to start building endpoints."
							action={{
								label: "Create Project",
								onClick: () => setCreateModalOpen(true),
								disabled: projectLimitReached,
							}}
							secondaryAction={{
								label: sampleProjectMutation.isPending
									? "Creating..."
									: "Try Demo Project",
								onClick: () => sampleProjectMutation.mutate(),
								disabled: projectLimitReached,
							}}
						/>
					) : (
						<div className="space-y-3">
							{projects.map((project) => (
								<ProjectCard
									key={project.id}
									project={project}
									endpointCount={endpointCounts.get(project.id)}
									onDelete={() => deleteMutation.mutate(project.id)}
								/>
							))}
						</div>
					)}
				</div>
			</div>

			<CreateProjectModal
				open={createModalOpen}
				onOpenChange={setCreateModalOpen}
			/>
		</main>
	);
}
