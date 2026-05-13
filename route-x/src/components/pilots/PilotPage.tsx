"use client";

import { Tabs } from "components/ui/Tabs";
import { cn } from "lib/cn";
import Image from "next/image";
import { type FC, useState } from "react";
import type { Car } from "types/car";
import type { Pilot } from "types/pilot";

type PilotPageProps = {
  pilot: Pilot;
  cars: Car[];
};

export const PilotPage: FC<PilotPageProps> = ({ pilot, cars }) => {
  const [tab, setTab] = useState<"about" | "awards">("about");
  const [showMore, setShowMore] = useState(false);

  const handleSetTab = (tab: "about" | "awards") => {
    setTab(tab);
    setShowMore(false);
  };

  return (
    <div
      className={
        "2xl:w-7xl 2xl:px-0 px-2 w-full mx-auto grid md:grid-cols-[1fr_2fr] grid-cols-1 gap-8"
      }
    >
      <div className={"flex flex-col gap-4 min-w-0"}>
        <Image
          src={pilot.image}
          alt={`${pilot.firstName} ${pilot.lastName}`}
          width={650}
          height={800}
          className={"h-120 rounded-3xl w-full object-cover"}
        />
        <div className={"flex gap-4 items-center w-full"}>
          <h2
            className={
              "font-semibold text-[32px] text-accent whitespace-nowrap"
            }
          >
            {pilot.raceNumber}
          </h2>
          <div className={"h-16 w-px bg-white/70 rotate-15 shrink-0"} />
          <h1 className={"text-3xl truncate font-semibold min-w-0"}>
            {pilot.firstName} {pilot.lastName}
          </h1>
        </div>
        <div className={"grid grid-cols-2 gap-y-1"}>
          <span className={"text-white/70"}>Возраст</span>
          <span>{pilot.age}</span>
          <span className={"text-white/70"}>Опыт</span>
          <span>{pilot.experience}</span>
        </div>
        <div className={"flex flex-col gap-4 max-w-full"}>
          <Tabs
            setTab={handleSetTab}
            tab={tab}
            tabs={[
              { value: "about", label: "О себе" },
              { value: "awards", label: "Достижения" },
            ]}
          />
          {tab === "about" && (
            <span
              className={cn(
                "text-white/70 w-full",
                !showMore && "line-clamp-3",
              )}
            >
              {pilot.about}
            </span>
          )}
          {tab === "awards" && (
            <span
              className={cn(
                "text-white/70 w-full",
                !showMore && "line-clamp-3",
              )}
            >
              {pilot.awards}
            </span>
          )}
          <button onClick={() => setShowMore((prev) => !prev)} type="button">
            {showMore ? "Свернуть" : "Читать дальше"}
          </button>
        </div>
      </div>
      <div className={"flex flex-col gap-8 grow"}>
        {cars.length === 0 && (
            <span className={"text-center"}>У этого пилота нет авто</span>
        )}
        {cars.map((car) => (
            <div key={car.id} className={"flex flex-col gap-2"}>
              <Image
                  src={car.image}
                  alt={car.title}
                  width={1200}
                  height={1200 / 1.5}
                  className={"rounded-3xl md:h-120 object-cover"}
              />
              <h2 className={"font-semibold text-[32px]"}>{car.title}</h2>
              <div
                  className={
                    "grid md:grid-cols-2 grid-cols-[1fr_auto] max-w-lg gap-y-1"
                  }
              >
                <span className={"text-white/70"}>Привод</span>
                <span className={"md:justify-self-start justify-self-end"}>
                {car.drive}
              </span>
                <span className={"text-white/70"}>Рабочий объем (л)</span>
                <span className={"md:justify-self-start justify-self-end"}>
                {car.engineDisplacement}
              </span>
                <span className={"text-white/70"}>Крутящий момент</span>
                <span className={"md:justify-self-start justify-self-end"}>
                {car.torque}
              </span>
                <span className={"text-white/70"}>Мощность</span>
                <span className={"md:justify-self-start justify-self-end"}>
                {car.power}
              </span>
                <span className={"text-white/70"}>Вес (пустой)</span>
                <span className={"md:justify-self-start justify-self-end"}>
                {car.weight}
              </span>
              </div>
            </div>
        ))}
      </div>
    </div>
  );
};
