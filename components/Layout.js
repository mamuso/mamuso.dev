import Head from "next/head";
import CSSVars from "../components/CSSVars";
import Header from "../components/Header";

export default function Layout({ children }) {
  return (
    <div>
      <CSSVars />
      <Header />
      <main>{children}</main>
    </div>
  );
}
