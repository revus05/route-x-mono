import Image from "next/image";
import Link from "next/link";
import a1logo from "../../../public/a1-logo.svg";
import instagramLogo from "../../../public/instagram-logo.svg";
import telegramLogo from "../../../public/telegram-logo.svg";

export const Contacts = () => {
  return (
    <>
      <div
        className={"flex items-center gap-2 font-(family-name:--font-roboto)"}
      >
        <Image src={a1logo} alt="A1 Logo" />
        <Link
          href="tel:+375259253938"
          className="whitespace-nowrap hover:underline"
        >
          +375 25 925-39-38
        </Link>
        <span>Артур</span>
      </div>
      <div
        className={"flex items-center gap-2 font-(family-name:--font-roboto)"}
      >
        <Image src={instagramLogo} alt={"Instagram logo"} />
        <Link
          href="https://www.instagram.com/gymkhana_route_race"
          target="_blank"
          className="whitespace-nowrap hover:underline"
        >
          @gymkhana_route_x_race
        </Link>
      </div>
      <div
        className={"flex items-center gap-2 font-(family-name:--font-roboto)"}
      >
        <Image src={telegramLogo} alt={"Telegram logo"} />
        <Link
          href="https://t.me/fgbffhgddf"
          target="_blank"
          className="whitespace-nowrap hover:underline"
        >
          GYMKHANA Route X Race
        </Link>
      </div>
    </>
  );
};
