import { useSpring, animated } from 'react-spring';
// eslint-disable-next-line no-unused-vars
import styled from 'styled-components/macro';
import CardBack from './CardBack/CardBack';

export function Card(props) {
  const { cardFace: CardFace, isTurnedOver, ...other } = props;
  const { transform, opacity } = useSpring({
    opacity: isTurnedOver ? 1 : 0,
    transform: `perspective(100px) rotateY(${isTurnedOver ? 180 : 0}deg)`,
    config: { mass: 5, tension: 500, friction: 80 },
  });
  const svgProps = {
    width: '7rem',
    height: '7rem',
  };

  return (
    <div
      {...other}
      css={`
        max-height: 112px;
        padding: 8px 0px;
      `}
      role="button"
      tabIndex={0}
    >
      <animated.div
        style={{
          position: 'relative',
          willChange: 'transform, opacity',
          opacity: opacity.interpolate((o) => 1 - o),
          transform,
        }}
      >
        <CardBack {...svgProps} />
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
        <CardFace {...svgProps} />
      </animated.div>
    </div>
  );
}

export default Card;
