import React from "react";
import styled from "styled-components";

import Img from "gatsby-image";

const Post = data => {
  console.log(data);
  const { frontmatter, html } = data.data;

  const Article = styled.article`
    display: grid;
    grid-template-columns: [content] 30rem 9rem [image] auto;
    margin-bottom: 10rem;
  `;

  const Content = styled.div`
    grid-area: content;
  `;

  const Image = styled.div`
    grid-area: image;
  `;

  return (
    <Article>
      <Content>
        <time pubdate datetime="datePublished" value={frontmatter.date}>
          {frontmatter.date}
        </time>
        <h2>{frontmatter.title}</h2>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </Content>
      <Image>
        {frontmatter.image ? (
          !!frontmatter.image && !!frontmatter.childImageSharp ? (
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
