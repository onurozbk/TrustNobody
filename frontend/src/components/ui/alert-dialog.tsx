import * as AlertDialogPrimitive from "@rn-primitives/alert-dialog";
import * as React from "react";
import { Platform, View, type ViewProps } from "react-native";
import { FullWindowOverlay as RNFullWindowOverlay } from "react-native-screens";
import { cn } from "../../lib/utils";
import { DialogMotion } from "../motion";
import { Text } from "./text";

const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogPortal = AlertDialogPrimitive.Portal;

const FullWindowOverlay = Platform.OS === "ios" ? RNFullWindowOverlay : React.Fragment;

function AlertDialogOverlay({ className, children, ...props }: AlertDialogPrimitive.OverlayProps & { children: React.ReactNode }) {
  return (
    <FullWindowOverlay>
      <AlertDialogPrimitive.Overlay
        className={cn(
          "absolute bottom-0 left-0 right-0 top-0 z-50 flex items-center justify-center bg-black/75 p-4",
          Platform.select({ web: "animate-in fade-in-0 fixed backdrop-blur-sm" }),
          className,
        )}
        {...props}
      >
        <DialogMotion kind="overlay">
          {children}
        </DialogMotion>
      </AlertDialogPrimitive.Overlay>
    </FullWindowOverlay>
  );
}

function AlertDialogContent({ className, portalHost, ...props }: AlertDialogPrimitive.ContentProps & { portalHost?: string }) {
  return (
    <AlertDialogPortal hostName={portalHost}>
      <AlertDialogOverlay>
        <DialogMotion kind="content">
          <AlertDialogPrimitive.Content
            className={cn(
              "bg-popover border-border z-50 flex w-full max-w-sm flex-col gap-6 rounded-2xl border p-6 shadow-2xl shadow-black",
              Platform.select({ web: "animate-in fade-in-0 zoom-in-95 duration-200" }),
              className,
            )}
            {...props}
          />
        </DialogMotion>
      </AlertDialogOverlay>
    </AlertDialogPortal>
  );
}

function AlertDialogHeader({ className, ...props }: ViewProps) {
  return <View className={cn("flex flex-col gap-2", className)} {...props} />;
}

function AlertDialogFooter({ className, ...props }: ViewProps) {
  return <View className={cn("flex flex-row justify-end gap-3", className)} {...props} />;
}

function AlertDialogTitle({ className, ...props }: AlertDialogPrimitive.TitleProps) {
  return (
    <Text asChild>
      <AlertDialogPrimitive.Title className={cn("text-foreground text-lg font-bold", className)} {...props} />
    </Text>
  );
}

function AlertDialogDescription({ className, ...props }: AlertDialogPrimitive.DescriptionProps) {
  return (
    <Text asChild>
      <AlertDialogPrimitive.Description className={cn("text-muted-foreground text-sm leading-5", className)} {...props} />
    </Text>
  );
}

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};
