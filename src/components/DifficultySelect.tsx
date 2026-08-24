import styled from 'styled-components';
import { useGameStore, DIFFS, DIFF_LABELS } from '../store/useGameStore';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  gap: 28px;
  padding: 20px;
`;

const Heading = styled.h2`
  color: ${({ theme }) => theme.colors.secondary};
  font-size: 1.6rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 300px;
`;

// Matches StartScreen's MenuButton so the two menus feel like one flow.
const DiffButton = styled.button`
  padding: 18px;
  font-size: 1.4rem;
  background: rgba(255, 255, 255, 0.05);
  background: #fffefc;
  border: 1px solid ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text};
  border-radius: 16px;
  backdrop-filter: blur(5px);
  font-weight: bold;
  transition: ${({ theme }) => theme.transitions.fast};
  box-shadow: 0 4px 14px rgba(219, 37, 235, 0.12);

  &:hover {
    background: ${({ theme }) => theme.colors.primary};
  }
`;

const BackButton = styled.button`
  color: ${({ theme }) => theme.colors.textSecondary};
  background: transparent;
  font-size: 0.95rem;
  text-decoration: underline;
`;

export const DifficultySelect = () => {
  const { language, chooseDifficulty, quitGame } = useGameStore();

  return (
    <Container>
      <Heading>{language === 'ko' ? '난이도 선택' : 'Select Difficulty'}</Heading>
      <ButtonGroup>
        {DIFFS.map((d) => (
          <DiffButton key={d} onClick={() => chooseDifficulty(d)}>
            {DIFF_LABELS[d][language]}
          </DiffButton>
        ))}
      </ButtonGroup>
      <BackButton onClick={quitGame}>
        {language === 'ko' ? '← 메뉴로' : '← Back to menu'}
      </BackButton>
    </Container>
  );
};
