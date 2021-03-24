import styled from "styled-components";
import Link from "next/link";

const PaginationSection = styled.section`
  font-size: ${(props) => props.theme.fontSizes[2]};
  padding: 4rem 0;
  text-align: center;
  & a {
    color: var(--text-link);
    text-decoration: none;
  }
  & a:hover {
    text-decoration: underline;
  }
`;

export default function Pagination({ page, totalPages }) {
  const pageInt = parseInt(page);
  const totalPagesInt = parseInt(totalPages);
  return (
    <PaginationSection>
      {pageInt - 1 > 0 && <Link href={`/posts/${pageInt - 1}`}>← Previous</Link>}
      {pageInt + 1 <= totalPagesInt && <Link href={`/posts/${pageInt + 1}`}>Next →</Link>}
    </PaginationSection>
  );
}
