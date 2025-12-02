import { MethodBadge } from "@/components/method-badge";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
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
import { Select } from "@/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
	createEndpoint,
	createVariant,
	deleteVariant,
	getVariants,
	reorderVariants,
	updateEndpoint,
	updateVariant,
} from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";

import type {
	CreateEndpointInput,
	DelayType,
	Endpoint,
	HttpMethod,
	MatchOperator,
	MatchRule,
	MatchTarget,
	RuleLogic,
	ValidationMode,
	Variant,
} from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GripVertical, Plus, Settings2, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const COMMON_STATUS_CODES = [200, 201, 204, 400, 401, 403, 404, 500];
const NO_BODY_STATUS_CODES = [204, 304];
const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const MATCH_TARGETS: { value: MatchTarget; label: string }[] = [
	{ value: "header", label: "Header" },
	{ value: "query", label: "Query" },
	{ value: "param", label: "Path Param" },
	{ value: "body", label: "Body" },
];

const MATCH_OPERATORS: { value: MatchOperator; label: string }[] = [
	{ value: "equals", label: "equals" },
	{ value: "not_equals", label: "not equals" },
	{ value: "contains", label: "contains" },
	{ value: "not_contains", label: "not contains" },
	{ value: "exists", label: "exists" },
	{ value: "not_exists", label: "not exists" },
];

function RuleBuilder({
	rules,
	ruleLogic,
	onRulesChange,
	onLogicChange,
}: {
	rules: MatchRule[];
	ruleLogic: RuleLogic;
	onRulesChange: (rules: MatchRule[]) => void;
	onLogicChange: (logic: RuleLogic) => void;
}) {
	function addRule() {
		onRulesChange([
			...rules,
			{ target: "header", key: "", operator: "equals", value: "" },
		]);
	}

	function removeRule(index: number) {
		onRulesChange(rules.filter((_, i) => i !== index));
	}

	function updateRule(index: number, updates: Partial<MatchRule>) {
		onRulesChange(
			rules.map((rule, i) => (i === index ? { ...rule, ...updates } : rule)),
		);
	}

	const needsValue = (op: MatchOperator) =>
		!["exists", "not_exists"].includes(op);

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<Label className="text-sm font-medium">Match Rules</Label>
				{rules.length > 1 && (
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => onLogicChange("and")}
							className={`px-2 py-0.5 text-xs rounded ${
								ruleLogic === "and"
									? "bg-[var(--glow-violet)]/20 text-[var(--glow-violet)]"
									: "bg-white/5 text-[var(--text-muted)]"
							}`}
						>
							AND
						</button>
						<button
							type="button"
							onClick={() => onLogicChange("or")}
							className={`px-2 py-0.5 text-xs rounded ${
								ruleLogic === "or"
									? "bg-[var(--glow-violet)]/20 text-[var(--glow-violet)]"
									: "bg-white/5 text-[var(--text-muted)]"
							}`}
						>
							OR
						</button>
					</div>
				)}
			</div>

			{rules.length === 0 ? (
				<p className="text-sm text-[var(--text-muted)] italic">
					No rules - this variant will match all requests (if default) or never
					match
				</p>
			) : (
				<div className="space-y-2">
					{rules.map((rule, index) => (
						<div
							key={`${rule.target}-${rule.key}-${rule.operator}-${index}`}
							className="flex items-center gap-2 p-2 bg-[rgba(0,0,0,0.2)] rounded-lg"
						>
							<Select
								value={rule.target}
								onChange={(e) =>
									updateRule(index, { target: e.target.value as MatchTarget })
								}
								className="w-28 h-8 text-xs"
							>
								{MATCH_TARGETS.map((t) => (
									<option key={t.value} value={t.value}>
										{t.label}
									</option>
								))}
							</Select>

							<Input
								value={rule.key}
								onChange={(e) => updateRule(index, { key: e.target.value })}
								placeholder={
									rule.target === "body" ? "user.name" : "X-Custom-Header"
								}
								className="flex-1 h-8 text-xs font-mono"
							/>

							<Select
								value={rule.operator}
								onChange={(e) =>
									updateRule(index, {
										operator: e.target.value as MatchOperator,
									})
								}
								className="w-32 h-8 text-xs"
							>
								{MATCH_OPERATORS.map((op) => (
									<option key={op.value} value={op.value}>
										{op.label}
									</option>
								))}
							</Select>

							{needsValue(rule.operator) && (
								<Input
									value={rule.value ?? ""}
									onChange={(e) => updateRule(index, { value: e.target.value })}
									placeholder="value"
									className="flex-1 h-8 text-xs font-mono"
								/>
							)}

							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-[var(--text-muted)] hover:text-red-400"
								onClick={() => removeRule(index)}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					))}
				</div>
			)}

			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={addRule}
				className="w-full"
				disabled={rules.length >= 10}
			>
				<Plus className="h-4 w-4 mr-2" />
				Add Rule
			</Button>
		</div>
	);
}

function VariantFormModal({
	projectId,
	endpointId,
	variant,
	open,
	onOpenChange,
}: {
	projectId: string;
	endpointId: string;
	variant?: Variant;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const isEditing = !!variant;
	const queryClient = useQueryClient();

	const [name, setName] = useState(variant?.name ?? "Variant");
	const [isDefault, setIsDefault] = useState(variant?.isDefault ?? false);
	const [status, setStatus] = useState(variant?.status ?? 200);
	const [body, setBody] = useState(() => {
		if (!variant?.body) return "{}";
		if (variant.bodyType === "template") return String(variant.body);
		return JSON.stringify(variant.body, null, 2);
	});
	const [delay, setDelay] = useState(variant?.delay ?? 0);
	const [delayType, setDelayType] = useState<DelayType>(
		variant?.delayType ?? "fixed",
	);
	const [failRate, setFailRate] = useState(variant?.failRate ?? 0);
	const [rules, setRules] = useState<MatchRule[]>(variant?.rules ?? []);
	const [ruleLogic, setRuleLogic] = useState<RuleLogic>(
		variant?.ruleLogic ?? "and",
	);
	const [error, setError] = useState<string | null>(null);

	const isTemplate = body.includes("{{");

	useEffect(() => {
		if (open) {
			if (variant) {
				setName(variant.name);
				setIsDefault(variant.isDefault);
				setStatus(variant.status);
				setBody(
					variant.bodyType === "template"
						? String(variant.body)
						: JSON.stringify(variant.body, null, 2),
				);
				setDelay(variant.delay);
				setDelayType(variant.delayType);
				setFailRate(variant.failRate);
				setRules(variant.rules);
				setRuleLogic(variant.ruleLogic);
			} else {
				setName("Variant");
				setIsDefault(false);
				setStatus(200);
				setBody("{}");
				setDelay(0);
				setDelayType("fixed");
				setFailRate(0);
				setRules([]);
				setRuleLogic("and");
			}
			setError(null);
		}
	}, [open, variant]);

	const createMutation = useMutation({
		mutationFn: () => {
			const statusAllowsBody = !NO_BODY_STATUS_CODES.includes(status);
			const bodyType = isTemplate ? "template" : "static";
			let parsedBody: unknown = null;

			if (statusAllowsBody) {
				if (isTemplate) {
					parsedBody = body;
				} else {
					parsedBody = JSON.parse(body);
				}
			}

			return createVariant(projectId, endpointId, {
				name,
				isDefault,
				status,
				body: parsedBody,
				bodyType: statusAllowsBody ? bodyType : "static",
				delay,
				delayType,
				failRate,
				rules,
				ruleLogic,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["variants", projectId, endpointId],
			});
			onOpenChange(false);
			toast.success("Variant created");
		},
		onError: (err: unknown) => {
			setError(getErrorMessage(err));
		},
	});

	const updateMutation = useMutation({
		mutationFn: () => {
			const statusAllowsBody = !NO_BODY_STATUS_CODES.includes(status);
			const bodyType = isTemplate ? "template" : "static";
			let parsedBody: unknown = null;

			if (statusAllowsBody) {
				if (isTemplate) {
					parsedBody = body;
				} else {
					parsedBody = JSON.parse(body);
				}
			}

			return updateVariant(projectId, endpointId, variant?.id ?? "", {
				name,
				isDefault,
				status,
				body: parsedBody,
				bodyType: statusAllowsBody ? bodyType : "static",
				delay,
				delayType,
				failRate,
				rules,
				ruleLogic,
			});
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["variants", projectId, endpointId],
			});
			onOpenChange(false);
			toast.success("Variant updated");
		},
		onError: (err: unknown) => {
			setError(getErrorMessage(err));
		},
	});

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);

		const statusAllowsBody = !NO_BODY_STATUS_CODES.includes(status);
		if (statusAllowsBody && !isTemplate) {
			try {
				JSON.parse(body);
			} catch {
				setError("Invalid JSON in response body");
				return;
			}
		}

		if (isEditing) {
			updateMutation.mutate();
		} else {
			createMutation.mutate();
		}
	}

	const isPending = createMutation.isPending || updateMutation.isPending;
	const statusAllowsBody = !NO_BODY_STATUS_CODES.includes(status);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>
							{isEditing ? "Edit Variant" : "Create Variant"}
						</DialogTitle>
					</DialogHeader>

					<div className="space-y-6 py-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									className="mt-1.5"
									required
								/>
							</div>
							<div className="flex items-end">
								<label className="flex items-center gap-2 cursor-pointer">
									<input
										type="checkbox"
										checked={isDefault}
										onChange={(e) => setIsDefault(e.target.checked)}
										className="rounded border-[var(--border-subtle)]"
									/>
									<span className="text-sm">Default fallback</span>
								</label>
							</div>
						</div>

						<RuleBuilder
							rules={rules}
							ruleLogic={ruleLogic}
							onRulesChange={setRules}
							onLogicChange={setRuleLogic}
						/>

						<div>
							<Label htmlFor="status">Status Code</Label>
							<div className="mt-1.5 flex flex-wrap gap-2">
								{COMMON_STATUS_CODES.map((code) => {
									const isSuccess = code >= 200 && code < 300;
									const isError = code >= 400;
									return (
										<button
											key={code}
											type="button"
											onClick={() => setStatus(code)}
											className={`rounded-md px-3 py-1.5 text-sm font-mono transition-all ${
												status === code
													? isSuccess
														? "bg-[var(--status-success)]/20 text-[var(--status-success)] border border-[var(--status-success)]/30"
														: isError
															? "bg-red-500/20 text-red-400 border border-red-500/30"
															: "bg-[var(--glow-violet)]/20 text-[var(--glow-violet)] border border-[var(--glow-violet)]/30"
													: "bg-white/5 text-[var(--text-muted)] border border-white/10 hover:border-white/20"
											}`}
										>
											{code}
										</button>
									);
								})}
								<Input
									type="number"
									min={100}
									max={599}
									value={status}
									onChange={(e) => setStatus(Number(e.target.value))}
									className="w-20 font-mono"
								/>
							</div>
						</div>

						{statusAllowsBody ? (
							<div>
								<div className="flex items-center gap-2">
									<Label htmlFor="body">Response Body</Label>
									{isTemplate && (
										<span className="text-xs bg-[var(--glow-blue)]/20 text-[var(--glow-blue)] px-2 py-0.5 rounded-full">
											Template
										</span>
									)}
								</div>
								<Textarea
									id="body"
									value={body}
									onChange={(e) => setBody(e.target.value)}
									className="mt-1.5 min-h-[120px] font-mono text-sm"
									placeholder='{"message": "Hello, world!"}'
								/>
							</div>
						) : (
							<p className="text-sm text-[var(--text-muted)] italic">
								Status {status} does not allow a response body
							</p>
						)}

						<div className="grid grid-cols-2 gap-4">
							<div>
								<div className="flex items-center justify-between mb-1.5">
									<Label htmlFor="delay">
										{delayType === "random" ? "Max Delay (ms)" : "Delay (ms)"}
									</Label>
									<div className="flex items-center gap-1">
										<button
											type="button"
											onClick={() => setDelayType("fixed")}
											className={`px-2 py-0.5 text-xs rounded transition-colors ${
												delayType === "fixed"
													? "bg-[var(--glow-violet)]/20 text-[var(--glow-violet)]"
													: "bg-white/5 text-[var(--text-muted)] hover:bg-white/10"
											}`}
										>
											Fixed
										</button>
										<button
											type="button"
											onClick={() => setDelayType("random")}
											className={`px-2 py-0.5 text-xs rounded transition-colors ${
												delayType === "random"
													? "bg-[var(--glow-violet)]/20 text-[var(--glow-violet)]"
													: "bg-white/5 text-[var(--text-muted)] hover:bg-white/10"
											}`}
										>
											Random
										</button>
									</div>
								</div>
								<Input
									id="delay"
									type="number"
									min={0}
									max={30000}
									value={delay}
									onChange={(e) => setDelay(Number(e.target.value))}
								/>
							</div>
							<div>
								<Label htmlFor="failRate">Fail Rate (%)</Label>
								<Input
									id="failRate"
									type="number"
									min={0}
									max={100}
									value={failRate}
									onChange={(e) => setFailRate(Number(e.target.value))}
									className="mt-1.5"
								/>
							</div>
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
							{isPending
								? "Saving..."
								: isEditing
									? "Save Changes"
									: "Create Variant"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function VariantCard({
	variant,
	projectId,
	endpointId,
	onEdit,
	isDragging,
}: {
	variant: Variant;
	projectId: string;
	endpointId: string;
	onEdit: () => void;
	isDragging?: boolean;
}) {
	const [showConfirm, setShowConfirm] = useState(false);
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: () => deleteVariant(projectId, endpointId, variant.id),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["variants", projectId, endpointId],
			});
			toast.success("Variant deleted");
		},
		onError: (err: unknown) => {
			toast.error(getErrorMessage(err));
		},
	});

	return (
		<div
			className={`group flex items-center gap-4 rounded-xl border bg-[var(--bg-surface)] p-4 transition-all ${
				isDragging
					? "border-[var(--glow-violet)] shadow-lg"
					: "border-[var(--border-subtle)] hover:border-[var(--border-highlight)]"
			}`}
		>
			<div className="cursor-grab text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
				<GripVertical className="h-5 w-5" />
			</div>

			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2 mb-1">
					<span className="font-medium text-[var(--text-primary)] truncate">
						{variant.name}
					</span>
					{variant.isDefault && (
						<Badge
							variant="outline"
							className="text-xs border-[var(--glow-blue)]/30 text-[var(--glow-blue)]"
						>
							Default
						</Badge>
					)}
					<StatusBadge status={variant.status} />
				</div>

				{variant.rules.length > 0 && (
					<div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
						<Settings2 className="h-3 w-3" />
						<span>
							{variant.rules.length} rule{variant.rules.length > 1 ? "s" : ""} (
							{variant.ruleLogic.toUpperCase()})
						</span>
					</div>
				)}
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

function VariantList({
	variants,
	projectId,
	endpointId,
	onEdit,
}: {
	variants: Variant[];
	projectId: string;
	endpointId: string;
	onEdit: (variant: Variant) => void;
}) {
	const queryClient = useQueryClient();
	const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
	const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

	const reorderMutation = useMutation({
		mutationFn: (variantIds: string[]) =>
			reorderVariants(projectId, endpointId, variantIds),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["variants", projectId, endpointId],
			});
		},
		onError: (err: unknown) => {
			toast.error(getErrorMessage(err));
		},
	});

	function handleDragStart(index: number) {
		setDraggedIndex(index);
	}

	function handleDragOver(e: React.DragEvent, index: number) {
		e.preventDefault();
		setDragOverIndex(index);
	}

	function handleDrop(e: React.DragEvent, dropIndex: number) {
		e.preventDefault();
		if (draggedIndex === null || draggedIndex === dropIndex) {
			setDraggedIndex(null);
			setDragOverIndex(null);
			return;
		}

		const newVariants = [...variants];
		const [removed] = newVariants.splice(draggedIndex, 1);
		newVariants.splice(dropIndex, 0, removed);

		reorderMutation.mutate(newVariants.map((v) => v.id));
		setDraggedIndex(null);
		setDragOverIndex(null);
	}

	function handleDragEnd() {
		setDraggedIndex(null);
		setDragOverIndex(null);
	}

	return (
		<div className="space-y-2">
			{variants.map((variant, index) => (
				<div
					key={variant.id}
					draggable
					onDragStart={() => handleDragStart(index)}
					onDragOver={(e) => handleDragOver(e, index)}
					onDrop={(e) => handleDrop(e, index)}
					onDragEnd={handleDragEnd}
					className={
						dragOverIndex === index && draggedIndex !== index
							? "border-t-2 border-[var(--glow-violet)]"
							: ""
					}
				>
					<VariantCard
						variant={variant}
						projectId={projectId}
						endpointId={endpointId}
						onEdit={() => onEdit(variant)}
						isDragging={draggedIndex === index}
					/>
				</div>
			))}
		</div>
	);
}

type EndpointPanelProps = {
	projectId: string;
	apiKey: string;
	endpoint: Endpoint | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	proxyBaseUrl?: string | null;
};

export function EndpointPanel({
	projectId,
	endpoint,
	open,
	onOpenChange,
	proxyBaseUrl,
}: EndpointPanelProps) {
	const [activeTab, setActiveTab] = useState<"variants" | "config">("variants");
	const [variantModalOpen, setVariantModalOpen] = useState(false);
	const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
	const queryClient = useQueryClient();

	// Endpoint Config State
	const [method, setMethod] = useState<HttpMethod>("GET");
	const [path, setPath] = useState("/");
	const [status, setStatus] = useState(200);
	const [body, setBody] = useState("{}");
	const [delay, setDelay] = useState(0);
	const [failRate, setFailRate] = useState(0);
	const [validationEnabled, setValidationEnabled] = useState(false);
	const [requestBodySchema, setRequestBodySchema] = useState("");
	const [validationMode, setValidationMode] =
		useState<ValidationMode>("strict");
	const [proxyEnabled, setProxyEnabled] = useState(false);
	const [configError, setConfigError] = useState<string | null>(null);

	const isTemplate = body.includes("{{");

	// Reset/Sync state when endpoint changes or panel opens
	useEffect(() => {
		if (open) {
			if (endpoint) {
				setMethod(endpoint.method);
				setPath(endpoint.path);
				setStatus(endpoint.status);
				setBody(
					endpoint.bodyType === "template"
						? String(endpoint.body)
						: JSON.stringify(endpoint.body, null, 2),
				);
				setDelay(endpoint.delay);
				setFailRate(endpoint.failRate);
				const hasSchema =
					endpoint.requestBodySchema != null &&
					Object.keys(endpoint.requestBodySchema as object).length > 0;
				setValidationEnabled(endpoint.validationMode !== "none" && hasSchema);
				setRequestBodySchema(
					hasSchema ? JSON.stringify(endpoint.requestBodySchema, null, 2) : "",
				);
				setValidationMode(endpoint.validationMode ?? "strict");
				setProxyEnabled(endpoint.proxyEnabled ?? false);
			} else {
				// Create mode defaults
				setMethod("GET");
				setPath("/");
				setStatus(200);
				setBody("{}");
				setDelay(0);
				setFailRate(0);
				setValidationEnabled(false);
				setRequestBodySchema("");
				setValidationMode("strict");
				setProxyEnabled(false);
			}
			setConfigError(null);
		}
	}, [open, endpoint]);

	const { data: variants = [], isLoading: variantsLoading } = useQuery({
		queryKey: ["variants", projectId, endpoint?.id],
		queryFn: () => getVariants(projectId, endpoint?.id ?? ""),
		enabled: open && !!endpoint,
	});

	const createEndpointMutation = useMutation({
		mutationFn: (input: CreateEndpointInput) =>
			createEndpoint(projectId, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["endpoints", projectId] });
			queryClient.invalidateQueries({ queryKey: ["statistics", projectId] });
			onOpenChange(false);
			toast.success("Endpoint created");
		},
		onError: (err: unknown) => {
			setConfigError(getErrorMessage(err));
			toast.error(getErrorMessage(err));
		},
	});

	const updateEndpointMutation = useMutation({
		mutationFn: (input: CreateEndpointInput) =>
			updateEndpoint(projectId, endpoint?.id ?? "", input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["endpoints", projectId] });
			toast.success("Endpoint updated");
		},
		onError: (err: unknown) => {
			setConfigError(getErrorMessage(err));
			toast.error(getErrorMessage(err));
		},
	});

	function handleNewVariant() {
		setSelectedVariant(null);
		setVariantModalOpen(true);
	}

	function handleEditVariant(variant: Variant) {
		setSelectedVariant(variant);
		setVariantModalOpen(true);
	}

	function formatJsonBody() {
		if (isTemplate) return;
		try {
			const parsed = JSON.parse(body);
			setBody(JSON.stringify(parsed, null, 2));
		} catch {
			// invalid JSON, leave as-is
		}
	}

	function handleSaveConfig(e: React.FormEvent) {
		e.preventDefault();
		setConfigError(null);

		const statusAllowsBody = !NO_BODY_STATUS_CODES.includes(status);
		const bodyType = isTemplate ? "template" : "static";

		let parsedBody: unknown = null;
		if (statusAllowsBody) {
			if (isTemplate) {
				parsedBody = body;
			} else {
				try {
					parsedBody = JSON.parse(body);
				} catch {
					setConfigError("Invalid JSON in response body");
					return;
				}
			}
		}

		let parsedSchema: unknown = {};
		if (validationEnabled && requestBodySchema) {
			try {
				parsedSchema = JSON.parse(requestBodySchema);
			} catch {
				setConfigError("Invalid JSON in request body schema");
				return;
			}
		}

		const input: CreateEndpointInput = {
			method,
			path,
			status,
			body: parsedBody,
			bodyType: statusAllowsBody ? bodyType : "static",
			delay,
			failRate,
			requestBodySchema: parsedSchema,
			validationMode: validationEnabled ? validationMode : "none",
			proxyEnabled,
		};

		if (endpoint) {
			updateEndpointMutation.mutate(input);
		} else {
			createEndpointMutation.mutate(input);
		}
	}

	const isPending =
		createEndpointMutation.isPending || updateEndpointMutation.isPending;
	const statusAllowsBody = !NO_BODY_STATUS_CODES.includes(status);

	return (
		<>
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent className="w-[500px] sm:w-[600px] p-0 flex flex-col bg-[var(--bg-void)] border-l border-[var(--border-subtle)]">
					<SheetHeader className="px-6 py-4 border-b border-[var(--border-subtle)]">
						<SheetTitle className="font-['Outfit'] text-xl">
							{endpoint ? "Endpoint Details" : "Create Endpoint"}
						</SheetTitle>
						{endpoint && (
							<div className="flex items-center gap-2 text-sm font-mono text-[var(--text-muted)] mt-1">
								<MethodBadge method={endpoint.method} />
								<span className="truncate">{endpoint.path}</span>
							</div>
						)}
					</SheetHeader>

					{/* Tabs - Only show if editing an existing endpoint */}
					{endpoint ? (
						<div className="px-6 pt-4 pb-2">
							<div className="flex p-1 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-subtle)]">
								<button
									type="button"
									onClick={() => setActiveTab("variants")}
									className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
										activeTab === "variants"
											? "bg-[var(--bg-surface-active)] text-[var(--text-primary)] shadow-sm"
											: "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
									}`}
								>
									Variants
								</button>
								<button
									type="button"
									onClick={() => setActiveTab("config")}
									className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
										activeTab === "config"
											? "bg-[var(--bg-surface-active)] text-[var(--text-primary)] shadow-sm"
											: "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
									}`}
								>
									Configuration
								</button>
							</div>
						</div>
					) : null}

					{/* Content */}
					<div className="flex-1 overflow-y-auto px-6 py-4">
						{endpoint && activeTab === "variants" ? (
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<p className="text-sm text-[var(--text-muted)]">
										{variants.length} variant{variants.length !== 1 ? "s" : ""}{" "}
										defined
									</p>
									<Button
										size="sm"
										variant="outline"
										onClick={handleNewVariant}
										className="h-8"
									>
										<Plus className="h-3.5 w-3.5 mr-1.5" />
										New Variant
									</Button>
								</div>

								{variantsLoading ? (
									<div className="space-y-2">
										<div className="h-16 bg-[var(--bg-surface)] rounded-xl animate-pulse" />
										<div className="h-16 bg-[var(--bg-surface)] rounded-xl animate-pulse" />
									</div>
								) : variants.length === 0 ? (
									<div className="text-center py-8 border border-dashed border-[var(--border-subtle)] rounded-xl">
										<p className="text-sm text-[var(--text-muted)] mb-2">
											No variants yet
										</p>
										<Button size="sm" onClick={handleNewVariant}>
											Create your first variant
										</Button>
									</div>
								) : (
									<VariantList
										variants={variants}
										projectId={projectId}
										endpointId={endpoint.id}
										onEdit={handleEditVariant}
									/>
								)}
							</div>
						) : (
							<form onSubmit={handleSaveConfig} className="space-y-6 pb-8">
								{/* Method + Path */}
								<div className="space-y-3">
									<div>
										<Label>Method</Label>
										<div className="mt-1.5 flex gap-2">
											{HTTP_METHODS.map((m) => (
												<button
													key={m}
													type="button"
													onClick={() => setMethod(m)}
													className={`transition-all ${
														method === m
															? "scale-110 ring-2 ring-white/30 rounded-md"
															: "opacity-50 hover:opacity-80"
													}`}
												>
													<MethodBadge method={m} className="cursor-pointer" />
												</button>
											))}
										</div>
									</div>
									<div>
										<Label htmlFor="path">Path</Label>
										<Input
											id="path"
											value={path}
											onChange={(e) => setPath(e.target.value)}
											placeholder="/users/:id"
											className="mt-1.5 font-mono"
											required
										/>
									</div>
								</div>

								{/* Proxy Toggle */}
								{proxyBaseUrl && (
									<div className="space-y-3 bg-[var(--glow-blue)]/5 rounded-xl p-4 border border-[var(--glow-blue)]/20">
										<div className="flex items-center justify-between">
											<div>
												<Label>Proxy to Upstream</Label>
												<p className="text-xs text-[var(--text-muted)] mt-0.5">
													Forward requests to {proxyBaseUrl}
												</p>
											</div>
											<button
												type="button"
												onClick={() => setProxyEnabled(!proxyEnabled)}
												className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
													proxyEnabled ? "bg-[var(--glow-blue)]" : "bg-white/10"
												}`}
											>
												<span
													className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
														proxyEnabled ? "translate-x-4.5" : "translate-x-1"
													}`}
												/>
											</button>
										</div>
										{proxyEnabled && (
											<p className="text-xs text-[var(--glow-blue)]">
												Response config below will be ignored - real upstream
												response will be returned.
											</p>
										)}
									</div>
								)}

								{/* Request Validation */}
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<Label>Request Validation</Label>
										<button
											type="button"
											onClick={() => setValidationEnabled(!validationEnabled)}
											className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
												validationEnabled
													? "bg-[var(--glow-violet)]"
													: "bg-white/10"
											}`}
										>
											<span
												className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
													validationEnabled
														? "translate-x-4.5"
														: "translate-x-1"
												}`}
											/>
										</button>
									</div>

									{validationEnabled && (
										<div className="space-y-3 pl-4 border-l-2 border-[var(--border-subtle)]">
											<Textarea
												value={requestBodySchema}
												onChange={(e) => setRequestBodySchema(e.target.value)}
												placeholder='{"type": "object", "properties": {...}}'
												className="min-h-[100px] font-mono text-sm"
											/>
											<div>
												<Label htmlFor="validationMode">
													On Validation Failure
												</Label>
												<Select
													id="validationMode"
													value={validationMode}
													onChange={(e) =>
														setValidationMode(e.target.value as ValidationMode)
													}
													className="mt-1.5"
												>
													<option value="strict">
														Strict - Return 400 error
													</option>
													<option value="warn">
														Warn - Log errors, return response
													</option>
												</Select>
											</div>
										</div>
									)}
								</div>

								{/* Response Config */}
								{!proxyEnabled && (
									<>
										<div>
											<Label htmlFor="status">Status Code</Label>
											<div className="mt-1.5 flex flex-wrap gap-2">
												{COMMON_STATUS_CODES.map((code) => {
													const isSuccess = code >= 200 && code < 300;
													const isError = code >= 400;
													return (
														<button
															key={code}
															type="button"
															onClick={() => setStatus(code)}
															className={`rounded-md px-3 py-1.5 text-sm font-mono transition-all ${
																status === code
																	? isSuccess
																		? "bg-[var(--status-success)]/20 text-[var(--status-success)] border border-[var(--status-success)]/30"
																		: isError
																			? "bg-red-500/20 text-red-400 border border-red-500/30"
																			: "bg-[var(--glow-violet)]/20 text-[var(--glow-violet)] border border-[var(--glow-violet)]/30"
																	: "bg-white/5 text-[var(--text-muted)] border border-white/10 hover:border-white/20"
															}`}
														>
															{code}
														</button>
													);
												})}
												<Input
													type="number"
													min={100}
													max={599}
													value={status}
													onChange={(e) => setStatus(Number(e.target.value))}
													className="w-20 font-mono"
												/>
											</div>
										</div>

										{statusAllowsBody ? (
											<div>
												<div className="flex items-center gap-2">
													<Label htmlFor="body">Response Body</Label>
													{isTemplate && (
														<span className="text-xs bg-[var(--glow-blue)]/20 text-[var(--glow-blue)] px-2 py-0.5 rounded-full">
															Template
														</span>
													)}
												</div>
												<Textarea
													id="body"
													value={body}
													onChange={(e) => setBody(e.target.value)}
													onBlur={formatJsonBody}
													className="mt-1.5 min-h-[160px] font-mono text-sm"
													placeholder='{"message": "Hello, world!"}'
												/>
											</div>
										) : (
											<p className="text-sm text-[var(--text-muted)] italic">
												Status {status} does not allow a response body
											</p>
										)}

										<div className="grid grid-cols-2 gap-4">
											<div>
												<Label htmlFor="delay">Delay (ms)</Label>
												<Input
													id="delay"
													type="number"
													min={0}
													max={30000}
													value={delay}
													onChange={(e) => setDelay(Number(e.target.value))}
													className="mt-1.5"
												/>
											</div>
											<div>
												<Label htmlFor="failRate">Fail Rate (%)</Label>
												<Input
													id="failRate"
													type="number"
													min={0}
													max={100}
													value={failRate}
													onChange={(e) => setFailRate(Number(e.target.value))}
													className="mt-1.5"
												/>
											</div>
										</div>
									</>
								)}

								{configError && (
									<p className="text-sm text-red-400">{configError}</p>
								)}

								<Button type="submit" className="w-full" disabled={isPending}>
									{isPending
										? "Saving..."
										: endpoint
											? "Save Changes"
											: "Create Endpoint"}
								</Button>
							</form>
						)}
					</div>
				</SheetContent>
			</Sheet>

			<VariantFormModal
				projectId={projectId}
				endpointId={endpoint?.id ?? ""}
				variant={selectedVariant ?? undefined}
				open={variantModalOpen}
				onOpenChange={setVariantModalOpen}
			/>
		</>
	);
}
