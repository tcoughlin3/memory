import React from 'react';
// eslint-disable-next-line no-unused-vars
import styled from 'styled-components/macro';
import Confetti from 'react-confetti';
import useWindowSize from 'react-use/lib/useWindowSize';
import { Button } from '../components/Button';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import useSound from '../hooks/useSound';
import matchSfx from './sounds/match.mp3';
import flipSfx from './sounds/flip.wav';
import winSfx from './sounds/win.mp3';
import { Card } from './Card';
import * as cardsSvgs from './CardFaces';
import shuffle from './shuffle';

// Deck has shape Array<{ cardId: string, component: ReactComponent }>
// Matching cards have the same cardId based on file name with the exception of
// '-A' and '-B' appended to either one so we can know which of the pair is
// turned over.
const shuffleDeck = () => {
  const cards = Object.values(cardsSvgs);
  return shuffle([
    ...cards.map((CardFace) => {
      const cardId = `${CardFace.name}-A`;
      const Component = (props) => <Card {...props} cardFace={CardFace} />;
      return { cardId, component: Component };
    }),
    ...cards.map((CardFace) => {
      const cardId = `${CardFace.name}-B`;
      const Component = (props) => <Card {...props} cardFace={CardFace} />;
      return { cardId, component: Component };
    }),
  ]);
};

// Simple game utilities
const toCardType = (cardId) => cardId.slice(0, -2);
const isMatch = (cardIdA, cardIdB) =>
  toCardType(cardIdA) === toCardType(cardIdB);

const initialState = {
  deck: shuffleDeck(),
  freezeGame: false,
  flippedCards: [],
  matchedCards: [],
  playSounds: true,
};

function reducer(state, action) {
  switch (action.type) {
    case 'flip': {
      if (state.freezeGame) {
        return state;
      }
      const nextFlippedCards = state.flippedCards.concat(action.cardId);

      if (nextFlippedCards.length === 2) {
        const [firstCardId, secondCardId] = nextFlippedCards;
        if (isMatch(firstCardId, secondCardId)) {
          return {
            ...state,
            flippedCards: [],
            matchedCards: state.matchedCards.concat(firstCardId, secondCardId),
          };
        }
      }

      const nextFreezeGame = nextFlippedCards.length === 2;

      return {
        ...state,
        freezeGame: nextFreezeGame,
        flippedCards: nextFlippedCards,
      };
    }
    case 'playSounds': {
      return {
        ...state,
        playSounds: action.playSounds,
      };
    }
    case 'resetGame': {
      return {
        ...initialState,
        deck: shuffleDeck(),
        playSounds: state.playSounds,
      };
    }
    case 'unfreezeGame': {
      return {
        ...state,
        freezeGame: false,
        flippedCards: [],
      };
    }
    default:
      throw new Error(`Unhandled type: ${action.type}`);
  }
}

function Game() {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const wonGame = state.matchedCards.length === state.deck.length;

  const [playMatchSfx] = useSound(matchSfx, {
    soundEnabled: state.playSounds,
  });
  const [playFlipSfx] = useSound(flipSfx, {
    soundEnabled: state.playSounds,
    volume: 0.1,
  });
  const [playWinSfx] = useSound(winSfx, {
    soundEnabled: state.playSounds,
  });

  React.useEffect(() => {
    if (state.matchedCards.length >= 2) playMatchSfx();
    if (wonGame) playWinSfx();
  }, [state.matchedCards.length, wonGame, playMatchSfx, playWinSfx]);

  React.useEffect(() => {
    if (state.freezeGame) {
      setTimeout(() => {
        dispatch({ type: 'unfreezeGame' });
      }, 500);
    }
  }, [state.freezeGame]);

  const { width, height } = useWindowSize();

  return (
    <>
      <Container>
        <Section>
          <span
            css={`
              color: white;
              font-size: 4rem;
              font-family: 'Bangers';
              letter-spacing: 2px;
              text-shadow: 2px 1px 1px red;
            `}
          >
            Memory
          </span>
        </Section>
        <Section
          css={`
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
          `}
        >
          {state.deck.map(({ cardId, component: Card }, index) => {
            const isTurnedOver =
              state.flippedCards.includes(cardId) ||
              state.matchedCards.includes(cardId);
            const onClick = () => {
              if (!state.freezeGame && !isTurnedOver) {
                dispatch({ type: 'flip', cardId });
                playFlipSfx();
              }
            };
            return (
              <Card
                aria-label={
                  isTurnedOver
                    ? `Face up card ${cardId}`
                    : `Face down card ${index}`
                }
                isTurnedOver={isTurnedOver}
                key={cardId}
                onClick={onClick}
                onKeyDown={(event) => {
                  if (event.keyCode === 13) {
                    onClick();
                  }
                }}
              />
            );
          })}
        </Section>
        <Section>
          <label
            css={`
              margin-right: 12px;
            `}
          >
            Play Sounds?
            <input
              defaultChecked
              onClick={() => {
                dispatch({ type: 'playSounds', playSounds: !state.playSounds });
              }}
              type="checkbox"
            />
          </label>

          <Button
            onClick={() => {
              dispatch({ type: 'resetGame' });
            }}
          >
            Reset Game
          </Button>
        </Section>
      </Container>
      {wonGame && (
        <Confetti
          confettiSource={{ w: 10, h: 10, x: width, y: height }}
          data-testid="confetti"
          width={width}
          height={height}
          initialVelocityX={-14}
          initialVelocityY={18}
          numberOfPieces={1000}
          recycle={false}
        />
      )}
    </>
  );
}

export default Game;
