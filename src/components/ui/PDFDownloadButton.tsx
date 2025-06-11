import React from 'react';
import { Download, Loader2 } from 'lucide-react';
import { PDFOptions } from '@/lib/pdf-utils';

interface PDFDownloadButtonProps {
  elementRef: React.RefObject<HTMLElement | null>;
  options: PDFOptions;
  onGenerating?: (generating: boolean) => void;
  onSuccess?: (filename: string) => void;
  onError?: (error: string) => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
  disabled?: boolean;
}

const PDFDownloadButton: React.FC<PDFDownloadButtonProps> = ({
  elementRef,
  options,
  onGenerating,
  onSuccess,
  onError,
  className = '',
  variant = 'primary',
  size = 'md',
  children,
  disabled = false
}) => {
  const [isGenerating, setIsGenerating] = React.useState(false);

  const handleDownload = async () => {
    if (!elementRef.current || isGenerating || disabled) return;

    setIsGenerating(true);
    onGenerating?.(true);

    try {
      // Dynamic import to avoid SSR issues
      const { PDFGenerator } = await import('@/lib/pdf-utils');
      
      const result = await PDFGenerator.generateFromRef(elementRef, options);
      
      if (result.success) {
        onSuccess?.(result.filename || options.filename || 'document.pdf');
      } else {
        onError?.(result.error || 'Failed to generate PDF');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onError?.(errorMessage);
    } finally {
      setIsGenerating(false);
      onGenerating?.(false);
    }
  };

  // Base button styles
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Variant styles
  const variantStyles = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white focus:ring-gray-500',
    outline: 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-indigo-500'
  };
  
  // Size styles
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const buttonClasses = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || isGenerating}
      className={buttonClasses}
      title={isGenerating ? 'Generating PDF...' : 'Download PDF'}
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      {children || (isGenerating ? 'Generating PDF...' : 'Download PDF')}
    </button>
  );
};

export default PDFDownloadButton;
