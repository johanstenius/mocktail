import { ApiKeyRowSkeleton } from "@/components/skeleton";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createApiKey, deleteApiKey, getApiKeys, getMembers } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { ApiKey, OrgRole } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Check, Copy, Key, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/api-keys")({
	component: ApiKeysPage,
});

function ApiKeyRow({
	apiKey,
	canDelete,
	onDelete,
}: {
	apiKey: ApiKey;
	canDelete: boolean;
	onDelete: () => void;
}) {
	const [showConfirm, setShowConfirm] = useState(false);

	return (
		<div className="flex items-center justify-between p-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl hover:border-[var(--border-highlight)] transition-all">
			<div className="flex items-center gap-4">
				<div className="w-10 h-10 rounded-full bg-[var(--bg-surface-active)] flex items-center justify-center">
					<Key className="h-4 w-4 text-[var(--glow-violet)]" />
				</div>
				<div>
					<div className="text-sm font-medium text-[var(--text-primary)] font-['Inter']">
						{apiKey.name}
					</div>
					<div className="text-xs text-[var(--text-muted)] font-['JetBrains_Mono']">
						{apiKey.key}
					</div>
				</div>
			</div>
			<div className="flex items-center gap-3">
				<span className="text-xs text-[var(--text-muted)] font-['JetBrains_Mono']">
					{new Date(apiKey.createdAt).toLocaleDateString()}
				</span>
				{canDelete &&
					(showConfirm ? (
						<div className="flex items-center gap-2">
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
							className="h-8 w-8 text-[var(--text-muted)] hover:text-[var(--status-error)]"
							onClick={() => setShowConfirm(true)}
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					))}
			</div>
		</div>
	);
}

function CreateApiKeyModal({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [name, setName] = useState("");
	const [error, setError] = useState("");
	const [createdKey, setCreatedKey] = useState<string | null>(null);
	const [copied, setCopied] = useState(false);
	const queryClient = useQueryClient();

	const mutation = useMutation({
		mutationFn: () => createApiKey({ name }),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
			setCreatedKey(data.fullKey);
		},
		onError: (err: Error) => {
			setError(err.message);
		},
	});

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		mutation.mutate();
	}

	function handleCopy() {
		if (createdKey) {
			navigator.clipboard.writeText(createdKey);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	}

	function handleClose() {
		onOpenChange(false);
		setName("");
		setError("");
		setCreatedKey(null);
		setCopied(false);
	}

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{createdKey ? "API Key Created" : "Create API Key"}
					</DialogTitle>
				</DialogHeader>
				{createdKey ? (
					<div className="space-y-4">
						<div className="p-4 bg-[var(--status-warning)]/10 border border-[var(--status-warning)]/30 rounded-lg">
							<p className="text-sm text-[var(--text-primary)] mb-2 font-medium">
								Copy your API key now. You won't be able to see it again.
							</p>
						</div>
						<div className="flex items-center gap-2 p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg font-['JetBrains_Mono'] text-sm">
							<code className="flex-1 break-all text-[var(--text-primary)]">
								{createdKey}
							</code>
							<Button
								variant="ghost"
								size="icon"
								onClick={handleCopy}
								className="flex-shrink-0"
							>
								{copied ? (
									<Check className="h-4 w-4 text-[var(--status-success)]" />
								) : (
									<Copy className="h-4 w-4" />
								)}
							</Button>
						</div>
						<div className="flex justify-end">
							<Button onClick={handleClose}>Done</Button>
						</div>
					</div>
				) : (
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								placeholder="e.g. Production, CI/CD, Local dev"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
							/>
						</div>
						{error && (
							<p className="text-sm text-[var(--status-error)]">{error}</p>
						)}
						<div className="flex justify-end gap-3">
							<Button type="button" variant="ghost" onClick={handleClose}>
								Cancel
							</Button>
							<Button type="submit" disabled={mutation.isPending}>
								{mutation.isPending && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Create Key
							</Button>
						</div>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}

function ApiKeysPage() {
	const { isAuthenticated, isLoading: authLoading, user } = useAuth();
	const navigate = useNavigate();
	const [createModalOpen, setCreateModalOpen] = useState(false);
	const queryClient = useQueryClient();

	const { data: apiKeys = [], isLoading: keysLoading } = useQuery({
		queryKey: ["apiKeys"],
		queryFn: getApiKeys,
		enabled: isAuthenticated,
	});

	const { data: members = [] } = useQuery({
		queryKey: ["members"],
		queryFn: getMembers,
		enabled: isAuthenticated,
	});

	const deleteMutation = useMutation({
		mutationFn: deleteApiKey,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["apiKeys"] });
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

	const currentMember = members.find((m) => m.userId === user?.id);
	const currentRole: OrgRole = currentMember?.role ?? "member";
	const canManage = currentRole === "owner" || currentRole === "admin";

	return (
		<main className="flex-1 flex flex-col overflow-hidden">
			<header className="h-20 px-8 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[rgba(5,5,5,0.3)] backdrop-blur-md">
				<div className="flex items-center gap-2 text-sm text-[var(--text-muted)] font-['Inter']">
					<span className="text-[var(--text-primary)] font-medium">
						API Keys
					</span>
				</div>
				{canManage && (
					<Button
						onClick={() => setCreateModalOpen(true)}
						className="bg-[var(--glow-violet)] hover:bg-[#7c3aed] text-white shadow-[0_0_15px_rgba(139,92,246,0.3)] border border-white/10"
					>
						<Plus className="h-4 w-4 mr-2" />
						Create API Key
					</Button>
				)}
			</header>

			<div className="flex-1 overflow-y-auto p-8">
				<div className="max-w-4xl mx-auto">
					<div className="mb-6">
						<h1 className="text-3xl font-bold mb-1 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent font-['Outfit']">
							API Keys
						</h1>
						<p className="text-[var(--text-muted)] font-['JetBrains_Mono'] text-sm">
							Manage API keys for programmatic access to your mock endpoints
						</p>
					</div>

					{keysLoading ? (
						<div className="space-y-3">
							<ApiKeyRowSkeleton />
							<ApiKeyRowSkeleton />
							<ApiKeyRowSkeleton />
						</div>
					) : apiKeys.length === 0 ? (
						<div className="text-center py-12 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl">
							<Key className="h-12 w-12 text-[var(--text-muted)] mx-auto mb-4" />
							<h3 className="text-lg font-medium text-[var(--text-primary)] mb-2 font-['Outfit']">
								No API Keys
							</h3>
							<p className="text-[var(--text-muted)] mb-4 font-['Inter']">
								Create an API key to access your mock endpoints programmatically
							</p>
							{canManage && (
								<Button onClick={() => setCreateModalOpen(true)}>
									<Plus className="h-4 w-4 mr-2" />
									Create API Key
								</Button>
							)}
						</div>
					) : (
						<div className="space-y-3">
							{apiKeys.map((apiKey) => (
								<ApiKeyRow
									key={apiKey.id}
									apiKey={apiKey}
									canDelete={canManage}
									onDelete={() => deleteMutation.mutate(apiKey.id)}
								/>
							))}
						</div>
					)}
				</div>
			</div>

			<CreateApiKeyModal
				open={createModalOpen}
				onOpenChange={setCreateModalOpen}
			/>
		</main>
	);
}
