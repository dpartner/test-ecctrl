import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserDto } from "../types/UserDto";
import { api, type LoginParams } from "../utils/api";
import { authService, type AuthUiStateType } from "../services/AuthService";
import { useLevelProgress } from "./useLevelProgress";

export enum LoginState {
  NoUser = "no_user",
  Pending = "pending",
  Authentificated = "authentificated",
}

interface AuthState {
  loginState: LoginState;
  user: UserDto | null;
  initializeAuthService: () => void;
  setState: (state: LoginState) => void;
  authentificate: (state: LoginState, user?: UserDto | null) => void;
  login: (session: LoginParams) => Promise<UserDto | undefined>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set, get) => ({
  loginState: LoginState.NoUser,
  user: null,
  initializeAuthService: () => {
    const contextValue: AuthUiStateType = {
      login: useAuth.getState().login,
      logout: useAuth.getState().logout,
      user: useAuth.getState().user,
      authentificate: useAuth.getState().authentificate,
    };
    authService.setUIState(contextValue);
  },
  setState: (state: LoginState) => set({ loginState: state }),
  authentificate: (state: LoginState, user?: UserDto | null) => {
    useLevelProgress.getState().initializeGame();
    set({ loginState: state, user: user ?? null });
  },
  login: async (session: LoginParams) => {
    try {
      const response = await api.login(session);
      useAuth.getState().authentificate(LoginState.Authentificated, response.user);
      console.log("🔄 Login successful", 'user:', get().loginState);

      // Load progress from server after successful login
      try {
        await useLevelProgress.getState().loadProgressFromServer();
      } catch (error) {
        console.warn("Failed to load progress after login:", error);
      }

      return response.user;
    } catch (error) {
      console.error(error);
    }
  },
  logout: async () => {
    // Save progress to server before logout
    try {
      await useLevelProgress.getState().saveProgressToServer();
    } catch (error) {
      console.warn("Failed to save progress before logout:", error);
    }

    await api.logout();
    set({ loginState: LoginState.NoUser, user: null });
  },
}));