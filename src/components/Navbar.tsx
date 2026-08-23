import styled from 'styled-components';
import { useGameStore, DIFFS, DIFF_LABELS, type Difficulty } from '../store/useGameStore';
import { FaHome, FaGlobe, FaQuestion, FaTrophy } from "react-icons/fa";
import { useState } from 'react';

interface NavbarProps {
  onOpenHelp: () => void;
}

const NavContainer = styled.nav`
  width: 100%;
  height: 60px;
  background-color: ${({ theme }) => theme.colors.background};
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  /* position: fixed; */
  top: 0;
  left: 0;
  z-index: 100;
  box-shadow: 0 2px 6px #D1C8A3;

  @media (max-width: 768px) {
    height: 48px;
    padding: 5px 10px;
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  /* color: ${({ theme }) => theme.colors.primary}; */
  background-image: linear-gradient(to bottom right, #ff50d6, #f3bae6); /* 선형 그라데이션 */
  -webkit-background-clip: text; /* WebKit 브라우저용 */
  background-clip: text;
  color: transparent; /* 텍스트 색상을 투명하게 */
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const NavActions = styled.div`
  position: relative;
  display: flex;
  gap: 10px;

  @media (max-width: 768px) {
    gap: 5px;
  }
`;

const NavButton = styled.button`
  height: 32px;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};

  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #D1C8A3;
  padding: 5px 10px;
  border-radius: 8px;
  font-size: 0.8rem;
  transition: ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: ${({ theme }) => theme.colors.text};
  }

  &:active:not(:disabled) {
    transform: translateY(2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

  @media (max-width: 768px) {
    height: 36px;
  }
`;

const ResetButton = styled(NavButton)`
  margin-top: 5px;
  margin-left: auto;
`;

const StatsContainer = styled.div`
  position: absolute;
  top: 100%;
  right: 36px;
  top: 100%;

  /* width: 200px; */

  padding: 10px;
  border: 1px solid #D1C8A3;
  border-radius: 16px;

  z-index: 100;

  background-color: ${({ theme }) => theme.colors.background};

  p {
    margin-bottom: 5px;
  }
`

const StatsTable = styled.table`
  border-collapse: collapse;
  font-size: 0.8rem;
  white-space: nowrap;
  margin-bottom: 5px;

  th, td {
    padding: 4px 10px;
    text-align: center;
  }
  th {
    color: ${({ theme }) => theme.colors.textSecondary};
    font-weight: 600;
    font-size: 0.72rem;
  }
  td:first-child, th:first-child {
    text-align: left;
    font-weight: 600;
  }
  tbody tr:not(:last-child) td {
    border-bottom: 1px solid #D1C8A3;
  }
`

export const Navbar = ({ onOpenHelp }: NavbarProps) => {
  const { language, setLanguage, status, quitGame, vsCpuStats, twoPlayerStats, resetHistory, mode, cpuDifficulty } = useGameStore();
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'ko' ? 'en' : 'ko');
  };

  const handleBackToMenu = () => {
    if (status === 'PLAYING') {
      const message = language === 'ko'
        ? '정말 나가시겠습니까?' + (mode === 'VS_CPU' ? ' 패배로 기록됩니다.' : '')
        : 'Are you sure you want to quit?' + (mode === 'VS_CPU' ? ' The game will be recorded as a loss.' : '');
      if (window.confirm(message)) {
        quitGame();
      }
    } else {
      quitGame();
    }
  };

  const handleResetStats = () => {
    if (window.confirm(language === 'ko' ? '전적을 초기화하시겠습니까?' : 'Are you sure you want to reset your stats?')) {
      resetHistory();
    }
  }

  // totalGames is incremented at kick-off, so discount the game still in progress
  const cpuWLD = (d: Difficulty) => {
    const s = vsCpuStats[d];
    const inProgress = status === 'PLAYING' && mode === 'VS_CPU' && cpuDifficulty === d;
    const played = s.totalGames - (inProgress ? 1 : 0);
    const loss = Math.max(0, played - s.wins - s.draws);
    const rate = played > 0 ? (s.wins / played) * 100 : 0;
    return { w: s.wins, l: loss, d: s.draws, played, rate };
  };

  const humanStats = `${twoPlayerStats.wins} / ${twoPlayerStats.totalGames - twoPlayerStats.wins - twoPlayerStats.draws} / ${twoPlayerStats.draws} (${(twoPlayerStats.wins / twoPlayerStats.totalGames * 100 || 0).toFixed(1)}%)`;

  return (
    <NavContainer>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Title>RUSSIAN JELLY</Title>
      </div>

      <NavActions>
        <NavButton onClick={handleBackToMenu} disabled={status === 'IDLE'}>
          <FaHome size={16} />
        </NavButton>
        <NavButton onClick={onOpenHelp}>
          <FaQuestion size={16} />
        </NavButton>
        <NavButton onClick={() => setIsStatsOpen(!isStatsOpen)} onBlur={() => setIsStatsOpen(false)}>
          <FaTrophy size={16} />
        </NavButton>
        {isStatsOpen && (
          <StatsContainer onMouseDown={(e) => e.preventDefault()}>
            <h4>VS CPU</h4>
            <StatsTable>
              <thead>
                <tr>
                  <th />
                  <th>{language === 'ko' ? '승/패/무' : 'W/L/D'}</th>
                  <th>{language === 'ko' ? '승률' : 'Win%'}</th>
                </tr>
              </thead>
              <tbody>
                {DIFFS.map((d) => {
                  const s = cpuWLD(d);
                  return (
                    <tr key={d}>
                      <td>{DIFF_LABELS[d][language]}</td>
                      <td>{`${s.w}/${s.l}/${s.d}`}</td>
                      <td>{s.played > 0 ? `${s.rate.toFixed(0)}%` : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </StatsTable>
            <h4>1P VS 2P</h4>
            <p>{humanStats}</p>
            <p style={{ fontStyle: 'italic', fontSize: '0.8rem' }}>{language === 'ko' ? '(승/패/무)' : '(Win/Lose/Draw)'}</p>
            <ResetButton onClick={handleResetStats}>
              {language === 'ko' ? '초기화' : 'Reset'}
            </ResetButton>
          </StatsContainer>
        )}
        <NavButton onClick={toggleLanguage}>
          <FaGlobe size={16} />
        </NavButton>
      </NavActions>
    </NavContainer>
  );
};
