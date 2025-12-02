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
	role: string | null;
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
	setTokens: (
		tokens: TokenResponse,
		user: AuthUser,
		org: AuthOrg,
		role?: string,
	) => void;
	refreshUser: () => Promise<void>;
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
		role: null,
		isLoading: true,
		isAuthenticated: false,
	});

	const loadUser = useCallback(async () => {
		// Check for OAuth callback tokens in URL
		const params = new URLSearchParams(window.location.search);
		const accessToken = params.get("access_token");
		const refreshToken = params.get("refresh_token");
		const expiresIn = params.get("expires_in");

		if (accessToken && refreshToken && expiresIn) {
			const tokens: TokenResponse = {
				accessToken,
				refreshToken,
				expiresIn: Number(expiresIn),
			};
			storeTokens(tokens);
			// Clean URL params
			window.history.replaceState({}, document.title, window.location.pathname);
		}

		const tokens = getStoredTokens();
		if (!tokens) {
			setState({
				user: null,
				org: null,
				hasCompletedOnboarding: true,
				emailVerifiedAt: null,
				role: null,
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
				role: me.role,
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
					role: me.role,
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
					role: null,
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
			role: me.role,
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
				role: "owner",
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
			// Best-effort logout - don't block local logout if API fails
			await api.logout(tokens.refreshToken).catch((err: unknown) => {
				console.warn("Logout API call failed:", err);
			});
		}
		clearTokens();
		setState({
			user: null,
			org: null,
			hasCompletedOnboarding: true,
			emailVerifiedAt: null,
			role: null,
			isLoading: false,
			isAuthenticated: false,
		});
	}, []);

	const setTokens = useCallback(
		(tokens: TokenResponse, user: AuthUser, org: AuthOrg, role?: string) => {
			storeTokens(tokens);
			setState({
				user,
				org,
				hasCompletedOnboarding: true,
				emailVerifiedAt: user.emailVerifiedAt,
				role: role ?? null,
				isLoading: false,
				isAuthenticated: true,
			});
		},
		[],
	);

	const refreshUser = useCallback(async () => {
		const tokens = getStoredTokens();
		if (!tokens) return;
		const me = await api.getMe(tokens.accessToken);
		setState((prev) => ({
			...prev,
			emailVerifiedAt: me.emailVerifiedAt,
			user: prev.user
				? { ...prev.user, emailVerifiedAt: me.emailVerifiedAt }
				: null,
		}));
	}, []);

	return (
		<AuthContext.Provider
			value={{
				...state,
				login,
				register,
				logout,
				setOnboardingComplete,
				setTokens,
				refreshUser,
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
