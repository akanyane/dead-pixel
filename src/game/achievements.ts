import { SKINS } from './data';
import type { Game } from './game';

export interface AchievementDef {
  id: string;
  /** Fica como "???" até ser conquistada, para não entregar a história. */
  hidden?: boolean;
  /** Progresso [atual, meta] das conquistas que dependem só de números salvos. */
  stat?: (g: Game) => [number, number];
}

const beat = (boss: 'scrum' | 'kernel' | 'hydra' | 'monolith' | 'pixel') => (g: Game): [number, number] => [g.progress.beaten.includes(boss) ? 1 : 0, 1];

export const PLATINUM = 'platinum';

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_blood', stat: (g) => [g.progress.kills, 1] },
  { id: 'kills_1000', stat: (g) => [g.progress.kills, 1000] },
  { id: 'streak_50', stat: (g) => [g.progress.bestStreak, 50] },
  { id: 'streak_100', stat: (g) => [g.progress.bestStreak, 100] },
  { id: 'melee_50', stat: (g) => [g.progress.meleeKills, 50] },
  { id: 'chain_3' },
  { id: 'rm_20' },
  { id: 'fork_4' },
  { id: 'clean_wave' },
  { id: 'close_call' },
  { id: 'beat_scrum', stat: beat('scrum') },
  { id: 'beat_kernel', stat: beat('kernel') },
  { id: 'beat_hydra', stat: beat('hydra') },
  { id: 'beat_monolith', stat: beat('monolith') },
  { id: 'clean_boss' },
  { id: 'pistol_level' },
  { id: 'no_commands' },
  { id: 'all_weapons' },
  { id: 'backup_used' },
  { id: 'all_skins', stat: (g) => [SKINS.filter((s) => g.isSkinUnlocked(s)).length, SKINS.length] },
  { id: 'deaths_10', stat: (g) => [g.progress.deaths, 10] },
  { id: 'lore_5', stat: (g) => [g.progress.lore.length, 5] },
  { id: 'cat_noa', hidden: true },
  { id: 'ending', hidden: true, stat: beat('pixel') },
  { id: 'second_run', hidden: true, stat: (g) => [g.progress.runs, 2] },
  { id: PLATINUM, stat: (g) => [g.progress.achievements.filter((a) => a !== PLATINUM).length, ACHIEVEMENTS.length - 1] },
];
