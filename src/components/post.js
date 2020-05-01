import React from "react";
import styled from "styled-components";
import { transparentize } from "polished";
import { Link } from "gatsby";

import Img from "gatsby-image";

const Post = (data) => {
  const { frontmatter, html, blogpost } = data.data;

  const Article = styled.article`
    display: grid;
    grid-template-columns: [content] 30rem 9rem [image] auto;
    margin-bottom: 10rem;
    .content {
      line-height: 1.6;
    }
    & .content a {
      border-bottom: 2px solid
        ${(props) => transparentize(0.8, props.theme.colors.text)};
      text-decoration: none;
      color: ${(props) => props.theme.colors.text};
      transition: all ${(props) => props.theme.animation};
      background: linear-gradient(
        12deg,
        ${(props) => props.theme.colors.backgroundLight} 0%,
        ${(props) => props.theme.colors.backgroundLight} 40%,
        ${(props) => transparentize(1, props.theme.colors.brand)} 41%
      );
      background-position: 50% 0%;
      background-size: 400% 400%;
    }
    & .content a:hover {
      border-bottom: 2px solid
        ${(props) => transparentize(0.8, props.theme.colors.brand)};
      color: ${(props) => props.theme.colors.brand};
      background-position: 0% 70%;
    }
    & .content ul {
      list-style: disc;
    }
    @media only screen and (max-width: 968px) {
      & {
        margin-left: -3.2rem;
        margin-right: -3.2rem;
        grid-template-columns: auto;
        grid-template-areas:
          "content"
          "image";
      }
    }
    @media only screen and (max-width: 767px) {
      & {
        margin-left: -1.6rem;
        margin-right: -1.6rem;
      }
    }
  `;

  const Content = styled.div`
    grid-area: content;
    margin-bottom: 0.8rem;
    @media only screen and (max-width: 968px) {
      & {
        padding-left: 3.2rem;
        padding-right: 3.2rem;
      }
    }
    @media only screen and (max-width: 767px) {
      & {
        padding-left: 1.2rem;
        padding-right: 1.2rem;
      }
    }
  `;

  const Image = styled.div`
    grid-area: image;
    & img,
    & picture,
    & .gatsby-image-wrapper {
      border-radius: ${(props) => props.theme.radii};
      box-shadow: 0 1px 2px rgba(51, 51, 51, 0.2);
      max-width: 100%;
    }
  `;

  const Meta = styled.div`
    font-family: ${(props) => props.theme.fonts.mono};
    font-size: ${(props) => props.theme.fontSizes.xsmall};
    color: ${(props) => props.theme.colors.secondary};
  `;

  const H2 = styled.h2`
    font-family: ${(props) => props.theme.fonts.heading};
    font-size: ${(props) => props.theme.fontSizes.large};
    margin: 0;
    & a {
      text-decoration: none;
      color: ${(props) => props.theme.colors.text};
      transition: all ${(props) => props.theme.animation};
      background: linear-gradient(
        12deg,
        ${(props) => props.theme.colors.backgroundLight} 0%,
        ${(props) => props.theme.colors.backgroundLight} 40%,
        ${(props) => transparentize(1, props.theme.colors.brand)} 41%
      );
      background-position: 50% 0%;
      background-size: 400% 400%;
    }
    & a:hover {
      border-bottom: 2px solid
        ${(props) => transparentize(0.8, props.theme.colors.text)};
      background-position: 0% 70%;
    }
  `;

  return (
    <Article>
      <Content>
        <Meta>
          <time pubdate datetime="datePublished" value={frontmatter.date}>
            {frontmatter.date}
          </time>
          {frontmatter.category ? ` in ${frontmatter.category}` : ``}
        </Meta>
        <H2>
          {!blogpost && <Link to={frontmatter.path}>{frontmatter.title}</Link>}
          {blogpost === true && frontmatter.title}
        </H2>
        <div class="content">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </Content>
      <Image>
        {frontmatter.image ? (
          frontmatter.image.childImageSharp != null ? (
            <Img
              fluid={frontmatter.image.childImageSharp.fluid}
              alt={frontmatter.title}
            />
          ) : (
            <img src={frontmatter.image.publicURL} alt={frontmatter.title} />
          )
        ) : (
          ""
        )}
      </Image>
    </Article>
  );
};

export default Post;
