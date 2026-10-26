/* Runs inside the page (see export-standalone.ts). Plain JS so no bundler helpers leak in. */
(() => {
    const doc = document;
    // Next.js runtime, preloads and RSC payloads are not needed in a static file.
    doc.querySelectorAll('script:not([type="application/ld+json"]), link[rel="preload"], link[rel="modulepreload"], link[rel="expect"], next-route-announcer, nextjs-portal').forEach((n) => n.remove());
    const stylesheets = [...doc.querySelectorAll('link[rel="stylesheet"]')].map((l) => {
      const href = l.getAttribute("href");
      l.replaceWith(Object.assign(doc.createElement("style"), { textContent: `/*__CSS__${href}*/` }));
      return href;
    });
    doc.querySelectorAll('link[rel="icon"], link[rel="manifest"], link[rel="apple-touch-icon"]').forEach((n) => n.remove());

    // Keep only the first hero scene inline; the runtime adds the rest.
    doc.querySelectorAll(".hero-scene").forEach((s, i) => {
      if (i === 0) s.classList.add("is-active");
      else s.remove();
    });
    // Let scroll reveals play again in the file.
    doc.querySelectorAll(".is-visible").forEach((n) => n.classList.remove("is-visible"));
    const welcome = doc.getElementById("dn-welcome");
    welcome?.removeAttribute("open");

    // Anchors for sections that stand in for other pages.
    const label = (id) => doc.querySelector(`[aria-labelledby="${id}"]`);
    label("f-title")?.setAttribute("id", "plan");
    label("e-title")?.setAttribute("id", "experiences");
    label("i-title")?.setAttribute("id", "stories");
    doc.querySelector('[aria-label="Offers and partnerships"]')?.setAttribute("id", "partners");

    // Internal links: map to sections on this page, or mark as full-site pages.
    const toAnchor = (p) => {
      const [pathAndQuery, hash] = p.split("#");
      const pathOnly = pathAndQuery.split("?")[0];
      if (pathOnly === "" || pathOnly === "/") return hash ? `#${hash}` : "#main";
      if (pathOnly === "/destinations") return "#find-your-nigeria";
      if (pathOnly === "/discover" || pathOnly === "/states") return "#map";
      if (pathOnly === "/experiences") return "#experiences";
      if (pathOnly === "/plan") return "#plan";
      if (pathOnly === "/invest") return "#invest";
      if (pathOnly === "/national-tourism-week") return hash === "register-interest" ? "#newsletter" : "#ntw";
      if (pathOnly === "/stories") return "#stories";
      if (pathOnly === "/offers" || pathOnly === "/partners") return "#partners";
      return null;
    };
    doc.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href");
      if (!href.startsWith("/")) return;
      const anchor = toAnchor(href);
      if (anchor) a.setAttribute("href", anchor);
      else {
        a.setAttribute("data-full-site-path", href);
        a.setAttribute("href", "#");
      }
    });
    const imgs = [...new Set([...doc.querySelectorAll("img[src]")].map((i) => i.getAttribute("src")).filter((s) => s.startsWith("/")))];
    return { html: "<!doctype html>\n" + doc.documentElement.outerHTML, stylesheets, imgs };
})()
