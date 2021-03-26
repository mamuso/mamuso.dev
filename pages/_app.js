import "../styles/index.scss";

import { useEffect } from "react";
import { useRouter } from "next/router";
import * as Fathom from "fathom-client";
import { ThemeProvider } from "styled-components";
import { defaultTheme } from "../components/Theme";
import Layout from "../components/Layout";

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Initialize Fathom when the app loads
    Fathom.load("ACIFFHWV", {
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

export default MyApp;
