import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../../lib/utils" // Asegúrate de que esta ruta apunte a tu utils.ts

// 1. Aquí definimos todas las variantes con 'cva'
const buttonVariants = cva(
  // Clases base (siempre aplicadas)
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-slate-900 text-slate-50 hover:bg-slate-900/90", 
        destructive: "bg-red-100 text-red-700 hover:bg-red-200 shadow-[0_4px_12px_rgba(239,68,68,0.2),inset_0_1px_0_rgba(255,255,255,0.3),0_1px_2px_rgba(0,0,0,0.1)] transition-all active:scale-95",
        success: "bg-green-100 text-green-700 hover:bg-green-200 border border-green-200 shadow-[0_4px_12px_rgba(34,197,94,0.15),inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.05)] transition-all active:scale-95", 
        outline: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-200 shadow-[0_4px_12px_rgba(234,179,8,0.15),inset_0_1px_0_rgba(255,255,255,0.8),0_1px_2px_rgba(0,0,0,0.05)] transition-all active:scale-95", 
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-100/80", 
        ghost: "hover:bg-slate-100 hover:text-slate-900", 
        link: "text-slate-900 underline-offset-4 hover:underline", 
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// 2. Definimos la interfaz combinando props de HTML y nuestras variantes
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

// 3. El componente final
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // Si asChild es true, el botón se comporta como el componente hijo (ej: un enlace)
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }