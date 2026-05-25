export const LANGUAGE_PROFICIENCY_LEVELS = [
  'Basic',
  'Conversational',
  'Fluent',
  'Native / Bilingual',
] as const;

export type LanguageProficiency = (typeof LANGUAGE_PROFICIENCY_LEVELS)[number];

export interface IUserLanguage {
  language: string;
  proficiency: LanguageProficiency;
  isNative: boolean;
}

const isProficiency = (value: string): value is LanguageProficiency =>
  (LANGUAGE_PROFICIENCY_LEVELS as readonly string[]).includes(value);

/** Normalize legacy string[] or object[] into structured language entries. */
export const normalizeUserLanguages = (raw: unknown): IUserLanguage[] => {
  if (!Array.isArray(raw)) return [];

  const out: IUserLanguage[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    let entry: IUserLanguage | null = null;

    if (typeof item === 'string') {
      const language = item.trim();
      if (!language) continue;
      entry = {
        language,
        proficiency: 'Fluent',
        isNative: false,
      };
    } else if (item && typeof item === 'object') {
      const o = item as Record<string, unknown>;
      const language = String(o.language ?? '').trim();
      if (!language) continue;

      const isNative = o.isNative === true;
      const rawProficiency = String(o.proficiency ?? 'Fluent').trim();
      let proficiency: LanguageProficiency = isProficiency(rawProficiency)
        ? rawProficiency
        : 'Fluent';
      if (isNative) {
        proficiency = 'Native / Bilingual';
      }

      entry = {
        language,
        proficiency,
        isNative,
      };
    }

    if (!entry) continue;
    const key = entry.language.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(entry);
  }

  return out;
};
