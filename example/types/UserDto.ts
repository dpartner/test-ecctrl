export type GameProgress = {
  mapId: string;
  npcId: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  dialogStep: string;
  factIndex: number;
}

export class UserDto {
  readonly address: string | null = null;
  readonly chain: string | null = null;
  readonly gameProgress: GameProgress[] | null = null;
  readonly unlockedMaps: string[] | null = null;

  static isValid(user: UserDto): boolean {
    if (!user) {
      return false;
    }

    if (typeof user.address !== "string" || user.address.trim().length === 0) {
      return false;
    }

    if (typeof user.chain !== "string" || user.chain.trim().length === 0) {
      return false;
    }
    return true;
  }
}
