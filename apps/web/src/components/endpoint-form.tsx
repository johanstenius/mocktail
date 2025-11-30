import { createEndpoint, updateEndpoint } from "@/lib/api";
import { getCurlCommand, getMockUrl } from "@/lib/url";
import type {
	BodyType,
	CreateEndpointInput,
	Endpoint,
	HttpMethod,
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
};

export function EndpointForm({
	projectId,
	apiKey,
	endpoint,
	prefill,
	open,
	onOpenChange,
}: EndpointFormProps) {
	const isEditing = !!endpoint;

	const [method, setMethod] = useState<HttpMethod>(endpoint?.method ?? "GET");
	const [path, setPath] = useState(endpoint?.path ?? "/");
	const [status, setStatus] = useState(endpoint?.status ?? 200);
	const [bodyType, setBodyType] = useState<BodyType>(
		endpoint?.bodyType ?? "static",
	);
	const [body, setBody] = useState(() => {
		if (!endpoint?.body) return "{}";
		if (endpoint.bodyType === "template") return String(endpoint.body);
		return JSON.stringify(endpoint.body, null, 2);
	});
	const [delay, setDelay] = useState(endpoint?.delay ?? 0);
	const [failRate, setFailRate] = useState(endpoint?.failRate ?? 0);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (open) {
			if (endpoint) {
				setMethod(endpoint.method);
				setPath(endpoint.path);
				setStatus(endpoint.status);
				setBodyType(endpoint.bodyType);
				setBody(
					endpoint.bodyType === "template"
						? String(endpoint.body)
						: JSON.stringify(endpoint.body, null, 2),
				);
				setDelay(endpoint.delay);
				setFailRate(endpoint.failRate);
			} else if (prefill) {
				setMethod(prefill.method);
				setPath(prefill.path);
				setStatus(200);
				setBodyType("static");
				setBody("{}");
				setDelay(0);
				setFailRate(0);
			} else {
				setMethod("GET");
				setPath("/");
				setStatus(200);
				setBodyType("static");
				setBody("{}");
				setDelay(0);
				setFailRate(0);
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
		onError: (err: Error) => {
			setError(err.message);
			toast.error("Failed to create endpoint");
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
		onError: (err: Error) => {
			setError(err.message);
			toast.error("Failed to update endpoint");
		},
	});

	function resetForm() {
		setMethod("GET");
		setPath("/");
		setStatus(200);
		setBodyType("static");
		setBody("{}");
		setDelay(0);
		setFailRate(0);
		setError(null);
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);

		const statusAllowsBody = !NO_BODY_STATUS_CODES.includes(status);

		let parsedBody: unknown = null;
		if (statusAllowsBody) {
			if (bodyType === "template") {
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

		const input: CreateEndpointInput = {
			method,
			path,
			status,
			body: parsedBody,
			bodyType: statusAllowsBody ? bodyType : "static",
			delay,
			failRate,
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

						{/* Body Type Toggle - only show when status allows body */}
						{statusAllowsBody && (
							<div>
								<Label>Response Type</Label>
								<div className="mt-1.5 flex gap-2">
									<button
										type="button"
										onClick={() => setBodyType("static")}
										className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
											bodyType === "static"
												? "bg-[var(--glow-violet)]/20 text-[var(--glow-violet)] border border-[var(--glow-violet)]/30 ring-2 ring-[var(--glow-violet)]/20"
												: "bg-white/5 text-[var(--text-muted)] border border-white/10 hover:border-white/20 hover:text-[var(--text-secondary)]"
										}`}
									>
										Static JSON
									</button>
									<button
										type="button"
										onClick={() => setBodyType("template")}
										className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${
											bodyType === "template"
												? "bg-[var(--glow-blue)]/20 text-[var(--glow-blue)] border border-[var(--glow-blue)]/30 ring-2 ring-[var(--glow-blue)]/20"
												: "bg-white/5 text-[var(--text-muted)] border border-white/10 hover:border-white/20 hover:text-[var(--text-secondary)]"
										}`}
									>
										Template
									</button>
								</div>
							</div>
						)}

						{/* Response Body - only show when status allows body */}
						{statusAllowsBody ? (
							<div>
								<Label htmlFor="body">
									{bodyType === "template"
										? "Response Body (Template)"
										: "Response Body (JSON)"}
								</Label>
								<Textarea
									id="body"
									value={body}
									onChange={(e) => setBody(e.target.value)}
									className="mt-1.5 min-h-[160px] font-mono text-sm"
									placeholder={
										bodyType === "template"
											? `{
  "id": "{{request.params.id}}",
  "name": "{{faker_person_fullName}}",
  "email": "{{faker_internet_email}}"
}`
											: '{"message": "Hello, world!"}'
									}
								/>
								{bodyType === "template" && (
									<p className="mt-2 text-xs text-[var(--text-muted)]">
										Use{" "}
										<code className="bg-[var(--glow-blue)]/10 text-[var(--glow-blue)] px-1.5 py-0.5 rounded">
											{"{{request.params.id}}"}
										</code>
										,{" "}
										<code className="bg-[var(--glow-blue)]/10 text-[var(--glow-blue)] px-1.5 py-0.5 rounded">
											{"{{request.query.name}}"}
										</code>
										,{" "}
										<code className="bg-[var(--glow-pink)]/10 text-[var(--glow-pink)] px-1.5 py-0.5 rounded">
											{"{{faker_person_fullName}}"}
										</code>
										,{" "}
										<code className="bg-[var(--glow-pink)]/10 text-[var(--glow-pink)] px-1.5 py-0.5 rounded">
											{"{{faker_internet_email}}"}
										</code>
									</p>
								)}
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
