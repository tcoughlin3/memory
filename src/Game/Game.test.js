import {
  waitForElementToBeRemoved,
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Game from './Game';

// Mock react-confetti library so we don't have to worry about
// mocking the jsdom environment that it expects.
jest.mock('react-confetti', () => {
  return {
    __esModule: true,
    default: (props) => <div data-testid={props['data-testid']} />,
  };
});

// Mock `shuffle` so it simply passes the array of cards through.
// That way we can know how to find matches in the tests.
// The first 12 cards in the deck will have their match at the n + 12 index.
// Index zero card `Svg10OfClubs-A` has a match at index 12
// `'Svg10OfClubs-B'`, and so on.
//
// [
//   { cardId: 'Svg10OfClubs-A', component: [...] },
//   { cardId: 'Svg2OfClubs-A', component: [...] },
//   { cardId: 'Svg3OfDiamonds-A', component: [...] },
//   { cardId: 'Svg5OfSpades-A', component: [...] },
//   { cardId: 'Svg6OfClubs-A', component: [...] },
//   { cardId: 'Svg7OfDiamonds-A', component: [...] },
//   { cardId: 'Svg8OfHearts-A', component: [...] },
//   { cardId: 'Svg9OfSpades-A', component: [...] },
//   { cardId: 'SvgAceOfSpades-A', component: [...] },
//   { cardId: 'SvgJackOfDiamonds2-A', component: [...] },
//   { cardId: 'SvgKingOfClubs2-A', component: [...] },
//   { cardId: 'SvgQueenOfHearts2-A', component: [...] },
//   { cardId: 'Svg10OfClubs-B', component: [...] },
//   { cardId: 'Svg2OfClubs-B', component: [...] },
//   { cardId: 'Svg3OfDiamonds-B', component: [...] },
//   { cardId: 'Svg5OfSpades-B', component: [...] },
//   { cardId: 'Svg6OfClubs-B', component: [...] },
//   { cardId: 'Svg7OfDiamonds-B', component: [...] },
//   { cardId: 'Svg8OfHearts-B', component: [...] },
//   { cardId: 'Svg9OfSpades-B', component: [...] },
//   { cardId: 'SvgAceOfSpades-B', component: [...] },
//   { cardId: 'SvgJackOfDiamonds2-B', component: [...] },
//   { cardId: 'SvgKingOfClubs2-B', component: [...] },
//   { cardId: 'SvgQueenOfHearts2-B', component: [...] }
// ]
jest.mock('./shuffle', () => {
  return jest.fn((v) => v);
});

describe('<Game />', () => {
  // Mock HTMLMediaElement methods that `use-sound` library will
  // call but are not implemented in jsdom environment.
  HTMLMediaElement.prototype.play = jest.fn();
  HTMLMediaElement.prototype.load = jest.fn();

  // Helpers just for convience of not having to retype the same
  // queries throughout tests.
  const findAllFaceDown = () =>
    screen.findAllByRole('button', {
      name: /face down/i,
    });
  const findAllFaceUp = () =>
    screen.findAllByRole('button', {
      name: /face up/i,
    });
  const queryAllFaceDown = () =>
    screen.queryAllByRole('button', {
      name: /face down/i,
    });
  const queryAllFaceUp = () =>
    screen.queryAllByRole('button', {
      name: /face up/i,
    });

  it('renders a title', async () => {
    render(<Game />);

    const titleElement = await screen.findByText(/memory/i);
    expect(titleElement).toBeInTheDocument();
  });

  it('renders 24 cards face down', async () => {
    render(<Game />);

    const faceDownCards = await findAllFaceDown();
    expect(faceDownCards).toHaveLength(24);

    const faceUpCards = queryAllFaceUp();
    expect(faceUpCards).toHaveLength(0);
  });

  // Assert clicks work but also Enter key for keyboard users
  it.each([userEvent.click, (el) => userEvent.type(el, '{enter}')])(
    "turns cards over so they're face up",
    async (clickOrPressEnter) => {
      render(<Game />);

      const [faceDownCard] = await findAllFaceDown();
      clickOrPressEnter(faceDownCard);

      const faceUpCards = await findAllFaceUp();
      expect(faceUpCards).toHaveLength(1);

      const faceDownCards = queryAllFaceDown();
      expect(faceDownCards).toHaveLength(23);
    }
  );

  // Game should be playable with Enter and Tab keys
  it.skip('should support tabbing', () => {});

  it("turns cards back face down when they don't match", async () => {
    render(<Game />);

    let faceDownCards = await findAllFaceDown();
    userEvent.click(faceDownCards[0]);
    // Index 13 card does not match index zero card
    userEvent.click(faceDownCards[13]);

    const faceUpCards = await findAllFaceUp();
    expect(faceUpCards).toHaveLength(2);
    faceDownCards = queryAllFaceDown();
    expect(faceDownCards).toHaveLength(22);

    await waitForElementToBeRemoved(() => queryAllFaceUp());

    faceDownCards = queryAllFaceDown();

    expect(faceDownCards).toHaveLength(24);
  });

  it('leaves matching cards face up', async () => {
    render(<Game />);

    let faceDownCards = await findAllFaceDown();
    userEvent.click(faceDownCards[0]);
    // Index 12 card does match index zero card
    userEvent.click(faceDownCards[12]);

    let faceUpCards = await findAllFaceUp();
    expect(faceUpCards).toHaveLength(2);

    faceDownCards = queryAllFaceDown();
    expect(faceDownCards).toHaveLength(22);

    userEvent.click(faceDownCards[0]);

    faceUpCards = await findAllFaceUp();
    // If the matching cards clicked above were to get flipped back
    // face down, this length be fewer than 3 and the test will fail.
    expect(faceUpCards).toHaveLength(3);

    faceDownCards = queryAllFaceDown();
    expect(faceDownCards).toHaveLength(21);
  });

  it('supports winning the game', async () => {
    render(<Game />);

    async function matchPair() {
      let faceDownCards = await findAllFaceDown();
      // Given the shape of the cards array with no shuffling (described at
      // top of file), the card matching index zero is reliably always the card
      // at length / 2.
      userEvent.click(faceDownCards[0]);
      userEvent.click(faceDownCards[faceDownCards.length / 2]);
    }

    // 1st matching pair
    await matchPair();
    // 2nd matching pair
    await matchPair();
    // 3rd matching pair
    await matchPair();
    // 4th matching pair
    await matchPair();
    // 5th matching pair
    await matchPair();
    // 6th matching pair
    await matchPair();
    // 7th matching pair
    await matchPair();
    // 8th matching pair
    await matchPair();
    // 9th matching pair
    await matchPair();
    // 10th matching pair
    await matchPair();
    // 11th matching pair
    await matchPair();
    // Confetti should only render when a win has occurred
    expect(screen.queryByTestId('confetti')).not.toBeInTheDocument();
    // 12th and final matching pair
    await matchPair();

    const faceUpCards = await findAllFaceUp();
    expect(faceUpCards).toHaveLength(24);

    const faceDownCards = queryAllFaceDown();
    expect(faceDownCards).toHaveLength(0);

    // <Confetti /> only renders when game is won
    const confetti = await screen.findByTestId('confetti');
    expect(confetti).toBeInTheDocument();
  });

  describe.skip('Reset Game button', () => {
    it('should reshuffle the deck', () => {});
  });
  describe.skip('Play Sounds toggle', () => {
    it('should toggle sound effects', () => {});
  });
});
