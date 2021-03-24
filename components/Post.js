import styled from "styled-components";
import Markdown from "markdown-to-jsx";
import dateFormat from "dateformat";
import Link from "next/link";
import Image from "next/image";
import Spinner from "../components/Spinner";

const Article = styled.article`
  font-size: ${(props) => props.theme.fontSizes[2]};
  padding-bottom: 8rem;
`;

const ImageWrap = styled.div`
  position: relative;
  margin: 3ch -2.4ch;
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
    margin: 0.25ch -2.6ch;
    opacity: ${(props) => props.theme.mdOpacity};
    content: "##";
  }
  & a {
    text-decoration: none;
    color: var(--text-primary);
  }
  & a:hover {
    text-decoration: none;
  }
`;

const TimePost = styled.time`
  font-family: ${(props) => props.theme.fonts.monospace};
  font-size: ${(props) => props.theme.fontSizes[0]};
  text-transform: uppercase;
  opacity: 0.45;
`;

const MarkdownPost = styled.section`
  margin: 3.2rem 0;
  a {
    color: var(--text-link);
  }
  & a::before {
    margin-right: 0.25ch;
    opacity: ${(props) => props.theme.mdOpacity};
    content: "[";
  }
  & a::after {
    margin-left: 0.25ch;
    opacity: ${(props) => props.theme.mdOpacity};
    content: "]";
  }
  & ul {
    padding-inline-start: 1.5ch;
  }
  & li {
    list-style: none;
  }
  & li::before {
    display: inline-block;
    width: 1.6ch;
    margin-left: -1.6ch;
    content: "-";
    opacity: ${(props) => props.theme.mdOpacity};
  }
  & strong::before {
    margin-right: 0.3ch;
    opacity: ${(props) => props.theme.mdOpacity};
    content: "**";
  }
  & strong::after {
    margin-left: 0.3ch;
    opacity: ${(props) => props.theme.mdOpacity};
    content: "**";
  }
`;

export default function Post({ post }) {
  return (
    <Article>
      <header>
        <H2Post>
          {post.link && (
            <Link href={`/post/${post.slug}`}>
              <a>{post.title}</a>
            </Link>
          )}

          {!post.link && post.title}
        </H2Post>
        <TimePost dateTime={post.date}>{dateFormat(`${post.date}T00:00:00`, "fullDate")}</TimePost>
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
