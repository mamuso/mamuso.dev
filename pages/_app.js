import "../styles/index.scss";

import { useEffect } from "react";
import { useRouter } from "next/router";
import * as Fathom from "fathom-client";
import { ThemeProvider } from "styled-components";
import { defaultTheme } from "../components/Theme";
import Layout from "../components/Layout";

function App({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    Fathom.load("ACIFFHWV", {
      canonical: false,
      includedDomains: ["mamuso.dev"],
    });

    function onRouteChangeComplete() {
      Fathom.trackPageview();
    }
    // Record a pageview when route changes
    router.events.on("routeChangeComplete", onRouteChangeComplete);

    // Unassign event listener
    return () => {
      router.events.off("routeChangeComplete", onRouteChangeComplete);
    };
  }, []);

  return (
    <ThemeProvider theme={defaultTheme}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ThemeProvider>
  );
}

export default App;
