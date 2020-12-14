import styled from 'styled-components';

export const Container = styled.div`
  text-align: center;
  margin-left: 16px;
  margin-right: 16px;
  @media (min-width: 768px) {
    margin-left: 64px;
    margin-right: 64px;
  }
  @media (min-width: 1024px) {
    max-width: 47rem;
    margin-left: auto;
    margin-right: auto;
  }
`;

export default Container;
