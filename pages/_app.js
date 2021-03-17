import "../styles/index.scss";

import { ThemeProvider } from "styled-components";
import { defaultTheme } from "../Theme";
import Layout from "../components/Layout";

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider theme={{ defaultTheme }}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ThemeProvider>
  );
}

export default MyApp;
