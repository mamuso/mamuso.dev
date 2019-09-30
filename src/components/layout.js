/**
 * Layout component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from "react";
import { Helmet } from "react-helmet";
import PropTypes from "prop-types";
import { useStaticQuery, graphql } from "gatsby";

import SiteHeader from "./header";
import styled, { ThemeProvider } from 'styled-components';
import { GlobalStyle } from '../theme/globalStyle'
import theme from '../theme/theme';


const Layout = ({ children }) => {
  const data = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
          description
        }
      }
    }
  `);

  return (
    <ThemeProvider theme={theme}>
      <>
      <GlobalStyle />
      <Helmet>
        <html lang="en" />
        <title>{data.site.siteMetadata.title}</title>
        <meta name="description" content={data.site.siteMetadata.description} />
        <meta name="theme-color" content="#D90E5D" />
        <meta property="og:type" content="business.business" />
        <meta property="og:title" content={data.site.siteMetadata.title} />
        <meta property="og:url" content="/" />
        <meta property="og:image" content={`img/og-image.jpg`} />
      </Helmet>
      <SiteHeader siteTitle={data.site.siteMetadata.title} />
      <div>
        <main>{children}</main>
        <footer>don't forget to eat your veggies</footer>
      </div>
      </>
    </ThemeProvider>
  );
};

Layout.propTypes = {
  children: PropTypes.node.isRequired
};

export default Layout;
