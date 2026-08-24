import { useEffect } from 'react';
import styled from 'styled-components';
import { useGameStore, DIFF_TEMPERATURE, DIFF_LABELS } from '../store/useGameStore';
import { ControlPanel } from './ControlPanel';
import { LogPanel } from './LogPanel';
import { useAgent } from '../services/useAgent';
import { JellyCounter } from './JellyCounter';
import { PlayerSection } from './PlayerSection';

// Layout Components
const BoardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(600px, 100vw);
  height: 100%;
  padding: 20px;
  /* gap: 20px; */
  position: relative;
`;

const PlayerSectionContainer = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  gap: 10px;
  margin-bottom: 20px;
`;

// const PlayerSection = styled.div<{ $isCurrentTurn: boolean }>`
//   flex: 1;
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: flex-start;
//   padding: 20px;
//   border-radius: ${({ theme }) => theme.borderRadius};
//   background: ${({ $isCurrentTurn }) =>
//     $isCurrentTurn ? 'rgba(255, 255, 255, 0.05)' : 'transparent'};
//   transition: ${({ theme }) => theme.transitions.default};
//   border: 2px solid ${({ theme, $isCurrentTurn }) => ($isCurrentTurn ? theme.colors.primary : 'transparent')};
// `;

// const ScoreDisplay = styled.h2`
//   font-size: 2rem;
//   color: ${({ theme }) => theme.colors.text};
// `;

const CounterContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
`;

const ResultContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
`;

const ResultButton = styled.button`
  margin-top: 20px;
  padding: 15px 30px;
  font-size: 1.5rem;
  background: #4caf50;
  color: white;
  border-radius: 12px;
  border: none;
`;

const ModeText = styled.div`
  width: 100%;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: start;
`;

const GameBoard = () => {
  const {
    language,
    status,
    jelliesRemaining,
    bulletsRemaining,
    isBulletRevealed,
    currentTurn,
    scores,
    playerJellies,
    playerBullets,
    drawJellies,
    startGame,
    winner,
    mode,
    cpuDifficulty,
  } = useGameStore();
  const agent = useAgent();

  useEffect(() => {
    if (status === 'PLAYING' && currentTurn === 'PLAYER_2' && mode === 'VS_CPU') {
      // CPU Turn
      const scoreDiff = scores.PLAYER_2 - scores.PLAYER_1;
      // difficulty = how much randomness the agent tolerates in its pick
      const temperature = DIFF_TEMPERATURE[cpuDifficulty];
      const action = agent.getAction(
        jelliesRemaining, scoreDiff, isBulletRevealed, bulletsRemaining, temperature,
      ).bestK;
      const timer = setTimeout(() => {
        drawJellies(action);
      }, action > 9 ? 2000 : action > 4 ? 1500 : 1000); // emulate think time

      return () => clearTimeout(timer);
    }
  }, [status, currentTurn, jelliesRemaining, bulletsRemaining, drawJellies, cpuDifficulty]);

  if (status === 'IDLE') {
    return null; // App handles StartScreen now
  }

  const P1Str = 'PLAYER 1';
  const P2Str = mode === 'VS_CPU' ? 'CPU' : 'PLAYER 2';
  const modeText = mode === 'VS_CPU'
    ? DIFF_LABELS[cpuDifficulty][language] + ' CPU'
    : (language === 'ko' ? '2인 플레이' : '2 Player Mode');

  return (
    <BoardContainer>
      <PlayerSectionContainer>
        <PlayerSection
          isCurrentTurn={currentTurn === 'PLAYER_1'}
          name={P1Str}
          score={scores.PLAYER_1}
          jellies={playerJellies.PLAYER_1}
          bullets={playerBullets.PLAYER_1}
        />
        <PlayerSection
          isCurrentTurn={currentTurn === 'PLAYER_2'}
          name={P2Str}
          score={scores.PLAYER_2}
          jellies={playerJellies.PLAYER_2}
          bullets={playerBullets.PLAYER_2}
        />
      </PlayerSectionContainer>

      {/* <JellyIndicator
        jellyCount={playerJellies.PLAYER_1 + playerJellies.PLAYER_2 - playerBullets.PLAYER_1 - playerBullets.PLAYER_2}
        bulletCount={playerBullets.PLAYER_1 + playerBullets.PLAYER_2}
      /> */}
      <CounterContainer>
        {isBulletRevealed ? (
          <>
            <JellyCounter count={bulletsRemaining} type="BULLET" />
            <JellyCounter count={jelliesRemaining - bulletsRemaining} type="JELLY" />
          </>
        ) : (
          <JellyCounter count={jelliesRemaining} type="COMBINED" />
        )}
      </CounterContainer>

      {status === 'PLAYING' ? (
        <ControlPanel
          maxJellies={jelliesRemaining}
          onDraw={drawJellies}
          disabled={
            status !== 'PLAYING' ||
            (currentTurn === 'PLAYER_2' && mode === 'VS_CPU')
          }
        />
      ) : (
        <ResultContainer>
          <h1>{language === 'ko'
            ? (winner === 'DRAW' ? '무승부' : `${winner === 'PLAYER_1' ? P1Str : P2Str} 승리!`)
            : (winner === 'DRAW' ? 'DRAW' : `${winner === 'PLAYER_1' ? P1Str : P2Str} WINS!`)}
          </h1>
          <ResultButton onClick={() => startGame(mode, mode === 'VS_CPU' ? cpuDifficulty : undefined)}>
            {language === 'ko' ? '새 게임' : 'New Game'}
          </ResultButton>
        </ResultContainer>
      )}
      
      <ModeText>{modeText}</ModeText>
      <LogPanel />
    </BoardContainer>
  );
};

export default GameBoard;
