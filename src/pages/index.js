import React from "react";
import { graphql } from "gatsby";

import Layout from "../components/layout";
import Post from "../components/post";
import { GatsbySeo } from "gatsby-plugin-next-seo";

const PostList = ({ data }) => {
  const { edges } = data.allMarkdownRemark;
  return (
    <Layout>
      <GatsbySeo
        title={"Sweet home – " + data.site.siteMetadata.title}
        description={data.site.siteMetadata.description}
        canonical="https://feed.mamuso.net/"
        openGraph={{
          url: "https://feed.mamuso.net/",
          title: `Sweet home – ${data.site.siteMetadata.title}`,
          description: `${data.site.siteMetadata.description}`,
          images: [
            {
              url: "https://feed.mamuso.net/img/og-image.png",
              width: 800,
              height: 800,
              alt: "mamuso's feed",
            },
          ],
          site_name: "mamuso's feed",
        }}
        twitter={{
          handle: "@mamuso",
          cardType: "summary_large_image",
        }}
      />
      {edges.map((edge) => {
        return (
          <div>
            <Post data={edge.node} />
          </div>
        );
      })}
    </Layout>
  );
};

export const query = graphql`
  query HomepageQuery {
    site {
      siteMetadata {
        title
        description
      }
    }
    allMarkdownRemark(sort: { order: DESC, fields: [frontmatter___date] }) {
      edges {
        node {
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
          }
          html
        }
      }
    }
  }
`;

export default PostList;
