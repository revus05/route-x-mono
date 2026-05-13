"use client";

import { Icons } from "components/ui/Icons";
import Image from "next/image";
import Link from "next/link";
import { type FC, useRef, useState } from "react";
import type { Pilot } from "types/pilot";

type PilotsPageProps = {
  pilots: Pilot[];
};

export const PilotsPage: FC<PilotsPageProps> = ({ pilots }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [lastNameSearch, setLastNameSearch] = useState("");

  const filteredPilots = pilots.filter((pilot) =>
    pilot.lastName.toLowerCase().includes(lastNameSearch.toLowerCase()),
  );

  return (
    <div
      className={
        "md:w-200 w-full md:px-0 px-2 mx-auto flex flex-col gap-4 items-center"
      }
    >
      <button
        className={
          "px-8 py-3 bg-black/50 backdrop-blur-lg rounded-2xl flex gap-4 items-center cursor-text w-full"
        }
        onClick={() => inputRef.current?.focus()}
        type={"button"}
      >
        <Icons.search />
        <input
          ref={inputRef}
          type="text"
          placeholder="Поиск по фамилии"
          onChange={(e) => setLastNameSearch(e.target.value)}
          className={"whitespace-nowrap outline-none w-full"}
        />
      </button>
      {filteredPilots.map((pilot) => (
        <Link
          href={`/pilots/${pilot.id}`}
          key={pilot.id}
          className={
            "flex gap-8 bg-black/50 backdrop-blur-lg rounded-3xl w-full"
          }
        >
          <Image
            src={pilot.image}
            alt={`${pilot.firstName} ${pilot.lastName}`}
            width={650}
            height={800}
            className={"h-32 w-auto rounded-l-3xl"}
          />
          <div className={"flex flex-col gap-2 py-6"}>
            <span className={"text-2xl text-white/70"}>{pilot.firstName}</span>
            <span className={"text-2xl font-bold"}>{pilot.lastName}</span>
          </div>
        </Link>
      ))}
    </div>
  );
};
