import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  INITIAL_JELLIES,
  calculateScore,
  generateBullets,
  simulateDraw,
} from '../utils/gameRules';
import type { Player } from '../utils/gameRules';
import { logGameResult } from '../services/gameLog';

const engineVersion = '1.0.1';

export type Difficulty = 'easy' | 'medium' | 'hard';
export const DIFFS: Difficulty[] = ['easy', 'medium', 'hard'];
export const DIFF_LABELS: Record<Difficulty, { ko: string; en: string }> = {
  easy: { ko: '입문자', en: 'Easy' },
  medium: { ko: '숙련자', en: 'Medium' },
  hard: { ko: '전문가', en: 'Hard' },
};

// Softmax temperature applied when the agent picks its draw. 0 = always the
// best-valued action; higher = more willing to take a worse one.
//
// Calibrated in sim/ (dev-only). The agent breaks even with an always-draw-1
// opponent at t ≈ 0.161, and is weaker than it above that, so the whole usable
// range is 0–0.16. `easy` sits just under the break-even point; `medium` was
// then picked by playing the tiers against each other, which separates them far
// better than a fixed baseline does (that measure saturates near full strength).
//   medium vs easy 55.3%  |  medium vs hard 44.8%   — evenly spaced
export const DIFF_TEMPERATURE: Record<Difficulty, number> = {
  easy: 0.13,
  medium: 0.06,
  hard: 0.0,
};

export type Status = 'IDLE' | 'DIFFICULTY_SELECT' | 'PLAYING' | 'ENDED';

interface Stats {
  totalGames: number;
  wins: number;
  draws: number;
}

interface VsCpuStats {
  easy: Stats;
  medium: Stats;
  hard: Stats;
  engineVersion: string;
}

interface HistoryItem {
  id: number;
  type: 'START' | 'DRAW' | 'REVEAL' | 'SURRENDER' | 'END';
  player: string;
  count: number;
  bulletCount: number;
  scoreDiff: number;
  bulletsLeft: number | null;
}

interface GameStore {
  // Session State (Persisted)
  vsCpuStats: VsCpuStats;
  twoPlayerStats: Stats;
  language: 'ko' | 'en';
  setLanguage: (lang: 'ko' | 'en') => void;
  resetHistory: () => void;

  // Current Game State
  status: Status;
  jelliesRemaining: number;
  bulletsRemaining: number;
  isBulletRevealed: boolean;
  currentTurn: Player;
  scores: Record<Player, number>;
  playerJellies: Record<Player, number>;
  playerBullets: Record<Player, number>;
  winner: Player | 'DRAW' | null;
  mode: 'VS_CPU' | 'VS_HUMAN';
  cpuDifficulty: Difficulty;
  history: HistoryItem[];

  // Actions
  // VS_CPU without a difficulty opens the picker; with one it starts the game.
  startGame: (mode: 'VS_CPU' | 'VS_HUMAN', difficulty?: Difficulty) => void;
  chooseDifficulty: (d: Difficulty) => void;
  quitGame: () => void;
  drawJellies: (count: number) => void;
  surrender: () => void;
}

// 종료된 게임의 최종 상태 스냅샷으로 Supabase 저장용 기록을 만들어 전송합니다.
// (fire-and-forget: 실패해도 게임 흐름에 영향 없음)
function sendGameRecord(
  state: GameStore,
  winner: Player | 'DRAW',
  endReason: 'FINISHED' | 'SURRENDER'
) {
  const startItem = state.history.find((h) => h.type === 'START');
  const turns = state.history.filter((h) => h.type === 'DRAW').length;

  void logGameResult({
    mode: state.mode,
    cpu_difficulty: state.mode === 'VS_CPU' ? state.cpuDifficulty : null,
    engine_version: state.mode === 'VS_CPU' ? state.vsCpuStats.engineVersion : null,
    winner,
    end_reason: endReason,
    starting_player: (startItem?.player as Player) ?? 'PLAYER_1',
    score_p1: state.scores.PLAYER_1,
    score_p2: state.scores.PLAYER_2,
    jellies_p1: state.playerJellies.PLAYER_1,
    jellies_p2: state.playerJellies.PLAYER_2,
    bullets_p1: state.playerBullets.PLAYER_1,
    bullets_p2: state.playerBullets.PLAYER_2,
    bullets_total: state.playerBullets.PLAYER_1 + state.playerBullets.PLAYER_2,
    turns,
    language: state.language,
    history: state.history,
  });
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      // Initial Session State
      vsCpuStats: {
        easy: { totalGames: 0, wins: 0, draws: 0 },
        medium: { totalGames: 0, wins: 0, draws: 0 },
        hard: { totalGames: 0, wins: 0, draws: 0 },
        engineVersion: engineVersion,
      },
      twoPlayerStats: { totalGames: 0, wins: 0, draws: 0 },
      language: 'ko',
      setLanguage: (lang) => set({ language: lang }),
      resetHistory: () =>
        set((state) => {
          if (state.mode === 'VS_CPU' && state.status === 'PLAYING') {
            return {
              vsCpuStats: {
                ...state.vsCpuStats,
                [state.cpuDifficulty]: { totalGames: 1, wins: 0, draws: 0 },
              },
              twoPlayerStats: { totalGames: 0, wins: 0, draws: 0 },
            };
          }
          return {
            vsCpuStats: {
              easy: { totalGames: 0, wins: 0, draws: 0 },
              medium: { totalGames: 0, wins: 0, draws: 0 },
              hard: { totalGames: 0, wins: 0, draws: 0 },
              engineVersion: engineVersion,
            },
            twoPlayerStats: { totalGames: 0, wins: 0, draws: 0 },
          };
        }),

      // Initial Game State
      status: 'IDLE',
      jelliesRemaining: INITIAL_JELLIES,
      bulletsRemaining: 0,
      isBulletRevealed: false,
      currentTurn: 'PLAYER_1',
      scores: { PLAYER_1: 0, PLAYER_2: 0 },
      playerJellies: { PLAYER_1: 0, PLAYER_2: 0 },
      playerBullets: { PLAYER_1: 0, PLAYER_2: 0 },
      winner: null,
      mode: 'VS_CPU',
      cpuDifficulty: 'hard',
      history: [],

      startGame: (mode, difficulty) => {
        if (mode === 'VS_CPU' && difficulty === undefined) {
          set({ mode, status: 'DIFFICULTY_SELECT' });
          return;
        }
        const chosen: Difficulty = difficulty ?? 'hard';
        const bullets = generateBullets();

        set((state) => {
          const startingPlayer = mode === 'VS_CPU'
            ? state.vsCpuStats[chosen].totalGames % 2 === 0 ? 'PLAYER_1' : 'PLAYER_2'
            : state.twoPlayerStats.totalGames % 2 === 0 ? 'PLAYER_1' : 'PLAYER_2';

          const newCpuStats = { ...state.vsCpuStats };
          if (mode === 'VS_CPU') {
            newCpuStats[chosen].totalGames += 1;
          }

          return {
            status: 'PLAYING',
            jelliesRemaining: INITIAL_JELLIES,
            bulletsRemaining: bullets,
            isBulletRevealed: false,
            currentTurn: startingPlayer,
            scores: { PLAYER_1: 0, PLAYER_2: 0 },
            playerJellies: { PLAYER_1: 0, PLAYER_2: 0 },
            playerBullets: { PLAYER_1: 0, PLAYER_2: 0 },
            winner: null,
            mode: mode,
            cpuDifficulty: chosen,
            vsCpuStats: newCpuStats,
            history: [{
              id: 0,
              type: 'START',
              player: startingPlayer,
              count: 0,
              bulletCount: 0,
              scoreDiff: 0,
              bulletsLeft: null,
            }],
          };
        });
      },

      chooseDifficulty: (d) => get().startGame('VS_CPU', d),

      quitGame: () => {
        set({ status: 'IDLE' });
      },

      drawJellies: (count) => {
        const {
          jelliesRemaining,
          bulletsRemaining,
          currentTurn,
          scores,
          playerJellies,
          playerBullets,
          status,
          isBulletRevealed,
          history,
        } = get();

        if (status !== 'PLAYING') return;

        const { bulletsDrawn, newTotalJellies, newTotalBullets } = simulateDraw(
          count,
          jelliesRemaining,
          bulletsRemaining
        );

        const scoreChange = calculateScore(count, bulletsDrawn);
        const newScores = {
          ...scores,
          [currentTurn]: scores[currentTurn] + scoreChange,
        };
        const newPlayerJellies = {
          ...playerJellies,
          [currentTurn]: playerJellies[currentTurn] + count,
        };
        const newPlayerBullets = {
          ...playerBullets,
          [currentTurn]: playerBullets[currentTurn] + bulletsDrawn,
        };

        const newHistory = [...history];

        const drawHistoryItem = {
          id: newHistory.length + 1,
          type: 'DRAW',
          player: currentTurn,
          count: count,
          bulletCount: bulletsDrawn,
          scoreDiff: scoreChange,
          bulletsLeft: isBulletRevealed ? newTotalBullets : null,
        } as HistoryItem;
        newHistory.push(drawHistoryItem);

        const newIsBulletRevealed = isBulletRevealed || bulletsDrawn > 0;

        const isGameOver = newTotalBullets === 0;

        if (!isBulletRevealed && newIsBulletRevealed) {
          const revealHistoryItem = {
            id: newHistory.length + 1,
            type: 'REVEAL',
            player: currentTurn,
            count: 0,
            bulletCount: bulletsDrawn,
            scoreDiff: scoreChange,
            bulletsLeft: newTotalBullets,
          } as HistoryItem;
          newHistory.push(revealHistoryItem);
        }

        if (isGameOver) {
          const p1Score = newScores.PLAYER_1;
          const p2Score = newScores.PLAYER_2;
          let winner: Player | 'DRAW' | null = null;

          if (p1Score > p2Score) winner = 'PLAYER_1';
          else if (p2Score > p1Score) winner = 'PLAYER_2';
          else winner = 'DRAW';

          set((state) => {
            const newCpuStats = { ...state.vsCpuStats };
            const newTwoPlayerStats = { ...state.twoPlayerStats };

            // Only update wins/draws if in VS_CPU mode
            // totalGames was already incremented at start
            if (state.mode === 'VS_CPU') {
              if (winner === 'PLAYER_1') {
                // User won (assuming Player 1 is user in VS CPU)
                newCpuStats[state.cpuDifficulty].wins++;
              } else if (winner === 'DRAW') {
                newCpuStats[state.cpuDifficulty].draws++;
              }
            } else {
              newTwoPlayerStats.totalGames++;
              if (winner === 'PLAYER_1') {
                newTwoPlayerStats.wins++;
              } else if (winner === 'DRAW') {
                newTwoPlayerStats.draws++;
              }
            }

            const endHistoryItem = {
              id: newHistory.length + 2,
              type: 'END',
              player: winner,
              count: count,
              bulletCount: bulletsDrawn,
              scoreDiff: scoreChange,
            } as HistoryItem;
            newHistory.push(endHistoryItem);

            return {
              jelliesRemaining: newTotalJellies,
              bulletsRemaining: newTotalBullets,
              scores: newScores,
              playerJellies: newPlayerJellies,
              playerBullets: newPlayerBullets,
              status: 'ENDED',
              winner,
              vsCpuStats: newCpuStats,
              twoPlayerStats: newTwoPlayerStats,
              isBulletRevealed: newIsBulletRevealed,
              history: newHistory,
            };
          });

          sendGameRecord(get(), winner as Player | 'DRAW', 'FINISHED');
        } else {
          // Switch Turn
          const nextTurn = currentTurn === 'PLAYER_1' ? 'PLAYER_2' : 'PLAYER_1';
          set(() => {
            return {
              jelliesRemaining: newTotalJellies,
              bulletsRemaining: newTotalBullets,
              scores: newScores,
              playerJellies: newPlayerJellies,
              playerBullets: newPlayerBullets,
              currentTurn: nextTurn,
              isBulletRevealed: newIsBulletRevealed,
              history: newHistory,
            };
          });
        }
      },

      surrender: () => {
        const { currentTurn, status, history } = get();
        if (status !== 'PLAYING') return;

        const winner = currentTurn === 'PLAYER_1' ? 'PLAYER_2' : 'PLAYER_1';
        const newHistoryItem = {
          id: history.length + 1,
          type: 'SURRENDER',
          player: winner,
          count: 0,
          bulletCount: 0,
          scoreDiff: 0,
        } as HistoryItem;

        set((state) => {
          if (state.mode === 'VS_HUMAN') {
            const newTwoPlayerStats = { ...state.twoPlayerStats };
            newTwoPlayerStats.totalGames++;
            if (winner === 'PLAYER_1') {
              newTwoPlayerStats.wins++;
            }
            return {
              status: 'ENDED',
              winner,
              twoPlayerStats: newTwoPlayerStats,
              history: [...state.history, newHistoryItem]
            };
          }
          return {
            status: 'ENDED',
            winner,
            history: [...state.history, newHistoryItem]
          };
        });

        sendGameRecord(get(), winner, 'SURRENDER');
      },
    }),
    {
      name: 'russian-jelly-storage',
      partialize: (state) => ({
        vsCpuStats: state.vsCpuStats,
        twoPlayerStats: state.twoPlayerStats,
        language: state.language,
      }),
    }
  )
);
