import { useEffect, useState } from "react";

const getEventsPerPage = () => {
  if (window.matchMedia("(min-width: 1024px)").matches) return 3;
  if (window.matchMedia("(min-width: 768px)").matches) return 2;
  return 1;
};

export const useEventsPerPage = () => {
  const [count, setCount] = useState(1);

  useEffect(() => {
    const update = () => setCount(getEventsPerPage());

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
};
