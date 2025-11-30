import { CreateProjectModal } from "@/components/create-project-modal";
import { EmptyState } from "@/components/empty-state";
import { ProjectCardSkeleton } from "@/components/skeleton";
import { Button } from "@/components/ui/button";
import {
	createSampleProject,
	deleteProject,
	getEndpoints,
	getProjects,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Project } from "@/types";
import {
	useMutation,
	useQueries,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { FolderPlus, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/projects")({
	component: ProjectsPage,
});

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
				to="/project/$id"
				params={{ id: project.id }}
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

function ProjectsPage() {
	const { isAuthenticated, isLoading: authLoading } = useAuth();
	const navigate = useNavigate();
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const queryClient = useQueryClient();

	const { data: projects = [], isLoading } = useQuery({
		queryKey: ["projects"],
		queryFn: getProjects,
		enabled: isAuthenticated,
	});

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
			navigate({ to: "/project/$id", params: { id: result.project.id } });
		},
		onError: () => {
			toast.error("Failed to create demo project");
		},
	});

	if (authLoading) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
			</div>
		);
	}

	if (!isAuthenticated) {
		navigate({ to: "/login" });
		return null;
	}

	return (
		<main className="flex-1 flex flex-col overflow-hidden">
			<header className="h-20 px-8 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[rgba(5,5,5,0.3)] backdrop-blur-md">
				<div className="flex items-center gap-2 text-sm text-[var(--text-muted)] font-['Inter']">
					<span className="text-[var(--text-primary)] font-medium">
						Projects
					</span>
				</div>
				<div className="flex items-center gap-4">
					<Button
						onClick={() => setCreateModalOpen(true)}
						className="bg-[var(--glow-violet)] hover:bg-[#7c3aed] text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] border border-white/10"
					>
						<Plus className="h-4 w-4 mr-2" />
						Create Project
					</Button>
				</div>
			</header>

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
							}}
							secondaryAction={{
								label: sampleProjectMutation.isPending
									? "Creating..."
									: "Try Demo Project",
								onClick: () => sampleProjectMutation.mutate(),
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
