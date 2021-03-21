import { defaultTheme } from "./Theme";
import Head from "next/head";

const darkTheme = Object.entries(defaultTheme.colors.dark)
  .map(([name, value]) => `--${name}: ${value}`)
  .join(";");

const lightTheme = Object.entries(defaultTheme.colors.light)
  .map(([name, value]) => `--${name}: ${value}`)
  .join(";");

export default function CSSVars() {
  return (
    <Head>
      <style>
        {`
        :root {
          ${lightTheme};
        }
        @media (prefers-color-scheme: dark) {
          :root {
            ${darkTheme};
          }
        }
        `}
      </style>
    </Head>
  );
}
