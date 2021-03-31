import { defaultTheme } from "./Theme";
import Head from "next/head";

const hexToRgb = (hex) => {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

const darkTheme = Object.entries(defaultTheme.colors.dark)
  .map(([name, value]) => `--${name}: ${value}; --${name}-rgb: ${Object.values(hexToRgb(value)).join(", ")};`)
  .join(";");

const lightTheme = Object.entries(defaultTheme.colors.light)
  .map(([name, value]) => `--${name}: ${value}; --${name}-rgb: ${Object.values(hexToRgb(value)).join(", ")};`)
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
