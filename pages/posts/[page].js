import { getAllPosts } from "../../lib/api";
import { NextSeo } from "next-seo";
import Head from "next/head";
import Post from "../../components/Post";

const postsPerPage = 20;
const allPosts = getAllPosts(["title", "date", "slug", "image", "content"]);

export default function Index({ pagePosts }) {
  if (pagePosts) {
    return (
      <>
        <Head>
          <title>mamuso.dev – Why does it hurt so much to hit your funny bone?</title>
        </Head>
        <NextSeo
          title="mamuso.dev"
          description="Why does it hurt so much to hit your funny bone?"
          canonical="https://www.mamuso.dev"
          openGraph={{
            url: "https://www.mamuso.dev",
            title: "mamuso.dev",
            description: "Why does it hurt so much to hit your funny bone?",
            images: [
              {
                url: "https://mamuso.dev/img/og.png",
                width: 1200,
                height: 627,
                alt: "mamuso.dev – Why does it hurt so much to hit your funny bone?",
              },
            ],
            site_name: "SiteName",
          }}
          twitter={{
            handle: "@mamuso",
            site: "@mamuso",
            cardType: "summary_large_image",
          }}
        />
        {pagePosts.map((post) => (
          <Post post={post} />
        ))}
      </>
    );
  } else {
    return null;
  }
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
