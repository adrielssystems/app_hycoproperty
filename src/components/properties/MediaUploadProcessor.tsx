'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Video,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Film,
  Zap,
} from 'lucide-react';
import {
  optimizeImage,
  processAndOptimizeVideo,
  formatBytes,
  OptimizedImageResult,
  OptimizedVideoResult,
} from '@/lib/mediaOptimizer';
import { useLanguage } from '@/context/LanguageContext';

interface MediaUploadProcessorProps {
  initialImageUrl?: string | null;
  initialVideoUrl?: string | null;
  onImageChange: (imageUrl: string | null) => void;
  onVideoChange: (videoUrl: string | null) => void;
}

export const MediaUploadProcessor: React.FC<MediaUploadProcessorProps> = ({
  initialImageUrl = null,
  initialVideoUrl = null,
  onImageChange,
  onVideoChange,
}) => {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');

  // Drag and drop hover states
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);

  // Image processing state
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageResult, setImageResult] = useState<OptimizedImageResult | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(initialImageUrl);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Video processing state
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [videoResult, setVideoResult] = useState<OptimizedVideoResult | null>(null);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(initialVideoUrl);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Process image file
  const processImageFile = async (file: File) => {
    setIsProcessingImage(true);
    try {
      const result = await optimizeImage(file, 1920, 1080, 0.82);
      setImageResult(result);
      setCurrentImageUrl(result.dataUrl);
      onImageChange(result.dataUrl);
    } catch (err) {
      console.error('Image optimization failed:', err);
      alert('Error optimizando la imagen.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Process video file
  const processVideoFile = async (file: File) => {
    setIsProcessingVideo(true);
    try {
      const result = await processAndOptimizeVideo(file);
      setVideoResult(result);
      setCurrentVideoUrl(result.videoUrl);
      onVideoChange(result.videoUrl);
    } catch (err) {
      console.error('Video optimization failed:', err);
      alert('Error procesando el video.');
    } finally {
      setIsProcessingVideo(false);
    }
  };

  // Drag & drop handlers for Image
  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(true);
  };

  const handleImageDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingImage(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    }
  };

  // Drag & drop handlers for Video
  const handleVideoDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingVideo(true);
  };

  const handleVideoDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingVideo(false);
  };

  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingVideo(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      processVideoFile(file);
    }
  };

  return (
    <div className="space-y-3 w-full">
      {/* Sub-Tabs: Image / Video */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('image')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'image'
              ? 'bg-[#D4AF37]/15 text-[#F3D270] border border-[#D4AF37]/30 shadow-sm'
              : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <ImageIcon size={14} />
          <span>{language === 'en' ? 'Photo' : 'Foto'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('video')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'video'
              ? 'bg-[#D4AF37]/15 text-[#F3D270] border border-[#D4AF37]/30 shadow-sm'
              : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
          }`}
        >
          <Video size={14} />
          <span>{language === 'en' ? 'Video' : 'Video'}</span>
        </button>
      </div>

      {/* IMAGE DRAG & DROP ZONE */}
      {activeTab === 'image' && (
        <div className="space-y-3">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processImageFile(file);
            }}
          />

          {!currentImageUrl ? (
            <div
              onClick={() => imageInputRef.current?.click()}
              onDragOver={handleImageDragOver}
              onDragEnter={handleImageDragOver}
              onDragLeave={handleImageDragLeave}
              onDrop={handleImageDrop}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all group ${
                isDraggingImage
                  ? 'border-[#D4AF37] bg-[#D4AF37]/10 scale-[1.01]'
                  : 'border-white/15 hover:border-[#D4AF37]/50 bg-white/[0.01] hover:bg-white/[0.03]'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-[#F3D270] mx-auto mb-2 group-hover:scale-110 transition-transform">
                <Upload size={18} />
              </div>
              <p className="text-xs font-bold text-white">
                {language === 'en' ? 'Drag & Drop photo here, or click to browse' : 'Arrastra y suelta tu foto aquí, o haz clic'}
              </p>
              <p className="text-[11px] text-white/40 mt-0.5">
                {language === 'en'
                  ? 'PNG, JPG, WebP auto-optimized'
                  : 'Formato optimizado automáticamente'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="relative rounded-xl overflow-hidden border border-white/[0.1] bg-black/40 group max-h-48 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={currentImageUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover"
                />

                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#070D18]/85 backdrop-blur-md text-[#F3D270] border border-[#D4AF37]/30 flex items-center gap-1">
                    <Sparkles size={10} />
                    WebP Ready
                  </span>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="p-1 rounded-lg bg-[#070D18]/85 backdrop-blur-md text-white hover:text-[#F3D270] transition-colors border border-white/20"
                    title={language === 'en' ? 'Replace' : 'Cambiar'}
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
              </div>

              {imageResult && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 size={13} />
                    <span>{language === 'en' ? 'WebP Optimized' : 'Optimizado'}</span>
                  </div>

                  <div className="flex items-center gap-2 text-white/60">
                    <span>
                      {formatBytes(imageResult.originalSize)} &rarr; <strong className="text-white">{formatBytes(imageResult.optimizedSize)}</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300">
                      -{imageResult.savingsPercent}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {isProcessingImage && (
            <div className="flex items-center justify-center gap-2 text-xs text-[#F3D270] py-1.5 animate-pulse font-medium">
              <Zap size={13} className="animate-spin" />
              <span>{language === 'en' ? 'Converting to WebP...' : 'Convirtiendo a WebP...'}</span>
            </div>
          )}
        </div>
      )}

      {/* VIDEO DRAG & DROP ZONE */}
      {activeTab === 'video' && (
        <div className="space-y-3">
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processVideoFile(file);
            }}
          />

          {!currentVideoUrl ? (
            <div
              onClick={() => videoInputRef.current?.click()}
              onDragOver={handleVideoDragOver}
              onDragEnter={handleVideoDragOver}
              onDragLeave={handleVideoDragLeave}
              onDrop={handleVideoDrop}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all group ${
                isDraggingVideo
                  ? 'border-[#D4AF37] bg-[#D4AF37]/10 scale-[1.01]'
                  : 'border-white/15 hover:border-[#D4AF37]/50 bg-white/[0.01] hover:bg-white/[0.03]'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-[#F3D270] mx-auto mb-2 group-hover:scale-110 transition-transform">
                <Video size={18} />
              </div>
              <p className="text-xs font-bold text-white">
                {language === 'en' ? 'Drag & Drop video tour here, or click to browse' : 'Arrastra y suelta tu video aquí, o haz clic'}
              </p>
              <p className="text-[11px] text-white/40 mt-0.5">
                {language === 'en'
                  ? 'MP4, WebM, MOV with auto-poster'
                  : 'Video optimizado con portada automática'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="relative rounded-xl overflow-hidden border border-white/[0.1] bg-black max-h-52 flex items-center justify-center">
                <video
                  src={currentVideoUrl}
                  controls
                  className="w-full max-h-52 object-contain"
                  poster={videoResult?.posterUrl || undefined}
                />

                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#070D18]/85 backdrop-blur-md text-[#F3D270] border border-[#D4AF37]/30 flex items-center gap-1">
                    <Film size={10} />
                    H.264
                  </span>
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="p-1 rounded-lg bg-[#070D18]/85 backdrop-blur-md text-white hover:text-[#F3D270] transition-colors border border-white/20"
                    title={language === 'en' ? 'Replace' : 'Cambiar'}
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
              </div>

              {videoResult && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <CheckCircle2 size={13} />
                    <span>{language === 'en' ? 'Poster & Stream Ready' : 'Portada y Streaming Listos'}</span>
                  </div>

                  <div className="flex items-center gap-2 text-white/60">
                    <span>{videoResult.durationFormatted}</span>
                    <span className="text-[#F3D270]">{videoResult.aspectRatio}</span>
                    <span>{formatBytes(videoResult.originalSize)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {isProcessingVideo && (
            <div className="flex items-center justify-center gap-2 text-xs text-[#F3D270] py-1.5 animate-pulse font-medium">
              <Zap size={13} className="animate-spin" />
              <span>{language === 'en' ? 'Extracting poster thumbnail...' : 'Extrayendo portada WebP...'}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
