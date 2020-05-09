import React from "react";
import { graphql } from "gatsby";

import Layout from "../components/layout";
import Post from "../components/post";
import { GatsbySeo } from "gatsby-plugin-next-seo";

const BlogPost = ({ data }) => {
  const { markdownRemark: post } = data;
  const ogimage = post.frontmatter.poster
    ? post.frontmatter.poster.publicURL
    : post.frontmatter.image.publicURL;

  return (
    <Layout>
      <GatsbySeo
        title={post.frontmatter.title + " – " + data.site.siteMetadata.title}
        description={post.excerpt}
        canonical="https://feed.mamuso.net/"
        openGraph={{
          url: "https://feed.mamuso.net/",
          title: `${post.frontmatter.title}`,
          description: `${post.excerpt}`,
          images: [
            {
              url: `https://feed.mamuso.net${ogimage}`,
            },
          ],
          site_name: "mamuso's feed",
        }}
        twitter={{
          handle: "@mamuso",
          cardType: "summary_large_image",
        }}
      />
      <div>
        <Post data={{ blogpost: true, ...post }} />
      </div>
    </Layout>
  );
};

export const pageQuery = graphql`
  query BlogPostByPath($path: String!) {
    site {
      siteMetadata {
        title
        description
      }
    }
    markdownRemark(frontmatter: { path: { eq: $path } }) {
      html
      excerpt(pruneLength: 280)
      frontmatter {
        title
        category
        path
        date(formatString: "MMMM Do YYYY")
        image {
          childImageSharp {
            fluid {
              ...GatsbyImageSharpFluid
            }
          }
          publicURL
        }
        poster {
          publicURL
        }
      }
    }
  }
`;

export default BlogPost;
