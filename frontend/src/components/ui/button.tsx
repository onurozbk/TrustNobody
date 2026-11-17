import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { ActivityIndicator, Platform, Pressable } from "react-native";
import { cn } from "../../lib/utils";
import { colors } from "../../theme";
import { TextClassContext } from "./text";

const buttonVariants = cva(
  cn(
    "group shrink-0 flex-row items-center justify-center gap-2 rounded-xl",
    Platform.select({
      web: "focus-visible:ring-ring/50 cursor-pointer whitespace-nowrap outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none",
    }),
  ),
  {
    variants: {
      variant: {
        default: cn("bg-primary active:bg-primary/85 shadow-lg shadow-primary/30", Platform.select({ web: "hover:bg-primary/90" })),
        destructive: cn("bg-destructive/15 border-destructive/40 active:bg-destructive/25 border", Platform.select({ web: "hover:bg-destructive/25" })),
        outline: cn("border-border bg-background/40 active:bg-accent border", Platform.select({ web: "hover:bg-accent" })),
        secondary: cn("bg-secondary active:bg-secondary/70", Platform.select({ web: "hover:bg-secondary/80" })),
        ghost: cn("active:bg-accent", Platform.select({ web: "hover:bg-accent/60" })),
        link: "",
      },
      size: {
        default: "h-12 px-5",
        sm: "h-9 gap-1.5 rounded-lg px-3",
        lg: "h-14 px-6",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

const buttonTextVariants = cva(
  cn("text-foreground text-base font-semibold", Platform.select({ web: "pointer-events-none transition-colors" })),
  {
    variants: {
      variant: {
        default: "text-primary-foreground",
        destructive: "text-destructive",
        outline: "",
        secondary: "text-secondary-foreground",
        ghost: "",
        link: cn("text-primary", Platform.select({ web: "underline-offset-4 group-hover:underline" })),
      },
      size: { default: "", sm: "text-sm", lg: "text-lg", icon: "" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

type ButtonProps = React.ComponentProps<typeof Pressable> &
  VariantProps<typeof buttonVariants> & {
    /** Yükleniyor göstergesi (buton bu sırada pasif olur). */
    loading?: boolean;
  };

function Button({ className, variant, size, loading, disabled, children, ...props }: ButtonProps) {
  const inactive = !!disabled || !!loading;
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn(inactive && "opacity-50", buttonVariants({ variant, size }), className)}
        role="button"
        disabled={inactive}
        accessibilityState={{ disabled: inactive, busy: !!loading }}
        {...props}
      >
        {loading ? <ActivityIndicator color={variant === "default" || !variant ? "#fff" : colors.foreground} /> : children}
      </Pressable>
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
