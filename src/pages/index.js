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
        title="Using More of Config"
        description="This example uses more of the available config options."
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
