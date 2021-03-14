import Link from "next/link";

export default function Header() {
  return (
    <header>
      <h1>
        <Link href="/">
          <a className="hover:underline">mamuso.dev</a>
        </Link>
      </h1>
    </header>
  );
}
