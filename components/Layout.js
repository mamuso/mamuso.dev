import Header from "../components/Header";

export default function Layout({ preview, children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
    </>
  );
}
