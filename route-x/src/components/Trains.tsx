"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import trainsRacetrack from "../../public/trains-racetrack.svg";

export const Trains = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isVisible, setIsVisible] = useState(false);

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        void videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );

    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <section>
      <div
        className={
          "lg:w-fit w-full lg:px-0 px-2 mx-auto flex xl:gap-16 gap-12 flex-col relative"
        }
      >
        <div className={"h-px w-full bg-accent "} />
        <div className={"flex flex-col gap-6 relative"}>
          <Image
            src={trainsRacetrack}
            alt="background"
            className="absolute -top-20 -right-40 -z-10 select-none"
          />
          <div ref={containerRef}>
            {isVisible && (
              <video
                ref={videoRef}
                src="/trains.mov"
                autoPlay
                muted
                loop
                playsInline
                className="rounded-2xl lg:w-214 w-full mx-auto"
                onClick={handleVideoClick}
              >
                Ваш браузер не поддерживает видео
              </video>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
