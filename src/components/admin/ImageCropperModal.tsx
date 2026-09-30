import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Check, ZoomIn, ZoomOut, RotateCw, RefreshCw, Sparkles } from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  title?: string;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string, croppedBlob: Blob) => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  imageSrc,
  title = 'Crop & Adjust Company Logo',
  onClose,
  onCropComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  
  // Transform states
  const [zoom, setZoom] = useState(1);
  const [minZoom, setMinZoom] = useState(0.2);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [bgColor, setBgColor] = useState<'white' | 'transparent'>('white');
  const [isProcessing, setIsProcessing] = useState(false);

  // Dragging state
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const CANVAS_SIZE = 340; // Preview viewport size
  const CROP_BOX_SIZE = 280; // Crop box dimension
  const EXPORT_SIZE = 512; // High-res output size

  // Load image whenever imageSrc changes
  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      // Auto-fit image to crop box
      const scaleW = CROP_BOX_SIZE / img.width;
      const scaleH = CROP_BOX_SIZE / img.height;
      const initialScale = Math.min(scaleW, scaleH) * 0.95;
      const safeScale = Math.max(0.1, initialScale);
      
      setMinZoom(Math.max(0.05, safeScale * 0.5));
      setZoom(safeScale);
      setPan({ x: 0, y: 0 });
      setRotation(0);
    };
    img.onerror = () => {
      console.error('Failed to load image for cropping');
    };
    img.src = imageSrc;
  }, [isOpen, imageSrc]);

  // Draw preview canvas
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    // 1. Clear background
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // 2. Draw checkerboard pattern for transparent visibility
    const squareSize = 10;
    for (let x = 0; x < CANVAS_SIZE; x += squareSize) {
      for (let y = 0; y < CANVAS_SIZE; y += squareSize) {
        ctx.fillStyle = (Math.floor(x / squareSize) + Math.floor(y / squareSize)) % 2 === 0 ? '#f1f5f9' : '#ffffff';
        ctx.fillRect(x, y, squareSize, squareSize);
      }
    }

    // 3. Draw crop box background if white
    const cropX = (CANVAS_SIZE - CROP_BOX_SIZE) / 2;
    const cropY = (CANVAS_SIZE - CROP_BOX_SIZE) / 2;

    if (bgColor === 'white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cropX, cropY, CROP_BOX_SIZE, CROP_BOX_SIZE);
    }

    // 4. Draw image inside crop bounds
    ctx.save();
    // Clip to crop box so user sees exact bounds
    ctx.beginPath();
    ctx.rect(cropX, cropY, CROP_BOX_SIZE, CROP_BOX_SIZE);
    ctx.clip();

    // Center of canvas
    ctx.translate(CANVAS_SIZE / 2 + pan.x, CANVAS_SIZE / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    ctx.drawImage(image, -image.width / 2, -image.height / 2);
    ctx.restore();

    // 5. Draw dark translucent overlay outside the crop box
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    // Top
    ctx.fillRect(0, 0, CANVAS_SIZE, cropY);
    // Bottom
    ctx.fillRect(0, cropY + CROP_BOX_SIZE, CANVAS_SIZE, cropY);
    // Left
    ctx.fillRect(0, cropY, cropX, CROP_BOX_SIZE);
    // Right
    ctx.fillRect(cropX + CROP_BOX_SIZE, cropY, cropX, CROP_BOX_SIZE);

    // Crop box outline
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(cropX, cropY, CROP_BOX_SIZE, CROP_BOX_SIZE);

    // Corner brackets
    ctx.setLineDash([]);
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 3;
    const corner = 14;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(cropX, cropY + corner);
    ctx.lineTo(cropX, cropY);
    ctx.lineTo(cropX + corner, cropY);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(cropX + CROP_BOX_SIZE - corner, cropY);
    ctx.lineTo(cropX + CROP_BOX_SIZE, cropY);
    ctx.lineTo(cropX + CROP_BOX_SIZE, cropY + corner);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(cropX, cropY + CROP_BOX_SIZE - corner);
    ctx.lineTo(cropX, cropY + CROP_BOX_SIZE);
    ctx.lineTo(cropX + corner, cropY + CROP_BOX_SIZE);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(cropX + CROP_BOX_SIZE - corner, cropY + CROP_BOX_SIZE);
    ctx.lineTo(cropX + CROP_BOX_SIZE, cropY + CROP_BOX_SIZE);
    ctx.lineTo(cropX + CROP_BOX_SIZE, cropY + CROP_BOX_SIZE - corner);
    ctx.stroke();

    ctx.restore();
  }, [image, zoom, pan, rotation, bgColor]);

  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  // Mouse / Touch handlers for panning
  const handlePointerDown = (clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: clientX - pan.x, y: clientY - pan.y };
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    setPan({
      x: clientX - dragStartRef.current.x,
      y: clientY - dragStartRef.current.y,
    });
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.05 : -0.05;
    setZoom((prev) => Math.max(minZoom, Math.min(prev + zoomDelta, 4.0)));
  };

  // Reset positioning and fit
  const handleReset = () => {
    if (!image) return;
    const scaleW = CROP_BOX_SIZE / image.width;
    const scaleH = CROP_BOX_SIZE / image.height;
    const initialScale = Math.min(scaleW, scaleH) * 0.95;
    setZoom(initialScale);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Export high resolution crop
  const handleApplyCrop = async () => {
    if (!image) return;
    setIsProcessing(true);

    try {
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = EXPORT_SIZE;
      exportCanvas.height = EXPORT_SIZE;
      const ctx = exportCanvas.getContext('2d');

      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      // Background
      if (bgColor === 'white') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);
      } else {
        ctx.clearRect(0, 0, EXPORT_SIZE, EXPORT_SIZE);
      }

      // Scaling factor from preview box to export size
      const scaleMultiplier = EXPORT_SIZE / CROP_BOX_SIZE;

      ctx.save();
      // Center of export canvas
      ctx.translate(EXPORT_SIZE / 2 + pan.x * scaleMultiplier, EXPORT_SIZE / 2 + pan.y * scaleMultiplier);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom * scaleMultiplier, zoom * scaleMultiplier);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(image, -image.width / 2, -image.height / 2);
      ctx.restore();

      const dataUrl = exportCanvas.toDataURL('image/png', 0.95);

      exportCanvas.toBlob((blob) => {
        if (blob) {
          onCropComplete(dataUrl, blob);
          onClose();
        }
        setIsProcessing(false);
      }, 'image/png', 0.95);
    } catch (err) {
      console.error('Failed to crop image:', err);
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '480px', 
          padding: '1.75rem',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)' 
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={18} color="#2563eb" /> {title}
            </h3>
            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
              Drag to reposition • Use slider to scale logo
            </p>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            style={{ position: 'static', width: '32px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {/* Interactive Canvas Area */}
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            background: '#0f172a', 
            borderRadius: '12px', 
            padding: '10px',
            touchAction: 'none',
            overflow: 'hidden',
            cursor: 'grab',
          }}
          onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
          onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={(e) => e.touches[0] && handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchMove={(e) => e.touches[0] && handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)}
          onTouchEnd={handlePointerUp}
          onWheel={handleWheel}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: `${CANVAS_SIZE}px`,
              height: `${CANVAS_SIZE}px`,
              borderRadius: '8px',
              display: 'block',
            }}
          />
        </div>

        {/* Controls Bar */}
        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          
          {/* Zoom Slider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              type="button" 
              className="admin-icon-btn" 
              title="Zoom out"
              onClick={() => setZoom((z) => Math.max(minZoom, z - 0.08))}
            >
              <ZoomOut size={16} />
            </button>
            <input 
              type="range" 
              min={minZoom} 
              max={3.0} 
              step={0.01} 
              value={zoom} 
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: '#2563eb', cursor: 'pointer' }}
            />
            <button 
              type="button" 
              className="admin-icon-btn" 
              title="Zoom in"
              onClick={() => setZoom((z) => Math.min(3.0, z + 0.08))}
            >
              <ZoomIn size={16} />
            </button>
            <span style={{ fontSize: '0.8rem', color: '#64748b', minWidth: '40px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
              {Math.round((zoom / minZoom) * 100)}%
            </span>
          </div>

          {/* Quick Tools & Background */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
            
            {/* Background Fill Options */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Background:</span>
              <button
                type="button"
                onClick={() => setBgColor('white')}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  border: bgColor === 'white' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: bgColor === 'white' ? '#2563eb' : '#475569',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                White
              </button>
              <button
                type="button"
                onClick={() => setBgColor('transparent')}
                style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  border: bgColor === 'transparent' ? '2px solid #2563eb' : '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: bgColor === 'transparent' ? '#2563eb' : '#475569',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Transparent
              </button>
            </div>

            {/* Transform shortcuts */}
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', gap: '0.3rem' }}
                onClick={handleRotate}
                title="Rotate 90°"
              >
                <RotateCw size={13} /> Rotate
              </button>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', gap: '0.3rem' }}
                onClick={handleReset}
                title="Center & Reset"
              >
                <RefreshCw size={13} /> Reset
              </button>
            </div>

          </div>

        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleApplyCrop}
            disabled={isProcessing || !image}
            style={{ gap: '0.4rem' }}
          >
            <Check size={16} /> {isProcessing ? 'Processing...' : 'Apply Crop & Use'}
          </button>
        </div>

      </div>
    </div>
  );
};
