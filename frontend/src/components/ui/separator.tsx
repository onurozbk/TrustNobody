import { View, type ViewProps } from "react-native";
import { cn } from "../../lib/utils";

function Separator({ className, orientation = "horizontal", ...props }: ViewProps & { orientation?: "horizontal" | "vertical" }) {
  return (
    <View
      role="separator"
      className={cn("bg-border shrink-0", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className)}
      {...props}
    />
  );
}

export { Separator };
