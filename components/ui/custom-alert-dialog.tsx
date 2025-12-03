'use client';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from 'lucide-react';

interface CustomAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "warning";
}

export function CustomAlertDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = "Lanjutkan",
  cancelText = "Batal",
  variant = "default"
}: CustomAlertDialogProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "destructive":
        return "bg-destructive text-destructive-foreground hover:bg-destructive/90";
      case "warning":
        return "bg-orange-600 text-white hover:bg-orange-700";
      default:
        return "bg-primary text-primary-foreground hover:bg-primary/90";
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {(variant === "destructive" || variant === "warning") && (
              <AlertTriangle className="h-5 w-5" />
            )}
            {title}
          </DialogTitle>
          
          {/* PERBAIKAN DI SINI:
              Menambahkan 'asChild' agar komponen ini merender <div> (child-nya)
              bukannya <p> default dari Radix UI.
          */}
          <DialogDescription className="text-left" asChild>
            <div className="text-sm text-muted-foreground">
              {description}
            </div>
          </DialogDescription>
          
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
          <DialogClose asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              {cancelText}
            </Button>
          </DialogClose>
          <Button 
            onClick={handleConfirm}
            className={`w-full sm:w-auto ${getVariantStyles()}`}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}