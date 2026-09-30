'use client'

import { useState } from 'react'
import * as stylex from '@stylexjs/stylex'
import { homeLink } from '@/app/styles/homeLink.stylex'
import { homeLinks } from '@/app/styles/homeLinks'
import { listHover } from '@/app/styles/listHover'
import { layout } from '@/app/styles/site'
import { colors } from '@/app/styles/tokens.stylex'
import { projects } from '@/data/projects'
import MoreLink from '@/app/components/MoreLink'

export default function HomeProjects() {
  const [expanded, setExpanded] = useState(false)

  return (
    <section aria-labelledby="home-fun" {...stylex.props(styles.projects)}>
      <div>
        <h2 id="home-fun" {...stylex.props(styles.heading, styles.rule)}>Having fun</h2>
        <ul id="home-projects" {...stylex.props(layout.list)}>
          {projects.slice(0, expanded ? projects.length : 9).map(project => (
            <li key={project.href} {...stylex.props(styles.rule)}>
              <a href={project.href} title={`${project.title} — ${project.description}`} {...stylex.props(homeLink, homeLinks.primary, styles.project, listHover.row)}>
                <span aria-hidden="true" {...stylex.props(listHover.square)} />
                {project.title}{' '}
                <span {...stylex.props(homeLinks.secondary)}>{project.description}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div><MoreLink label={expanded ? 'Fewer projects' : 'More projects'} expanded={expanded} controls="home-projects" onClick={() => setExpanded(value => !value)} /></div>
    </section>
  )
}

const styles = stylex.create({
  projects: {
    minWidth: 0,
    display: { default: 'block', '@media (min-width: 880px)': 'grid' },
    gridColumn: { default: 'auto', '@media (min-width: 880px)': '1' },
    gridRow: { default: 'auto', '@media (min-width: 880px)': '1 / span 2' },
    gridTemplateColumns: 'minmax(0, 1fr)',
    gridTemplateRows: { default: 'none', '@media (min-width: 880px)': 'subgrid' },
  },
  rule: {
    borderBlockEndColor: colors.rule,
    borderBlockEndStyle: 'solid',
    borderBlockEndWidth: 0.5,
  },
  heading: {
    fontSize: 18,
    letterSpacing: '-0.005em',
    lineHeight: '24px',
    fontWeight: 400,
    margin: 0,
    paddingBlock: 4,
  },
  project: {
    display: 'block',
    lineHeight: '22px',
    paddingBlock: 5,
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
})
