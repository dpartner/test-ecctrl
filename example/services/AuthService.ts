import { UserDto } from "../types/UserDto";
import { api, type LoginParams } from "../utils/api";
import { LoginState } from "../stores/useAuth";

export type AuthUiStateType = {
  login: (params: LoginParams) => Promise<UserDto | undefined>;
  logout: () => Promise<void>;
  user: UserDto | null;
  authentificate: (state: LoginState, profile?: UserDto | null) => void;
};

export class AuthService {
  private static instance: AuthService;
  private authHeader: string | null = null;
  private uiState: AuthUiStateType | null = null;

  public get AuthHeader(): string | null {
    return this.authHeader;
  }

  static getInstance() {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  setUIState(state: AuthUiStateType) {
    this.uiState = state;
  }

  setAuthHeader(header: string | null) {
    this.authHeader = header;
  }

  async login(params: LoginParams) {
    if (!this.uiState) throw new Error("UI State not initialized");
    return await this.uiState.login(params);
  }

  async fetchProfile() {
    if (!this.uiState) throw new Error("UI State not initialized");
    const profileResponse = await api.getProfile();
    console.log("Fetched profile:", profileResponse);
    this.uiState.authentificate(LoginState.Authentificated, profileResponse);
  }

  async logout() {
    if (!this.uiState) throw new Error("UI State not initialized");
    return await this.uiState.logout();
  }
}

export const authService = AuthService.getInstance();
