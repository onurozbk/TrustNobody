import { cva, type VariantProps } from "class-variance-authority";
import { View, type ViewProps } from "react-native";
import { cn } from "../../lib/utils";
import { TextClassContext } from "./text";

const badgeVariants = cva("shrink-0 flex-row items-center justify-center gap-1 overflow-hidden rounded-full border px-2.5 py-0.5", {
  variants: {
    variant: {
      default: "bg-primary border-transparent",
      secondary: "bg-secondary border-transparent",
      destructive: "bg-destructive/15 border-destructive/30",
      outline: "border-border",
      night: "bg-night/15 border-night/30",
      day: "bg-day/15 border-day/30",
      vote: "bg-vote/15 border-vote/30",
      success: "bg-success/15 border-success/30",
      blood: "bg-primary/15 border-primary/30",
    },
  },
  defaultVariants: { variant: "default" },
});

const badgeTextVariants = cva("text-xs font-semibold", {
  variants: {
    variant: {
      default: "text-primary-foreground",
      secondary: "text-secondary-foreground",
      destructive: "text-destructive",
      outline: "text-foreground",
      night: "text-night",
      day: "text-day",
      vote: "text-vote",
      success: "text-success",
      blood: "text-primary",
    },
  },
  defaultVariants: { variant: "default" },
});

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

function Badge({ className, variant, ...props }: ViewProps & VariantProps<typeof badgeVariants>) {
  return (
    <TextClassContext.Provider value={badgeTextVariants({ variant })}>
      <View className={cn(badgeVariants({ variant }), className)} {...props} />
    </TextClassContext.Provider>
  );
}

export { Badge, badgeTextVariants, badgeVariants };
export type { BadgeVariant };
