import Image from "next/image";
import Link from "next/link";
import type { Partner } from "types/partners";

export const Partners = async () => {
  async function fetchPartners(): Promise<Partner[]> {
    const res = await fetch(`${process.env.GOOGLE_SHEET_URL}Партнеры`, {
      next: { revalidate: 30 }, // 30 sec
    });

    if (!res.ok) {
      throw new Error("Failed to fetch season events");
    }

    return res.json();
  }

  const partners = await fetchPartners();

  return (
    <section id="partners_section" className="scroll-mt-36">
      <div
        className={"2xl:w-360 w-full 2xl:px-0 px-2 mx-auto flex flex-col gap-6"}
      >
        <h2 className="font-bold text-[40px] text-2xl">Партнеры</h2>
        <div className={"grid lg:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-6"}>
          {partners.map((partner) => (
            <Link
              href={partner.link || "#"}
              key={partner.id}
              className={
                "bg-black/50 backdrop-blur-lg rounded-2xl p-6 flex justify-center h-36"
              }
            >
              <Image
                src={partner.image}
                alt="partner"
                width={300}
                height={100}
                className={"object-contain"}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
