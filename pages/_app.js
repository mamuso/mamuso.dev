import Layout from "../components/Layout";

import "../styles/index.scss";

function MyApp({ Component, pageProps }) {
  return (
    <Layout {...pageProps}>
      <Component {...pageProps} />
    </Layout>
  );
}

export default MyApp;
