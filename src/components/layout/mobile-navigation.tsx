"use client";

import {
  isNavigationItemActive,
  mobileMoreNavigationItems,
  mobilePrimaryNavigationItems,
  type NavigationItem,
} from "@/components/layout/navigation-config";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type MobileNavigationLinkProps = {
  item: NavigationItem;
  onNavigate?: () => void;
  pathname: string;
};

function MobileNavigationLink({ item, onNavigate, pathname }: MobileNavigationLinkProps) {
  const isActive = isNavigationItemActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex min-h-16 flex-col items-center justify-center gap-1 rounded-control px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
      href={item.href}
      onClick={onNavigate}
    >
      <Icon aria-hidden="true" className="size-5" />
      <span>{item.label}</span>
    </Link>
  );
}

function MoreNavigationLink({ item, onNavigate, pathname }: MobileNavigationLinkProps) {
  const isActive = isNavigationItemActive(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-control px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isActive ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted",
      )}
      href={item.href}
      onClick={onNavigate}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

function MobileNavigation() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const pathname = usePathname();
  const isMoreActive = mobileMoreNavigationItems.some((item) =>
    isNavigationItemActive(pathname, item.href),
  );

  function openMoreMenu() {
    if (!dialogRef.current?.open) {
      dialogRef.current?.showModal();
      setIsMoreMenuOpen(true);
    }
  }

  function closeMoreMenu() {
    dialogRef.current?.close();
  }

  useEffect(() => {
    const desktopMediaQuery = window.matchMedia("(min-width: 64rem)");

    function closeMenuOnDesktop() {
      if (desktopMediaQuery.matches && dialogRef.current?.open) {
        dialogRef.current.close();
      }
    }

    closeMenuOnDesktop();
    desktopMediaQuery.addEventListener("change", closeMenuOnDesktop);

    return () => desktopMediaQuery.removeEventListener("change", closeMenuOnDesktop);
  }, []);

  return (
    <>
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgb(15_23_42/0.08)] backdrop-blur lg:hidden"
      >
        <div className="grid grid-cols-5 gap-1">
          {mobilePrimaryNavigationItems.map((item) => (
            <MobileNavigationLink item={item} key={item.href} pathname={pathname} />
          ))}
          <button
            aria-controls="mobile-navigation-dialog"
            aria-expanded={isMoreMenuOpen}
            aria-haspopup="dialog"
            className={cn(
        "flex min-h-16 flex-col items-center justify-center gap-1 rounded-control px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isMoreActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            onClick={openMoreMenu}
            type="button"
          >
            <Menu aria-hidden="true" className="size-5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      <dialog
        aria-labelledby="mobile-navigation-title"
        aria-modal="true"
        className="m-auto w-[calc(100%_-_2rem)] max-w-sm rounded-panel border border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-foreground/35 lg:hidden"
        id="mobile-navigation-dialog"
        onClose={() => setIsMoreMenuOpen(false)}
        ref={dialogRef}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold" id="mobile-navigation-title">
            More
          </h2>
          <button
            aria-label="Close more navigation"
            className="rounded-control p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={closeMoreMenu}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
        <nav aria-label="More navigation" className="p-3">
          <div className="space-y-1">
            {mobileMoreNavigationItems.map((item) => (
              <MoreNavigationLink
                item={item}
                key={item.href}
                onNavigate={closeMoreMenu}
                pathname={pathname}
              />
            ))}
          </div>
        </nav>
      </dialog>
    </>
  );
}

export { MobileNavigation };
