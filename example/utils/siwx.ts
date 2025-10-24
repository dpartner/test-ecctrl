import { type CaipNetworkId, type SIWXMessage, type SIWXSession, type SIWXConfig } from "@reown/appkit";
import { ChainController } from "@reown/appkit-core";
import { authService } from "../services/AuthService";
import { api, type LoginParams, type LoginPayloadParams, type MeReownResponse } from "../utils/api";
import { appkit } from "../providers/AppKitProvider";

export class AuthSIWX implements SIWXConfig {
  constructor(private readonly required: boolean = true) { }

  async createMessage(input: SIWXMessage.Input): Promise<SIWXMessage> {
    console.log(AuthSIWX.name, "createMessage:", input);
    const params: LoginPayloadParams = {
      address: input.accountAddress,
      chainId: input.chainId,
    };
    const payload = (await api.getLoginPayload(params)) as SIWXMessage.Data;
    return {
      ...payload,
      toString: () => {
        return JSON.stringify(payload);
      },
    };
  }

  async addSession(session: SIWXSession): Promise<void> {
    console.log(AuthSIWX.name, "addSession", session);
    const p: LoginParams = {
      payload: session.data,
      signature: session.signature,
    };
    await authService.login(p);
  }

  async getSessions(chainId: CaipNetworkId, address: string): Promise<SIWXSession[]> {
    console.log(AuthSIWX.name, "getSessions:", chainId, address);
    try {
      if (!address) {
        throw new Error("Address is required");
      }
      const siweSession = (await api.me()) as MeReownResponse;
      if (appkit.getIsConnectedState() && appkit.isOpen()) {
        appkit.close();
      }

      console.log(AuthSIWX.name, "getSessions:", siweSession);

      const siweCaipNetworkId = siweSession?.chainId;
      if (!siweSession?.accountAddress) {
        throw new Error("Account address is required");
      }
      const isSameAddress = siweSession?.accountAddress.toLowerCase() === address.toLowerCase();
      const isSameNetwork = siweCaipNetworkId === chainId;

      if (!isSameAddress || !isSameNetwork) {
        throw new Error("Network or address mismatch");
      }

      await authService.fetchProfile();
      const data = { accountAddress: siweSession.accountAddress, chainId: siweCaipNetworkId } as SIWXMessage.Data;
      const session: SIWXSession = { data, message: "", signature: "" };
      return [session];
    } catch (e) {
      console.error(AuthSIWX.name, e);
      return [];
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async revokeSession(_chainId: CaipNetworkId, _address: string): Promise<void> {
    console.log(AuthSIWX.name, "revokeSession");
    return Promise.resolve(await this.logout());
  }

  async setSessions(sessions: SIWXSession[]): Promise<void> {
    console.log(AuthSIWX.name, "setSessions", sessions);
    if (sessions.length === 0) {
      await this.logout();
    } else {
      const session = (sessions.find((s) => s.data.chainId === ChainController.getActiveCaipNetwork()?.caipNetworkId) || sessions[0]) as SIWXSession;

      await this.addSession(session);
    }
  }

  getRequired() {
    return this.required;
  }

  private async logout(): Promise<void> {
    await authService.logout();
  }
}
