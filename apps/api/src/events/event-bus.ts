import { EventEmitter } from "node:events";
import type { EventScope, SSEEvent } from "./types";

type EventHandler = (event: SSEEvent) => void;

type Subscription = {
	id: string;
	scope: EventScope;
	scopeId: string;
	handler: EventHandler;
};

class EventBus {
	private emitter = new EventEmitter();
	private subscriptions = new Map<string, Subscription>();
	private debounceTimers = new Map<string, NodeJS.Timeout>();
	private pendingEvents = new Map<string, SSEEvent>();

	private getChannelKey(scope: EventScope, scopeId: string): string {
		return `${scope}:${scopeId}`;
	}

	subscribe(scope: EventScope, scopeId: string, handler: EventHandler): string {
		const subscriptionId = crypto.randomUUID();
		const channelKey = this.getChannelKey(scope, scopeId);

		const subscription: Subscription = {
			id: subscriptionId,
			scope,
			scopeId,
			handler,
		};

		this.subscriptions.set(subscriptionId, subscription);
		this.emitter.on(channelKey, handler);

		return subscriptionId;
	}

	unsubscribe(subscriptionId: string): void {
		const subscription = this.subscriptions.get(subscriptionId);
		if (!subscription) return;

		const channelKey = this.getChannelKey(
			subscription.scope,
			subscription.scopeId,
		);
		this.emitter.off(channelKey, subscription.handler);
		this.subscriptions.delete(subscriptionId);
	}

	emit(event: SSEEvent): void {
		const channelKey = this.getChannelKey(event.scope, event.scopeId);
		this.emitter.emit(channelKey, event);
	}

	emitDebounced(event: SSEEvent, debounceMs = 500): void {
		const channelKey = this.getChannelKey(event.scope, event.scopeId);
		const debounceKey = `${channelKey}:${event.type}`;

		this.pendingEvents.set(debounceKey, event);

		const existingTimer = this.debounceTimers.get(debounceKey);
		if (existingTimer) {
			clearTimeout(existingTimer);
		}

		const timer = setTimeout(() => {
			const pendingEvent = this.pendingEvents.get(debounceKey);
			if (pendingEvent) {
				this.emit(pendingEvent);
				this.pendingEvents.delete(debounceKey);
			}
			this.debounceTimers.delete(debounceKey);
		}, debounceMs);

		this.debounceTimers.set(debounceKey, timer);
	}

	getSubscriptionCount(scope: EventScope, scopeId: string): number {
		const channelKey = this.getChannelKey(scope, scopeId);
		return this.emitter.listenerCount(channelKey);
	}
}

export const eventBus = new EventBus();
