import styled from "styled-components";
import Markdown from "markdown-to-jsx";
import Image from "next/image";
import Spinner from "../components/Spinner";

export default function Post({ post }) {
  return (
    <article>
      <header>
        <h2>{post.title}</h2>
        <time datetime={post.date}>{post.date}</time>
      </header>

      <Markdown>{post.content}</Markdown>

      <div style={{ backgroundColor: "red", margin: "0 -2rem", display: "block" }}>
        <Spinner />
        <Image src={`/_feed/${post.slug}.${post.image.format}`} layout="responsive" quality={85} width={post.image.width} height={post.image.height} />
      </div>
    </article>
  );
}
