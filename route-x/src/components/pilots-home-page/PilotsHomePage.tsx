import { PilotsButton } from "components/pilots-home-page/PilotsButton";
import Image from "next/image";
import graffitiArrow from "../../../public/graffiti-arrow.svg";
import graffitiComposition from "../../../public/graffiti-composition.png";
import pilots from "../../../public/pilots.png";
import pilotsGraffiti from "../../../public/pilots-graffiti.svg";
import pilotsGraffitiRx from "../../../public/pilots-graffiti-rx.svg";
import pilotsSectionUnderline from "../../../public/pilots-section-underline.svg";
import pilotsUnderline from "../../../public/pilots-underline.svg";
import pilotsX from "../../../public/pilots-x.svg";

export const PilotsHomePage = () => {
  return (
    <section
      className="min-h-125 flex items-center scroll-mt-36"
      id="pilots_section"
    >
      <div className={"lg:w-5xl w-full px-2 mx-auto relative"}>
        <Image
          src={pilotsGraffiti}
          alt="graffiti"
          className="absolute -top-64 -left-32 -z-10 select-none"
        />
        <Image
          src={pilotsGraffitiRx}
          alt="graffiti"
          className="absolute top-8 -left-64 -z-10 select-none"
        />
        <Image
          src={pilotsX}
          alt="graffiti"
          className="absolute -top-16 -right-32 -z-10 select-none"
        />
        <Image
          src={pilotsSectionUnderline}
          alt="graffiti"
          className="absolute -bottom-96 -right-64 -z-10 select-none"
        />
        <div className={"flex flex-col gap-6 relative"}>
          <div className={"flex flex-col gap-4"}>
            <h2 className={"text-[40px] font-bold"}>Команда профи</h2>
            <span
              className={"md:w-150 w-full text-shadow-black text-shadow-md"}
            >
              С пилотом вы получите не просто рекламу, а комплексный подход и
              индивидуальное внимание к потребностям вашего бренда. Повышение
              статуса среди конкурентов, узнаваемость, фото, видео, посты в
              социальных сетях, интервью и прочее. Там будет кнопка чтоб перейти
              на список всех пилотов
            </span>
          </div>
          <PilotsButton />
          <Image
            src={pilotsUnderline}
            alt="decorative graffiti"
            className="absolute left-0 -bottom-16"
          />
        </div>
        <Image
          src={graffitiComposition.src}
          alt={"pilot"}
          width={graffitiComposition.width}
          height={graffitiComposition.height}
          className={"absolute left-0 bottom-0 -z-10 select-none"}
        />
        <Image
          src={graffitiArrow.src}
          alt={"pilot"}
          width={graffitiArrow.width}
          height={graffitiArrow.height}
          className={
            "absolute xl:right-full lg:-left-32 left-0 -top-1/2 -z-10 select-none"
          }
        />
        <Image
          src={pilots.src}
          alt={"pilots"}
          width={pilots.width}
          height={pilots.height}
          className={
            "absolute xl:-right-32 right-0 top-1/2 -translate-y-1/2 -z-10 select-none"
          }
        />
      </div>
    </section>
  );
};
