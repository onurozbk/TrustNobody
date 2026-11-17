import * as Slot from "@rn-primitives/slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { Platform, Text as RNText } from "react-native";
import { cn } from "../../lib/utils";

const textVariants = cva(cn("text-foreground text-base", Platform.select({ web: "select-text" })), {
  variants: {
    variant: {
      default: "",
      h1: "text-4xl font-extrabold tracking-tight",
      h2: "text-3xl font-bold tracking-tight",
      h3: "text-2xl font-bold tracking-tight",
      h4: "text-xl font-semibold tracking-tight",
      p: "leading-6",
      lead: "text-muted-foreground text-lg leading-7",
      large: "text-lg font-semibold",
      small: "text-sm font-medium leading-none",
      muted: "text-muted-foreground text-sm leading-5",
      overline: "text-muted-foreground text-xs font-semibold uppercase tracking-widest",
    },
  },
  defaultVariants: { variant: "default" },
});

type TextVariantProps = VariantProps<typeof textVariants>;

const HEADINGS = new Set(["h1", "h2", "h3", "h4"]);

/** Ebeveyn bileşenin (Button, Card…) içindeki yazılara stil aktarması için. */
const TextClassContext = React.createContext<string | undefined>(undefined);

function Text({
  className,
  asChild = false,
  variant = "default",
  ...props
}: React.ComponentProps<typeof RNText> & TextVariantProps & { asChild?: boolean }) {
  const textClass = React.useContext(TextClassContext);
  const Component = asChild ? Slot.Text : RNText;
  return (
    <Component
      className={cn(textVariants({ variant }), textClass, className)}
      role={variant && HEADINGS.has(variant) ? "heading" : undefined}
      {...props}
    />
  );
}

export { Text, TextClassContext, textVariants };
