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
    iconColor: "text-green-600 dark:text-green-300",
    bgColor: "bg-green-50 dark:bg-green-900/30",
    borderColor: "border-green-200 dark:border-green-800",
  },
  error: {
    icon: XCircle,
    iconColor: "text-red-600 dark:text-red-300",
    bgColor: "bg-red-50 dark:bg-red-900/30",
    borderColor: "border-red-200 dark:border-red-800",
  },
  warning: {
    icon: AlertCircle,
    iconColor: "text-yellow-600 dark:text-yellow-300",
    bgColor: "bg-yellow-50 dark:bg-yellow-900/30",
    borderColor: "border-yellow-200 dark:border-yellow-800",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-600 dark:text-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-900/30",
    borderColor: "border-blue-200 dark:border-blue-800",
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
      <DialogContent className="max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-xl">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white dark:ring-offset-slate-950 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-950 dark:focus:ring-white focus:ring-offset-2"
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
              <DialogTitle className="text-left text-xl text-slate-900 dark:text-white">{title}</DialogTitle>
              {description && (
                <DialogDescription className="text-left mt-2 text-base text-slate-600 dark:text-slate-300">
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
                className="sm:mr-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              >
                {cancelText}
              </Button>
              <Button
                onClick={handleConfirm}
                className={
                  type === "error"
                    ? "bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                    : type === "warning"
                    ? "bg-yellow-600 hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600"
                    : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                }
              >
                {confirmText}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleCancel}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {confirmText}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
