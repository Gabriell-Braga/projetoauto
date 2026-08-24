"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Barra fina de 2px no topo durante transições de rota.
 * Liga no clique de qualquer link interno e desliga quando a rota muda.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);

  // a rota mudou: a navegação terminou
  useEffect(() => {
    setActive(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (destination.href === window.location.href) return;

      setActive(true);
    }

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", () => setActive(true));
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  if (!active) return null;

  return (
    <div
      role="progressbar"
      aria-label="Carregando página"
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden"
    >
      <div
        className="h-full w-full bg-accent"
        style={{ animation: "cockpit-progress 1.1s ease-in-out infinite" }}
      />
    </div>
  );
}
