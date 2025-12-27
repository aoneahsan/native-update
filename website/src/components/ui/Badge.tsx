import { forwardRef } from 'react';
import type { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-800 border border-gray-300',
        primary: 'bg-brand-100 text-brand-800 border border-brand-300',
        success: 'bg-green-100 text-green-800 border border-green-300',
        warning: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
        danger: 'bg-red-100 text-red-800 border border-red-300',
        info: 'bg-blue-100 text-blue-800 border border-blue-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(({ className, variant, ...props }, ref) => (
  <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
));

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
