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
  Key,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface PropertyItem {
  id: number;
  name: string;
  legal_name?: string;
}

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

interface DvrConfigRecord {
  id: number;
  property_id: number;
  host: string;
  port: string;
  username: string;
  device_model?: string;
  hasPassword: boolean;
}

interface SurveillanceManagementViewProps {
  properties?: PropertyItem[];
  userRole?: string;
  currentFilter?: string;
  searchQuery?: string;
}

export const SurveillanceManagementView: React.FC<SurveillanceManagementViewProps> = ({
  properties = [],
  userRole,
  currentFilter = 'ALL',
  searchQuery = '',
}) => {
  const { language } = useLanguage();
  const { success: toastSuccess, info: toastInfo, error: toastError } = useToast();

  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  const propertyOptions: PropertyItem[] = useMemo(() => {
    if (properties && properties.length > 0) return properties;
    return [
      { id: 1, name: '7898 Zionsville Rd Commercial Center' },
      { id: 2, name: 'Park 100 Industrial Center' },
      { id: 3, name: 'Morris Street Flex & Service Hub' },
      { id: 4, name: 'Meridian North Executive Suites' },
    ];
  }, [properties]);

  const [selectedPropertyId, setSelectedPropertyId] = useState<number>(propertyOptions[0]?.id || 1);
  const [device, setDevice] = useState<DvrDevice | null>(null);
  const [channels, setChannels] = useState<DvrChannel[]>([]);
  const [configSource, setConfigSource] = useState<string>('env');
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

  // SUPER_ADMIN DVR Config Modal State
  const [dvrConfigs, setDvrConfigs] = useState<DvrConfigRecord[]>([]);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [dvrForm, setDvrForm] = useState({
    property_id: 1,
    host: '',
    port: '80',
    username: '',
    password: '',
  });
  const [isTestingDvr, setIsTestingDvr] = useState(false);
  const [isSavingDvr, setIsSavingDvr] = useState(false);

  const loadDvrChannels = async (propId = selectedPropertyId) => {
    setIsLoadingChannels(true);
    setStreamError(false);
    try {
      const res = await fetch(`/api/cctv/channels?propertyId=${propId}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.channels) && data.channels.length > 0) {
        setDevice(data.device);
        setChannels(data.channels);
        setConfigSource(data.source || 'env');
        if (!data.channels.some((c: DvrChannel) => c.id === selectedChannelId)) {
          setSelectedChannelId(data.channels[0].id);
        }
      } else {
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

  const loadSuperAdminConfigs = async () => {
    if (!isSuperAdmin) return;
    try {
      const res = await fetch('/api/cctv/config', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.configs)) {
        setDvrConfigs(data.configs);
      }
    } catch {
      // Ignore silent preload failure
    }
  };

  useEffect(() => {
    loadDvrChannels(selectedPropertyId);
    setStreamKey(Date.now());
  }, [selectedPropertyId]);

  useEffect(() => {
    if (isSuperAdmin) {
      loadSuperAdminConfigs();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace('T', ' ').slice(0, 19) + ' EST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const openConfigModal = (propId = selectedPropertyId) => {
    const existing = dvrConfigs.find((c) => c.property_id === propId);
    setDvrForm({
      property_id: propId,
      host: existing?.host || '',
      port: existing?.port || '80',
      username: existing?.username || '',
      password: '',
    });
    setIsConfigModalOpen(true);
  };

  const handleTestDvrConnection = async () => {
    setIsTestingDvr(true);
    try {
      const res = await fetch('/api/cctv/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dvrForm, action: 'test' }),
      });
      const data = await res.json();
      if (data.success) {
        toastSuccess(
          language === 'en'
            ? `Connected to ${data.device?.model || 'Hikvision DVR'} (${data.channelCount} channels detected).`
            : `Conectado a ${data.device?.model || 'DVR Hikvision'} (${data.channelCount} canales detectados).`,
          language === 'en' ? 'Connection Verified' : 'Conexión Verificada'
        );
      } else {
        toastError(data.message || 'Connection failed');
      }
    } catch {
      toastError(language === 'en' ? 'Error testing DVR connection.' : 'Error al probar conexión con DVR.');
    } finally {
      setIsTestingDvr(false);
    }
  };

  const handleSaveDvrConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDvr(true);
    try {
      const res = await fetch('/api/cctv/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dvrForm, action: 'save' }),
      });
      const data = await res.json();
      if (data.success) {
        toastSuccess(
          language === 'en'
            ? 'Encrypted DVR credentials saved for property.'
            : 'Credenciales cifradas del DVR guardadas para la propiedad.',
          language === 'en' ? 'DVR Saved' : 'DVR Guardado'
        );
        setIsConfigModalOpen(false);
        await loadSuperAdminConfigs();
        if (dvrForm.property_id === selectedPropertyId) {
          await loadDvrChannels(selectedPropertyId);
          setStreamKey(Date.now());
        }
      } else {
        toastError(data.message || 'Error saving DVR config');
      }
    } catch {
      toastError(language === 'en' ? 'Network error saving DVR.' : 'Error de red al guardar DVR.');
    } finally {
      setIsSavingDvr(false);
    }
  };

  const handleDeleteDvrConfig = async () => {
    try {
      const res = await fetch(`/api/cctv/config?propertyId=${dvrForm.property_id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toastInfo(
          language === 'en'
            ? 'Property DVR config removed (reverted to default fallback).'
            : 'Configuración DVR removida (usando respaldo por defecto).'
        );
        setIsConfigModalOpen(false);
        await loadSuperAdminConfigs();
        await loadDvrChannels(selectedPropertyId);
      }
    } catch {
      toastError('Error removing config');
    }
  };

  const filteredChannels = useMemo(() => {
    return channels.filter((ch) => {
      const matchesSearch =
        !searchQuery ||
        ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `ch ${ch.id}`.includes(searchQuery.toLowerCase()) ||
        `0${ch.id}`.includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [channels, searchQuery]);

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

  const activePropertyName =
    propertyOptions.find((p) => p.id === selectedPropertyId)?.name || 'HYCO Complex';

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
      const res = await fetch(
        `/api/cctv/snapshot?propertyId=${selectedPropertyId}&channel=${selectedChannel.id}&hd=1`,
        { cache: 'no-store' }
      );
      if (!res.ok) throw new Error('Snapshot failed');
      const blob = await res.blob();
      const imgBitmap = await createImageBitmap(blob);

      const canvas = document.createElement('canvas');
      canvas.width = imgBitmap.width || 1280;
      canvas.height = imgBitmap.height || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(imgBitmap, 0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'rgba(7, 13, 24, 0.72)';
        ctx.fillRect(0, 0, canvas.width, 54);
        ctx.font = 'bold 20px monospace';
        ctx.fillStyle = '#F3D270';
        ctx.fillText(
          `HYCO CCTV — ${activePropertyName} • CH 0${selectedChannel.id}`,
          20,
          34
        );

        ctx.font = '16px monospace';
        ctx.fillStyle = '#FFFFFF';
        const timeWidth = ctx.measureText(currentTime).width;
        ctx.fillText(currentTime, canvas.width - timeWidth - 20, 34);

        const link = document.createElement('a');
        link.download = `HYCO-CCTV-P${selectedPropertyId}-CH0${selectedChannel.id}-${Date.now()}.png`;
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

  const liveStreamUrl = `/api/cctv/stream?propertyId=${selectedPropertyId}&channel=${selectedChannel.id}&hd=${
    isHdStream ? '1' : '0'
  }&t=${streamKey}`;

  return (
    <div className="space-y-6 w-full">
      {/* Executive Access, Property Selector & SUPER_ADMIN DVR Config Bar */}
      <div className="glass-card rounded-2xl p-4 border border-[#D4AF37]/25 bg-[#D4AF37]/[0.04] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
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
                  {device.model} ({configSource === 'database' ? 'Property DVR' : 'Env Fallback'})
                </span>
              )}
            </h2>
            <p className="text-[11px] text-white/70">
              {language === 'en'
                ? 'Cross-browser ISAPI Digest Proxy streaming directly without IE ActiveX plugins.'
                : 'Transmisión directa vía Proxy ISAPI compatible con todos los navegadores sin plugins de IE.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Property Switcher */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#F3D270]" />
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl glass-input text-xs font-semibold text-white bg-[#0B1526] border border-white/15 focus:border-[#D4AF37] outline-none"
            >
              {propertyOptions.map((prop) => (
                <option key={prop.id} value={prop.id} className="bg-[#0B1526] text-white">
                  {prop.name}
                </option>
              ))}
            </select>
          </div>

          {/* SUPER_ADMIN ONLY: Configure DVR Credentials Button */}
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => openConfigModal(selectedPropertyId)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#F3D270] to-[#D4AF37] text-[#070D18] text-xs font-bold shadow-md shadow-[#D4AF37]/20 hover:opacity-95 transition-all cursor-pointer"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Configure DVR' : 'Configurar DVR'}</span>
            </button>
          )}
        </div>
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
                  <span>{activePropertyName}</span>
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
              onClick={() => loadDvrChannels(selectedPropertyId)}
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

      {/* SUPER_ADMIN ONLY: Per-Property DVR Credentials Modal */}
      {isSuperAdmin && (
        <Modal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          title={
            language === 'en'
              ? 'Property DVR / NVR Credentials (Super Admin)'
              : 'Credenciales DVR / NVR por Propiedad (Super Admin)'
          }
          subtitle={
            language === 'en'
              ? 'AES-256-GCM encrypted in PostgreSQL. Never exposed to client browsers.'
              : 'Cifradas con AES-256-GCM en PostgreSQL. Nunca expuestas al navegador.'
          }
          maxWidth="md"
        >
          <form onSubmit={handleSaveDvrConfig} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1.5">
                {language === 'en' ? 'Target Property' : 'Propiedad'}
              </label>
              <select
                value={dvrForm.property_id}
                onChange={(e) => {
                  const pid = Number(e.target.value);
                  const existing = dvrConfigs.find((c) => c.property_id === pid);
                  setDvrForm({
                    property_id: pid,
                    host: existing?.host || '',
                    port: existing?.port || '80',
                    username: existing?.username || '',
                    password: '',
                  });
                }}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-white bg-[#0B1526] border border-white/10 focus:border-[#D4AF37]"
              >
                {propertyOptions.map((prop) => {
                  const hasCfg = dvrConfigs.some((c) => c.property_id === prop.id);
                  return (
                    <option key={prop.id} value={prop.id} className="bg-[#0B1526] text-white">
                      {prop.name} {hasCfg ? '✓' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Input
                  label={language === 'en' ? 'Host / DDNS / IP' : 'Host / DDNS / IP'}
                  placeholder="hyco34.dvrcam.info"
                  value={dvrForm.host}
                  onChange={(e) => setDvrForm({ ...dvrForm, host: e.target.value })}
                  required
                />
              </div>
              <Input
                label={language === 'en' ? 'HTTP Port' : 'Puerto HTTP'}
                placeholder="80"
                value={dvrForm.port}
                onChange={(e) => setDvrForm({ ...dvrForm, port: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label={language === 'en' ? 'DVR Username' : 'Usuario DVR'}
                placeholder="admin / test"
                value={dvrForm.username}
                onChange={(e) => setDvrForm({ ...dvrForm, username: e.target.value })}
                required
              />
              <Input
                label={language === 'en' ? 'DVR Password' : 'Contraseña DVR'}
                type="password"
                placeholder={
                  dvrConfigs.some((c) => c.property_id === dvrForm.property_id)
                    ? '•••••••• (keep current)'
                    : '••••••••'
                }
                value={dvrForm.password}
                onChange={(e) => setDvrForm({ ...dvrForm, password: e.target.value })}
                required={!dvrConfigs.some((c) => c.property_id === dvrForm.property_id)}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleTestDvrConnection}
                  disabled={isTestingDvr || !dvrForm.host || !dvrForm.username}
                >
                  <CheckCircle2 size={14} className="mr-1.5 text-emerald-400" />
                  {isTestingDvr
                    ? language === 'en'
                      ? 'Testing...'
                      : 'Probando...'
                    : language === 'en'
                    ? 'Test Connection'
                    : 'Probar Conexión'}
                </Button>

                {dvrConfigs.some((c) => c.property_id === dvrForm.property_id) && (
                  <button
                    type="button"
                    onClick={handleDeleteDvrConfig}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                    title={language === 'en' ? 'Remove Config' : 'Eliminar Configuración'}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="ghost" onClick={() => setIsConfigModalOpen(false)}>
                  {language === 'en' ? 'Cancel' : 'Cancelar'}
                </Button>
                <Button type="submit" disabled={isSavingDvr}>
                  {isSavingDvr
                    ? language === 'en'
                      ? 'Saving...'
                      : 'Guardando...'
                    : language === 'en'
                    ? 'Save DVR'
                    : 'Guardar DVR'}
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
