import type * as React from "react";
import { View, type ViewProps } from "react-native";
import { cn } from "../../lib/utils";
import { Text, TextClassContext } from "./text";

function Card({ className, ...props }: ViewProps) {
  return (
    <TextClassContext.Provider value="text-card-foreground">
      <View
        className={cn("bg-card border-border flex flex-col gap-5 rounded-2xl border py-5 shadow-sm shadow-black/40", className)}
        {...props}
      />
    </TextClassContext.Provider>
  );
}

function CardHeader({ className, ...props }: ViewProps) {
  return <View className={cn("flex flex-col gap-1.5 px-5", className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<typeof Text>) {
  return <Text role="heading" className={cn("text-lg font-bold leading-tight", className)} {...props} />;
}

function CardDescription({ className, ...props }: React.ComponentProps<typeof Text>) {
  return <Text className={cn("text-muted-foreground text-sm leading-5", className)} {...props} />;
}

function CardContent({ className, ...props }: ViewProps) {
  return <View className={cn("px-5", className)} {...props} />;
}

function CardFooter({ className, ...props }: ViewProps) {
  return <View className={cn("flex flex-row items-center gap-3 px-5", className)} {...props} />;
}

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
