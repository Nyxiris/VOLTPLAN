import React, { useEffect, useRef, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { loadPDF, renderPageToCanvas } from '../../lib/pdf-utils';

interface PdfPreviewModalProps {
  url: string | null;
  onClose: () => void;
}

export default function PdfPreviewModal({ url, onClose }: PdfPreviewModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url || !canvasRef.current) return;

    const loadAndRender = async () => {
      setLoading(true);
      try {
        const pdf = await loadPDF(url);
        await renderPageToCanvas(pdf, 1, canvasRef.current!, 1.5);
      } catch (error) {
        console.error("Error rendering PDF:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAndRender();
  }, [url]);

  if (!url) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden max-w-[80vw] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <h3 className="font-bold text-white">Aperçu du Plan</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50">
              <Loader2 className="animate-spin text-blue-500" size={40} />
            </div>
          )}
          <canvas ref={canvasRef} className="max-w-full max-h-full" />
        </div>
      </div>
    </div>
  );
}
