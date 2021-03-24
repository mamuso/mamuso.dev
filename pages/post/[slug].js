import { BLOG_URL, BLOG_TITLE, BLOG_SUBTITLE } from "../../lib/constants";
import { getPostBySlug, getAllPosts } from "../../lib/api";

import { NextSeo } from "next-seo";
import Head from "next/head";
import Post from "../../components/Post";

export default function PostPage({ post }) {
  if (post) {
    return (
      <>
        <Head>
          <title>{`${post.title} – ${BLOG_TITLE}`}</title>
        </Head>
        <Post post={post} />
      </>
    );
  }
}
export async function getStaticProps({ params }) {
  const post = getPostBySlug(params.slug, ["title", "date", "slug", "image", "content"]);

  return {
    props: { post },
  };
}

export async function getStaticPaths() {
  const posts = getAllPosts(["slug"]);

  return {
    paths: posts.map((post) => {
      return {
        params: {
          slug: post.slug,
        },
      };
    }),
    fallback: false,
  };
}
