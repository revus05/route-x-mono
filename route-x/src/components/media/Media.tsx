import { MediaSwiper } from "components/media/swiper";
import { Button } from "components/ui/Button";
import Image from "next/image";
import type { Media } from "types/media";
import mediaBackgroundGraffiti from "../../../public/media-background-graffiti.png";

export const MediaSection = async () => {
  async function fetchMedia(): Promise<Media[]> {
    const res = await fetch(`${process.env.GOOGLE_SHEET_URL}Медиа`, {
      next: { revalidate: 30 }, // 30 sec
    });

    if (!res.ok) {
      throw new Error("Failed to fetch season events");
    }

    return res.json();
  }

  const media = await fetchMedia();

  return (
    <section id="media_section" className="scroll-mt-36">
      <div className="2xl:w-360 2xl:px-0 px-2 w-full mx-auto relative">
        <Image
          src={mediaBackgroundGraffiti.src}
          width={mediaBackgroundGraffiti.width}
          height={mediaBackgroundGraffiti.height}
          alt="graffiti"
          className="absolute lg:-bottom-90 md:-bottom-72 sm:-bottom-56 -bottom-48 -right-40 -z-10 select-none"
        />
        <div className="flex flex-col gap-6">
          <div className="flex sm:items-center items-start sm:justify-between sm:flex-row flex-col gap-6">
            <h2 className="font-bold text-[40px] text-2xl">Лучшие моменты</h2>
            <Button
              variant="ghost"
              endIcon="chevronRightTop"
              className="w-full sm:w-fit"
            >
              Смотреть все
            </Button>
          </div>
          <MediaSwiper media={media} />
        </div>
      </div>
    </section>
  );
};
