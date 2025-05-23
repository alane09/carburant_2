"use client"

import { toggleVariants } from "@/components/ui/toggle"
import { cn } from "@/lib/utils"
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"
import * as React from "react"

const ToggleGroupContext = React.createContext<{
  size?: "default" | "sm" | "lg",
  variant?: "default" | "outline"
}>({})

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & {
    size?: "default" | "sm" | "lg",
    variant?: "default" | "outline"
  }
>(({ className, size, variant, children, ...props }, ref) => (
  <ToggleGroupContext.Provider value={{ size, variant }}>
    <ToggleGroupPrimitive.Root
      ref={ref}
      className={cn("flex items-center gap-1", className)}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Root>
  </ToggleGroupContext.Provider>
))
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> & {
    size?: "default" | "sm" | "lg",
    variant?: "default" | "outline"
  }
>(({ className, children, size, variant, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)
  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          size: size || context.size,
          variant: variant || context.variant,
        }),
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
})
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }

