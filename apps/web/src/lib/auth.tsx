import type { AuthOrg, AuthUser, MeResponse, TokenResponse } from "@/types";
import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import * as api from "./api";

type AuthState = {
	user: AuthUser | null;
	org: AuthOrg | null;
	hasCompletedOnboarding: boolean;
	emailVerifiedAt: string | null;
	isLoading: boolean;
	isAuthenticated: boolean;
};

type AuthContextValue = AuthState & {
	login: (email: string, password: string) => Promise<void>;
	register: (
		email: string,
		password: string,
		organization: string,
	) => Promise<void>;
	logout: () => Promise<void>;
	setOnboardingComplete: () => void;
	setTokens: (tokens: TokenResponse, user: AuthUser, org: AuthOrg) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "mocktail_tokens";

function getStoredTokens(): TokenResponse | null {
	const stored = localStorage.getItem(TOKEN_KEY);
	if (!stored) return null;
	try {
		return JSON.parse(stored) as TokenResponse;
	} catch {
		return null;
	}
}

function storeTokens(tokens: TokenResponse): void {
	localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

function clearTokens(): void {
	localStorage.removeItem(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<AuthState>({
		user: null,
		org: null,
		hasCompletedOnboarding: true,
		emailVerifiedAt: null,
		isLoading: true,
		isAuthenticated: false,
	});

	const loadUser = useCallback(async () => {
		const tokens = getStoredTokens();
		if (!tokens) {
			setState({
				user: null,
				org: null,
				hasCompletedOnboarding: true,
				emailVerifiedAt: null,
				isLoading: false,
				isAuthenticated: false,
			});
			return;
		}

		try {
			const me: MeResponse = await api.getMe(tokens.accessToken);
			setState({
				user: {
					id: me.id,
					email: me.email,
					emailVerifiedAt: me.emailVerifiedAt,
				},
				org: { id: me.org.id, name: me.org.name, slug: me.org.slug },
				hasCompletedOnboarding: me.hasCompletedOnboarding,
				emailVerifiedAt: me.emailVerifiedAt,
				isLoading: false,
				isAuthenticated: true,
			});
		} catch {
			// Token might be expired, try refresh
			try {
				const newTokens = await api.refreshTokens(tokens.refreshToken);
				storeTokens(newTokens);
				const me = await api.getMe(newTokens.accessToken);
				setState({
					user: {
						id: me.id,
						email: me.email,
						emailVerifiedAt: me.emailVerifiedAt,
					},
					org: { id: me.org.id, name: me.org.name, slug: me.org.slug },
					hasCompletedOnboarding: me.hasCompletedOnboarding,
					emailVerifiedAt: me.emailVerifiedAt,
					isLoading: false,
					isAuthenticated: true,
				});
			} catch {
				clearTokens();
				setState({
					user: null,
					org: null,
					hasCompletedOnboarding: true,
					emailVerifiedAt: null,
					isLoading: false,
					isAuthenticated: false,
				});
			}
		}
	}, []);

	useEffect(() => {
		loadUser();
	}, [loadUser]);

	const login = useCallback(async (email: string, password: string) => {
		const response = await api.login({ email, password });
		storeTokens(response.tokens);
		const me = await api.getMe(response.tokens.accessToken);
		setState({
			user: response.user,
			org: response.org,
			hasCompletedOnboarding: me.hasCompletedOnboarding,
			emailVerifiedAt: me.emailVerifiedAt,
			isLoading: false,
			isAuthenticated: true,
		});
	}, []);

	const register = useCallback(
		async (email: string, password: string, organization: string) => {
			const response = await api.register({ email, password, organization });
			storeTokens(response.tokens);
			setState({
				user: response.user,
				org: response.org,
				hasCompletedOnboarding: false,
				emailVerifiedAt: null,
				isLoading: false,
				isAuthenticated: true,
			});
		},
		[],
	);

	const setOnboardingComplete = useCallback(() => {
		setState((prev) => ({ ...prev, hasCompletedOnboarding: true }));
	}, []);

	const logout = useCallback(async () => {
		const tokens = getStoredTokens();
		if (tokens) {
			await api.logout(tokens.refreshToken).catch(() => {});
		}
		clearTokens();
		setState({
			user: null,
			org: null,
			hasCompletedOnboarding: true,
			emailVerifiedAt: null,
			isLoading: false,
			isAuthenticated: false,
		});
	}, []);

	const setTokens = useCallback(
		(tokens: TokenResponse, user: AuthUser, org: AuthOrg) => {
			storeTokens(tokens);
			setState({
				user,
				org,
				hasCompletedOnboarding: true,
				emailVerifiedAt: user.emailVerifiedAt,
				isLoading: false,
				isAuthenticated: true,
			});
		},
		[],
	);

	return (
		<AuthContext.Provider
			value={{
				...state,
				login,
				register,
				logout,
				setOnboardingComplete,
				setTokens,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return context;
}
