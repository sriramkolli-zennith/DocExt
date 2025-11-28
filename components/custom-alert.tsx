"use client"

import { AlertCircle, CheckCircle2, Info, XCircle, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type AlertType = "success" | "error" | "warning" | "info"

interface CustomAlertProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  type?: AlertType
  onConfirm?: () => void
  confirmText?: string
  cancelText?: string
}

const alertStyles = {
  success: {
    icon: CheckCircle2,
    iconColor: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  error: {
    icon: XCircle,
    iconColor: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  warning: {
    icon: AlertCircle,
    iconColor: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
}

export function CustomAlert({
  open,
  onOpenChange,
  title,
  description,
  type = "info",
  onConfirm,
  confirmText = "OK",
  cancelText = "Cancel",
}: CustomAlertProps) {
  const style = alertStyles[type]
  const Icon = style.icon
  const isConfirmDialog = !!onConfirm

  const handleConfirm = () => {
    onConfirm?.()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 rounded-full p-3 ${style.bgColor} border-2 ${style.borderColor}`}>
              <Icon className={`h-6 w-6 ${style.iconColor}`} />
            </div>
            <div className="flex-1 pt-1">
              <DialogTitle className="text-left text-xl">{title}</DialogTitle>
              {description && (
                <DialogDescription className="text-left mt-2 text-base">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <DialogFooter>
          {isConfirmDialog ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                className="sm:mr-2"
              >
                {cancelText}
              </Button>
              <Button
                onClick={handleConfirm}
                className={
                  type === "error"
                    ? "bg-red-600 hover:bg-red-700"
                    : type === "warning"
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : "bg-blue-600 hover:bg-blue-700"
                }
              >
                {confirmText}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleCancel}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              {confirmText}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
