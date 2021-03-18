import styled, { keyframes } from "styled-components";

const spinnerAnimation = keyframes`
  from { left: 0; }
  to { left: -11.2rem; }
`;

const SpinnerWrap = styled.div`
  display: inline-block;
  width: 16px;
  height: 24px;
  text-align: left;
  overflow: hidden;
  opacity: 0.4;
`;

const SpinnerContent = styled.div`
  position: relative;
  width: 1000px;
  animation: ${spinnerAnimation} 0.75s steps(7) infinite;
`;

const SpinnerFrame = styled.span`
  display: inline-block;
  width: 16px;
  height: 20px;
  text-align: center;
  font-weight: bold;
`;

export default function Spinner() {
  return (
    <SpinnerWrap className="spinner">
      <SpinnerContent>
        <SpinnerFrame>⣷</SpinnerFrame>
        <SpinnerFrame>⣯</SpinnerFrame>
        <SpinnerFrame>⣟</SpinnerFrame>
        <SpinnerFrame>⡿</SpinnerFrame>
        <SpinnerFrame>⢿</SpinnerFrame>
        <SpinnerFrame>⣻</SpinnerFrame>
        <SpinnerFrame>⣽</SpinnerFrame>
        <SpinnerFrame>⣾</SpinnerFrame>
      </SpinnerContent>
    </SpinnerWrap>
  );
}
