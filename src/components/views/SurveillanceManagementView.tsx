'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Video,
  Shield,
  Eye,
  Camera,
  Maximize2,
  RefreshCw,
  Building2,
  Lock,
  Radio,
  Users,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/context/ToastContext';

interface CameraNode {
  id: string;
  propertyId: string;
  propertyName: string;
  name: { en: string; es: string };
  location: string;
  channel: number;
  status: 'ONLINE' | 'STANDBY';
  resolution: string;
  fps: number;
  ipPlaceholder: string;
  ownerAccessEnabled: boolean;
  sampleVideo: string;
}

const CAMERA_NODES: CameraNode[] = [
  {
    id: 'cam-zionsville-01',
    propertyId: 'zionsville',
    propertyName: '7898 Zionsville Rd Commercial Center',
    name: {
      en: 'CAM 01 — Main Entrance & North Parking',
      es: 'CAM 01 — Acceso Principal y Estacionamiento Norte',
    },
    location: 'Building Exterior North Gate',
    channel: 1,
    status: 'ONLINE',
    resolution: '1080p Full HD',
    fps: 20,
    ipPlaceholder: '192.168.10.101',
    ownerAccessEnabled: true,
    sampleVideo: 'https://assets.mixkit.co/videos/preview/mixkit-top-view-of-cars-on-a-highway-42898-large.mp4',
  },
  {
    id: 'cam-zionsville-02',
    propertyId: 'zionsville',
    propertyName: '7898 Zionsville Rd Commercial Center',
    name: {
      en: 'CAM 02 — Rear Service Corridor & Suites 100–200',
      es: 'CAM 02 — Pasillo de Servicio y Suites 100–200',
    },
    location: 'South Loading Area',
    channel: 2,
    status: 'ONLINE',
    resolution: '1080p Full HD',
    fps: 20,
    ipPlaceholder: '192.168.10.102',
    ownerAccessEnabled: true,
    sampleVideo: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-42899-large.mp4',
  },
  {
    id: 'cam-park100-01',
    propertyId: 'park100',
    propertyName: 'Park 100 Industrial Center',
    name: {
      en: 'CAM 01 — Industrial Truck Court & Gate 1',
      es: 'CAM 01 — Patio de Maniobras y Portón 1',
    },
    location: 'Park 100 Gate 1 Entrance',
    channel: 1,
    status: 'ONLINE',
    resolution: '1080p Full HD',
    fps: 20,
    ipPlaceholder: '192.168.20.201',
    ownerAccessEnabled: true,
    sampleVideo: 'https://assets.mixkit.co/videos/preview/mixkit-highway-traffic-at-dusk-42901-large.mp4',
  },
  {
    id: 'cam-park100-02',
    propertyId: 'park100',
    propertyName: 'Park 100 Industrial Center',
    name: {
      en: 'CAM 02 — Loading Docks 1–4 High Clearance',
      es: 'CAM 02 — Muelles 1–4 Altura Libre',
    },
    location: 'Docks 1 to 4 Exterior Apron',
    channel: 2,
    status: 'ONLINE',
    resolution: '1080p Full HD',
    fps: 20,
    ipPlaceholder: '192.168.20.202',
    ownerAccessEnabled: false,
    sampleVideo: 'https://assets.mixkit.co/videos/preview/mixkit-top-view-of-cars-on-a-highway-42898-large.mp4',
  },
  {
    id: 'cam-morris-01',
    propertyId: 'morris',
    propertyName: 'Morris Street Flex & Service Hub',
    name: {
      en: 'CAM 01 — Drive-In Fleet Yard & I-70 Gate',
      es: 'CAM 01 — Patio de Flotas y Acceso a la I-70',
    },
    location: 'South Yard Gate',
    channel: 1,
    status: 'ONLINE',
    resolution: '1080p Full HD',
    fps: 20,
    ipPlaceholder: '192.168.30.101',
    ownerAccessEnabled: true,
    sampleVideo: 'https://assets.mixkit.co/videos/preview/mixkit-highway-traffic-at-dusk-42901-large.mp4',
  },
  {
    id: 'cam-meridian-01',
    propertyId: 'meridian',
    propertyName: 'Meridian North Executive Suites',
    name: {
      en: 'CAM 01 — Main Lobby & Executive Parking',
      es: 'CAM 01 — Lobby Principal y Estacionamiento Ejecutivo',
    },
    location: 'East Entrance',
    channel: 1,
    status: 'STANDBY',
    resolution: '1080p Full HD',
    fps: 15,
    ipPlaceholder: '192.168.40.101',
    ownerAccessEnabled: false,
    sampleVideo: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-42899-large.mp4',
  },
];

interface SurveillanceManagementViewProps {
  currentFilter?: string;
  searchQuery?: string;
}

export const SurveillanceManagementView: React.FC<SurveillanceManagementViewProps> = ({
  currentFilter = 'ALL',
  searchQuery = '',
}) => {
  const { language } = useLanguage();
  const { success: toastSuccess, info: toastInfo } = useToast();

  const [selectedCamId, setSelectedCamId] = useState<string>(CAMERA_NODES[0].id);
  const [ownerPermissions, setOwnerPermissions] = useState<Record<string, boolean>>(() =>
    CAMERA_NODES.reduce((acc, cam) => ({ ...acc, [cam.id]: cam.ownerAccessEnabled }), {})
  );
  const [isNightVision, setIsNightVision] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const filteredCameras = useMemo(() => {
    return CAMERA_NODES.filter((cam) => {
      const matchesFilter =
        !currentFilter ||
        currentFilter === 'ALL' ||
        cam.propertyId.toLowerCase() === currentFilter.toLowerCase() ||
        cam.status.toLowerCase() === currentFilter.toLowerCase();

      const matchesSearch =
        !searchQuery ||
        cam.propertyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cam.name.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cam.name.es.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cam.location.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [currentFilter, searchQuery]);

  const selectedCam =
    filteredCameras.find((c) => c.id === selectedCamId) || filteredCameras[0] || CAMERA_NODES[0];

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace('T', ' ').slice(0, 19) + ' EST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleFullscreen = () => {
    if (playerContainerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        playerContainerRef.current.requestFullscreen();
      }
    }
  };

  const handleSnapshot = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = isNightVision ? '#101518' : '#0B1526';
      ctx.fillRect(0, 0, 1280, 720);

      ctx.font = 'bold 24px monospace';
      ctx.fillStyle = '#D4AF37';
      ctx.fillText(`HYCO MANAGEMENT CCTV — ${selectedCam.name[language]}`, 40, 50);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '20px monospace';
      ctx.fillText(`${currentTime} — ${selectedCam.propertyName}`, 40, 90);
      ctx.fillText(`STREAM: HIKVISION HIK-CONNECT MANAGEMENT P2P (${selectedCam.resolution})`, 40, 130);

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(40, 160, 1200, 500);

      const link = document.createElement('a');
      link.download = `HYCO-MGMT-CCTV-${selectedCam.id}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toastSuccess(
        language === 'en' ? 'Timestamped security snapshot downloaded.' : 'Captura de seguridad descargada con marca de tiempo.',
        language === 'en' ? 'Snapshot Captured' : 'Captura Guardada'
      );
    }
  };

  const handleRefreshStream = () => {
    setIsLive(false);
    setTimeout(() => {
      setIsLive(true);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      }
      toastInfo(
        language === 'en' ? 'Hik-Connect live stream resynchronized.' : 'Flujo en vivo de Hik-Connect resincronizado.',
        'CCTV Management'
      );
    }, 500);
  };

  const toggleOwnerAccess = (camId: string) => {
    const nextVal = !ownerPermissions[camId];
    setOwnerPermissions((prev) => ({ ...prev, [camId]: nextVal }));
    toastSuccess(
      nextVal
        ? language === 'en'
          ? 'Owner portal delegation enabled for this feed.'
          : 'Acceso delegado a propietario habilitado para esta cámara.'
        : language === 'en'
        ? 'Feed restricted exclusively to internal Management.'
        : 'Cámara restringida exclusivamente a Administración interna.',
      language === 'en' ? 'Access Policy Updated' : 'Permiso Actualizado'
    );
  };

  return (
    <div className="space-y-6 w-full">
      {/* Executive Access Notice */}
      <div className="glass-card rounded-2xl p-4 border border-[#D4AF37]/25 bg-[#D4AF37]/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#D4AF37]/15 text-[#F3D270] border border-[#D4AF37]/30 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white">
              {language === 'en'
                ? 'Internal Management & Owner Surveillance Console'
                : 'Consola de Vigilancia Interna y Propietarios'}
            </h2>
            <p className="text-[11px] text-white/70">
              {language === 'en'
                ? 'Tenant portal access has been disabled per security policy. Live Hikvision feeds are strictly restricted to Management and authorized Owners.'
                : 'El acceso desde el portal de inquilinos ha sido deshabilitado por política de seguridad. Uso exclusivo de Administración y Propietarios autorizados.'}
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0 self-start sm:self-center">
          Hik-Connect Cloud Active
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
            <video
              ref={videoRef}
              key={selectedCam.id}
              src={selectedCam.sampleVideo}
              autoPlay
              loop
              muted
              playsInline
              className={`w-full h-full object-cover transition-all duration-500 ${
                isNightVision ? 'grayscale contrast-125 brightness-90' : 'opacity-90'
              }`}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40 pointer-events-none" />

            {/* Top HUD */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-mono font-bold text-[10px] flex items-center gap-1.5 shadow-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  {isLive ? 'LIVE REC' : 'SYNCING...'}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-white font-mono text-[10px] border border-white/10">
                  CH 0{selectedCam.channel} • {selectedCam.resolution} • {selectedCam.fps} FPS
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
                  <span>{selectedCam.propertyName}</span>
                </div>
                <h3 className="text-sm font-bold text-white">{selectedCam.name[language]}</h3>
                <p className="text-[11px] text-white/60 font-mono">
                  {selectedCam.location} • IP: {selectedCam.ipPlaceholder}
                </p>
              </div>

              <div className="flex items-center gap-2">
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

        {/* Right 4 Columns: Camera Directory & Owner Delegation Controls */}
        <div className="lg:col-span-4 space-y-3 max-h-[540px] overflow-y-auto pr-1 scrollbar-thin">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/60">
              {language === 'en' ? `Active Channels (${filteredCameras.length})` : `Canales Activos (${filteredCameras.length})`}
            </span>
            <span className="text-[10px] text-[#F3D270] font-semibold flex items-center gap-1">
              <Radio className="w-3 h-3" /> P2P Cloud
            </span>
          </div>

          {filteredCameras.map((cam) => {
            const isSelected = cam.id === selectedCam.id;
            const ownerAllowed = ownerPermissions[cam.id];

            return (
              <div
                key={cam.id}
                onClick={() => setSelectedCamId(cam.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50 shadow-lg shadow-[#D4AF37]/10'
                    : 'bg-[#0B1526]/80 border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Video className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#F3D270]' : 'text-white/50'}`} />
                    <span className="text-xs font-bold text-white line-clamp-1">
                      {cam.name[language]}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                      cam.status === 'ONLINE'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {cam.status}
                  </span>
                </div>

                <p className="text-[11px] text-white/60 mb-3 truncate">{cam.propertyName}</p>

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
                    onClick={() => toggleOwnerAccess(cam.id)}
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
