import { completeOnboarding, createSampleProject } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { FolderPlus, Rocket, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";

type WelcomeModalProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function WelcomeModal({ open, onOpenChange }: WelcomeModalProps) {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { setOnboardingComplete, org } = useAuth();
	const [isCreating, setIsCreating] = useState(false);

	const sampleProjectMutation = useMutation({
		mutationFn: createSampleProject,
		onSuccess: (result) => {
			queryClient.invalidateQueries({ queryKey: ["projects"] });
			queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
			setOnboardingComplete();
			onOpenChange(false);
			navigate({ to: "/projects/$id", params: { id: result.project.id } });
		},
	});

	async function handleCreateProject() {
		await completeOnboarding();
		setOnboardingComplete();
		onOpenChange(false);
		navigate({ to: "/projects" });
	}

	async function handleImportSample() {
		setIsCreating(true);
		await completeOnboarding();
		sampleProjectMutation.mutate();
	}

	async function handleSkip() {
		await completeOnboarding();
		setOnboardingComplete();
		onOpenChange(false);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader className="text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--glow-violet)] to-[var(--glow-blue)]">
						<Sparkles className="h-8 w-8 text-white" />
					</div>
					<DialogTitle className="text-2xl">
						Welcome to {org?.name || "Mocktail"}!
					</DialogTitle>
					<DialogDescription className="text-base mt-2">
						Build mock APIs in seconds. Perfect for testing, demos, and
						prototyping.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-3 py-4">
					<div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-surface)]">
						<Rocket className="h-5 w-5 text-[var(--glow-violet)] mt-0.5 shrink-0" />
						<div>
							<div className="font-medium">Instant endpoints</div>
							<div className="text-sm text-[var(--text-muted)]">
								Create REST endpoints with custom responses in seconds
							</div>
						</div>
					</div>

					<div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-surface)]">
						<Zap className="h-5 w-5 text-[var(--glow-emerald)] mt-0.5 shrink-0" />
						<div>
							<div className="font-medium">Real-time logs</div>
							<div className="text-sm text-[var(--text-muted)]">
								See every request to your mock API as it happens
							</div>
						</div>
					</div>

					<div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-surface)]">
						<FolderPlus className="h-5 w-5 text-[var(--glow-blue)] mt-0.5 shrink-0" />
						<div>
							<div className="font-medium">OpenAPI import</div>
							<div className="text-sm text-[var(--text-muted)]">
								Import existing specs to create mock servers instantly
							</div>
						</div>
					</div>
				</div>

				<div className="space-y-3 pt-2">
					<Button
						onClick={handleCreateProject}
						className="w-full bg-[var(--glow-violet)] hover:bg-[#7c3aed] text-white"
					>
						Create My First Project
					</Button>
					<Button
						onClick={handleImportSample}
						variant="secondary"
						className="w-full"
						disabled={isCreating || sampleProjectMutation.isPending}
					>
						{isCreating || sampleProjectMutation.isPending
							? "Creating demo..."
							: "Try with a Demo Project"}
					</Button>
					<button
						type="button"
						onClick={handleSkip}
						className="w-full text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors py-2"
					>
						Skip for now
					</button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
