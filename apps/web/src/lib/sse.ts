import type { ProjectStatistics } from "@/types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export type EventScope = "project" | "org" | "user";

export type StatsUpdatedPayload = {
	projectId: string;
	endpointId: string | null;
	requestCount?: number;
};

export type StatsInitialPayload = ProjectStatistics;

export type SSEEventMap = {
	"stats.updated": StatsUpdatedPayload;
	"stats.initial": StatsInitialPayload;
	keepalive: undefined;
};

export type SSEEventType = keyof SSEEventMap;

export type SSEConnection = {
	on<T extends SSEEventType>(
		event: T,
		handler: (payload: SSEEventMap[T]) => void,
	): void;
	off<T extends SSEEventType>(
		event: T,
		handler: (payload: SSEEventMap[T]) => void,
	): void;
	close(): void;
	isConnected(): boolean;
};

export function createSSEConnection(
	scope: EventScope,
	scopeId: string,
): SSEConnection {
	const url = `${API_BASE}/events/${scope}/${scopeId}`;
	let eventSource: EventSource | null = null;
	let reconnectAttempts = 0;
	let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
	let closed = false;

	type AnyHandler = (payload: unknown) => void;
	const handlers = new Map<SSEEventType, Set<AnyHandler>>();

	function connect() {
		if (closed) return;

		eventSource = new EventSource(url, { withCredentials: true });

		eventSource.onopen = () => {
			reconnectAttempts = 0;
		};

		eventSource.onerror = () => {
			if (closed) return;

			eventSource?.close();
			eventSource = null;

			const delay = Math.min(1000 * 2 ** reconnectAttempts, 30000);
			reconnectAttempts++;

			reconnectTimeout = setTimeout(() => {
				connect();
			}, delay);
		};

		eventSource.addEventListener("stats.updated", (e) => {
			const data = JSON.parse(e.data) as { payload: StatsUpdatedPayload };
			const eventHandlers = handlers.get("stats.updated");
			if (eventHandlers) {
				for (const h of eventHandlers) {
					h(data.payload);
				}
			}
		});

		eventSource.addEventListener("stats.initial", (e) => {
			const data = JSON.parse(e.data) as { payload: StatsInitialPayload };
			const eventHandlers = handlers.get("stats.initial");
			if (eventHandlers) {
				for (const h of eventHandlers) {
					h(data.payload);
				}
			}
		});

		eventSource.addEventListener("keepalive", () => {
			const eventHandlers = handlers.get("keepalive");
			if (eventHandlers) {
				for (const h of eventHandlers) {
					h(undefined);
				}
			}
		});
	}

	connect();

	return {
		on<T extends SSEEventType>(
			event: T,
			handler: (payload: SSEEventMap[T]) => void,
		) {
			if (!handlers.has(event)) {
				handlers.set(event, new Set());
			}
			handlers.get(event)?.add(handler as AnyHandler);
		},

		off<T extends SSEEventType>(
			event: T,
			handler: (payload: SSEEventMap[T]) => void,
		) {
			handlers.get(event)?.delete(handler as AnyHandler);
		},

		close() {
			closed = true;
			if (reconnectTimeout) {
				clearTimeout(reconnectTimeout);
			}
			eventSource?.close();
			eventSource = null;
		},

		isConnected() {
			return eventSource?.readyState === EventSource.OPEN;
		},
	};
}
