'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Video,
  Eye,
  Camera,
  Maximize2,
  RefreshCw,
  Building2,
  Lock,
  Radio,
  Users,
  Sparkles,
  WifiOff,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';

interface DvrChannel {
  id: number;
  name: string;
  enabled: boolean;
  resolution: string;
  videoFormat: string;
}

interface DvrDevice {
  deviceName: string;
  model: string;
  serialNumber: string;
  firmwareVersion: string;
}

interface SurveillanceManagementViewProps {
  currentFilter?: string;
  searchQuery?: string;
}

export const SurveillanceManagementView: React.FC<SurveillanceManagementViewProps> = ({
  currentFilter = 'ALL',
  searchQuery = '',
}) => {
  const { language } = useLanguage();
  const { success: toastSuccess, info: toastInfo, error: toastError } = useToast();

  const [device, setDevice] = useState<DvrDevice | null>(null);
  const [channels, setChannels] = useState<DvrChannel[]>([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [selectedChannelId, setSelectedChannelId] = useState<number>(1);
  const [ownerPermissions, setOwnerPermissions] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: false,
    5: true,
    6: false,
    7: false,
    8: false,
  });

  const [isNightVision, setIsNightVision] = useState(false);
  const [isHdStream, setIsHdStream] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [streamError, setStreamError] = useState(false);
  const [streamKey, setStreamKey] = useState<number>(() => Date.now());
  const [currentTime, setCurrentTime] = useState('');
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const loadDvrChannels = async () => {
    setIsLoadingChannels(true);
    try {
      const res = await fetch('/api/cctv/channels', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.channels) && data.channels.length > 0) {
        setDevice(data.device);
        setChannels(data.channels);
        if (!data.channels.some((c: DvrChannel) => c.id === selectedChannelId)) {
          setSelectedChannelId(data.channels[0].id);
        }
      } else {
        // Fallback 8-channel list if DVR is temporarily unreachable
        setChannels(
          Array.from({ length: 8 }, (_, idx) => ({
            id: idx + 1,
            name: `Camera 0${idx + 1}`,
            enabled: true,
            resolution: '1080P30',
            videoFormat: 'NTSC',
          }))
        );
      }
    } catch {
      toastError(
        language === 'en'
          ? 'Could not query DVR channel list.'
          : 'No se pudo consultar la lista de canales del DVR.'
      );
    } finally {
      setIsLoadingChannels(false);
    }
  };

  useEffect(() => {
    loadDvrChannels();
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace('T', ' ').slice(0, 19) + ' EST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredChannels = useMemo(() => {
    return channels.filter((ch) => {
      const matchesFilter =
        !currentFilter ||
        currentFilter === 'ALL' ||
        (currentFilter === 'zionsville' && ch.id <= 4) ||
        (currentFilter === 'park100' && ch.id >= 5);

      const matchesSearch =
        !searchQuery ||
        ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `ch ${ch.id}`.includes(searchQuery.toLowerCase()) ||
        `0${ch.id}`.includes(searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [channels, currentFilter, searchQuery]);

  const selectedChannel =
    filteredChannels.find((c) => c.id === selectedChannelId) ||
    filteredChannels[0] ||
    channels[0] || {
      id: 1,
      name: 'Camera 01',
      enabled: true,
      resolution: '1080P30',
      videoFormat: 'NTSC',
    };

  const handleSelectChannel = (id: number) => {
    setSelectedChannelId(id);
    setStreamError(false);
    setIsLive(true);
    setStreamKey(Date.now());
  };

  const handleFullscreen = () => {
    if (playerContainerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        playerContainerRef.current.requestFullscreen();
      }
    }
  };

  const handleSnapshot = async () => {
    try {
      const res = await fetch(`/api/cctv/snapshot?channel=${selectedChannel.id}&hd=1`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Snapshot failed');
      const blob = await res.blob();
      const imgBitmap = await createImageBitmap(blob);

      const canvas = document.createElement('canvas');
      canvas.width = imgBitmap.width || 1280;
      canvas.height = imgBitmap.height || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(imgBitmap, 0, 0, canvas.width, canvas.height);

        // Top watermark bar
        ctx.fillStyle = 'rgba(7, 13, 24, 0.72)';
        ctx.fillRect(0, 0, canvas.width, 54);
        ctx.font = 'bold 20px monospace';
        ctx.fillStyle = '#F3D270';
        ctx.fillText(
          `HYCO CCTV — CH 0${selectedChannel.id} (${selectedChannel.name})`,
          20,
          34
        );

        ctx.font = '16px monospace';
        ctx.fillStyle = '#FFFFFF';
        const timeWidth = ctx.measureText(currentTime).width;
        ctx.fillText(currentTime, canvas.width - timeWidth - 20, 34);

        const link = document.createElement('a');
        link.download = `HYCO-CCTV-CH0${selectedChannel.id}-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        toastSuccess(
          language === 'en'
            ? 'Live HD security snapshot downloaded.'
            : 'Captura HD en vivo descargada con marca de tiempo.',
          language === 'en' ? 'Snapshot Captured' : 'Captura Guardada'
        );
      }
    } catch {
      toastError(
        language === 'en'
          ? 'Unable to capture live frame from DVR.'
          : 'No se pudo capturar el fotograma en vivo del DVR.'
      );
    }
  };

  const handleRefreshStream = () => {
    setStreamError(false);
    setIsLive(false);
    setStreamKey(Date.now());
    setTimeout(() => {
      setIsLive(true);
      toastInfo(
        language === 'en'
          ? `Channel 0${selectedChannel.id} live stream resynchronized.`
          : `Canal 0${selectedChannel.id} resincronizado en vivo.`,
        'Hikvision ISAPI Proxy'
      );
    }, 300);
  };

  const toggleOwnerAccess = (channelId: number) => {
    const nextVal = !ownerPermissions[channelId];
    setOwnerPermissions((prev) => ({ ...prev, [channelId]: nextVal }));
    toastSuccess(
      nextVal
        ? language === 'en'
          ? 'Owner portal delegation enabled for this camera.'
          : 'Acceso delegado a propietario habilitado para esta cámara.'
        : language === 'en'
        ? 'Camera restricted exclusively to internal Management.'
        : 'Cámara restringida exclusivamente a Administración interna.',
      language === 'en' ? 'Access Policy Updated' : 'Permiso Actualizado'
    );
  };

  const liveStreamUrl = `/api/cctv/stream?channel=${selectedChannel.id}&hd=${isHdStream ? '1' : '0'}&t=${streamKey}`;

  return (
    <div className="space-y-6 w-full">
      {/* Executive Access & Plugin-Free Notice */}
      <div className="glass-card rounded-2xl p-4 border border-[#D4AF37]/25 bg-[#D4AF37]/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#D4AF37]/15 text-[#F3D270] border border-[#D4AF37]/30 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white flex flex-wrap items-center gap-2">
              <span>
                {language === 'en'
                  ? 'Plugin-Free Live CCTV Management Console'
                  : 'Consola de Vigilancia CCTV en Vivo (Sin Plugins)'}
              </span>
              {device && (
                <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-[#F3D270] font-mono text-[10px] border border-white/10">
                  {device.model}
                </span>
              )}
            </h2>
            <p className="text-[11px] text-white/70">
              {language === 'en'
                ? 'Cross-browser ISAPI Digest Proxy streaming directly to Chrome, Safari, Edge, and Mobile without legacy IE ActiveX plugins. Restricted to Management & Owners.'
                : 'Transmisión directa vía Proxy ISAPI compatible con Chrome, Safari, Edge y Móviles sin plugins heredados de Internet Explorer. Uso exclusivo de Administración y Propietarios.'}
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0 self-start sm:self-center">
          {isLoadingChannels ? 'Connecting DVR...' : 'DVR Connected (Live)'}
        </span>
      </div>

      {/* Main 12-Col Grid: Video Stage + Camera Nodes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Columns: Active Live Stream */}
        <div className="lg:col-span-8 space-y-4">
          <div
            ref={playerContainerRef}
            className="relative rounded-3xl overflow-hidden bg-black border border-white/10 shadow-2xl aspect-video group"
          >
            {streamError ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/70 p-6 text-center">
                <WifiOff className="w-10 h-10 text-rose-400" />
                <p className="text-xs font-semibold">
                  {language === 'en'
                    ? `Channel 0${selectedChannel.id} stream interrupted.`
                    : `Flujo del Canal 0${selectedChannel.id} interrumpido.`}
                </p>
                <button
                  onClick={handleRefreshStream}
                  className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#070D18] text-xs font-bold cursor-pointer hover:brightness-110"
                >
                  {language === 'en' ? 'Reconnect Feed' : 'Reconectar Cámara'}
                </button>
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={liveStreamUrl}
                src={liveStreamUrl}
                alt={selectedChannel.name}
                onError={() => setStreamError(true)}
                className={`w-full h-full object-cover transition-all duration-300 ${
                  isNightVision ? 'grayscale contrast-125 brightness-95' : ''
                }`}
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/35 pointer-events-none" />

            {/* Top HUD */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-mono font-bold text-[10px] flex items-center gap-1.5 shadow-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {isLive ? 'LIVE MJPEG' : 'SYNCING...'}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white font-mono text-[10px] border border-white/10">
                  CH 0{selectedChannel.id} • {isHdStream ? 'HD Main' : 'Sub-Stream'} • {selectedChannel.resolution}
                </span>
              </div>

              <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[#F3D270] font-mono text-[10px] border border-[#D4AF37]/30">
                {currentTime}
              </span>
            </div>

            {/* Bottom HUD */}
            <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#F3D270] mb-0.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{device?.deviceName || 'HYCO Commercial Complex DVR'}</span>
                </div>
                <h3 className="text-sm font-bold text-white">
                  CH 0{selectedChannel.id} — {selectedChannel.name}
                </h3>
                <p className="text-[11px] text-white/60 font-mono">
                  {device?.model || 'DS-7208HUHI-K2'} • {selectedChannel.videoFormat} • Zero-Plugin HTTPS Stream
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setIsHdStream(!isHdStream);
                    setStreamKey(Date.now());
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                    isHdStream
                      ? 'bg-[#D4AF37] text-[#070D18] border-[#D4AF37]'
                      : 'bg-black/60 text-white border-white/20 hover:bg-white/10'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isHdStream ? 'HD 1080p' : 'Fast Stream'}</span>
                </button>
                <button
                  onClick={() => setIsNightVision(!isNightVision)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                    isNightVision
                      ? 'bg-[#D4AF37] text-[#070D18] border-[#D4AF37]'
                      : 'bg-black/60 text-white border-white/20 hover:bg-white/10'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Night IR' : 'Visión IR'}</span>
                </button>
                <button
                  onClick={handleSnapshot}
                  className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-white/10 text-white border border-white/20 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Snapshot' : 'Captura'}</span>
                </button>
                <button
                  onClick={handleRefreshStream}
                  className="p-2 rounded-xl bg-black/60 hover:bg-white/10 text-white border border-white/20 transition-all cursor-pointer"
                  title={language === 'en' ? 'Resync Stream' : 'Resincronizar'}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${!isLive ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleFullscreen}
                  className="p-2 rounded-xl bg-black/60 hover:bg-white/10 text-white border border-white/20 transition-all cursor-pointer"
                  title={language === 'en' ? 'Fullscreen' : 'Pantalla Completa'}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Columns: Live DVR Channel Directory & Owner Delegation Controls */}
        <div className="lg:col-span-4 space-y-3 max-h-[540px] overflow-y-auto pr-1 scrollbar-thin">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/60">
              {language === 'en'
                ? `DVR Channels (${filteredChannels.length})`
                : `Canales DVR (${filteredChannels.length})`}
            </span>
            <button
              onClick={loadDvrChannels}
              className="text-[10px] text-[#F3D270] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Radio className="w-3 h-3" /> {language === 'en' ? 'Refresh DVR' : 'Actualizar DVR'}
            </button>
          </div>

          {filteredChannels.map((ch) => {
            const isSelected = ch.id === selectedChannel.id;
            const ownerAllowed = ownerPermissions[ch.id] ?? false;

            return (
              <div
                key={ch.id}
                onClick={() => handleSelectChannel(ch.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50 shadow-lg shadow-[#D4AF37]/10'
                    : 'bg-[#0B1526]/80 border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <Video className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#F3D270]' : 'text-white/50'}`} />
                    <span className="text-xs font-bold text-white">
                      CH 0{ch.id} — {ch.name}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                      ch.enabled
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {ch.enabled ? 'ONLINE' : 'STANDBY'}
                  </span>
                </div>

                <p className="text-[11px] text-white/60 mb-3 font-mono">
                  {ch.resolution} • {ch.videoFormat}
                </p>

                <div
                  className="pt-2.5 border-t border-white/[0.06] flex items-center justify-between"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[10px] text-white/50 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {language === 'en' ? 'Owner Portal Access' : 'Acceso a Propietario'}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleOwnerAccess(ch.id)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                      ownerAllowed
                        ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                        : 'bg-white/[0.05] text-white/50 border border-white/10'
                    }`}
                  >
                    {ownerAllowed
                      ? language === 'en'
                        ? 'Enabled'
                        : 'Habilitado'
                      : language === 'en'
                      ? 'Internal Only'
                      : 'Solo Interno'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
