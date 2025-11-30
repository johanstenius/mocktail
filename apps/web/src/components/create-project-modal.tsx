import { createProject } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type CreateProjectModalProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function CreateProjectModal({
	open,
	onOpenChange,
}: CreateProjectModalProps) {
	const [name, setName] = useState("");
	const [slug, setSlug] = useState("");
	const [error, setError] = useState<string | null>(null);

	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: createProject,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["projects"] });
			onOpenChange(false);
			setName("");
			setSlug("");
			setError(null);
		},
		onError: (err: Error) => {
			setError(err.message);
		},
	});

	function handleNameChange(value: string) {
		setName(value);
		const newSlug = value
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");
		setSlug(newSlug);
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		mutation.mutate({ name, slug });
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>Create Project</DialogTitle>
						<DialogDescription>
							Create a new mock API project to start building endpoints.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="name">Project Name</Label>
							<Input
								id="name"
								placeholder="My API"
								value={name}
								onChange={(e) => handleNameChange(e.target.value)}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="slug">URL Slug</Label>
							<Input
								id="slug"
								placeholder="my-api"
								value={slug}
								onChange={(e) => setSlug(e.target.value)}
								pattern="^[a-z0-9-]+$"
								required
							/>
							<p className="text-xs text-[var(--color-text-subtle)]">
								Your mock API will be available at{" "}
								<code className="rounded bg-white/5 px-1 py-0.5">
									/mock/{slug || "..."}/*
								</code>
							</p>
						</div>

						{error && (
							<p className="text-sm text-[var(--color-error)]">{error}</p>
						)}
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="secondary"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={mutation.isPending}>
							{mutation.isPending ? "Creating..." : "Create Project"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
