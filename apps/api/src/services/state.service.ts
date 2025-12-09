type BucketItem = Record<string, unknown>;

type ProjectState = {
	counters: Map<string, number>;
	buckets: Map<string, BucketItem[]>;
};

const stateStore = new Map<string, ProjectState>();

function getProjectState(projectId: string): ProjectState {
	let state = stateStore.get(projectId);
	if (!state) {
		state = { counters: new Map(), buckets: new Map() };
		stateStore.set(projectId, state);
	}
	return state;
}

export function getEndpointCounter(
	projectId: string,
	endpointId: string,
): number {
	const state = getProjectState(projectId);
	return state.counters.get(endpointId) ?? 0;
}

export function incrementEndpointCounter(
	projectId: string,
	endpointId: string,
): number {
	const state = getProjectState(projectId);
	const current = state.counters.get(endpointId) ?? 0;
	const next = current + 1;
	state.counters.set(endpointId, next);
	return next;
}

export function resetProjectCounters(projectId: string): void {
	const state = stateStore.get(projectId);
	if (state) {
		state.counters.clear();
	}
}

export function resetAllState(): void {
	stateStore.clear();
}

export function getProjectCounterStats(
	projectId: string,
): Record<string, number> {
	const state = stateStore.get(projectId);
	if (!state) return {};
	return Object.fromEntries(state.counters);
}

export function getBucketData(
	projectId: string,
	bucketName: string,
): BucketItem[] | undefined {
	const state = stateStore.get(projectId);
	return state?.buckets.get(bucketName);
}

export function setBucketData(
	projectId: string,
	bucketName: string,
	data: BucketItem[],
): void {
	const state = getProjectState(projectId);
	state.buckets.set(bucketName, data);
}

export function deleteBucketData(projectId: string, bucketName: string): void {
	const state = stateStore.get(projectId);
	if (state) {
		state.buckets.delete(bucketName);
	}
}

export function resetProjectBuckets(projectId: string): void {
	const state = stateStore.get(projectId);
	if (state) {
		state.buckets.clear();
	}
}

export function resetProjectState(projectId: string): void {
	const state = stateStore.get(projectId);
	if (state) {
		state.counters.clear();
		state.buckets.clear();
	}
}
