"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	createBucket,
	deleteBucket,
	getBuckets,
	updateBucket,
} from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import type { Bucket } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Database, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type BucketFormModalProps = {
	projectId: string;
	bucket?: Bucket;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

function BucketFormModal({
	projectId,
	bucket,
	open,
	onOpenChange,
}: BucketFormModalProps) {
	const isEditing = !!bucket;
	const queryClient = useQueryClient();

	const [name, setName] = useState(bucket?.name ?? "");
	const [data, setData] = useState(() => {
		if (!bucket?.data) return "[]";
		return JSON.stringify(bucket.data, null, 2);
	});
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (open) {
			if (bucket) {
				setName(bucket.name);
				setData(JSON.stringify(bucket.data, null, 2));
			} else {
				setName("");
				setData("[]");
			}
			setError(null);
		}
	}, [open, bucket]);

	const createMutation = useMutation({
		mutationFn: () => {
			const parsedData = JSON.parse(data);
			return createBucket(projectId, { name, data: parsedData });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["buckets", projectId] });
			onOpenChange(false);
			toast.success("Bucket created");
		},
		onError: (err: unknown) => {
			setError(getErrorMessage(err));
		},
	});

	const updateMutation = useMutation({
		mutationFn: () => {
			const parsedData = JSON.parse(data);
			return updateBucket(projectId, bucket?.name ?? "", { data: parsedData });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["buckets", projectId] });
			onOpenChange(false);
			toast.success("Bucket updated");
		},
		onError: (err: unknown) => {
			setError(getErrorMessage(err));
		},
	});

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);

		if (!name.trim()) {
			setError("Name is required");
			return;
		}

		if (!/^[a-z][a-z0-9_]*$/.test(name)) {
			setError("Name must start with letter, contain only lowercase letters, numbers, underscores");
			return;
		}

		try {
			const parsed = JSON.parse(data);
			if (!Array.isArray(parsed)) {
				setError("Data must be a JSON array");
				return;
			}
		} catch {
			setError("Invalid JSON");
			return;
		}

		if (isEditing) {
			updateMutation.mutate();
		} else {
			createMutation.mutate();
		}
	}

	const isPending = createMutation.isPending || updateMutation.isPending;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>
							{isEditing ? "Edit Bucket" : "Create Bucket"}
						</DialogTitle>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div>
							<Label htmlFor="bucketName">Name</Label>
							<Input
								id="bucketName"
								value={name}
								onChange={(e) => setName(e.target.value.toLowerCase())}
								placeholder="users"
								className="mt-1.5 font-mono"
								disabled={isEditing}
								required
							/>
							<p className="text-xs text-[var(--text-muted)] mt-1">
								Use in templates: {`{{bucket '${name || "name"}'}}`}
							</p>
						</div>

						<div>
							<Label htmlFor="bucketData">Initial Data (JSON array)</Label>
							<Textarea
								id="bucketData"
								value={data}
								onChange={(e) => setData(e.target.value)}
								className="mt-1.5 min-h-[200px] font-mono text-sm"
								placeholder='[{"id": "1", "name": "John"}]'
							/>
						</div>

						{error && <p className="text-sm text-red-400">{error}</p>}
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="secondary"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending ? "Saving..." : isEditing ? "Save Changes" : "Create"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function BucketCard({
	bucket,
	projectId,
	onEdit,
}: {
	bucket: Bucket;
	projectId: string;
	onEdit: () => void;
}) {
	const [showConfirm, setShowConfirm] = useState(false);
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: () => deleteBucket(projectId, bucket.name),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["buckets", projectId] });
			toast.success("Bucket deleted");
		},
		onError: (err: unknown) => {
			toast.error(getErrorMessage(err));
		},
	});

	return (
		<div className="group flex items-center gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 hover:border-[var(--border-highlight)] transition-all">
			<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--glow-violet)]/10">
				<Database className="h-5 w-5 text-[var(--glow-violet)]" />
			</div>

			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<span className="font-medium font-mono text-[var(--text-primary)]">
						{bucket.name}
					</span>
					<span className="text-xs text-[var(--text-muted)]">
						{bucket.data.length} items
					</span>
				</div>
				<p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">
					{`{{bucket '${bucket.name}'}}`}
				</p>
			</div>

			<div
				className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
			>
				<Button variant="ghost" size="sm" onClick={onEdit}>
					Edit
				</Button>
				{showConfirm ? (
					<>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowConfirm(false)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							size="sm"
							onClick={() => deleteMutation.mutate()}
							disabled={deleteMutation.isPending}
						>
							Delete
						</Button>
					</>
				) : (
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 text-[var(--text-muted)] hover:text-red-400"
						onClick={() => setShowConfirm(true)}
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				)}
			</div>
		</div>
	);
}

type BucketListProps = {
	projectId: string;
};

export function BucketList({ projectId }: BucketListProps) {
	const [modalOpen, setModalOpen] = useState(false);
	const [selectedBucket, setSelectedBucket] = useState<Bucket | undefined>();

	const { data: buckets = [], isLoading } = useQuery({
		queryKey: ["buckets", projectId],
		queryFn: () => getBuckets(projectId),
	});

	function handleNewBucket() {
		setSelectedBucket(undefined);
		setModalOpen(true);
	}

	function handleEditBucket(bucket: Bucket) {
		setSelectedBucket(bucket);
		setModalOpen(true);
	}

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h3 className="text-xl font-bold ">Data Buckets</h3>
					<p className="text-sm text-[var(--text-muted)] mt-1">
						In-memory data stores for CRUD simulation and templates
					</p>
				</div>
				<Button onClick={handleNewBucket} size="sm">
					<Plus className="h-4 w-4 mr-2" />
					New Bucket
				</Button>
			</div>

			{isLoading ? (
				<div className="space-y-2">
					<div className="h-16 bg-[var(--bg-surface)] rounded-xl animate-pulse" />
					<div className="h-16 bg-[var(--bg-surface)] rounded-xl animate-pulse" />
				</div>
			) : buckets.length === 0 ? (
				<div className="text-center py-12 border border-dashed border-[var(--border-subtle)] rounded-xl">
					<Database className="h-10 w-10 mx-auto text-[var(--text-muted)] mb-3" />
					<h4 className="font-medium text-[var(--text-primary)] mb-1">
						No data buckets yet
					</h4>
					<p className="text-sm text-[var(--text-muted)] mb-4">
						Create a bucket to store data for CRUD endpoints and templates
					</p>
					<Button onClick={handleNewBucket} size="sm">
						<Plus className="h-4 w-4 mr-2" />
						Create your first bucket
					</Button>
				</div>
			) : (
				<div className="space-y-2">
					{buckets.map((bucket) => (
						<BucketCard
							key={bucket.id}
							bucket={bucket}
							projectId={projectId}
							onEdit={() => handleEditBucket(bucket)}
						/>
					))}
				</div>
			)}

			<BucketFormModal
				projectId={projectId}
				bucket={selectedBucket}
				open={modalOpen}
				onOpenChange={setModalOpen}
			/>
		</div>
	);
}
