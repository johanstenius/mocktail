import { importOpenApiSpec } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileJson, Loader2, Upload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

type ImportDropzoneProps = {
	projectId: string;
	variant?: "full" | "compact";
	onSuccess?: () => void;
	autoImport?: boolean;
};

export function ImportDropzone({
	projectId,
	variant = "full",
	onSuccess,
	autoImport = false,
}: ImportDropzoneProps) {
	const [specInput, setSpecInput] = useState("");
	const [overwrite, setOverwrite] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [dragOver, setDragOver] = useState(false);
	const [pendingAutoImport, setPendingAutoImport] = useState(false);

	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: (spec: string) =>
			importOpenApiSpec(projectId, { spec, options: { overwrite } }),
		onSuccess: (result) => {
			queryClient.invalidateQueries({ queryKey: ["endpoints", projectId] });
			setSpecInput("");
			setError(null);
			setPendingAutoImport(false);
			if (result.created > 0) {
				toast.success(
					`Imported ${result.created} endpoint${result.created !== 1 ? "s" : ""}${result.skipped > 0 ? ` (${result.skipped} skipped)` : ""}`,
				);
			} else if (result.skipped > 0) {
				toast.info(`${result.skipped} endpoints already exist`);
			} else {
				toast.info("No endpoints found in spec");
			}
			onSuccess?.();
		},
		onError: (err: unknown) => {
			setError(getErrorMessage(err));
			toast.error(getErrorMessage(err));
			setPendingAutoImport(false);
		},
	});

	useEffect(() => {
		if (
			autoImport &&
			pendingAutoImport &&
			specInput.trim() &&
			!mutation.isPending
		) {
			mutation.mutate(specInput);
		}
	}, [autoImport, pendingAutoImport, specInput, mutation]);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setDragOver(false);

			const file = e.dataTransfer.files[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (event) => {
					setSpecInput(event.target?.result as string);
					if (autoImport) {
						setPendingAutoImport(true);
					}
				};
				reader.readAsText(file);
			}
		},
		[autoImport],
	);

	const handleFileSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) {
				const reader = new FileReader();
				reader.onload = (event) => {
					setSpecInput(event.target?.result as string);
					if (autoImport) {
						setPendingAutoImport(true);
					}
				};
				reader.readAsText(file);
			}
		},
		[autoImport],
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

	if (variant === "compact") {
		return (
			<form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto">
				<div
					onDragOver={(e) => {
						e.preventDefault();
						setDragOver(true);
					}}
					onDragLeave={() => setDragOver(false)}
					onDrop={handleDrop}
					className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
						dragOver
							? "border-[var(--glow-violet)] bg-[var(--glow-violet)]/5"
							: "border-[var(--border-subtle)] hover:border-[var(--border-highlight)]"
					}`}
				>
					<input
						type="file"
						accept=".json,.yaml,.yml"
						onChange={handleFileSelect}
						className="absolute inset-0 opacity-0 cursor-pointer"
					/>
					<div className="flex flex-col items-center gap-3">
						<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--bg-surface)]">
							<Upload className="h-6 w-6 text-[var(--text-muted)]" />
						</div>
						<div>
							<p className="text-sm font-medium text-[var(--text-primary)]">
								Drop your OpenAPI spec here
							</p>
							<p className="text-xs text-[var(--text-muted)]">
								or click to browse (.json, .yaml)
							</p>
						</div>
					</div>
				</div>

				{specInput && (
					<div className="mt-4 space-y-3">
						<div className="flex items-center gap-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3">
							{mutation.isPending ? (
								<Loader2 className="h-5 w-5 text-[var(--glow-violet)] animate-spin" />
							) : (
								<FileJson className="h-5 w-5 text-[var(--glow-violet)]" />
							)}
							<span className="text-sm text-[var(--text-secondary)]">
								{mutation.isPending
									? "Importing..."
									: `Spec loaded (${specInput.length.toLocaleString()} characters)`}
							</span>
						</div>

						{!autoImport && (
							<>
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="checkbox"
										checked={overwrite}
										onChange={(e) => setOverwrite(e.target.checked)}
										className="h-4 w-4 rounded border-[var(--border-subtle)] bg-[var(--bg-surface)]"
									/>
									<span className="text-sm text-[var(--text-muted)]">
										Overwrite existing endpoints
									</span>
								</label>

								<Button
									type="submit"
									disabled={mutation.isPending}
									className="w-full bg-[var(--glow-violet)] hover:bg-[#7c3aed] text-white"
								>
									{mutation.isPending ? (
										<>
											<Loader2 className="h-4 w-4 animate-spin mr-2" />
											Importing...
										</>
									) : (
										"Import Endpoints"
									)}
								</Button>
							</>
						)}

						{error && <p className="text-sm text-red-400">{error}</p>}
					</div>
				)}
			</form>
		);
	}

	return (
		<div className="space-y-4">
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
						<p className="text-sm font-medium">Drop your OpenAPI spec here</p>
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

			<Textarea
				value={specInput}
				onChange={(e) => setSpecInput(e.target.value)}
				placeholder='{"openapi": "3.0.0", ...}'
				className="min-h-[200px]"
			/>

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

			{error && <p className="text-sm text-[var(--color-error)]">{error}</p>}

			<Button
				onClick={handleSubmit}
				disabled={mutation.isPending || !specInput}
				className="w-full"
			>
				{mutation.isPending ? "Importing..." : "Import Endpoints"}
			</Button>
		</div>
	);
}
