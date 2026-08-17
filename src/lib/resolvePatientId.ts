import {
  usersApi,
  normalizeProfiles,
  resolveRoleProfileId,
  formatUserName,
  type UserDto,
} from '@/api/users';

export type ResolvedPatientIdentity = {
  /** Patient ProfileId - для prescriptions / МК / lab-orders */
  profileId: string;
  /** User.PublicId, если удалось определить */
  publicId?: string;
  fullName?: string;
  /** Исходный id из URL / консультации */
  rawId: string;
};

const cache = new Map<string, Promise<ResolvedPatientIdentity>>();

/**
 * Приводит произвольный id к Patient ProfileId.
 * Врач часто получает publicId из старых консультаций/календаря -
 * рецепты и МК живут на profileId.
 */
export function resolvePatientIdentity(rawId: string): Promise<ResolvedPatientIdentity> {
  const id = rawId.trim();
  if (!id) {
    return Promise.resolve({ profileId: id, rawId: id });
  }

  const cached = cache.get(id);
  if (cached) return cached;

  const task = (async (): Promise<ResolvedPatientIdentity> => {
    // 1) id как publicId пользователя
    try {
      const user = await usersApi.getUser(id);
      const profiles = await loadProfiles(user, id);
      const profileId = resolveRoleProfileId(user, profiles, 'patient');
      if (profileId) {
        const resolved: ResolvedPatientIdentity = {
          profileId,
          publicId: user.publicId ?? id,
          fullName: formatUserName(user, undefined),
          rawId: id,
        };
        // Кэш и под profileId, чтобы повторные вызовы были мгновенными
        cache.set(profileId, Promise.resolve(resolved));
        return resolved;
      }
    } catch {
      /* не publicId - возможно уже profileId */
    }

    // 2) Уже profileId: обратного lookup нет - возвращаем как есть
    return { profileId: id, rawId: id };
  })();

  cache.set(id, task);
  return task;
}

async function loadProfiles(user: UserDto, publicId: string) {
  const fromUser = normalizeProfiles(user.profiles);
  const fromApi = normalizeProfiles(await usersApi.getProfiles(publicId).catch(() => null));
  const byId = new Map<string, (typeof fromUser)[number]>();
  for (const p of [...fromUser, ...fromApi]) {
    const pid = p.profileId ?? p.id;
    if (pid) byId.set(pid, p);
  }
  return [...byId.values()];
}

/** Все известные id одного пациента (profile + public) - для поиска консультаций/рецептов. */
export function patientIdCandidates(identity: ResolvedPatientIdentity | null | undefined): string[] {
  if (!identity) return [];
  return [...new Set([identity.profileId, identity.publicId, identity.rawId].filter(Boolean))] as string[];
}

export async function resolvePatientIdentityMap(
  ids: string[],
): Promise<Map<string, ResolvedPatientIdentity>> {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  const entries = await Promise.all(
    unique.map(async (id) => [id, await resolvePatientIdentity(id)] as const),
  );
  return new Map(entries);
}
