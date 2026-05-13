"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { FC } from "react";

type MenuItemsProps = {
  onMenuItemClickAction?: () => void;
};

export const MenuItems: FC<MenuItemsProps> = ({ onMenuItemClickAction }) => {
  const pathname = usePathname();
  const router = useRouter();

  const scrollTo = (id: string) => {
    if (pathname === "/") {
      const el = document.getElementById(id);
      if (!el) return;

      el.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      window.history.pushState(null, "", `/#${id}`);
    } else {
      router.push(`/#${id}`);
    }

    if (onMenuItemClickAction) {
      onMenuItemClickAction();
    }
  };

  return (
    <ul className={"flex lg:flex-row flex-col"}>
      <li>
        <Link
          href="/#events_section"
          className={
            "flex xl:px-6 lg:px-2 px-6 py-3 2xl:text-xl xl:text-lg lg:text-base text-lg font-semibold hover:text-accent"
          }
          onClick={(e) => {
            e.preventDefault();
            scrollTo("events_section");
            if (onMenuItemClickAction) {
              onMenuItemClickAction();
            }
          }}
        >
          Мероприятия
        </Link>
      </li>
      <li>
        <Link
          href="/#pilots_section"
          className={
            "flex xl:px-6 lg:px-2 px-6 py-3 2xl:text-xl xl:text-lg lg:text-base text-lg font-semibold hover:text-accent"
          }
          onClick={(e) => {
            e.preventDefault();
            scrollTo("pilots_section");
            if (onMenuItemClickAction) {
              onMenuItemClickAction();
            }
          }}
        >
          Пилоты
        </Link>
      </li>
      <li>
        <Link
          href="/#media_section"
          className={
            "flex xl:px-6 lg:px-2 px-6 py-3 2xl:text-xl xl:text-lg lg:text-base text-lg font-semibold hover:text-accent"
          }
          onClick={(e) => {
            e.preventDefault();
            scrollTo("media_section");
            if (onMenuItemClickAction) {
              onMenuItemClickAction();
            }
          }}
        >
          Медиа
        </Link>
      </li>
      <li>
        <Link
          href="/#partners_section"
          className={
            "flex xl:px-6 lg:px-2 px-6 py-3 2xl:text-xl xl:text-lg lg:text-base text-lg font-semibold hover:text-accent"
          }
          onClick={(e) => {
            e.preventDefault();
            scrollTo("partners_section");
            if (onMenuItemClickAction) {
              onMenuItemClickAction();
            }
          }}
        >
          Партнеры
        </Link>
      </li>
      <li>
        <Link
          href="/documents"
          className={
            "flex xl:px-6 lg:px-2 px-6 py-3 2xl:text-xl xl:text-lg lg:text-base text-lg font-semibold hover:text-accent"
          }
          onClick={() => {
            if (onMenuItemClickAction) {
              onMenuItemClickAction();
            }
          }}
        >
          Документация
        </Link>
      </li>
    </ul>
  );
};
