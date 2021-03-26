import "../styles/index.scss";

import { useEffect } from "react";
import Router from "next/router";
import * as Fathom from "fathom-client";
import { ThemeProvider } from "styled-components";
import { defaultTheme } from "../components/Theme";
import Layout from "../components/Layout";

// Record a pageview when route changes
Router.events.on("routeChangeComplete", () => {
  Fathom.trackPageview();
});

function App({ Component, pageProps }) {
  useEffect(() => {
    Fathom.load("MY_FATHOM_ID", {
      includedDomains: ["yourwebsite.com"],
    });
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
