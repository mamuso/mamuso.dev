import * as React from "react";

export default function Fathom({ siteId }) {
  React.useEffect(() => {
    const tracker = window.document.createElement("script");
    const firstScript = window.document.getElementsByTagName("script")[0];
    tracker.defer = true;
    tracker.setAttribute("site", siteId);
    tracker.setAttribute("spa", "auto");
    tracker.setAttribute("excluded-domains", "localhost,now.sh");
    tracker.setAttribute("included-domains", "mamuso.dev");
    tracker.src = "https://cdn.usefathom.com/script.js";
    firstScript.parentNode.insertBefore(tracker, firstScript);
  }, []);

  return null;
}
