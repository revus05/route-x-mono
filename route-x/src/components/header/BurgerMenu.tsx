"use client";

import { Contacts } from "components/header/Contacts";
import { MenuItems } from "components/header/MenuItems";
import { cn } from "lib/cn";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icons } from "../ui/Icons";

export const BurgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const handleOpenBurgerMenu = () => {
    setIsOpen(true);
  };

  const handleCloseBurgerMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    window.addEventListener("resize", handleCloseBurgerMenu);
    return () => window.removeEventListener("resize", handleCloseBurgerMenu);
  }, [mounted, handleCloseBurgerMenu]);

  useEffect(() => {
    if (!mounted) return;

    if (isOpen) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen, mounted]);

  return (
    <>
      <button
        className="justify-self-end p-4 cursor-pointer lg:hidden block"
        onClick={handleOpenBurgerMenu}
        type="button"
      >
        <Icons.burgerMenu />
      </button>

      {mounted &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Close menu"
              onClick={handleCloseBurgerMenu}
              className={cn(
                "fixed inset-0 z-40 bg-black/60 transition-opacity",
                isOpen
                  ? "opacity-100 pointer-events-auto"
                  : "opacity-0 pointer-events-none",
              )}
            />
            <div
              className={cn(
                "lg:hidden fixed top-0 right-0 h-screen w-[320px] bg-background z-50 transition-transform",
                isOpen ? "translate-x-0" : "translate-x-full",
              )}
            >
              <button
                onClick={handleCloseBurgerMenu}
                type="button"
                className={"p-4"}
              >
                <Icons.cross />
              </button>
              <nav>
                <MenuItems onMenuItemClickAction={handleCloseBurgerMenu} />
              </nav>
              <div className={"p-4 flex flex-col gap-4"}>
                <Contacts />
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
};
