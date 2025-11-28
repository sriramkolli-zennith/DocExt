import * as React from "react"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

interface DialogContentProps {
  children: React.ReactNode
  className?: string
}

interface DialogHeaderProps {
  children: React.ReactNode
  className?: string
}

interface DialogFooterProps {
  children: React.ReactNode
  className?: string
}

interface DialogTitleProps {
  children: React.ReactNode
  className?: string
}

interface DialogDescriptionProps {
  children: React.ReactNode
  className?: string
}

const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50">{children}</div>
    </div>
  )
}

const DialogContent = ({ children, className = "" }: DialogContentProps) => {
  return (
    <div
      className={`bg-white rounded-lg shadow-2xl p-6 max-w-md w-full mx-4 animate-in fade-in-0 zoom-in-95 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  )
}

const DialogHeader = ({ children, className = "" }: DialogHeaderProps) => {
  return (
    <div className={`flex flex-col space-y-1.5 text-center sm:text-left mb-4 ${className}`}>
      {children}
    </div>
  )
}

const DialogFooter = ({ children, className = "" }: DialogFooterProps) => {
  return (
    <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2 mt-6 ${className}`}>
      {children}
    </div>
  )
}

const DialogTitle = ({ children, className = "" }: DialogTitleProps) => {
  return (
    <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
      {children}
    </h2>
  )
}

const DialogDescription = ({ children, className = "" }: DialogDescriptionProps) => {
  return (
    <p className={`text-sm text-gray-500 ${className}`}>
      {children}
    </p>
  )
}

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
