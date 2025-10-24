import { post, get } from "./requests";
import { UserDto } from '../types/UserDto';
import type { GameProgress } from '../types/UserDto';
import { type SIWXMessage } from "@reown/appkit-core";

export type BeeardLoginPayload = SIWXMessage.Data;

export type LoginParams = {
  readonly payload: BeeardLoginPayload;
  readonly signature: string;
};

export type LoginPayloadParams = {
  readonly address: string;
  readonly chainId: string;
};

export interface ILoginData {
  user: UserDto;
}

export class MeReownResponse {
  readonly chainId: string | null = null;
  readonly accountAddress: string | null = null;

  static isValid(data: MeReownResponse): boolean {
    if (!data) return false;
    if (typeof data.chainId !== "string" || !data.chainId) return false;
    if (typeof data.accountAddress !== "string" || !data.accountAddress) return false;
    return true;
  }
}

export interface StateResponse {
  success: boolean;
}

export interface SaveProgressParams {
  readonly gameProgress: GameProgress[];
  readonly unlockedMaps: string[];
}

export interface SaveProgressResponse {
  success: boolean;
}

export const api = {
  async getProfile(): Promise<UserDto> {
    const data = await get({ url: "users/profile" });
    if (!UserDto.isValid(data)) {
      throw new Error("Incorrect response");
    }
    return data;
  },

  login: async (params: LoginParams): Promise<ILoginData> => {
    return await post({ url: "auth/authenticate", params });
  },

  getLoginPayload: async (params: LoginPayloadParams): Promise<BeeardLoginPayload> => {
    return await get({
      url: "auth/getLoginPayload",
      params: {
        address: params.address,
        chainId: params.chainId,
      },
    });
  },

  me: async (): Promise<MeReownResponse> => {
    const data = await get({ url: "auth/me" });

    if (!MeReownResponse.isValid(data)) {
      throw new Error("Invalid response format");
    }

    return data;
  },

  logout: async (): Promise<StateResponse> => {
    return await post({
      url: "auth/logout",
    });
  },

  // Game progress methods
  saveProgress: async (params: SaveProgressParams): Promise<SaveProgressResponse> => {
    return await post({
      url: "users/progress",
      params: params as unknown as Record<string, unknown>,
    });
  },

  getProgress: async (): Promise<{ gameProgress: GameProgress[]; unlockedMaps: string[] }> => {
    return await get({
      url: "users/progress",
    });
  },
};
