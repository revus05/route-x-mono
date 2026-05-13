"use client";

import { BurgerMenu } from "components/header/BurgerMenu";
import { Contacts } from "components/header/Contacts";
import { MenuItems } from "components/header/MenuItems";
import Image from "next/image";
import Link from "next/link";
import logo from "../../../public/logo.svg";

export const Header = () => {
  const scrollToTop = () => {
    const el = document.body;
    if (!el) return;

    el.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <header className={"sm:mt-4 mt-2 mb-2 relative h-24"}>
      <div className="z-20 fixed 2xl:left-1/2 2xl:-translate-x-1/2 bg-black/50 rounded-2xl backdrop-blur-lg 2xl:w-360 inset-x-2 sm:inset-x-8 2xl:inset-x-auto h-24 mx-auto grid lg:grid-cols-[200px_1fr_auto] sm:grid-cols-[250px_1fr] grid-cols-[200px_auto] items-center xl:px-8 px-4">
        <Link href="/" onClick={scrollToTop}>
          <Image
            src={logo.src}
            alt="logo"
            width={logo.width}
            height={logo.height}
          />
        </Link>
        <nav className={"lg:block hidden justify-self-center"}>
          <MenuItems />
        </nav>
        <div className={"lg:flex hidden justify-self-end flex-col gap-0.5"}>
          <Contacts />
        </div>
        <BurgerMenu />
      </div>
    </header>
  );
};
