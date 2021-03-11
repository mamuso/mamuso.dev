import { getAllPosts } from "../lib/api";
import Head from "next/head";

export default function Index({ allPosts }) {
  return (
    <>
      <Head>
        <title>mamuso.dev</title>
      </Head>
      <div>
        {allPosts.map((post) => (
          <p>{post.title}</p>
        ))}
      </div>
    </>
  );
}

export async function getStaticProps() {
  const allPosts = getAllPosts(["title", "date", "slug"]);

  return {
    props: { allPosts },
  };
}
