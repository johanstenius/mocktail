import { createEndpoint, updateEndpoint } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { getCurlCommand, getMockUrl } from "@/lib/url";
import type {
	CreateEndpointInput,
	Endpoint,
	HttpMethod,
	ValidationMode,
} from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CopyButton } from "./copy-button";
import { MethodBadge } from "./method-badge";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select } from "./ui/select";
import { Textarea } from "./ui/textarea";

const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const COMMON_STATUS_CODES = [200, 201, 204, 400, 401, 403, 404, 500];
const NO_BODY_STATUS_CODES = [204, 304];

type EndpointFormProps = {
	projectId: string;
	apiKey?: string;
	endpoint?: Endpoint;
	prefill?: { method: HttpMethod; path: string };
	open: boolean;
	onOpenChange: (open: boolean) => void;
	proxyBaseUrl?: string | null;
};

export function EndpointForm({
	projectId,
	apiKey,
	endpoint,
	prefill,
	open,
	onOpenChange,
	proxyBaseUrl,
}: EndpointFormProps) {
	const isEditing = !!endpoint;

	const [method, setMethod] = useState<HttpMethod>(endpoint?.method ?? "GET");
	const [path, setPath] = useState(endpoint?.path ?? "/");
	const [status, setStatus] = useState(endpoint?.status ?? 200);
	const [body, setBody] = useState(() => {
		if (!endpoint?.body) return "{}";
		if (endpoint.bodyType === "template") return String(endpoint.body);
		return JSON.stringify(endpoint.body, null, 2);
	});
	const [delay, setDelay] = useState(endpoint?.delay ?? 0);
	const [failRate, setFailRate] = useState(endpoint?.failRate ?? 0);
	const [validationEnabled, setValidationEnabled] = useState(
		endpoint?.validationMode !== "none" &&
			endpoint?.requestBodySchema != null &&
			Object.keys(endpoint?.requestBodySchema as object).length > 0,
	);
	const [requestBodySchema, setRequestBodySchema] = useState(() => {
		if (!endpoint?.requestBodySchema) return "";
		if (Object.keys(endpoint.requestBodySchema as object).length === 0)
			return "";
		return JSON.stringify(endpoint.requestBodySchema, null, 2);
	});
	const [validationMode, setValidationMode] = useState<ValidationMode>(
		endpoint?.validationMode ?? "strict",
	);
	const [proxyEnabled, setProxyEnabled] = useState(
		endpoint?.proxyEnabled ?? false,
	);
	const [error, setError] = useState<string | null>(null);

	const isTemplate = body.includes("{{");

	function formatJsonBody() {
		if (isTemplate) return;
		try {
			const parsed = JSON.parse(body);
			setBody(JSON.stringify(parsed, null, 2));
		} catch {
			// invalid JSON, leave as-is (will show error on submit)
		}
	}

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
			} else if (prefill) {
				setMethod(prefill.method);
				setPath(prefill.path);
				setStatus(200);
				setBody("{}");
				setDelay(0);
				setFailRate(0);
				setValidationEnabled(false);
				setRequestBodySchema("");
				setValidationMode("strict");
				setProxyEnabled(false);
			} else {
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
			setError(null);
		}
	}, [open, endpoint, prefill]);

	const queryClient = useQueryClient();

	const createMutation = useMutation({
		mutationFn: (input: CreateEndpointInput) =>
			createEndpoint(projectId, input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["endpoints", projectId] });
			queryClient.invalidateQueries({ queryKey: ["statistics", projectId] });
			onOpenChange(false);
			resetForm();
			toast.success("Endpoint created");
		},
		onError: (err: unknown) => {
			setError(getErrorMessage(err));
			toast.error(getErrorMessage(err));
		},
	});

	const updateMutation = useMutation({
		mutationFn: (input: CreateEndpointInput) =>
			updateEndpoint(projectId, endpoint?.id ?? "", input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["endpoints", projectId] });
			onOpenChange(false);
			toast.success("Endpoint updated");
		},
		onError: (err: unknown) => {
			setError(getErrorMessage(err));
			toast.error(getErrorMessage(err));
		},
	});

	function resetForm() {
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
		setError(null);
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);

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
					setError("Invalid JSON in response body");
					return;
				}
			}
		}

		let parsedSchema: unknown = {};
		if (validationEnabled && requestBodySchema) {
			try {
				parsedSchema = JSON.parse(requestBodySchema);
			} catch {
				setError("Invalid JSON in request body schema");
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

		if (isEditing) {
			updateMutation.mutate(input);
		} else {
			createMutation.mutate(input);
		}
	}

	const isPending = createMutation.isPending || updateMutation.isPending;
	const statusAllowsBody = !NO_BODY_STATUS_CODES.includes(status);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<div className="flex items-center justify-between">
							<DialogTitle>
								{isEditing ? "Edit Endpoint" : "Create Endpoint"}
							</DialogTitle>
							{isEditing && apiKey && (
								<div className="flex items-center gap-2">
									<CopyButton
										value={getMockUrl(path)}
										label="Copy URL"
										variant="ghost"
										size="sm"
										className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
									>
										URL
									</CopyButton>
									<CopyButton
										value={getCurlCommand(method, getMockUrl(path), apiKey)}
										label="Copy cURL"
										variant="ghost"
										size="sm"
										className="text-[var(--text-muted)] hover:text-[var(--text-primary)] font-['JetBrains_Mono'] text-xs"
									>
										cURL
									</CopyButton>
								</div>
							)}
						</div>
					</DialogHeader>

					<div className="space-y-6 py-4">
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

						{/* Proxy Toggle - only show if project has proxyBaseUrl */}
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
										className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${proxyEnabled ? "bg-[var(--glow-blue)]" : "bg-white/10"}`}
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
											validationEnabled ? "translate-x-4.5" : "translate-x-1"
										}`}
									/>
								</button>
							</div>
							<p className="text-xs text-[var(--text-muted)]">
								{validationEnabled
									? "Validate incoming request body against JSON Schema"
									: "Accept all requests (no validation)"}
							</p>

							{validationEnabled && (
								<>
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
											<option value="strict">Strict - Return 400 error</option>
											<option value="warn">
												Warn - Log errors, return response
											</option>
										</Select>
									</div>
								</>
							)}
						</div>

						{/* Response Config - hidden when proxy enabled */}
						{!proxyEnabled && (
							<>
								{/* Status */}
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
																? "bg-[var(--status-success)]/20 text-[var(--status-success)] border border-[var(--status-success)]/30 ring-2 ring-[var(--status-success)]/20"
																: isError
																	? "bg-red-500/20 text-red-400 border border-red-500/30 ring-2 ring-red-500/20"
																	: "bg-[var(--glow-violet)]/20 text-[var(--glow-violet)] border border-[var(--glow-violet)]/30 ring-2 ring-[var(--glow-violet)]/20"
															: "bg-white/5 text-[var(--text-muted)] border border-white/10 hover:border-white/20 hover:text-[var(--text-secondary)]"
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

								{/* Response Body - only show when status allows body */}
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
										<p className="mt-2 text-xs text-[var(--text-muted)]">
											Supports{" "}
											<a
												href="/docs#response-templates"
												target="_blank"
												rel="noopener noreferrer"
												className="text-[var(--glow-blue)] hover:underline"
											>
												templates
											</a>{" "}
											and{" "}
											<a
												href="/docs#faker-helpers"
												target="_blank"
												rel="noopener noreferrer"
												className="text-[var(--glow-pink)] hover:underline"
											>
												faker helpers
											</a>{" "}
											for dynamic responses
										</p>
									</div>
								) : (
									<p className="text-sm text-[var(--text-muted)] italic">
										Status {status} does not allow a response body
									</p>
								)}

								{/* Advanced: Delay + Fail Rate */}
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
										<p className="mt-1 text-xs text-[var(--text-muted)]">
											Simulate network latency
										</p>
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
										<p className="mt-1 text-xs text-[var(--text-muted)]">
											Random 500 errors
										</p>
									</div>
								</div>
							</>
						)}

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
									: "Create Endpoint"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
