import { forwardRef, useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      {children}
    </div>
  );
}

interface DialogContentProps {
  className?: string;
  children: ReactNode;
}

export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative z-50 w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl',
        'max-h-[calc(100vh-4rem)] overflow-y-auto',
        className
      )}
    >
      {children}
    </div>
  )
);
DialogContent.displayName = 'DialogContent';

interface DialogHeaderProps {
  className?: string;
  children: ReactNode;
}

export function DialogHeader({ className, children }: DialogHeaderProps) {
  return <div className={cn('mb-4 space-y-1.5', className)}>{children}</div>;
}

interface DialogTitleProps {
  className?: string;
  children: ReactNode;
}

export function DialogTitle({ className, children }: DialogTitleProps) {
  return <h2 className={cn('text-xl font-bold text-gray-900', className)}>{children}</h2>;
}

interface DialogDescriptionProps {
  className?: string;
  children: ReactNode;
}

export function DialogDescription({ className, children }: DialogDescriptionProps) {
  return <p className={cn('text-sm text-gray-600', className)}>{children}</p>;
}

interface DialogFooterProps {
  className?: string;
  children: ReactNode;
}

export function DialogFooter({ className, children }: DialogFooterProps) {
  return <div className={cn('mt-6 flex justify-end gap-3', className)}>{children}</div>;
}
