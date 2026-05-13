"use client";

import { useEventsPerPage } from "components/events/useEventsPerPage";
import { Button } from "components/ui/Button";
import { Tabs } from "components/ui/Tabs";
import { cn } from "lib/cn";
import Image from "next/image";
import { type FC, useState } from "react";
import type { Event } from "types/event";
import decorativeGraffiti1 from "../../../public/decorative-graffiti-1.svg";
import eventsHeadline from "../../../public/events-headline.svg";
import eventsStar from "../../../public/events-star.svg";

type EventsListProps = {
  events: Event[];
};

export const EventsList: FC<EventsListProps> = ({ events }) => {
  const EVENTS_PER_PAGE = useEventsPerPage();

  const [tab, setTab] = useState<"active" | "completed">("active");
  const [sliderOffset, setSliderOffset] = useState(0);

  const handleSetTab = (tab: "active" | "completed") => {
    setTab(tab);
    setSliderOffset(0);
  };

  const filteredEvents = events.filter((event) => event.status === tab);

  const handleSliderPrev = () => {
    setSliderOffset((prev) => prev - 1);
  };

  const handleSliderNext = () => {
    setSliderOffset((prev) => prev + 1);
  };

  const visibleEvents = filteredEvents.slice(
    sliderOffset,
    sliderOffset + EVENTS_PER_PAGE,
  );

  const prevDisabled = sliderOffset <= 0;
  const nextDisabled = sliderOffset >= filteredEvents.length - EVENTS_PER_PAGE;

  return (
    <div
      className={"2xl:w-7xl w-full 2xl:px-0 px-2 mx-auto flex flex-col gap-6"}
    >
      <div
        className={
          "grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-4 relative"
        }
      >
        <Image
          src={decorativeGraffiti1}
          alt={"decorative"}
          className="absolute -left-64 -top-40 -z-1 select-none"
        />
        <Image
          src={eventsHeadline}
          alt={"decorative"}
          className="absolute -left-24 -top-8 -z-1 select-none"
        />
        <Image
          src={eventsStar}
          alt={"decorative"}
          className="absolute -right-40 -top-24 -z-1 select-none"
        />
        <h2 className={"md:text-[48px] text-3xl font-semibold"}>Мероприятия</h2>
        <Tabs
          setTab={handleSetTab}
          tab={tab}
          tabs={[
            { value: "active", label: "Активные" },
            { value: "completed", label: "Завершенные" },
          ]}
          className={
            "justify-self-center sm:justify-self-end lg:justify-self-center h-fit self-center"
          }
        />
      </div>
      <div className={"flex md:gap-6 gap-3 items-center"}>
        <Button
          variant={"icon"}
          type={"button"}
          onClick={handleSliderPrev}
          className={"md:p-4 p-3"}
          endIcon={"chevronLeft"}
          disabled={prevDisabled}
        />
        <div
          className={
            "grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6 justify-between lg:mb-16 w-full"
          }
        >
          {visibleEvents.map((event, index) => (
            <div
              key={event.id}
              className={cn(
                "relative group lg:overflow-hidden aspect-650/800",
                index % 2 !== 0 && "lg:translate-y-16",
              )}
            >
              <Image
                src={event.image}
                alt="poster"
                width={405}
                height={514}
                className={"w-full rounded-2xl object-cover h-full"}
                loading="lazy"
              />
              <div
                className={
                  "bg-black/70 backdrop-blur-lg w-full flex flex-col gap-4 rounded-2xl lg:px-8 px-4 lg:py-5 py-3 lg:absolute lg:scale-75 lg:bottom-0 lg:translate-y-full group-hover:translate-y-0 transition-transform group-hover:scale-100"
                }
              >
                <div className={"flex flex-col gap-2"}>
                  <span className={"text-lg line-clamp-1"}>{event.title}</span>
                  <span>
                    <span className={"text-white/70"}>Дата проведения:</span>{" "}
                    {event.date}
                  </span>
                </div>
                <Button
                  variant={"hover"}
                  className={"w-full"}
                  href={`/events/${event.id}`}
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                >
                  Подробнее
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button
          variant={"icon"}
          type={"button"}
          onClick={handleSliderNext}
          className={"md:p-4 p-3"}
          endIcon={"chevronRight"}
          disabled={nextDisabled}
        />
      </div>
    </div>
  );
};
