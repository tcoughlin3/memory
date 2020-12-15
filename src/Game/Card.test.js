import {
  waitForElementToBeRemoved,
  render,
  screen,
} from '@testing-library/react';
import Card from './Card';
import AceOfSpades from './CardFaces/AceOfSpades';

describe('<Card />', () => {
  it('should be face down by default', () => {
    render(<Card cardFace={AceOfSpades} />);
    expect(screen.getByTestId('card-back')).toBeVisible();
    expect(screen.queryByTestId('card-face')).not.toBeVisible();
  });
  it('should support `isTurnedOver` prop', () => {
    render(<Card cardFace={AceOfSpades} isTurnedOver />);
    expect(screen.queryByTestId('card-back')).not.toBeVisible();
    expect(screen.getByTestId('card-face')).toBeVisible();
  });
});
