import { Platform, TextInput, type TextInputProps } from "react-native";
import { cn } from "../../lib/utils";
import { colors } from "../../theme";

function Input({ className, ...props }: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.mutedForeground}
      className={cn(
        "bg-input/40 border-input text-foreground flex h-12 w-full min-w-0 flex-row items-center rounded-xl border px-4 py-1 text-base leading-5",
        props.editable === false && "opacity-50",
        Platform.select({
          web: cn(
            "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground outline-none transition-[color,box-shadow]",
            "focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/30 aria-invalid:border-destructive",
          ),
        }),
        className,
      )}
      {...props}
    />
  );
}

export { Input };
