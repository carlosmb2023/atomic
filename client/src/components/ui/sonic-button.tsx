import * as React from "react";
import { Button, ButtonProps, buttonVariants } from "@/components/ui/button";
import { useSoundEffect } from "@/hooks/use-sound-effect";
import { cn } from "@/lib/utils";

export interface SonicButtonProps extends ButtonProps {
  soundOnHover?: boolean;
  soundOnClick?: boolean;
}

const SonicButton = React.forwardRef<HTMLButtonElement, SonicButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    soundOnHover = true,
    soundOnClick = true,
    asChild = false,
    onMouseEnter,
    onClick,
    ...props 
  }, ref) => {
    const { playHover, playClick } = useSoundEffect();
    
    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (soundOnHover) {
        playHover();
      }
      onMouseEnter?.(e);
    };
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (soundOnClick) {
        playClick();
      }
      onClick?.(e);
    };
    
    return (
      <Button
        className={cn("relative overflow-hidden", className)}
        variant={variant}
        size={size}
        asChild={asChild}
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onClick={handleClick}
        {...props}
      />
    );
  }
);

SonicButton.displayName = "SonicButton";

export { SonicButton };