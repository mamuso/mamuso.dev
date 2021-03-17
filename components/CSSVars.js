import Head from "next/head";

export default function CSSVars({ children }) {
  return (
    <Head>
      <style>
        {`
        :root {
          --bg-color: #fff;
          --font-color: #424242;
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --bg-color: #011627;
            --font-color: #e1e1ff;
          }
        }

        `}
      </style>
    </Head>
  );
}
