import { importOpenApiSpec } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileJson, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Textarea } from "./ui/textarea";

type ImportModalProps = {
	projectId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function ImportModal({
	projectId,
	open,
	onOpenChange,
}: ImportModalProps) {
	const [specInput, setSpecInput] = useState("");
	const [overwrite, setOverwrite] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [dragOver, setDragOver] = useState(false);

	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: (spec: string) =>
			importOpenApiSpec(projectId, { spec, options: { overwrite } }),
		onSuccess: (result) => {
			queryClient.invalidateQueries({ queryKey: ["endpoints", projectId] });
			onOpenChange(false);
			setSpecInput("");
			setError(null);
			alert(`Imported ${result.created} endpoints (${result.skipped} skipped)`);
		},
		onError: (err: Error) => {
			setError(err.message);
		},
	});

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setDragOver(false);

		const file = e.dataTransfer.files[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (event) => {
				setSpecInput(event.target?.result as string);
			};
			reader.readAsText(file);
		}
	}, []);

	const handleFileSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (event) => {
					setSpecInput(event.target?.result as string);
				};
				reader.readAsText(file);
			}
		},
		[],
	);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);

		if (!specInput.trim()) {
			setError("Please provide an OpenAPI spec");
			return;
		}

		mutation.mutate(specInput);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>Import OpenAPI Spec</DialogTitle>
						<DialogDescription>
							Import endpoints from an OpenAPI 3.x specification (JSON or YAML)
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						{/* Drop zone */}
						<div
							onDragOver={(e) => {
								e.preventDefault();
								setDragOver(true);
							}}
							onDragLeave={() => setDragOver(false)}
							onDrop={handleDrop}
							className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
								dragOver
									? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
									: "border-white/10 hover:border-white/20"
							}`}
						>
							<input
								type="file"
								accept=".json,.yaml,.yml"
								onChange={handleFileSelect}
								className="absolute inset-0 opacity-0 cursor-pointer"
							/>
							<div className="flex flex-col items-center gap-3">
								<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
									<Upload className="h-6 w-6 text-[var(--color-text-muted)]" />
								</div>
								<div>
									<p className="text-sm font-medium">
										Drop your OpenAPI spec here
									</p>
									<p className="text-xs text-[var(--color-text-subtle)]">
										or click to browse (.json, .yaml)
									</p>
								</div>
							</div>
						</div>

						<div className="flex items-center gap-2 text-[var(--color-text-subtle)]">
							<div className="flex-1 h-px bg-white/10" />
							<span className="text-xs">or paste below</span>
							<div className="flex-1 h-px bg-white/10" />
						</div>

						{/* Textarea */}
						<Textarea
							value={specInput}
							onChange={(e) => setSpecInput(e.target.value)}
							placeholder='{"openapi": "3.0.0", ...}'
							className="min-h-[200px]"
						/>

						{/* Options */}
						<label className="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={overwrite}
								onChange={(e) => setOverwrite(e.target.checked)}
								className="h-4 w-4 rounded border-white/20 bg-white/5"
							/>
							<span className="text-sm text-[var(--color-text-muted)]">
								Overwrite existing endpoints with same path
							</span>
						</label>

						{specInput && (
							<div className="flex items-center gap-2 rounded-lg bg-white/5 p-3">
								<FileJson className="h-5 w-5 text-[var(--color-primary)]" />
								<span className="text-sm">
									Spec loaded ({specInput.length.toLocaleString()} characters)
								</span>
							</div>
						)}

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
						<Button type="submit" disabled={mutation.isPending || !specInput}>
							{mutation.isPending ? "Importing..." : "Import Endpoints"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
