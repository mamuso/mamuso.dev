import React from "react";
import { graphql } from "gatsby";

import Layout from "../components/layout";
import Img from "gatsby-image";

const PostList = ({ data }) => {
  const { edges } = data.allMarkdownRemark;
  return (
    <Layout>
      {edges.map(edge => {
        const { frontmatter, html } = edge.node;
        return (
          <div>
            {frontmatter.image ? (
              !!frontmatter.image && !!frontmatter.childImageSharp ? (
                <Img
                  fluid={frontmatter.image.childImageSharp.fluid}
                  alt={frontmatter.title}
                />
              ) : (
                <img
                  src={frontmatter.image.publicURL}
                  alt={frontmatter.title}
                />
              )
            ) : (
              ""
            )}
            {frontmatter.date} - {frontmatter.title}
            <div dangerouslySetInnerHTML={{ __html: html }} />
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
                fluid(maxWidth: 1075, quality: 72) {
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
