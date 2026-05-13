import { PilotsPage } from "components/pilots/PilotsPage";
import type { Pilot } from "types/pilot";

export default async function Pilots() {
  async function fetchPilots(): Promise<Pilot[]> {
    const res = await fetch(`${process.env.GOOGLE_SHEET_URL}Пилоты`, {
      next: { revalidate: 30 }, // 30 sec
    });

    if (!res.ok) {
      throw new Error("Failed to fetch pilots");
    }

    return res.json();
  }

  const pilots = await fetchPilots();

  if (pilots.length === 0) {
    return <span>Что-то пошло не так</span>;
  }

  return <PilotsPage pilots={pilots} />;
}
