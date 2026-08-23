import styled from 'styled-components';
import { FaTimes, FaArrowRight } from "react-icons/fa";
import { Jelly } from './Jelly';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'ko' | 'en';
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh; /* old browser fallback */
  height: 100dvh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
  backdrop-filter: blur(5px);
`;

const ModalContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: 16px;
  padding: 10px;
  max-width: 800px;
  width: 90%;
  max-height: 95%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);

  @media (max-width: 768px) {
    max-height: 80%;
  }
`;

const Title = styled.h2`
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: 20px;
  text-align: center;
`;

const Content = styled.div`
  color: ${({ theme }) => theme.colors.text};
  padding: 10px;
  line-height: 1.6;
  font-size: 0.95rem;
  overflow-y: auto;

  h3 {
    color: ${({ theme }) => theme.colors.secondary};
    margin: 15px 0 5px;
  }

  ul {
    padding-left: 20px;
  }
  
  li {
    margin-bottom: 5px;
  }

  div {
    display: flex;
    align-items: center;
  }
`;

const WS = styled.div`
  width: 6px;
`;

const WSWide = styled.div`
  width: 46px;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${({ theme }) => theme.colors.primary};
  margin: 22px 0 14px;
`;

const Recommend = styled.p`
  font-size: 0.88rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;

  /* pre-styled for the link that wraps the game's name */
  a {
    color: #2563EB;
    font-weight: 600;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  top: 10px;
  right: 10px;
  width: 40px;
  height: 40px;
  padding: 12px;
  background: ${({ theme }) => theme.colors.primary};
  color: white;
  border-radius: 8px;
  font-weight: bold;
  font-size: 1rem;
  
  &:hover {
    background: ${({ theme }) => theme.colors.primaryHover};
  }
`;

export const HelpModal = ({ isOpen, onClose, language }: HelpModalProps) => {
  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <Title>{language === 'ko' ? '게임 규칙' : 'Game Rules'}</Title>
        <CloseButton onClick={onClose}>
          <FaTimes size={20} />
        </CloseButton>
        <Content>
          {language === 'ko' ? (
            <>
              <h2>러시안 젤리</h2>
              <p>러시안 젤리는 마사토끼/joana 작가의 만화 <a href="https://comic.naver.com/webtoon/list?titleId=670145" target="_blank">킬더킹</a>에 등장하는 2인 전략 게임입니다.</p>
              <p>총알 젤리가 섞인 27개의 젤리 중에서 두 사람이 번갈아 가며 젤리를 뽑고, 점수를 더 많이 획득한 사람이 승리합니다.</p>

              <h3>1. 진행 방법</h3>
              <ul>
                <li>젤리 박스에는 총 27개의 젤리가 들어있습니다.</li>
                <li>젤리 중 1~8개는 '총알 젤리'입니다.</li>
                <li>매 턴 번갈아 가며 원하는 수만큼 젤리를 뽑습니다.</li>
              </ul>

              <h3>2. 점수 획득</h3>
              <ul>
                <li>매 턴마다 한 번에 뽑는 젤리의 수에 따라 점수를 획득합니다.</li>
                <li>젤리를 많이 뽑을수록 획득하는 점수가 2배로 늘어납니다.</li>
                <div><Jelly size={24} /><WS /><FaArrowRight /><WS />1점</div>
                <div><Jelly size={24} /><Jelly size={24} /><WS /><FaArrowRight /><WS />2점</div>
                <div><Jelly size={24} /><Jelly size={24} /><Jelly size={24} /><WS /><FaArrowRight /><WS />4점</div>
                <div><Jelly size={24} /><Jelly size={24} /><Jelly size={24} /><Jelly size={24} /><WS /><FaArrowRight /><WS />8점</div>
                <div><WSWide />⁝</div>
                <li>총알 젤리가 뽑혔다면, 점수를 얻는 대신 뽑힌 수만큼 추가로 곱해 점수를 잃습니다.</li>
                <div><Jelly size={24} type="BULLET" /><Jelly size={24} /><Jelly size={24} /><Jelly size={24} /><WS /><FaArrowRight /><WS />-8점</div>
                <div><Jelly size={24} type="BULLET" /><Jelly size={24} type="BULLET" /><Jelly size={24} /><Jelly size={24} /><WS /><FaArrowRight /><WS />-16점</div>
                <div><Jelly size={24} type="BULLET" /><Jelly size={24} type="BULLET" /><Jelly size={24} type="BULLET" /><Jelly size={24} /><WS /><FaArrowRight /><WS />-24점</div>
                <div><WSWide />⁝</div>
              </ul>

              <h3>3. 게임 종료</h3>
              <ul>
                <li>처음에는 총알 젤리의 개수가 공개되지 않습니다.</li>
                <li>총알 젤리가 하나라도 뽑히고 나면 남은 총알 젤리의 개수가 공개됩니다.</li>
                <li>마지막 남은 총알 젤리가 뽑히면 즉시 게임이 종료됩니다.</li>
                <li>게임 종료 시점에 점수가 더 높은 사람이 승리합니다.</li>
              </ul>

              <Divider />
              <Recommend>
                러시안 젤리를 재미있게 플레이하셨다면 <a href="https://trrtx74.github.io/cellmoku/" target="_blank">개척 오목</a>도 플레이해 보세요!
              </Recommend>
            </>
          ) : (
            <>
              <h2>Russian Jelly</h2>
              <p>Russian Jelly is a two-player strategy game that appears in the webtoon <a className="en" href="https://comic.naver.com/webtoon/list?titleId=670145" target="_blank">
                Kill the King
              </a> by MASATOKKI / joana.</p>
              <p>Out of 27 jellies mixed with bullet jellies, two players take turns drawing jellies. The player who scores more points wins.</p>

              <h3>1. How to Play</h3>
              <ul>
                <li>The jelly box contains a total of 27 jellies.</li>
                <li>Between 1 and 8 of them are “bullet jellies.”</li>
                <li>Players take turns, and on each turn may draw any number of jellies they choose.</li>
              </ul>

              <h3>2. Scoring</h3>
              <ul>
                <li>On each turn, you earn points based on how many jellies you draw at once.</li>
                <li>The more jellies you draw, the score doubles each time.</li>
                <div><Jelly size={24} /><WS /><FaArrowRight /><WS />1 points</div>
                <div><Jelly size={24} /><Jelly size={24} /><WS /><FaArrowRight /><WS />2 points</div>
                <div><Jelly size={24} /><Jelly size={24} /><Jelly size={24} /><WS /><FaArrowRight /><WS />4 points</div>
                <div><Jelly size={24} /><Jelly size={24} /><Jelly size={24} /><Jelly size={24} /><WS /><FaArrowRight /><WS />8 points</div>
                <div><WSWide />⁝</div>
                <li>If one or more bullets are drawn, you instead lose points multiplied by the number of bullets.</li>
                <div><Jelly size={24} type="BULLET" /><Jelly size={24} /><Jelly size={24} /><Jelly size={24} /><WS /><FaArrowRight /><WS />-8 points</div>
                <div><Jelly size={24} type="BULLET" /><Jelly size={24} type="BULLET" /><Jelly size={24} /><Jelly size={24} /><WS /><FaArrowRight /><WS />-16 points</div>
                <div><Jelly size={24} type="BULLET" /><Jelly size={24} type="BULLET" /><Jelly size={24} type="BULLET" /><Jelly size={24} /><WS /><FaArrowRight /><WS />-24 points</div>
                <div><WSWide />⁝</div>
              </ul>
              <h3>3. End of the Game</h3>
              <ul>
                <li>At the start of the game, the number of bullets is hidden.</li>
                <li>Once at least one bullet is drawn, the number of remaining bullets is revealed.</li>
                <li>When the last remaining bullet is drawn, the game ends immediately.</li>
                <li>The player with the higher score at the end of the game wins.</li>
              </ul>

              <Divider />
              <Recommend>
                If you enjoyed Russian Jelly, give <a href="https://trrtx74.github.io/cellmoku/" target="_blank">Cellmoku</a> a try too!
              </Recommend>
            </>
          )}
        </Content>
      </ModalContainer>
    </Overlay >
  );
};
