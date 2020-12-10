import React from 'react';
import useSound from 'use-sound';
import { useSpring, animated } from 'react-spring';
import './App.css';
import * as cardsSvgs from './cards';
import CardBack from './CardBack';
import matchSfx from './sounds/match.mp3';
import flipSfx from './sounds/flip.wav';
import winSfx from './sounds/win.mp3';
import Confetti from 'react-confetti';
import useWindowSize from 'react-use/lib/useWindowSize';

// TODOS
// - [ ] use styled-components lib
// - [ ] code cleanup - refactor to separate files
// - [ ] write tests
// - [ ] white sox theme
//   - [ ] replace card assets
//   - [ ] add GR field background
// - [ ] deploy
// - [ ] add auth
// - [ ] add leader board

function shuffle(cards) {
  cards.forEach((card, index) => {
    const randomIndex = Math.floor(Math.random() * cards.length);
    const randomCard = cards[randomIndex];
    cards.splice(index, 1, randomCard);
    cards.splice(randomIndex, 1, card);
  });
  return cards;
}

const cardProps = {
  width: '7rem',
  height: '7rem',
};

const cards = Object.values(cardsSvgs);

function Card(props) {
  const { cardFace: CardFace, isTurnedOver, ...other } = props;
  const { transform, opacity } = useSpring({
    opacity: isTurnedOver ? 1 : 0,
    transform: `perspective(100px) rotateY(${isTurnedOver ? 180 : 0}deg)`,
    config: { mass: 5, tension: 500, friction: 80 },
  });

  return (
    <div
      {...other}
      style={{
        maxHeight: '132px',
      }}
    >
      <animated.div
        style={{
          position: 'relative',
          willChange: 'transform, opacity',
          opacity: opacity.interpolate((o) => 1 - o),
          transform,
        }}
      >
        <CardBack {...cardProps} />
      </animated.div>
      <animated.div
        style={{
          position: 'relative',
          top: '-112px',
          willChange: 'transform, opacity',
          opacity,
          transform: transform.interpolate((t) => `${t} rotateY(180deg)`),
        }}
      >
        <CardFace {...cardProps} />
      </animated.div>
    </div>
  );
}

const shuffleDeck = () =>
  shuffle([
    ...cards.slice(0, 4).map((CardFace) => {
      const cardId = `${CardFace.name}-A`;
      const Component = (props) => <Card {...props} cardFace={CardFace} />;
      return { cardId, component: Component };
    }),
    ...cards.slice(0, 4).map((CardFace) => {
      const cardId = `${CardFace.name}-B`;
      const Component = (props) => <Card {...props} cardFace={CardFace} />;
      return { cardId, component: Component };
    }),
  ]);

const toCardType = (cardId) => cardId.slice(0, 5);
const isMatch = (cardIdA, cardIdB) =>
  toCardType(cardIdA) === toCardType(cardIdB);

const initialState = {
  deck: shuffleDeck(),
  freezeGame: false,
  flippedCards: [],
  matchedCards: [],
  playSounds: true,
};

function appReducer(state, action) {
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

function useConditionalSound(
  url,
  { soundEnabled, ...config } = { soundEnabled: true }
) {
  let [playSound, ...other] = useSound(url, config);
  return [soundEnabled ? playSound : noop, ...other];
}
function noop() {}

function App() {
  const [state, dispatch] = React.useReducer(appReducer, initialState);
  const wonGame = state.matchedCards.length === state.deck.length;

  const [playMatchSfx] = useConditionalSound(matchSfx, {
    soundEnabled: state.playSounds,
  });
  const [playFlipSfx] = useConditionalSound(flipSfx, {
    soundEnabled: state.playSounds,
    volume: 0.1,
  });
  const [playWinSfx] = useConditionalSound(winSfx, {
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
      <div className="app">
        <div className="cards">
          {state.deck.map(({ cardId, component: Card }) => {
            const isTurnedOver =
              state.flippedCards.includes(cardId) ||
              state.matchedCards.includes(cardId);
            return (
              <Card
                isTurnedOver={isTurnedOver}
                key={cardId}
                onClick={() => {
                  if (!state.freezeGame && !isTurnedOver) {
                    dispatch({ type: 'flip', cardId });
                    playFlipSfx();
                  }
                }}
              />
            );
          })}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '24px',
          }}
        >
          <label style={{ marginRight: '12px' }}>
            Play Sounds?
            <input
              defaultChecked
              onClick={() => {
                dispatch({ type: 'playSounds', playSounds: !state.playSounds });
              }}
              type="checkbox"
            />
          </label>
          <button
            style={{ marginLeft: '12px' }}
            onClick={() => {
              dispatch({ type: 'resetGame' });
            }}
          >
            Reset Game
          </button>
        </div>
      </div>
      {wonGame && (
        <Confetti
          confettiSource={{ w: 10, h: 10, x: width, y: height }}
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

export default App;
