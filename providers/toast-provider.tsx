'use client'

import React from "react"
import { type ToastProps } from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"  // Make sure this path is correct

type ToastContextType = ReturnType<typeof useToast>

export const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast()

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Render toasts here */}
      {toast.toasts.map((toastProps) => (
        <Toast key={toastProps.id} {...toastProps} />
      ))}
    </ToastContext.Provider>
  )
}

// Custom hook to use the toast context
export function useToastContext() {
  const context = React.useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToastContext must be used within a ToastProvider")
  }
  return context
}

// You'll need to import or create a Toast component
import { Toast } from "@/components/ui/toast"