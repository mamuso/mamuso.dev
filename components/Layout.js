import styled from "styled-components";
import Head from "next/head";
import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from "../lib/constants";
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
        <link rel="alternate" type="application/rss+xml" title={`${BLOG_TITLE} – ${BLOG_SUBTITLE}`} href={`${BLOG_URL}/rss.xml`} />
      </Head>
      <CSSVars />
      <Header />
      <MainColumn>{children}</MainColumn>
    </>
  );
}
