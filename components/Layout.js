import styled from "styled-components";
<<<<<<< HEAD
=======
import Head from "next/head";
import { NextSeo } from "next-seo";
>>>>>>> 9b079ae318e9b8372280e8a9c2f21e171021f3e0
import CSSVars from "../components/CSSVars";
import Header from "../components/Header";

const MainColumn = styled.main`
  max-width: 84rem;
  margin: 0 auto;
`;

export default function Layout({ children }) {
  return (
    <>
<<<<<<< HEAD
      <CSSVars />
      <Header />
      <MainColumn>{children}</MainColumn>
=======
      <NextSeo
        title="mamuso.dev"
        description="Why does it hurt so much to hit your funny bone?"
        canonical="https://www.mamuso.dev"
        openGraph={{
          url: "https://www.mamuso.dev",
          title: "mamuso.dev",
          description: "Why does it hurt so much to hit your funny bone?",
          images: [
            {
              url: "https://mamuso.dev/img/og.png",
              width: 1200,
              height: 627,
              alt: "mamuso.dev – Why does it hurt so much to hit your funny bone?",
            },
          ],
          site_name: "SiteName",
        }}
        twitter={{
          handle: "@mamuso",
          site: "@mamuso",
          cardType: "summary_large_image",
        }}
      />
      <Head>
        <title>mamuso.dev – Why does it hurt so much to hit your funny bone?</title>
      </Head>
      <CSSVars />
      <Header />
      <main>{children}</main>
>>>>>>> 9b079ae318e9b8372280e8a9c2f21e171021f3e0
    </>
  );
}
