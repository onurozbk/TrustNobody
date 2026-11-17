import { View, type ViewProps } from "react-native";
import { cn } from "../../lib/utils";

/** 0-100 arası dolum çubuğu. */
function Progress({
  value,
  className,
  indicatorClassName,
  color,
  ...props
}: ViewProps & { value: number; indicatorClassName?: string; color?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn("bg-secondary relative h-2 w-full overflow-hidden rounded-full", className)}
      {...props}
    >
      <View
        className={cn("bg-primary h-full rounded-full", indicatorClassName)}
        style={{ width: `${pct}%`, ...(color ? { backgroundColor: color } : null) }}
      />
    </View>
  );
}

export { Progress };
