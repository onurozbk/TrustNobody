import { useEffect, useRef, useState } from "react";
import { setConfirmHandler, type ConfirmRequest } from "../lib/platform";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { Text } from "./ui/text";

/** `confirm()` çağrılarını tarayıcı/OS penceresi yerine shadcn AlertDialog ile gösterir. Kök layout'ta bir kez durur. */
export function ConfirmHost() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const current = useRef<ConfirmRequest | null>(null);

  useEffect(() => {
    setConfirmHandler(req => {
      current.current?.resolve(false);
      current.current = req;
      setRequest(req);
    });
    return () => setConfirmHandler(null);
  }, []);

  const close = (result: boolean) => {
    current.current?.resolve(result);
    current.current = null;
    setRequest(null);
  };

  return (
    <AlertDialog open={!!request} onOpenChange={open => { if (!open) close(false); }}>
      {request && (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{request.title}</AlertDialogTitle>
            <AlertDialogDescription>{request.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" className="flex-1" onPress={() => close(false)}>
              <Text>Vazgeç</Text>
            </Button>
            <Button variant={request.destructive ? "destructive" : "default"} className="flex-1" onPress={() => close(true)}>
              <Text>{request.confirmText}</Text>
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
}
