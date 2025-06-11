'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Printer, Settings2, FileText, Download, Mail, Eye } from 'lucide-react';
import { PDFGenerator } from '@/lib/pdf-utils';

interface PDFPrintPreviewProps {
  title?: string;
  children: React.ReactNode;
  filename?: string;
  onPrint?: () => void;
  onDownload?: () => void;
  onEmail?: () => void;
  className?: string;
}

interface PrintSettings {
  orientation: 'portrait' | 'landscape';
  paperSize: 'A4' | 'Letter' | 'Legal';
  margins: 'normal' | 'narrow' | 'wide' | 'custom';
  scale: number;
  headers: boolean;
  footers: boolean;
  backgroundColor: boolean;
  customMargins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export default function PDFPrintPreview({
  title = "Print Preview",
  children,
  filename = "document",
  onPrint,
  onDownload,
  onEmail,
  className = ""
}: PDFPrintPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<PrintSettings>({
    orientation: 'portrait',
    paperSize: 'A4',
    margins: 'normal',
    scale: 100,
    headers: true,
    footers: true,
    backgroundColor: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const marginPresets = {
    normal: { top: 1, right: 1, bottom: 1, left: 1 },
    narrow: { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 },
    wide: { top: 1.5, right: 1.5, bottom: 1.5, left: 1.5 },
    custom: settings.customMargins || { top: 1, right: 1, bottom: 1, left: 1 }
  };

  useEffect(() => {
    if (isOpen && contentRef.current) {
      generatePreview();
    }
  }, [isOpen, settings]);

  const generatePreview = async () => {
    if (!contentRef.current) return;

    setIsLoading(true);
    try {
      const margins = marginPresets[settings.margins];
      
      const result = await PDFGenerator.generateFromElement(contentRef.current, {
        filename: `${filename}_preview.pdf`,
        format: settings.paperSize.toLowerCase() as 'a4' | 'letter' | 'legal',
        orientation: settings.orientation,
        scale: settings.scale / 100,
        title: title,
        quality: 0.95
      });

      if (result.success && result.blob) {
        const url = URL.createObjectURL(result.blob);
        setPreviewUrl(url);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    if (previewRef.current) {
      previewRef.current.contentWindow?.print();
    }
    onPrint?.();
  };

  const handleDownload = async () => {
    if (previewUrl) {
      const link = document.createElement('a');
      link.href = previewUrl;
      link.download = `${filename}.pdf`;
      link.click();
    }
    onDownload?.();
  };

  const handleEmail = () => {
    if (previewUrl) {
      const emailBody = `Please find the attached ${title.toLowerCase()}.`;
      const emailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(emailBody)}`;
      window.open(emailUrl);
    }
    onEmail?.();
  };

  const updateCustomMargins = (side: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    setSettings(prev => ({
      ...prev,
      customMargins: {
        ...(prev.customMargins || { top: 1, right: 1, bottom: 1, left: 1 }),
        [side]: value
      }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <Eye className="h-4 w-4 mr-2" />
          Print Preview
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl w-full h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title} - Print Preview
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-4 flex-1 overflow-hidden">
          {/* Settings Panel */}
          <div className="w-80 space-y-4 p-4 border rounded-lg bg-gray-50 overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 className="h-4 w-4" />
              <h3 className="font-semibold">Print Settings</h3>
            </div>
            
            <div className="space-y-4">
              {/* Orientation */}
              <div>
                <Label htmlFor="orientation">Orientation</Label>
                <Select
                  value={settings.orientation}
                  onValueChange={(value: 'portrait' | 'landscape') =>
                    setSettings(prev => ({ ...prev, orientation: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Paper Size */}
              <div>
                <Label htmlFor="paperSize">Paper Size</Label>
                <Select
                  value={settings.paperSize}
                  onValueChange={(value: 'A4' | 'Letter' | 'Legal') =>
                    setSettings(prev => ({ ...prev, paperSize: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="Letter">Letter</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Margins */}
              <div>
                <Label htmlFor="margins">Margins</Label>
                <Select
                  value={settings.margins}
                  onValueChange={(value: 'normal' | 'narrow' | 'wide' | 'custom') =>
                    setSettings(prev => ({ ...prev, margins: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="narrow">Narrow</SelectItem>
                    <SelectItem value="wide">Wide</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Margins */}
              {settings.margins === 'custom' && (
                <div className="space-y-2 p-3 border rounded-lg bg-white">
                  <Label>Custom Margins (inches)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="marginTop" className="text-xs">Top</Label>
                      <Input
                        id="marginTop"
                        type="number"
                        step="0.1"
                        min="0"
                        value={settings.customMargins?.top || 1}
                        onChange={(e) => updateCustomMargins('top', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="marginRight" className="text-xs">Right</Label>
                      <Input
                        id="marginRight"
                        type="number"
                        step="0.1"
                        min="0"
                        value={settings.customMargins?.right || 1}
                        onChange={(e) => updateCustomMargins('right', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="marginBottom" className="text-xs">Bottom</Label>
                      <Input
                        id="marginBottom"
                        type="number"
                        step="0.1"
                        min="0"
                        value={settings.customMargins?.bottom || 1}
                        onChange={(e) => updateCustomMargins('bottom', parseFloat(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="marginLeft" className="text-xs">Left</Label>
                      <Input
                        id="marginLeft"
                        type="number"
                        step="0.1"
                        min="0"
                        value={settings.customMargins?.left || 1}
                        onChange={(e) => updateCustomMargins('left', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Scale */}
              <div>
                <Label htmlFor="scale">Scale (%)</Label>
                <Input
                  id="scale"
                  type="number"
                  min="25"
                  max="200"
                  step="5"
                  value={settings.scale}
                  onChange={(e) => setSettings(prev => ({ ...prev, scale: parseInt(e.target.value) }))}
                />
              </div>

              <Separator />

              {/* Options */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="headers"
                    checked={settings.headers}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, headers: !!checked }))
                    }
                  />
                  <Label htmlFor="headers">Headers</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="footers"
                    checked={settings.footers}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, footers: !!checked }))
                    }
                  />
                  <Label htmlFor="footers">Footers</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="backgroundColor"
                    checked={settings.backgroundColor}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({ ...prev, backgroundColor: !!checked }))
                    }
                  />
                  <Label htmlFor="backgroundColor">Background Graphics</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Preview</h3>
              <div className="flex gap-2">
                <Button onClick={handlePrint} disabled={!previewUrl || isLoading}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button onClick={handleDownload} disabled={!previewUrl || isLoading}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                {onEmail && (
                  <Button onClick={handleEmail} disabled={!previewUrl || isLoading}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 border rounded-lg overflow-hidden bg-white">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Generating preview...</p>
                  </div>
                </div>
              ) : previewUrl ? (
                <iframe
                  ref={previewRef}
                  src={previewUrl}
                  className="w-full h-full"
                  title="PDF Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Preview will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hidden content for PDF generation */}
        <div ref={contentRef} className="hidden">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
