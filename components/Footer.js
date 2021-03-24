import styled from "styled-components";

const FooterSection = styled.footer`
  font-size: ${(props) => props.theme.fontSizes[1]};
  padding: 4rem 0;
  text-align: center;
  & a {
    display: inline-block;
    margin: 0 0.8rem;
    color: var(--text-link);
    text-decoration: none;
  }
  & a:hover {
    text-decoration: underline;
  }
`;
export default function Footer() {
  return (
    <FooterSection>
      mamuso.dev: <a href="http://twitter.com/mamuso">Twitter</a>
      <a href="http://github.com/mamuso">Github</a>
      <a href="https://www.linkedin.com/in/mamuso/">Linkedin</a>
      <a href="mailto:mamuso@mamuso.net">Say hi</a>
    </FooterSection>
  );
}
