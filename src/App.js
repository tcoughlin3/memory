import React from 'react';
import useSound from 'use-sound';
import './App.css';
import * as cardsSvgs from './cards';
import CardBack from './CardBack';
import matchSfx from './sounds/match.mp3';
import notMatchSfx from './sounds/not-match.mp3';
import winSfx from './sounds/win.mp3';

function shuffle(cards) {
  cards.forEach((card, index) => {
    const randomIndex = Math.floor(Math.random() * cards.length);
    const randomCard = cards[randomIndex];
    cards.splice(index, 1, randomCard);
    cards.splice(randomIndex, 1, card);
  });
  return cards;
}

const cardProps = { width: '7rem', height: '7rem' };

const cards = Object.values(cardsSvgs);

function Card(props) {
  const { cardFace: CardFace, isTurnedOver, ...other } = props;

  return (
    <span {...other}>
      {isTurnedOver ? <CardFace {...cardProps} /> : <CardBack {...cardProps} />}
    </span>
  );
}

const shuffledCards = shuffle([
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

const toCardType = (cardId) => cardId.slice(0, 5);
const isMatch = (cardIdA, cardIdB) =>
  toCardType(cardIdA) === toCardType(cardIdB);

function App() {
  const initialState = {
    freezeGame: false,
    flippedCards: [],
    matchedCards: [],
    playSounds: true,
  };
  const [state, dispatch] = React.useReducer((state, action) => {
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
              matchedCards: state.matchedCards.concat(
                firstCardId,
                secondCardId
              ),
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
  }, initialState);

  const [playMatchSfx] = useSound(matchSfx);
  const [playNotMatchSfx] = useSound(notMatchSfx, { volume: 0.1 });
  const [playWinSfx] = useSound(winSfx);

  React.useEffect(() => {
    if (state.playSounds) {
      if (state.matchedCards.length > 0) playMatchSfx();
      if (state.matchedCards.length === shuffledCards.length) playWinSfx();
    }
  }, [state.matchedCards, playMatchSfx, playWinSfx]);

  React.useEffect(() => {
    if (state.freezeGame) {
      if (state.playSounds) playNotMatchSfx();
      setTimeout(() => {
        dispatch({ type: 'unfreezeGame' });
      }, 1000);
    }
  }, [state.freezeGame, playNotMatchSfx]);

  return (
    <>
      <div className="App">
        {shuffledCards.map(({ cardId, component: Card }) => {
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
          margin: '8px',
        }}
      >
        <label style={{ marginRight: '4px' }}>
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
          style={{ marginLeft: '4px' }}
          onClick={() => {
            dispatch({ type: 'resetGame' });
          }}
        >
          Reset Game
        </button>
      </div>
    </>
  );
}

export default App;
