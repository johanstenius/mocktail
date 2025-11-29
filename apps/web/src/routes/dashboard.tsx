import { CreateProjectModal } from "@/components/create-project-modal";
import { EmptyState } from "@/components/empty-state";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { deleteProject, getEndpoints, getProjects } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Project } from "@/types";
import {
	useMutation,
	useQueries,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { FolderPlus, Loader2, LogOut, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/dashboard")({
	component: DashboardPage,
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
		<div className="group relative glass-panel rounded-2xl p-6 transition-all cursor-pointer hover:border-[var(--color-glass-highlight)] hover:-translate-y-1 hover:bg-white/[0.05]">
			<Link
				to="/projects/$id"
				params={{ id: project.id }}
				className="absolute inset-0 rounded-2xl"
			/>
			<div className="flex flex-col h-full">
				<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--color-accent-1)]/20 to-[var(--color-accent-2)]/20 border border-white/10 text-xl font-extrabold text-white mb-4">
					{project.name.charAt(0).toUpperCase()}
				</div>
				<h3 className="text-lg font-bold text-white mb-1 group-hover:text-[var(--color-accent-2)] transition-colors">
					{project.name}
				</h3>
				<p className="text-sm font-mono text-[var(--color-text-muted)] mb-4">
					/m/{project.slug}
				</p>
				<div className="mt-auto flex items-center gap-2">
					{endpointCount !== undefined && (
						<span className="text-xs px-2 py-1 bg-white/10 rounded">
							{endpointCount} Endpoint{endpointCount !== 1 ? "s" : ""}
						</span>
					)}
				</div>
			</div>
			<div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
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
						className="h-8 w-8"
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
	);
}

function CreateProjectCard({ onClick }: { onClick: () => void }) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="glass-panel rounded-2xl p-6 border-dashed opacity-60 hover:opacity-100 transition-all flex flex-col items-center justify-center min-h-[200px] cursor-pointer"
		>
			<div className="text-3xl mb-3 text-white/50">+</div>
			<span className="font-semibold">Create Project</span>
		</button>
	);
}

function ProjectSkeleton() {
	return (
		<div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
			<div className="h-12 w-12 rounded-xl bg-white/5 animate-pulse mb-4" />
			<div className="h-5 w-32 rounded bg-white/5 animate-pulse mb-2" />
			<div className="h-4 w-24 rounded bg-white/5 animate-pulse mb-4" />
			<div className="h-6 w-20 rounded bg-white/5 animate-pulse" />
		</div>
	);
}

function DashboardPage() {
	const { isAuthenticated, isLoading: authLoading, logout, user } = useAuth();
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
		},
	});

	if (authLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-white/50" />
			</div>
		);
	}

	if (!isAuthenticated) {
		navigate({ to: "/login" });
		return null;
	}

	async function handleLogout() {
		await logout();
		navigate({ to: "/" });
	}

	return (
		<div className="min-h-screen">
			<Navbar
				actions={
					<>
						<span className="text-sm text-white/60 mr-2 hidden sm:inline">
							{user?.email}
						</span>
						<Button
							onClick={() => setCreateModalOpen(true)}
							className="bg-white text-black hover:bg-gray-200 rounded-full px-6"
						>
							<Plus className="h-4 w-4 mr-2" />
							New Project
						</Button>
						<Button
							variant="ghost"
							size="icon"
							onClick={handleLogout}
							title="Sign out"
						>
							<LogOut className="h-4 w-4" />
						</Button>
					</>
				}
			/>

			<main className="relative z-10 mx-auto max-w-6xl px-6 py-8 md:px-12">
				<div className="flex justify-between items-center mb-8">
					<h1 className="text-2xl font-bold">Projects</h1>
					<Button
						onClick={() => setCreateModalOpen(true)}
						className="bg-white text-black hover:bg-gray-200 rounded-full px-6"
					>
						+ New Project
					</Button>
				</div>

				{isLoading ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						<ProjectSkeleton />
						<ProjectSkeleton />
						<ProjectSkeleton />
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
					/>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{projects.map((project) => (
							<ProjectCard
								key={project.id}
								project={project}
								endpointCount={endpointCounts.get(project.id)}
								onDelete={() => deleteMutation.mutate(project.id)}
							/>
						))}
						<CreateProjectCard onClick={() => setCreateModalOpen(true)} />
					</div>
				)}
			</main>

			<CreateProjectModal
				open={createModalOpen}
				onOpenChange={setCreateModalOpen}
			/>
		</div>
	);
}
