import { RegisterButton } from "components/RegisterButton";
import Image from "next/image";
import heroCar from "../../public/hero-car.png";
import heroGraffiti from "../../public/hero-graffiti.png";

export const HeroSection = () => {
  return (
    <div
      className={
        "2xl:w-360 w-full 2xl:px-0 px-2 mx-auto xl:min-h-90 lg:min-h-80 md:min-h-70 sm:min-h-60 min-h-50 xl:flex xl:items-center xl:py-0 sm:py-20 pb-20 pt-4 relative"
      }
    >
      <div className={"flex flex-col gap-6 md:w-161.25 w-full"}>
        <div className={"flex flex-col gap-2 2xl:px-0 px-5"}>
          <div className={"w-fit h-fit"}>
            <h1 className={"xl:text-[40px] text-[20px] font-bold"}>
              Точность. Скорость. Контроль.
            </h1>
          </div>
          <span className={"text-shadow-black text-shadow-md"}>
            Автоспорт, где решает мастерство управления и мгновенная реакция.
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RegisterButton />
        </div>
      </div>
      <Image
        aria-hidden
        src={heroGraffiti.src}
        alt={"graffiti"}
        height={heroGraffiti.height}
        width={heroGraffiti.width}
        className={
          "absolute 2xl:-left-64 md:-left-42 -left-24 top-[70%] -translate-y-1/2 select-none -z-1"
        }
      />
      <Image
        src={heroCar.src}
        alt={"Mazda rx 8"}
        height={heroCar.height}
        width={heroCar.width}
        className={
          "absolute lg:-right-87.5 sm:-right-70 -right-48 top-1/2 sm:-translate-y-1/2 -translate-y-1/3 select-none -z-1"
        }
      />
    </div>
  );
};
