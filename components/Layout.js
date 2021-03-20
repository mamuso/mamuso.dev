import styled from "styled-components";
import Head from "next/head";
import { BLOG_URL, BLOG_TITLE } from "../lib/constants";
import CSSVars from "../components/CSSVars";
import Header from "../components/Header";

const MainColumn = styled.main`
  max-width: 84rem;
  margin: 0 auto;
`;

export default function Layout({ children }) {
  return (
    <>
      <Head>
        <link rel="alternate" type="application/rss+xml" title={`RSS Feed for ${BLOG_TITLE}`} href={`${BLOG_URL}/rss.xml`} />
      </Head>
      <CSSVars />
      <Header />
      <MainColumn>{children}</MainColumn>
    </>
  );
}
