import { getAllPosts } from "../../lib/api";
import Head from "next/head";
import Image from "next/image";

const postsPerPage = 20;
const allPosts = getAllPosts(["title", "date", "slug"]);

export default function Index({ pagePosts }) {
  return (
    <>
      <Head>
        <title>mamuso.dev</title>
      </Head>
      <div>
        {pagePosts.map((post) => (
          <p>{post.title}</p>
        ))}
      </div>
    </>
  );
}

export async function getStaticPaths() {
  // calculate the number of pages to spit the static paths
  const totalPages = Math.ceil(allPosts.length / postsPerPage);
  const pathPages = Array.from({ length: totalPages }, (x, i) => ({
    params: {
      page: `${i + 1}`,
    },
  }));
  return {
    paths: pathPages,
    fallback: true,
  };
}

export async function getStaticProps(context) {
  const { page } = context.params;
  let pagePosts = allPosts.slice((page - 1) * postsPerPage, page * postsPerPage);
  return {
    props: { pagePosts },
  };
}
