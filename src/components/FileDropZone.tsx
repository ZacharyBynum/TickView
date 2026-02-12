import { Upload } from 'lucide-react';

interface FileDropZoneProps {
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: () => void;
}

export default function FileDropZone({ isDragging, onDragOver, onDragLeave, onDrop, onFileSelect }: FileDropZoneProps) {
  return (
    <div className="app">
      <div
        className="file-drop-zone"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div
          className={`file-drop-area${isDragging ? ' dragging' : ''}`}
          onClick={onFileSelect}
        >
          <Upload size={48} className="file-drop-icon" />
          <div className="file-drop-title">Load Tick Data</div>
          <div className="file-drop-subtitle">
            Drag & drop a tick data file here, or click to browse
          </div>
          <div className="file-drop-hint">
            Supports NinjaTrader .txt exports (YYYYMMDD HHmmss format)
          </div>
        </div>
      </div>
    </div>
  );
}
