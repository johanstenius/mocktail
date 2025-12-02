export type EventScope = "project" | "org" | "user";

type BaseEvent<T extends string, P> = {
	type: T;
	scope: EventScope;
	scopeId: string;
	payload: P;
	timestamp: string;
};

// Stats updated event - emitted when mock request is logged
export type StatsUpdatedEvent = BaseEvent<
	"stats.updated",
	{
		projectId: string;
		endpointId: string | null;
		requestCount?: number;
	}
>;

// Future event types (for extensibility reference)
export type MemberJoinedEvent = BaseEvent<
	"member.joined",
	{
		memberId: string;
		email: string;
		role: string;
	}
>;

export type MemberRemovedEvent = BaseEvent<
	"member.removed",
	{
		memberId: string;
		email: string;
	}
>;

export type InviteCreatedEvent = BaseEvent<
	"invite.created",
	{
		inviteId: string;
		email: string;
		orgName: string;
	}
>;

// Union of all SSE events
export type SSEEvent =
	| StatsUpdatedEvent
	| MemberJoinedEvent
	| MemberRemovedEvent
	| InviteCreatedEvent;

// Helper to create events
export function createEvent<T extends SSEEvent["type"]>(
	type: T,
	scope: EventScope,
	scopeId: string,
	payload: Extract<SSEEvent, { type: T }>["payload"],
): Extract<SSEEvent, { type: T }> {
	return {
		type,
		scope,
		scopeId,
		payload,
		timestamp: new Date().toISOString(),
	} as Extract<SSEEvent, { type: T }>;
}
