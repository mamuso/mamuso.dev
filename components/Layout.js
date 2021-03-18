import styled from "styled-components";
import Head from "next/head";
import { NextSeo } from "next-seo";
import CSSVars from "../components/CSSVars";
import Header from "../components/Header";

export default function Layout({ children }) {
  return (
    <>
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
    </>
  );
}
