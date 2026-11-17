import * as SwitchPrimitives from "@rn-primitives/switch";
import { Platform } from "react-native";
import { cn } from "../../lib/utils";

function Switch({ className, ...props }: SwitchPrimitives.RootProps) {
  return (
    <SwitchPrimitives.Root
      className={cn(
        "flex h-7 w-12 shrink-0 flex-row items-center rounded-full border border-transparent px-0.5",
        Platform.select({
          web: "focus-visible:ring-ring/50 cursor-pointer outline-none transition-all focus-visible:ring-[3px] disabled:cursor-not-allowed",
        }),
        props.checked ? "bg-primary" : "bg-input",
        props.disabled && "opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "h-6 w-6 rounded-full shadow-sm shadow-black/30",
          Platform.select({ web: "pointer-events-none transition-transform" }),
          props.checked ? "bg-primary-foreground translate-x-5" : "bg-foreground/80 translate-x-0",
        )}
      />
    </SwitchPrimitives.Root>
  );
}

export { Switch };
