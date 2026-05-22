import { cn } from "@/utils/cn";

export const BrowserComponent: React.FC<{
  children?: React.ReactNode;
  className?: string;
  url?: string;
}> = ({ className, children, url = "yourwebsite.com/admin/sales" }) => (
  <div
    className={cn(
      "flex flex-col text-sm dark:text-neutral-400 text-neutral-950 rounded-lg overflow-hidden w-full dark:bg-neutral-950 bg-white",
      className,
    )}
  >
    <div
      className={
        "border-b border-inherit flex items-center justify-between w-full py-1 px-3 bg-inherit shrink-0"
      }
    >
      <div className={"flex gap-1.5"}>
        <div
          className={"w-2 h-2 rounded-full dark:bg-neutral-800 bg-neutral-300"}
        />
        <div
          className={"w-2 h-2 rounded-full dark:bg-neutral-800 bg-neutral-300"}
        />
        <div
          className={"w-2 h-2 rounded-full dark:bg-neutral-800 bg-neutral-300"}
        />
      </div>
      <div
        className={
          "border border-inherit rounded flex gap-1.5 px-1.5 py-0.5 w-fit min-w-1/3"
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="2"
          className={"dark:stroke-neutral-700 stroke-neutral-300 w-3 max-w-4"}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span
          className={
            "text-xs font-[family-name:var(--font-inter)] flex items-center justify-center"
          }
        >
          {url}
        </span>
      </div>
      <div />
    </div>
    <div className={"w-full"}>{children}</div>
  </div>
);
