import styled from 'styled-components';
// import { GiCardPickup } from "react-icons/gi";
import { useGameStore } from '../store/useGameStore';
import { useEffect, useState } from 'react';
// import { Jelly } from './Jelly';

interface ControlPanelProps {
  maxJellies: number;
  onDraw: (count: number) => void;
  disabled?: boolean;
}

const PanelContainer = styled.div`
  padding: 0 20px;
  border-radius: ${({ theme }) => theme.borderRadius};
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
`;

const ButtonGrid = styled.div`
  width: 440px;
  display: flex;
  justify-content: center;
  /* align-items: start; */
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    width: min(100%, 536px);
    /* height: 150px; */
    height: min(18vh, 150px);
    align-content: flex-start;
    overflow-y: auto;
  }
`;

const DrawButton = styled.button<{ $isHighlighted?: boolean, $isHovered?: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  font-weight: bold;
  transition: ${({ theme }) => theme.transitions.fast};
  transform: ${({ $isHovered }) => $isHovered ? 'scale(1)' : 'scale(0.9)'};

  background: ${({ theme, $isHighlighted }) => $isHighlighted ? theme.colors.primary : 'transparent'};
  font-size: ${({ $isHovered }) => $isHovered ? '1.5rem' : '1rem'};

  &:disabled {
    border-color: #000000;
    opacity: 0.5;
    cursor: default;
  }

  &.isHidden {
    opacity: 0.5;
    color: transparent;
    background: transparent;
    border-color: #555;
    border-radius: 50%;
    transform: scale(0.2);
    cursor: default;
  }

  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
    font-size: ${({ $isHovered }) => $isHovered ? '2rem' : '1.5rem'};

    &.isHidden {
      display: none;
    }
  }
`;

const Filler = styled.div`
  width: 40px;
  height: 40px;

  @media (max-width: 768px) {
    display: none;
  }
`;

const ConfirmButton = styled.button`
  width: 240px;
  height: 60px;

  border-radius: 16px;
  background: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.text};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  font-size: 1.2rem;
  font-weight: bold;

  &:disabled {
    opacity: 0.5;
    cursor: default;
    background: transparent;
  }
`;

export const ControlPanel = ({ maxJellies, onDraw, disabled }: ControlPanelProps) => {
  const { language, mode } = useGameStore();
  const [hoverCount, setHoverCount] = useState<number | null>(null);
  const [isTouchInput, setIsTouchInput] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 768;
  });
  // const [selectedCount, setSelectedCount] = useState<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>, count: number) => {
    if (disabled) return;
    if (e.pointerType === 'touch') {
      setHoverCount(count);
      setIsTouchInput(true);
      // setSelectedCount(count);
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>, count: number) => {
    if (disabled) return;
    if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
      onDraw(count);
      setIsTouchInput(false);
    }
  }

  // const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>, count: number) => {
  //   setHoverCount(count);
  //   if (e.pointerType === 'touch') {
  //     setSelectedCount(count);
  //   }
  // }

  const handlePointerEnter = (e: React.PointerEvent<HTMLButtonElement>, count: number) => {
    if (disabled) return;
    if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
      setHoverCount(count);
      setIsTouchInput(false);
    }
  }

  const handlePointerLeave = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.pointerType === 'mouse' || e.pointerType === 'pen') {
      setHoverCount(null);
      setIsTouchInput(false);
    }
  }

  const handleConfirm = () => {
    if (disabled) return;
    onDraw(hoverCount || 1);
    if (mode === 'VS_HUMAN') {
      setHoverCount(null);
    }
  }

  const buttons = [
    0, 0, 1, 2, 3, 4, 5, 6, 7, 0, 0,
    0, 8, 9, 10, 11, 12, 13, 14, 15, 16, 0,
    17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
  ]

  useEffect(() => {
    if (!disabled) {
      setHoverCount(Math.min(hoverCount || 1, maxJellies));
    }
  }, [disabled]);

  return (
    <PanelContainer>
      {/* <PreviewContainer>
        {hoverCount &&
          Array.from({ length: hoverCount }).map((_, i) => (
            <Jelly key={i} type="JELLY" />
          ))}
      </PreviewContainer> */}
      <ButtonGrid>
        {buttons.map((count, i) => {
          if (count === 0) {
            return <Filler key={`filler-${i}`} />;
          } else {
            return (
              <DrawButton
                key={`button-${i}`}
                className={count > maxJellies ? 'isHidden' : ''}
                // onClick={(e) => onButtonClick(e, count)}
                // onMouseEnter={() => setHoverCount(count)}
                // onMouseLeave={() => setHoverCount(null)}
                onPointerEnter={(e) => handlePointerEnter(e, count)}
                onPointerLeave={(e) => handlePointerLeave(e)}
                // onPointerMove={(e) => onPointerMove(e, count)}
                onPointerUp={(e) => handlePointerUp(e, count)}
                onPointerDown={(e) => handlePointerDown(e, count)}
                disabled={disabled}
                $isHighlighted={!disabled && (hoverCount || 0) >= count}
                $isHovered={!disabled && hoverCount === count}
              >
                {count}
              </DrawButton>
            );
          }
        })}
      </ButtonGrid>
      {isTouchInput &&
        <ConfirmButton
          onClick={handleConfirm}
          disabled={!hoverCount || disabled}
        >
          {language === 'ko' ? (hoverCount && !disabled ? `${hoverCount}개 뽑기` : '뽑기') : (hoverCount && !disabled ? `Draw ${hoverCount}` : 'Draw')}
          {/* {hoverCount ? `${hoverCount}` : ''} <GiCardPickup /> */}
        </ConfirmButton>
      }
    </PanelContainer>
  );
};
