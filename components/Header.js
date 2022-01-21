import styled from 'styled-components'
import Link from 'next/link'

const HeaderWrap = styled.header`
  margin-bottom: 10rem;
`

const HeaderLink = styled.div`
  position: relative;
  z-index: 1;
  margin-right: 2.5rem;
  &:hover .pt {
    transform: translateY(0.6rem);
  }
  &:hover .pb {
    transform: translateY(-0.6rem);
  }
  @media only screen and (max-width: 767px) and (min-width: 320px) {
    & {
      float:left;
    }
  }

`

const HeaderColumn = styled.div`
  display: block;
  // max-width: 84rem;
  margin: 0 auto;
  padding: 1.6rem 0;
`

const HeaderLabel = styled.div`
  display: inline-block;
  font-family: ${(props) => props.theme.fonts.monospace};
  font-size: ${(props) => props.theme.fontSizes[0]};
  // background: var(--text-link);
  color: var(--text-primary);
  padding: 0.1rem 0.7rem;
  text-transform: uppercase;
  border-radius: ${(props) => props.theme.radii};
`

const Path = styled.path`
  transition: ${(props) => props.theme.animation};
`

export default function Header() {
  return (
    <HeaderWrap>
      <HeaderLink>
        <Link href="/">
          <a>
            <svg className="logo" width="44" height="60" viewBox="0 0 56 67" fill="none" xmlns="http://www.w3.org/2000/svg" alt="mamuso.dev" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <Path
                className="pt"
                d="M37.276 45.752C37.2974 45.7591 37.3188 45.7663 37.3403 45.7735C46.6806 48.8965 55.6719 49.22 55.6719 49.22C55.6719 49.22 57.7892 29.8228 51.2671 17.4271C44.745 5.03129 30.0982 0 30.0982 0C30.0982 0 -0.443344 9.04381 0.00488585 26.2813C0.453115 43.5189 12.0332 51.942 12.0332 51.942C12.0332 51.942 14.8572 49.22 18.7567 45.5765C18.8198 45.5175 18.8825 45.4589 18.9448 45.4006C19.2244 45.7139 19.5105 46.0176 19.8031 46.3101C25.828 52.3341 33.0165 54.8493 33.0165 54.8493L37.276 45.752Z"
                fill="url(#paint0_linear)"
              />
              <g style={{ mixBlendMode: 'multiply', transform: 'translateZ(0px)' }}>
                <Path
                  className="pb"
                  d="M37.276 57.752C37.2974 57.7591 37.3188 57.7663 37.3403 57.7735C46.6806 60.8965 55.6719 61.22 55.6719 61.22C55.6719 61.22 57.7892 41.8228 51.2671 29.4271C44.745 17.0313 30.0982 12 30.0982 12C30.0982 12 -0.443344 21.0438 0.00488585 38.2813C0.453115 55.5189 12.0332 63.942 12.0332 63.942C12.0332 63.942 14.8572 61.22 18.7567 57.5765C18.8198 57.5175 18.8825 57.4589 18.9448 57.4006C19.2244 57.7139 19.5105 58.0176 19.8031 58.3101C25.828 64.3341 33.0165 66.8493 33.0165 66.8493L37.276 57.752Z"
                  fill="url(#paint1_linear)"
                />
              </g>
              <defs>
                <linearGradient id="paint0_linear" x1="28" y1="-8.17319e-07" x2="0.918546" y2="55.2992" gradientUnits="userSpaceOnUse">
                  <stop offset="0.326" stopColor="#D80D5C" />
                  <stop offset="1" stopColor="#FF005E" />
                </linearGradient>
                <linearGradient id="paint1_linear" x1="28" y1="12" x2="0.918546" y2="67.2992" gradientUnits="userSpaceOnUse">
                  <stop offset="0.265193" stopColor="#5A9AFE" />
                  <stop offset="1" stopColor="#85C6FE" />
                </linearGradient>
              </defs>
            </svg>
          </a>
        </Link>
      </HeaderLink>
      <HeaderColumn>
        <HeaderLabel>mamuso's playlog</HeaderLabel>
      </HeaderColumn>
    </HeaderWrap>
  )
}
