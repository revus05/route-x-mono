"use client";

import { Button } from "components/ui/Button";

export const PilotsButton = () => {
  return (
    <Button
      href="/pilots"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      Пилоты
    </Button>
  );
};
