import styled from "styled-components";
<<<<<<< HEAD
import Markdown from "markdown-to-jsx";
import Image from "next/image";
import Spinner from "../components/Spinner";

const Article = styled.article`
  padding-bottom: 6.4rem;
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

export default function Post({ post }) {
  return (
    <Article>
      <header>
        <h2>{post.title}</h2>
        <time dateTime={post.date}>{post.date}</time>
      </header>

      <Markdown>{post.content}</Markdown>

      <ImageWrap>
        <Spinner />
        <Image src={`/_feed/${post.slug}.${post.image.format}`} layout="responsive" quality={85} width={post.image.width} height={post.image.height} />
      </ImageWrap>
    </Article>
  );
}
=======
>>>>>>> 9b079ae318e9b8372280e8a9c2f21e171021f3e0
