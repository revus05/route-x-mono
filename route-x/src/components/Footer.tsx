"use client";

import { Contacts } from "components/header/Contacts";
import Image from "next/image";
import Link from "next/link";
import logo from "../../public/logo.svg";

export const Footer = () => {
  return (
    <footer className={"bg-black/50 backdrop-blur-lg py-6"}>
      <div
        className={
          "2xl:w-360 w-full 2xl:px-0 px-2 mx-auto grid md:grid-cols-3 grid-cols-1 gap-8"
        }
      >
        <div className="flex flex-col gap-4 max-w-125">
          <Link href="/privacy-policy" className="text-white/70">
            Политика конфиденциальности
          </Link>
          <span className="text-white/70">
            По вопросам спонсорства, размещения рекламы, аккредитации,
            медиаматериалов и интервью:{" "}
            <Link
              href="mailto:routestarsby@gmail.com"
              className="text-white hover:underline"
            >
              routestarsby@gmail.com
            </Link>
          </span>
          <span className="text-white/70">
            ©2026 <span className="text-white">gymkhanarace.by</span>. Все права
            защищены
          </span>
        </div>
        <Link
          href="#"
          className="justify-self-center md:order-0 -order-1 flex justify-center h-fit"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          <Image
            src={logo.src}
            alt="logo"
            width={logo.width}
            height={logo.height}
            className="max-w-[320px]"
          />
        </Link>
        <div
          className={
            "flex flex-col gap-4 md:justify-self-end [&_img]:size-8 text-lg"
          }
        >
          <Contacts />
        </div>
      </div>
    </footer>
  );
};
