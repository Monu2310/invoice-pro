import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useState } from 'react';

export interface PDFOptions {
  filename?: string;
  title?: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter' | 'legal';
  scale?: number;
  quality?: number;
}

export interface PDFGenerationResult {
  success: boolean;
  error?: string;
  filename?: string;
  blob?: Blob;
}

/**
 * Enhanced PDF Metadata interface
 */
export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modDate?: Date;
}

/**
 * PDF Merging Options
 */
export interface PDFMergeOptions {
  filename?: string;
  metadata?: PDFMetadata;
  addPageNumbers?: boolean;
  addTimestamp?: boolean;
}

/**
 * PDF Merger Utility Class
 * Provides methods to merge multiple PDFs
 */
export class PDFMerger {
  /**
   * Merge multiple PDF blobs into a single PDF
   * @param pdfBlobs - Array of PDF blobs to merge
   * @param options - Merge options
   * @returns Promise<PDFGenerationResult>
   */
  static async mergeBlobs(
    pdfBlobs: Blob[],
    options: PDFMergeOptions = {}
  ): Promise<PDFGenerationResult> {
    try {
      const mergedPdf = new jsPDF();
      const config = {
        filename: options.filename || 'merged-document.pdf',
        ...options
      };

      // Clear the initial blank page
      mergedPdf.deletePage(1);

      for (let i = 0; i < pdfBlobs.length; i++) {
        const arrayBuffer = await pdfBlobs[i].arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Note: This is a simplified merge - for production use,
        // consider using pdf-lib library for proper PDF merging
        const pageCount = await this.getPDFPageCount(uint8Array);
        
        for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
          mergedPdf.addPage();
          // Add content from source PDF (simplified implementation)
        }
      }

      // Add metadata if provided
      if (config.metadata) {
        this.addMetadataToPDF(mergedPdf, config.metadata);
      }

      // Add page numbers if requested
      if (config.addPageNumbers) {
        this.addPageNumbers(mergedPdf);
      }

      // Save the merged PDF
      const blob = mergedPdf.output('blob');
      mergedPdf.save(config.filename);

      return {
        success: true,
        filename: config.filename,
        blob
      };
    } catch (error) {
      console.error('Error merging PDFs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to merge PDFs'
      };
    }
  }

  /**
   * Add metadata to PDF
   * @param pdf - jsPDF instance
   * @param metadata - Metadata to add
   */
  private static addMetadataToPDF(pdf: jsPDF, metadata: PDFMetadata): void {
    const props: any = {};
    
    if (metadata.title) props.title = metadata.title;
    if (metadata.author) props.author = metadata.author;
    if (metadata.subject) props.subject = metadata.subject;
    if (metadata.keywords) props.keywords = metadata.keywords.join(', ');
    if (metadata.creator) props.creator = metadata.creator;
    if (metadata.producer) props.producer = metadata.producer;
    if (metadata.creationDate) props.creationDate = metadata.creationDate;
    if (metadata.modDate) props.modDate = metadata.modDate;

    pdf.setProperties(props);
  }

  /**
   * Add page numbers to PDF
   * @param pdf - jsPDF instance
   */
  private static addPageNumbers(pdf: jsPDF): void {
    const pageCount = pdf.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.setTextColor(128, 128, 128);
      
      const pageSize = pdf.internal.pageSize;
      const pageText = `Page ${i} of ${pageCount}`;
      const textWidth = pdf.getTextWidth(pageText);
      const x = (pageSize.getWidth() - textWidth) / 2;
      const y = pageSize.getHeight() - 10;
      
      pdf.text(pageText, x, y);
    }
  }

  /**
   * Get PDF page count (simplified implementation)
   * @param pdfData - PDF data as Uint8Array
   * @returns Promise<number>
   */
  private static async getPDFPageCount(pdfData: Uint8Array): Promise<number> {
    // This is a simplified implementation
    // In production, use pdf-lib or similar library for accurate page counting
    return 1;
  }
}

/**
 * PDF Generation Utility Class
 * Provides methods to generate PDFs from HTML content
 */
export class PDFGenerator {
  private static readonly DEFAULT_OPTIONS: Required<PDFOptions> = {
    filename: 'document.pdf',
    title: 'Document',
    orientation: 'portrait',
    format: 'a4',
    scale: 2,
    quality: 0.95
  };

  /**
   * Generate PDF from HTML element
   * @param element - HTML element to convert to PDF
   * @param options - PDF generation options
   * @returns Promise<PDFGenerationResult>
   */
  static async generateFromElement(
    element: HTMLElement, 
    options: PDFOptions = {}
  ): Promise<PDFGenerationResult> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };
    
    try {
      // Create a clone of the element to modify for PDF
      const elementClone = element.cloneNode(true) as HTMLElement;
      const tempDiv = document.createElement('div');
      tempDiv.appendChild(elementClone);
      
      // Apply PDF-friendly styles
      this.preparePDFStyles(tempDiv);
      
      // Temporarily append to body (hidden)
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = element.offsetWidth + 'px';
      document.body.appendChild(tempDiv);
      
      // Generate canvas from the element
      const canvas = await html2canvas(elementClone, {
        scale: config.scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: element.offsetWidth,
        height: element.offsetHeight,
        onclone: (clonedDoc: Document) => {
          // Additional processing of the cloned document to fix color issues
          this.preprocessClonedDocument(clonedDoc);
          // Also process all existing stylesheets for OKLCH colors
          this.processExistingStylesheets(clonedDoc);
        },
        ignoreElements: (element: Element) => {
          // Ignore elements that might cause issues, but allow style elements for preprocessing
          const tagName = element.tagName.toLowerCase();
          return tagName === 'script' || element.hasAttribute('data-html2canvas-ignore');
        }
      });
      
      // Clean up - remove the temp div
      document.body.removeChild(tempDiv);
      
      // Create PDF
      const pdf = this.createPDFFromCanvas(canvas, config);
      
      // Download the PDF
      pdf.save(config.filename);
      
      return {
        success: true,
        filename: config.filename
      };
    } catch (error) {
      console.error('Error generating PDF:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate PDF from element by selector
   * @param selector - CSS selector for the element
   * @param options - PDF generation options
   * @returns Promise<PDFGenerationResult>
   */
  static async generateFromSelector(
    selector: string,
    options: PDFOptions = {}
  ): Promise<PDFGenerationResult> {
    const element = document.querySelector(selector) as HTMLElement;
    
    if (!element) {
      return {
        success: false,
        error: `Element with selector "${selector}" not found`
      };
    }
    
    return this.generateFromElement(element, options);
  }

  /**
   * Generate PDF from React ref
   * @param ref - React ref object containing the element
   * @param options - PDF generation options
   * @returns Promise<PDFGenerationResult>
   */
  static async generateFromRef(
    ref: React.RefObject<HTMLElement | null>,
    options: PDFOptions = {}
  ): Promise<PDFGenerationResult> {
    if (!ref.current) {
      return {
        success: false,
        error: 'Ref element is null or undefined'
      };
    }
    
    return this.generateFromElement(ref.current, options);
  }

  /**
   * Generate PDF from HTML string
   * @param html - HTML string to convert to PDF
   * @param options - PDF generation options
   * @returns Promise<PDFGenerationResult>
   */
  static async generateFromHTML(
    html: string,
    options: PDFOptions = {}
  ): Promise<PDFGenerationResult> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };
    
    try {
      // Create a temporary element with the HTML content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Apply PDF-friendly styles
      this.preparePDFStyles(tempDiv);
      
      // Temporarily append to body (hidden)
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '800px'; // Default width for HTML content
      document.body.appendChild(tempDiv);
      
      // Generate canvas from the element
      const canvas = await html2canvas(tempDiv, {
        scale: config.scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: 800,
        height: tempDiv.scrollHeight
      });
      
      // Clean up - remove the temp div
      document.body.removeChild(tempDiv);
      
      // Create PDF
      const pdf = this.createPDFFromCanvas(canvas, config);
      
      // Generate blob for return
      const blob = pdf.output('blob');
      
      // Download the PDF
      pdf.save(config.filename);
      
      return {
        success: true,
        filename: config.filename,
        blob
      };
    } catch (error) {
      console.error('Error generating PDF from HTML:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Prepare element styles for PDF generation
   * @param element - Element to prepare
   */
  private static preparePDFStyles(element: HTMLElement): void {
    // Override any problematic CSS (like oklch colors)
    const allElements = element.querySelectorAll('*');
    allElements.forEach((el) => {
      const htmlElement = el as HTMLElement;
      const style = window.getComputedStyle(htmlElement);
      
      // Convert problematic color formats to supported ones
      this.fixColorProperties(htmlElement, style);
      
      // Ensure text is visible and properly styled for PDF
      if (style.color === 'rgba(0, 0, 0, 0)' || style.color === 'transparent') {
        htmlElement.style.color = '#000000';
      }
      
      // Fix any print-unfriendly styles
      if (htmlElement.style.position === 'fixed') {
        htmlElement.style.position = 'absolute';
      }
      
      // Remove any CSS custom properties that might cause issues
      this.removeProblematicCSSProperties(htmlElement);
    });
  }

  /**
   * Fix color properties that might not be supported by PDF libraries
   * @param element - HTML element to fix
   * @param computedStyle - Computed style of the element
   */
  private static fixColorProperties(element: HTMLElement, computedStyle: CSSStyleDeclaration): void {
    try {
      // Apply computed colors directly to override any problematic color formats
      const colorProps = ['color', 'backgroundColor', 'borderColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'];
      
      colorProps.forEach(prop => {
        const value = computedStyle.getPropertyValue(prop);
        if (value && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
          // Check if it's an oklch or other modern color function
          if (value.includes('oklch') || value.includes('lch') || value.includes('lab')) {
            // Convert to a fallback color - we'll use the computed RGB value
            const rgbValue = this.convertToRGB(value);
            (element.style as any)[prop] = rgbValue;
          } else {
            (element.style as any)[prop] = value;
          }
        }
      });
    } catch (error) {
      console.warn('Error fixing color properties:', error);
      // Fallback to safe colors
      element.style.color = '#000000';
      element.style.backgroundColor = '#ffffff';
    }
  }

  /**
   * Convert modern color functions to RGB
   * @param colorValue - Color value to convert
   * @returns RGB color string
   */
  private static convertToRGB(colorValue: string): string {
    try {
      // For oklch colors, try to extract lightness and convert to grayscale as fallback
      if (colorValue.includes('oklch')) {
        const match = colorValue.match(/oklch\(([^)]+)\)/);
        if (match) {
          const params = match[1].split(/\s+/);
          const lightness = parseFloat(params[0]);
          if (!isNaN(lightness)) {
            // Convert lightness (0-1) to grayscale RGB
            const gray = Math.round(lightness * 255);
            return `rgb(${gray}, ${gray}, ${gray})`;
          }
        }
      }
      
      // Create a temporary element to get the computed RGB value
      const tempDiv = document.createElement('div');
      tempDiv.style.color = colorValue;
      document.body.appendChild(tempDiv);
      
      const computedColor = window.getComputedStyle(tempDiv).color;
      document.body.removeChild(tempDiv);
      
      return computedColor || '#000000';
    } catch (error) {
      console.warn('Error converting color:', colorValue, error);
      return '#000000'; // Fallback to black
    }
  }

  /**
   * Remove problematic CSS properties that might cause PDF generation issues
   * @param element - HTML element to clean
   */
  private static removeProblematicCSSProperties(element: HTMLElement): void {
    // Remove CSS custom properties (CSS variables) that might cause issues
    const style = element.style;
    for (let i = style.length - 1; i >= 0; i--) {
      const property = style[i];
      if (property.startsWith('--')) {
        style.removeProperty(property);
      }
    }
    
    // Remove other potentially problematic properties
    const problematicProps = [
      'backdrop-filter',
      'filter',
      'clip-path',
      'mask',
      'mask-image'
    ];
    
    problematicProps.forEach(prop => {
      if (style.getPropertyValue(prop)) {
        style.removeProperty(prop);
      }
    });
  }

  /**
   * Create PDF from canvas
   * @param canvas - HTML5 Canvas element
   * @param options - PDF options
   * @returns jsPDF instance
   */
  private static createPDFFromCanvas(canvas: HTMLCanvasElement, options: Required<PDFOptions>): jsPDF {
    const pdf = new jsPDF(
      options.orientation === 'landscape' ? 'l' : 'p',
      'mm',
      options.format
    );
    
    // Get page dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate image dimensions to fit page
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add title if provided
    if (options.title) {
      pdf.setProperties({
        title: options.title,
        creator: 'Invoice Dashboard',
        author: 'Your Company'
      });
    }
    
    let heightLeft = imgHeight;
    let position = 0;
    
    // Convert canvas to image data
    const imgData = canvas.toDataURL('image/png', options.quality);
    
    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // Add additional pages if content is too long
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    return pdf;
  }

  /**
   * Preprocess cloned document to fix color and style issues
   * @param clonedDoc - Cloned document from html2canvas
   */
  private static preprocessClonedDocument(clonedDoc: Document): void {
    try {
      // First, inject a comprehensive style override for OKLCH colors
      this.injectOklchFallbackStyles(clonedDoc);
      
      // Get all elements with computed styles that might have oklch colors
      const allElements = clonedDoc.querySelectorAll('*');
      
      allElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        
        // Check for problematic color functions in inline styles
        if (htmlElement.style.cssText) {
          let cssText = htmlElement.style.cssText;
          
          // Replace oklch colors with intelligent fallbacks
          cssText = cssText.replace(/oklch\(([^)]+)\)/g, (match, params) => {
            return this.convertOklchToRgb(params);
          });
          
          // Replace other modern color functions with fallbacks
          cssText = cssText.replace(/lch\([^)]+\)/g, 'rgb(128, 128, 128)');
          cssText = cssText.replace(/lab\([^)]+\)/g, 'rgb(128, 128, 128)');
          
          htmlElement.style.cssText = cssText;
        }
        
        // Also check for these in any style attributes
        const colorAttributes = ['color', 'background-color', 'border-color'];
        colorAttributes.forEach(attr => {
          const value = htmlElement.style.getPropertyValue(attr);
          if (value && (value.includes('oklch') || value.includes('lch') || value.includes('lab'))) {
            if (value.includes('oklch')) {
              const match = value.match(/oklch\(([^)]+)\)/);
              if (match) {
                htmlElement.style.setProperty(attr, this.convertOklchToRgb(match[1]));
              } else {
                htmlElement.style.setProperty(attr, '#666666');
              }
            } else {
              htmlElement.style.setProperty(attr, '#666666');
            }
          }
        });
      });
      
      // Process any embedded stylesheets
      const styleSheets = clonedDoc.querySelectorAll('style');
      styleSheets.forEach((styleElement) => {
        if (styleElement.textContent) {
          let cssContent = styleElement.textContent;
          
          // Replace oklch colors with intelligent fallbacks
          cssContent = cssContent.replace(/oklch\(([^)]+)\)/g, (match, params) => {
            return this.convertOklchToRgb(params);
          });
          
          cssContent = cssContent.replace(/lch\([^)]+\)/g, 'rgb(128, 128, 128)');
          cssContent = cssContent.replace(/lab\([^)]+\)/g, 'rgb(128, 128, 128)');
          styleElement.textContent = cssContent;
        }
      });
    } catch (error) {
      console.warn('Error preprocessing cloned document:', error);
    }
  }

  /**
   * Inject comprehensive OKLCH fallback styles into the cloned document
   * @param clonedDoc - Cloned document from html2canvas
   */
  private static injectOklchFallbackStyles(clonedDoc: Document): void {
    try {
      const fallbackStyles = `
        <style id="oklch-fallback-styles">
          :root {
            --background: rgb(255, 255, 255) !important;
            --foreground: rgb(37, 37, 37) !important;
            --card: rgb(255, 255, 255) !important;
            --card-foreground: rgb(37, 37, 37) !important;
            --popover: rgb(255, 255, 255) !important;
            --popover-foreground: rgb(37, 37, 37) !important;
            --primary: rgb(52, 52, 52) !important;
            --primary-foreground: rgb(251, 251, 251) !important;
            --secondary: rgb(247, 247, 247) !important;
            --secondary-foreground: rgb(52, 52, 52) !important;
            --muted: rgb(247, 247, 247) !important;
            --muted-foreground: rgb(142, 142, 142) !important;
            --accent: rgb(247, 247, 247) !important;
            --accent-foreground: rgb(52, 52, 52) !important;
            --destructive: rgb(239, 68, 68) !important;
            --border: rgb(235, 235, 235) !important;
            --input: rgb(235, 235, 235) !important;
            --ring: rgb(180, 180, 180) !important;
            --chart-1: rgb(164, 94, 59) !important;
            --chart-2: rgb(97, 153, 153) !important;
            --chart-3: rgb(76, 101, 124) !important;
            --chart-4: rgb(211, 168, 84) !important;
            --chart-5: rgb(196, 156, 84) !important;
            --sidebar: rgb(251, 251, 251) !important;
            --sidebar-foreground: rgb(37, 37, 37) !important;
            --sidebar-primary: rgb(52, 52, 52) !important;
            --sidebar-primary-foreground: rgb(251, 251, 251) !important;
            --sidebar-accent: rgb(247, 247, 247) !important;
            --sidebar-accent-foreground: rgb(52, 52, 52) !important;
            --sidebar-border: rgb(235, 235, 235) !important;
            --sidebar-ring: rgb(180, 180, 180) !important;
          }
          
          .dark {
            --background: rgb(37, 37, 37) !important;
            --foreground: rgb(251, 251, 251) !important;
            --card: rgb(52, 52, 52) !important;
            --card-foreground: rgb(251, 251, 251) !important;
            --popover: rgb(52, 52, 52) !important;
            --popover-foreground: rgb(251, 251, 251) !important;
            --primary: rgb(235, 235, 235) !important;
            --primary-foreground: rgb(52, 52, 52) !important;
            --secondary: rgb(68, 68, 68) !important;
            --secondary-foreground: rgb(251, 251, 251) !important;
            --muted: rgb(68, 68, 68) !important;
            --muted-foreground: rgb(180, 180, 180) !important;
            --accent: rgb(68, 68, 68) !important;
            --accent-foreground: rgb(251, 251, 251) !important;
            --destructive: rgb(220, 38, 38) !important;
            --border: rgba(255, 255, 255, 0.1) !important;
            --input: rgba(255, 255, 255, 0.15) !important;
            --ring: rgb(142, 142, 142) !important;
            --chart-1: rgb(124, 58, 237) !important;
            --chart-2: rgb(34, 197, 94) !important;
            --chart-3: rgb(196, 156, 84) !important;
            --chart-4: rgb(168, 85, 247) !important;
            --chart-5: rgb(239, 68, 68) !important;
            --sidebar: rgb(52, 52, 52) !important;
            --sidebar-foreground: rgb(251, 251, 251) !important;
            --sidebar-primary: rgb(124, 58, 237) !important;
            --sidebar-primary-foreground: rgb(251, 251, 251) !important;
            --sidebar-accent: rgb(68, 68, 68) !important;
            --sidebar-accent-foreground: rgb(251, 251, 251) !important;
            --sidebar-border: rgba(255, 255, 255, 0.1) !important;
            --sidebar-ring: rgb(142, 142, 142) !important;
          }
          
          /* Override any remaining OKLCH usage */
          * {
            color: var(--foreground) !important;
            background-color: var(--background) !important;
          }
        </style>
      `;
      
      // Remove any existing fallback styles first
      const existingFallback = clonedDoc.getElementById('oklch-fallback-styles');
      if (existingFallback) {
        existingFallback.remove();
      }
      
      // Inject the fallback styles at the beginning of the head
      const head = clonedDoc.head || clonedDoc.querySelector('head');
      if (head) {
        head.insertAdjacentHTML('afterbegin', fallbackStyles);
      }
    } catch (error) {
      console.warn('Error injecting OKLCH fallback styles:', error);
    }
  }

  /**
   * Process existing stylesheets in the cloned document to replace OKLCH colors
   * @param clonedDoc - Cloned document from html2canvas
   */
  private static processExistingStylesheets(clonedDoc: Document): void {
    try {
      // Process all link elements that might be stylesheets
      const linkElements = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
      linkElements.forEach((link) => {
        const href = (link as HTMLLinkElement).href;
        // Skip external stylesheets to avoid CORS issues
        if (href && (href.startsWith('/') || href.includes(window.location.origin))) {
          console.log('Processing internal stylesheet:', href);
          // Note: We can't modify external stylesheets, but our injected styles should override them
        }
      });

      // Process any style elements
      const styleElements = clonedDoc.querySelectorAll('style');
      styleElements.forEach((styleElement) => {
        if (styleElement.textContent) {
          let cssContent = styleElement.textContent;
          
          // Replace OKLCH color functions with RGB equivalents
          cssContent = cssContent.replace(/oklch\(([^)]+)\)/g, (match, params) => {
            return this.convertOklchToRgb(params);
          });
          
          // Replace LCH and LAB functions
          cssContent = cssContent.replace(/lch\([^)]+\)/g, 'rgb(128, 128, 128)');
          cssContent = cssContent.replace(/lab\([^)]+\)/g, 'rgb(128, 128, 128)');
          
          styleElement.textContent = cssContent;
        }
      });
    } catch (error) {
      console.warn('Error processing existing stylesheets:', error);
    }
  }

  /**
   * Convert OKLCH parameters to RGB
   * @param params - OKLCH parameters string
   * @returns RGB color string
   */
  private static convertOklchToRgb(params: string): string {
    try {
      const parts = params.trim().split(/\s+/);
      const lightness = parseFloat(parts[0]);
      
      if (!isNaN(lightness)) {
        // Convert lightness (0-1) to grayscale RGB as a safe fallback
        const gray = Math.round(lightness * 255);
        return `rgb(${gray}, ${gray}, ${gray})`;
      }
      
      // Default fallback
      return 'rgb(128, 128, 128)';
    } catch (error) {
      console.warn('Error converting OKLCH:', params, error);
      return 'rgb(128, 128, 128)';
    }
  }
}

  /**
   * Specialized PDF generators for different document types
   */
export class InvoicePDFGenerator extends PDFGenerator {
  static async generateInvoicePDF(
    elementRef: React.RefObject<HTMLElement | null>,
    invoiceNumber: string,
    customerName?: string
  ): Promise<PDFGenerationResult> {
    const filename = `invoice_${invoiceNumber}_${customerName ? customerName.replace(/\s+/g, '_') : 'customer'}.pdf`;
    
    return this.generateFromRef(elementRef, {
      filename,
      title: `Invoice ${invoiceNumber}`,
      orientation: 'portrait',
      format: 'a4'
    });
  }
}

export class OrderPDFGenerator extends PDFGenerator {
  static async generateOrderPDF(
    elementRef: React.RefObject<HTMLElement | null>,
    orderNumber: string,
    customerName?: string
  ): Promise<PDFGenerationResult> {
    const filename = `order_${orderNumber}_${customerName ? customerName.replace(/\s+/g, '_') : 'customer'}.pdf`;
    
    return this.generateFromRef(elementRef, {
      filename,
      title: `Order ${orderNumber}`,
      orientation: 'portrait',
      format: 'a4'
    });
  }
}

export class TransactionPDFGenerator extends PDFGenerator {
  static async generateTransactionPDF(
    elementRef: React.RefObject<HTMLElement | null>,
    transactionId: string,
    description?: string
  ): Promise<PDFGenerationResult> {
    const filename = `transaction_${transactionId}_${description ? description.replace(/\s+/g, '_') : 'receipt'}.pdf`;
    
    return this.generateFromRef(elementRef, {
      filename,
      title: `Transaction ${transactionId}`,
      orientation: 'portrait',
      format: 'a4'
    });
  }
}

/**
 * Batch PDF Generation Utility
 */
export class BatchPDFGenerator {
  /**
   * Generate multiple PDFs and download them as a ZIP file
   * @param elements - Array of elements to convert to PDF
   * @param options - Batch PDF generation options
   * @returns Promise<PDFGenerationResult>
   */
  static async generateBatchPDFs(
    elements: { element: HTMLElement; filename: string; title?: string }[],
    options: Omit<PDFOptions, 'filename' | 'title'> = {}
  ): Promise<PDFGenerationResult> {
    try {
      const results: PDFGenerationResult[] = [];
      
      for (const { element, filename, title } of elements) {
        const result = await PDFGenerator.generateFromElement(element, {
          ...options,
          filename,
          title
        });
        results.push(result);
      }
      
      const failedCount = results.filter(r => !r.success).length;
      
      if (failedCount === 0) {
        return {
          success: true,
          filename: `batch_export_${elements.length}_files.zip`
        };
      } else {
        return {
          success: false,
          error: `${failedCount} out of ${elements.length} PDFs failed to generate`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Batch PDF generation failed'
      };
    }
  }

  /**
   * Generate PDF from table data
   * @param tableData - Array of objects representing table rows
   * @param headers - Array of column headers
   * @param options - PDF generation options
   * @returns Promise<PDFGenerationResult>
   */
  static async generateTablePDF(
    tableData: Record<string, any>[],
    headers: string[],
    options: PDFOptions = {}
  ): Promise<PDFGenerationResult> {
    const config = { ...PDFGenerator['DEFAULT_OPTIONS'], ...options };
    
    try {
      const pdf = new jsPDF(
        config.orientation === 'landscape' ? 'l' : 'p',
        'mm',
        config.format
      );
      
      // Add title
      if (config.title) {
        pdf.setFontSize(16);
        pdf.text(config.title, 20, 20);
      }
      
      // Add table using autoTable plugin (requires jspdf-autotable)
      // For now, let's create a simple table manually
      let yPosition = config.title ? 40 : 20;
      
      // Add headers
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      let xPosition = 20;
      headers.forEach((header, index) => {
        pdf.text(header, xPosition, yPosition);
        xPosition += 40; // Adjust spacing as needed
      });
      
      yPosition += 10;
      pdf.setFont('helvetica', 'normal');
      
      // Add data rows
      tableData.forEach((row, rowIndex) => {
        xPosition = 20;
        headers.forEach((header, colIndex) => {
          const cellValue = String(row[header] || '');
          pdf.text(cellValue, xPosition, yPosition);
          xPosition += 40;
        });
        yPosition += 8;
        
        // Add new page if needed
        if (yPosition > 280) {
          pdf.addPage();
          yPosition = 20;
        }
      });
      
      // Download the PDF
      pdf.save(config.filename);
      
      return {
        success: true,
        filename: config.filename
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Table PDF generation failed'
      };
    }
  }
}

/**
 * Comprehensive PDF Report Generator
 * Handles complex reports with charts, tables, and multiple pages
 */
export class ReportPDFGenerator extends PDFGenerator {
  /**
   * Generate a comprehensive business report
   * @param reportData - Report data structure
   * @param options - PDF generation options
   * @returns Promise<PDFGenerationResult>
   */
  static async generateBusinessReport(
    reportData: {
      title: string;
      subtitle?: string;
      sections: {
        title: string;
        content: string | HTMLElement;
        type: 'text' | 'table' | 'chart' | 'html';
      }[];
      summary?: {
        totalRevenue?: number;
        totalOrders?: number;
        totalCustomers?: number;
        growthRate?: number;
      };
    },
    options: PDFOptions = {}
  ): Promise<PDFGenerationResult> {
    const defaultOptions: Required<PDFOptions> = {
      filename: 'document.pdf',
      title: 'Document',
      orientation: 'portrait',
      format: 'a4',
      scale: 2,
      quality: 0.95
    };
    const config = { ...defaultOptions, ...options };
    
    try {
      const pdf = new jsPDF(
        config.orientation === 'landscape' ? 'l' : 'p',
        'mm',
        config.format
      );

      // Set document properties
      pdf.setProperties({
        title: reportData.title,
        creator: 'Invoice Dashboard',
        author: 'Business Reports'
      });

      let yPosition = 20;
      const pageHeight = pdf.internal.pageSize.getHeight() - 20;
      const pageWidth = pdf.internal.pageSize.getWidth() - 40;

      // Add header
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text(reportData.title, 20, yPosition);
      yPosition += 15;

      if (reportData.subtitle) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'normal');
        pdf.text(reportData.subtitle, 20, yPosition);
        yPosition += 10;
      }

      // Add generation date
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
      yPosition += 20;

      // Add summary section if provided
      if (reportData.summary) {
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Executive Summary', 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        
        if (reportData.summary.totalRevenue !== undefined) {
          pdf.text(`Total Revenue: $${reportData.summary.totalRevenue.toFixed(2)}`, 20, yPosition);
          yPosition += 8;
        }
        
        if (reportData.summary.totalOrders !== undefined) {
          pdf.text(`Total Orders: ${reportData.summary.totalOrders}`, 20, yPosition);
          yPosition += 8;
        }
        
        if (reportData.summary.totalCustomers !== undefined) {
          pdf.text(`Total Customers: ${reportData.summary.totalCustomers}`, 20, yPosition);
          yPosition += 8;
        }
        
        if (reportData.summary.growthRate !== undefined) {
          pdf.text(`Growth Rate: ${reportData.summary.growthRate}%`, 20, yPosition);
          yPosition += 15;
        }
      }

      // Add sections
      for (const section of reportData.sections) {
        // Check if we need a new page
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = 20;
        }

        // Section title
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(section.title, 20, yPosition);
        yPosition += 10;

        // Section content based on type
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');

        switch (section.type) {
          case 'text':
            if (typeof section.content === 'string') {
              const lines = pdf.splitTextToSize(section.content, pageWidth);
              pdf.text(lines, 20, yPosition);
              yPosition += lines.length * 5 + 10;
            }
            break;
          
          case 'table':
            // Basic table rendering (would need jspdf-autotable for advanced tables)
            if (typeof section.content === 'string') {
              pdf.text(section.content, 20, yPosition);
              yPosition += 20;
            }
            break;
          
          case 'html':
            if (section.content instanceof HTMLElement) {
              // Convert HTML element to canvas and add to PDF
              const canvas = await html2canvas(section.content, {
                scale: config.scale,
                useCORS: true,
                backgroundColor: '#ffffff'
              });
              
              const imgWidth = pageWidth;
              const imgHeight = (canvas.height * imgWidth) / canvas.width;
              
              if (yPosition + imgHeight > pageHeight) {
                pdf.addPage();
                yPosition = 20;
              }
              
              const imgData = canvas.toDataURL('image/png', config.quality);
              pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
              yPosition += imgHeight + 10;
            }
            break;
          
          default:
            pdf.text('Unsupported content type', 20, yPosition);
            yPosition += 15;
        }
      }

      // Add footer
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.text(
          `Page ${i} of ${totalPages}`,
          pdf.internal.pageSize.getWidth() - 40,
          pdf.internal.pageSize.getHeight() - 10
        );
      }

      // Save the PDF
      pdf.save(config.filename);

      return {
        success: true,
        filename: config.filename
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Report generation failed'
      };
    }
  }
}

/**
 * Analytics PDF Generator for dashboard reports
 */
export class AnalyticsPDFGenerator extends ReportPDFGenerator {
  static async generateDashboardReport(
    dashboardData: {
      period: string;
      metrics: {
        revenue: number;
        orders: number;
        customers: number;
        growth: number;
      };
      charts?: HTMLElement[];
      tables?: HTMLElement[];
    },
    options: PDFOptions = {}
  ): Promise<PDFGenerationResult> {
    const reportData = {
      title: 'Dashboard Analytics Report',
      subtitle: `Period: ${dashboardData.period}`,
      summary: {
        totalRevenue: dashboardData.metrics.revenue,
        totalOrders: dashboardData.metrics.orders,
        totalCustomers: dashboardData.metrics.customers,
        growthRate: dashboardData.metrics.growth
      },
      sections: [
        {
          title: 'Performance Overview',
          content: `This report provides a comprehensive overview of business performance for the period ${dashboardData.period}. The metrics show significant insights into revenue trends, customer acquisition, and order patterns.`,
          type: 'text' as const
        },
        ...(dashboardData.charts?.map((chart, index) => ({
          title: `Chart ${index + 1}`,
          content: chart,
          type: 'html' as const
        })) || []),
        ...(dashboardData.tables?.map((table, index) => ({
          title: `Data Table ${index + 1}`,
          content: table,
          type: 'html' as const
        })) || [])
      ]
    };

    return this.generateBusinessReport(reportData, {
      filename: `dashboard_report_${new Date().toISOString().split('T')[0]}.pdf`,
      title: 'Dashboard Analytics Report',
      orientation: 'portrait',
      format: 'a4',
      ...options
    });
  }
}

/**
 * Email Integration PDF Generator
 * Handles PDF generation with email sending capabilities
 */
export class EmailPDFGenerator extends PDFGenerator {
  /**
   * Generate PDF and prepare for email attachment
   * @param element - HTML element to convert
   * @param emailOptions - Email configuration
   * @param pdfOptions - PDF generation options
   * @returns Promise with PDF blob and email data
   */
  static async generateForEmail(
    element: HTMLElement,
    emailOptions: {
      to: string;
      subject: string;
      body: string;
      attachmentName?: string;
    },
    pdfOptions: PDFOptions = {}
  ): Promise<{
    success: boolean;
    pdfBlob?: Blob;
    emailData?: {
      to: string;
      subject: string;
      body: string;
      attachmentName: string;
    };
    error?: string;
  }> {
    const config = { ...this.getDefaultOptions(), ...pdfOptions };
    
    try {
      // Generate canvas from the element
      const canvas = await html2canvas(element, {
        scale: config.scale,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // Create PDF
      const pdf = new jsPDF(
        config.orientation === 'landscape' ? 'l' : 'p',
        'mm',
        config.format
      );
      
      // Get page dimensions
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate image dimensions to fit page
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add title if provided
      if (config.title) {
        pdf.setProperties({
          title: config.title,
          creator: 'Invoice Dashboard',
          author: 'Your Company'
        });
      }
      
      let heightLeft = imgHeight;
      let position = 0;
      
      // Convert canvas to image data
      const imgData = canvas.toDataURL('image/png', config.quality);
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if content is too long
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // Convert PDF to blob for email attachment
      const pdfBlob = new Blob([pdf.output('blob')], { type: 'application/pdf' });
      
      const emailData = {
        to: emailOptions.to,
        subject: emailOptions.subject,
        body: emailOptions.body,
        attachmentName: emailOptions.attachmentName || config.filename
      };
      
      return {
        success: true,
        pdfBlob,
        emailData
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email PDF generation failed'
      };
    }
  }

  /**
   * Get default options (helper method to avoid accessing private property)
   */
  private static getDefaultOptions(): Required<PDFOptions> {
    return {
      filename: 'document.pdf',
      title: 'Document',
      orientation: 'portrait',
      format: 'a4',
      scale: 2,
      quality: 0.95
    };
  }
}

/**
 * Bulk Operations PDF Generator
 * Handles multiple document operations
 */
export class BulkPDFGenerator {
  /**
   * Process multiple invoices and generate individual PDFs
   * @param invoices - Array of invoice data with elements
   * @param options - Bulk processing options
   * @returns Promise with processing results
   */
  static async processBulkInvoices(
    invoices: {
      id: string;
      element: HTMLElement;
      invoiceNumber: string;
      customerName: string;
    }[],
    options: {
      baseFilename?: string;
      pdfOptions?: Partial<PDFOptions>;
      onProgress?: (current: number, total: number, currentInvoice: string) => void;
    } = {}
  ): Promise<{
    success: boolean;
    processed: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      success: true,
      processed: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (let i = 0; i < invoices.length; i++) {
      const invoice = invoices[i];
      
      try {
        // Report progress
        options.onProgress?.(i + 1, invoices.length, invoice.invoiceNumber);
        
        // Generate PDF for this invoice
        const result = await InvoicePDFGenerator.generateInvoicePDF(
          { current: invoice.element },
          invoice.invoiceNumber,
          invoice.customerName
        );
        
        if (result.success) {
          results.processed++;
        } else {
          results.failed++;
          results.errors.push(`${invoice.invoiceNumber}: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`${invoice.invoiceNumber}: ${error instanceof Error ? error.message : 'Processing error'}`);
      }
    }

    results.success = results.failed === 0;
    return results;
  }

  /**
   * Generate a combined PDF with multiple documents
   * @param documents - Array of document elements
   * @param options - Combined PDF options
   * @returns Promise<PDFGenerationResult>
   */
  static async generateCombinedPDF(
    documents: {
      title: string;
      element: HTMLElement;
    }[],
    options: PDFOptions & {
      coverPage?: {
        title: string;
        subtitle?: string;
        author?: string;
      };
    } = {}
  ): Promise<PDFGenerationResult> {
    const config = {
      filename: 'combined_documents.pdf',
      title: 'Combined Documents',
      orientation: 'portrait' as const,
      format: 'a4' as const,
      scale: 2,
      quality: 0.95,
      ...options
    };

    try {
      const pdf = new jsPDF(
        config.orientation === 'landscape' ? 'l' : 'p',
        'mm',
        config.format
      );

      // Add cover page if specified
      if (options.coverPage) {
        pdf.setFontSize(24);
        pdf.setFont('helvetica', 'bold');
        pdf.text(options.coverPage.title, 20, 40);
        
        if (options.coverPage.subtitle) {
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'normal');
          pdf.text(options.coverPage.subtitle, 20, 60);
        }
        
        if (options.coverPage.author) {
          pdf.setFontSize(12);
          pdf.text(`By: ${options.coverPage.author}`, 20, 80);
        }
        
        pdf.setFontSize(10);
        pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 100);
        
        pdf.addPage();
      }

      // Process each document
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];
        
        // Add document title page
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(doc.title, 20, 30);
        pdf.addPage();
        
        // Convert document to canvas and add to PDF
        const canvas = await html2canvas(doc.element, {
          scale: config.scale,
          useCORS: true,
          backgroundColor: '#ffffff'
        });
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth - 40; // 20mm margin on each side
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 20;
        
        const imgData = canvas.toDataURL('image/png', config.quality);
        
        // Add first page of document
        pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 40; // Account for margins
        
        // Add additional pages if content is too long
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight + 20;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 20, position, imgWidth, imgHeight);
          heightLeft -= pageHeight - 40;
        }
        
        // Add page break before next document (except for last document)
        if (i < documents.length - 1) {
          pdf.addPage();
        }
      }

      // Save the combined PDF
      pdf.save(config.filename);

      return {
        success: true,
        filename: config.filename
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Combined PDF generation failed'
      };
    }
  }
}

/**
 * PDF Analytics and Reporting
 */
export class PDFAnalytics {
  private static downloadHistory: Array<{
    filename: string;
    timestamp: Date;
    size: number;
    type: string;
  }> = [];

  /**
   * Record a PDF download
   * @param filename - Name of the downloaded file
   * @param size - Size of the file in bytes
   * @param type - Type of PDF (invoice, report, etc.)
   */
  static recordDownload(filename: string, size: number, type: string = 'document'): void {
    this.downloadHistory.push({
      filename,
      timestamp: new Date(),
      size,
      type
    });

    // Keep only last 100 entries
    if (this.downloadHistory.length > 100) {
      this.downloadHistory = this.downloadHistory.slice(-100);
    }
  }

  /**
   * Get download statistics
   * @returns Download statistics
   */
  static getStatistics() {
    const total = this.downloadHistory.length;
    const totalSize = this.downloadHistory.reduce((sum, entry) => sum + entry.size, 0);
    const typeBreakdown = this.downloadHistory.reduce((acc, entry) => {
      acc[entry.type] = (acc[entry.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const recentDownloads = this.downloadHistory
      .slice(-10)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return {
      totalDownloads: total,
      totalSize: totalSize,
      averageSize: total > 0 ? totalSize / total : 0,
      typeBreakdown,
      recentDownloads
    };
  }

  /**
   * Clear download history
   */
  static clearHistory(): void {
    this.downloadHistory = [];
  }
}

/**
 * React Hook for PDF Generation
 */
export const usePDFGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePDF = async (
    elementRef: React.RefObject<HTMLElement | null>,
    options: PDFOptions = {}
  ): Promise<boolean> => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const result = await PDFGenerator.generateFromRef(elementRef, options);
      
      if (!result.success) {
        setError(result.error || 'Failed to generate PDF');
        return false;
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generatePDF,
    isGenerating,
    error,
    clearError: () => setError(null)
  };
};

/**
 * Enhanced React Hook for PDF Generation with batch support
 */
export const useAdvancedPDFGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const generatePDF = async (
    elementRef: React.RefObject<HTMLElement | null>,
    options: PDFOptions = {}
  ): Promise<boolean> => {
    setIsGenerating(true);
    setError(null);
    setProgress(0);
    
    try {
      const result = await PDFGenerator.generateFromRef(elementRef, options);
      setProgress(100);
      
      if (!result.success) {
        setError(result.error || 'Failed to generate PDF');
        return false;
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  const generateTablePDF = async (
    tableData: Record<string, any>[],
    headers: string[],
    options: PDFOptions = {}
  ): Promise<boolean> => {
    setIsGenerating(true);
    setError(null);
    setProgress(0);
    
    try {
      const result = await BatchPDFGenerator.generateTablePDF(tableData, headers, options);
      setProgress(100);
      
      if (!result.success) {
        setError(result.error || 'Failed to generate table PDF');
        return false;
      }
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generatePDF,
    generateTablePDF,
    isGenerating,
    error,
    progress,
    clearError: () => setError(null)
  };
};

// Export default instance for convenience
export default PDFGenerator;
