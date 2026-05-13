import { cn } from "lib/cn";
import {
  type ComponentProps,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type TabsProps<T extends string> = ComponentProps<"div"> & {
  tab: T;
  setTab: (tab: T) => void;
  tabs: readonly { label: string; value: T }[];
};

export const Tabs = <T extends string>({
  tab,
  setTab,
  tabs,
  className,
  ...props
}: TabsProps<T>) => {
  const [pressed, setPressed] = useState(false);
  const [visibleTab, setVisibleTab] = useState<T>(tab);

  const indicatorRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<T, HTMLButtonElement | null>>(
    {} as Record<T, HTMLButtonElement | null>,
  );

  const handleIndicatorPlacement = useCallback((newTab: T) => {
    setVisibleTab(newTab);

    const indicator = indicatorRef.current;
    const currentTab = tabRefs.current[newTab];

    if (!indicator || !currentTab) return;

    indicator.style.width = `${currentTab.offsetWidth}px`;
    indicator.style.transform = `translateX(${currentTab.offsetLeft}px)`;
  }, []);

  useEffect(() => {
    handleIndicatorPlacement(tab);
  }, [tab, handleIndicatorPlacement]);

  return (
    <div className={cn("relative flex gap-4", className)} {...props}>
      <div
        ref={indicatorRef}
        className="absolute inset-y-0 transition-[transform,width]"
      >
        <div
          className={cn(
            "w-full h-full bg-accent rounded-2xl transition-transform origin-center",
            pressed && "scale-[0.95]",
          )}
        />
      </div>

      {tabs.map(({ label, value }) => (
        <button
          key={value}
          ref={(el) => {
            tabRefs.current[value] = el;
          }}
          onClick={() => setTab(value)}
          onMouseEnter={() => handleIndicatorPlacement(value)}
          onMouseLeave={() => handleIndicatorPlacement(tab)}
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
          className={cn(
            "px-4 py-2 z-10 transition hover:text-black",
            visibleTab === value && "text-black",
          )}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  );
};
