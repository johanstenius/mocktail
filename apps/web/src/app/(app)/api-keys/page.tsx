"use client";

import { PageHeader } from "@/components/page-header";
import { MemberRowSkeleton } from "@/components/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOrgApiKey, deleteOrgApiKey, getOrgApiKeys } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import type { ApiKey } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Key, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function formatDate(dateString: string | null): string {
	if (!dateString) return "Never";
	return new Date(dateString).toLocaleDateString();
}

function CopyButton({ value }: { value: string }) {
	const [copied, setCopied] = useState(false);

	async function handleCopy() {
		await navigator.clipboard.writeText(value);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}

	return (
		<Button
			variant="ghost"
			size="icon"
			className="h-8 w-8 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
			onClick={handleCopy}
		>
			{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
		</Button>
	);
}

function ApiKeyRow({
	apiKey,
	onDelete,
	isDeleting,
}: {
	apiKey: ApiKey;
	onDelete: () => void;
	isDeleting: boolean;
}) {
	const [showConfirm, setShowConfirm] = useState(false);
	const isExpired = apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date();

	return (
		<div className="flex items-center justify-between p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl hover:border-[var(--border-highlight)] transition-all">
			<div className="flex items-center gap-4">
				<div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--glow-pink)] to-[var(--glow-violet)] flex items-center justify-center">
					<Key className="h-4 w-4 text-white" />
				</div>
				<div>
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium text-[var(--text-primary)]">
							{apiKey.name}
						</span>
						{isExpired && <Badge variant="destructive">Expired</Badge>}
					</div>
					<div className="flex items-center gap-2 mt-1">
						<code className="text-xs text-[var(--text-muted)] font-['JetBrains_Mono'] bg-[var(--bg-surface-active)] px-2 py-0.5 rounded">
							{apiKey.key.slice(0, 20)}...
						</code>
						<CopyButton value={apiKey.key} />
					</div>
				</div>
			</div>
			<div className="flex items-center gap-4">
				<div className="text-right">
					<div className="text-xs text-[var(--text-muted)]">
						Last used: {formatDate(apiKey.lastUsedAt)}
					</div>
					<div className="text-xs text-[var(--text-muted)]">
						Created: {formatDate(apiKey.createdAt)}
					</div>
				</div>
				{showConfirm ? (
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowConfirm(false)}
							disabled={isDeleting}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							size="sm"
							onClick={onDelete}
							disabled={isDeleting}
						>
							{isDeleting ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								"Delete"
							)}
						</Button>
					</div>
				) : (
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 text-[var(--text-muted)] hover:text-[var(--status-error)]"
						onClick={() => setShowConfirm(true)}
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				)}
			</div>
		</div>
	);
}

function CreateKeyModal({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [name, setName] = useState("");
	const queryClient = useQueryClient();

	const createMutation = useMutation({
		mutationFn: () => createOrgApiKey({ name }),
		onSuccess: (newKey) => {
			queryClient.invalidateQueries({ queryKey: ["org-api-keys"] });
			onOpenChange(false);
			setName("");
			toast.success(
				<div>
					<p>API key created</p>
					<p className="text-xs text-[var(--text-muted)] mt-1">
						Copy it now - you won't see it again
					</p>
				</div>,
			);
			navigator.clipboard.writeText(newKey.key);
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "Failed to create");
		},
	});

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		createMutation.mutate();
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create API Key</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">Name</Label>
						<Input
							id="name"
							placeholder="e.g. CI Pipeline, Production"
							value={name}
							onChange={(e) => setName(e.target.value)}
							required
						/>
						<p className="text-xs text-[var(--text-muted)]">
							Give your key a descriptive name to identify its usage
						</p>
					</div>
					<div className="flex justify-end gap-3">
						<Button
							type="button"
							variant="ghost"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={createMutation.isPending || !name}>
							{createMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Create Key
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export default function ApiKeysPage() {
	const { data: session, isPending: authLoading } = useSession();
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const queryClient = useQueryClient();

	const { data: apiKeys, isLoading } = useQuery({
		queryKey: ["org-api-keys"],
		queryFn: getOrgApiKeys,
		enabled: !!session,
	});

	const deleteMutation = useMutation({
		mutationFn: deleteOrgApiKey,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["org-api-keys"] });
			toast.success("API key deleted");
			setDeletingId(null);
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "Failed to delete");
			setDeletingId(null);
		},
	});

	function handleDelete(keyId: string) {
		setDeletingId(keyId);
		deleteMutation.mutate(keyId);
	}

	if (authLoading) {
		return (
			<div className="flex-1 flex items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-[var(--text-muted)]" />
			</div>
		);
	}

	return (
		<main className="flex-1 flex flex-col overflow-hidden">
			<PageHeader
				title="API Keys"
				icon={<Key className="h-4 w-4 text-[var(--glow-violet)]" />}
				actions={
					<Button
						onClick={() => setCreateModalOpen(true)}
						className="bg-[var(--glow-violet)] hover:bg-[#7c3aed] text-white border border-white/10"
					>
						<Plus className="h-4 w-4 mr-2" />
						Create Key
					</Button>
				}
			/>

			<div className="flex-1 overflow-y-auto p-8">
				<div className="max-w-4xl mx-auto">
					<div className="mb-6">
						<h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
							Organization API Keys
						</h1>
						<p className="text-[var(--text-muted)] font-['JetBrains_Mono'] text-sm">
							Use org keys with the SDK to manage all projects
						</p>
					</div>

					<div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 mb-6">
						<h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">
							SDK Usage
						</h3>
						<pre className="text-xs text-[var(--text-muted)] font-['JetBrains_Mono'] bg-[var(--bg-surface-active)] p-3 rounded overflow-x-auto">
							{`import { Mocktail } from '@mockspec/sdk'

const client = new Mocktail({
  apiKey: 'ms_org_xxx'
})

const projects = await client.projects.list()`}
						</pre>
					</div>

					{isLoading ? (
						<div className="space-y-3">
							<MemberRowSkeleton />
							<MemberRowSkeleton />
						</div>
					) : apiKeys && apiKeys.length > 0 ? (
						<div className="space-y-3">
							{apiKeys.map((key) => (
								<ApiKeyRow
									key={key.id}
									apiKey={key}
									onDelete={() => handleDelete(key.id)}
									isDeleting={deletingId === key.id}
								/>
							))}
						</div>
					) : (
						<div className="text-center py-12 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl">
							<Key className="h-12 w-12 mx-auto text-[var(--text-muted)] mb-4" />
							<h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
								No API keys yet
							</h3>
							<p className="text-sm text-[var(--text-muted)] mb-4">
								Create an org API key to use with the SDK
							</p>
							<Button
								onClick={() => setCreateModalOpen(true)}
								className="bg-[var(--glow-violet)] hover:bg-[#7c3aed] text-white border border-white/10"
							>
								<Plus className="h-4 w-4 mr-2" />
								Create Key
							</Button>
						</div>
					)}
				</div>
			</div>

			<CreateKeyModal
				open={createModalOpen}
				onOpenChange={setCreateModalOpen}
			/>
		</main>
	);
}
