import styled from "styled-components";
import CSSVars from "../components/CSSVars";
import Header from "../components/Header";

const MainColumn = styled.main`
  max-width: 84rem;
  margin: 0 auto;
`;

export default function Layout({ children }) {
  return (
    <>
      <CSSVars />
      <Header />
      <MainColumn>{children}</MainColumn>
    </>
  );
}
