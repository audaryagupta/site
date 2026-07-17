import { cx } from "@/lib/utils";

export function Container({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("mx-auto w-full max-w-container px-5 sm:px-8", className)}>
      {children}
    </div>
  );
}
