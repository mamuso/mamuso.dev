import styled from "styled-components";
import Markdown from "markdown-to-jsx";
import Image from "next/image";
import Spinner from "../components/Spinner";

const Article = styled.article`
  font-size: ${(props) => props.theme.fontSizes[2]};
  padding-bottom: 7.2rem;
`;

const ImageWrap = styled.div`
  position: relative;
  margin: 1rem -2.4rem;
  background-color: var(--outer-border);
  border-radius: ${(props) => props.theme.radii};
  text-align: center;
  overflow: hidden;
  & .spinner {
    position: absolute;
    top: 48%;
  }
`;

const H2Post = styled.h2`
  font-family: ${(props) => props.theme.fonts.heading};
  font-size: ${(props) => props.theme.fontSizes[5]};
  letter-spacing: -0.02rem;
  line-height: ${(props) => props.theme.lineHeights.heading};
  margin-bottom: 0.3rem;
  &::before {
    position: absolute;
    font-family: ${(props) => props.theme.fonts.body};
    font-size: ${(props) => props.theme.fontSizes[4]};
    font-weight: ${(props) => props.theme.fontWeights.body};
    letter-spacing: normal;
    margin: 0.3ch -2.6ch;
    opacity: 0.15;
    content: "##";
  }
`;

const TimePost = styled.time`
  font-family: ${(props) => props.theme.fonts.monospace};
  font-size: ${(props) => props.theme.fontSizes[1]};
  opacity: 0.4;
`;

const MarkdownPost = styled.section`
  margin: 1.5rem 0;
  & a::before {
    opacity: 0.15;
    content: "[";
  }
  & a::after {
    opacity: 0.15;
    content: "]";
  }
`;

export default function Post({ post }) {
  return (
    <Article>
      <header>
        <H2Post>{post.title}</H2Post>
        <TimePost dateTime={post.date}>{post.date}</TimePost>
      </header>
      <MarkdownPost>
        <Markdown>{post.content}</Markdown>
      </MarkdownPost>
      <ImageWrap>
        <Spinner />
        <Image src={`/_feed/${post.slug}.${post.image.format}`} layout="responsive" quality={85} width={post.image.width} height={post.image.height} />
      </ImageWrap>
    </Article>
  );
}
