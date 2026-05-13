"use client";

import { useMemo, useState } from "react";
import { FreeMode } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/free-mode";

import Image from "next/image";
import Link from "next/link";
import type { FC } from "react";
import type { Swiper as SwiperType } from "swiper";
import type { Media } from "types/media";

type MediaSwiperProps = {
  media: Media[];
};

export const MediaSwiper: FC<MediaSwiperProps> = ({ media }) => {
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const slidesPerView =
    typeof swiperInstance?.params.slidesPerView === "number"
      ? swiperInstance.params.slidesPerView
      : 1;

  const visibleIndicators = useMemo(() => {
    const indicatorsMedia = [...media];

    indicatorsMedia.splice(activeIndex + 1, slidesPerView - 1);
    return indicatorsMedia;
  }, [activeIndex, slidesPerView, media]);

  return (
    <div className="flex flex-col gap-4">
      <Swiper
        modules={[FreeMode]}
        spaceBetween={16}
        slidesPerView={1}
        grabCursor
        onSwiper={setSwiperInstance}
        onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
        breakpoints={{
          640: {
            slidesPerView: 2,
          },
          1024: {
            slidesPerView: 4,
          },
        }}
        className="2xl:w-360 w-full 2xl:px-0 px-2"
      >
        {media.map((mediaItem) => (
          <SwiperSlide key={mediaItem.id}>
            <Link
              href={mediaItem.link || "#"}
              target="_blank"
              className="block relative w-full aspect-353/404 rounded-2xl overflow-hidden"
            >
              <Image
                src={mediaItem.image}
                alt="media image"
                fill
                className="object-cover"
              />

              <div className="absolute inset-0 bg-media-fade flex items-end">
                <div className="flex flex-col gap-2 p-5 w-full">
                  <h3 className="text-xl font-bold line-clamp-2">
                    {mediaItem.title}
                  </h3>
                  <span className="text-white/70 font-medium text-sm line-clamp-1">
                    {mediaItem.car}
                  </span>
                </div>
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="flex justify-center items-center gap-2">
        {visibleIndicators.map((mediaItem, index) => (
          <button
            key={mediaItem.id}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              activeIndex + 1 === +mediaItem.id
                ? "bg-accent w-4"
                : "bg-gray-300 hover:bg-gray-400"
            }`}
            aria-label={`Перейти к слайду ${activeIndex + index + 1}`}
            type="button"
          />
        ))}
      </div>
    </div>
  );
};
