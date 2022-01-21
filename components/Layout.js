import styled from "styled-components";
import Head from "next/head";
import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from "../lib/constants";
import CSSVars from "../components/CSSVars";
import Header from "../components/Header";
import Footer from "../components/Footer";

const MainColumn = styled.main`
  max-width: 120rem;
  margin: 0;
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
      <Footer />
    </>
  );
}
