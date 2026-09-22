import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'default', size = 'md', className, children, ...props }: ButtonProps) {
    return (
        <button
            className={cn(
                'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                {
                    'bg-indigo-600 text-white hover:bg-indigo-700': variant === 'default',
                    'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900': variant === 'outline',
                    'text-slate-600 hover:bg-slate-100 hover:text-slate-900': variant === 'ghost',
                },
                {
                    'px-3 py-1.5 text-xs': size === 'sm',
                    'px-4 py-2 text-sm': size === 'md',
                    'px-5 py-2.5 text-base': size === 'lg',
                },
                className,
            )}
            {...props}
        >
            {children}
        </button>
    );
}
