"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  ShieldCheck,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CameraOff,
  Sparkles,
  Clock4,
  RefreshCw,
  Scan,
  Eye,
  Keyboard,
  Copy,
  Camera,
  DoorOpen,
} from "lucide-react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";

type SendState = "idle" | "sending" | "success" | "duplicate" | "error";
type TabType = "scan" | "show" | "manual";

interface GateInfo {
  COMPANY: string;
  CLIENT: string;
  PLANT: string;
  GATEID: string;
  GATETYPE: string;
  DESCRIPTION: string;
}

function formatDateSlash(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
function formatTime(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mi}:${ss}`;
}

export default function QRPage() {
  const { user } = useAuth();
  const [persidValue, setPersidValue] = useState("");
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [lastScan, setLastScan] = useState<string>("");
  const [selectedGate, setSelectedGate] = useState<string>("");
  const [gps, setGps] = useState<{ x: string; y: string }>({ x: "000", y: "000" });
  const [sendState, setSendState] = useState<SendState>("idle");
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("scan");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [qrLoading, setQrLoading] = useState(false);
  const [gateList, setGateList] = useState<GateInfo[]>([]);
  const [loadingGates, setLoadingGates] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const dbName = useMemo(() => (user as any)?.dbName || "HOMINUM", [user]);

  useEffect(() => {
    setPersidValue((user as any)?.persid || "");
  }, [user]);

  // Kamera kontrolü
  useEffect(() => {
    let cancelled = false;
    async function checkCamera() {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) {
          setHasCamera(false);
          setCameraError("Cihaz kamerası desteklenmiyor.");
        }
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        stream.getTracks().forEach((t) => t.stop());
        if (!cancelled) {
          setHasCamera(true);
          setCameraError(null);
        }
      } catch {
        if (!cancelled) {
          setHasCamera(false);
          setCameraError("Kameraya erişim izni reddedildi veya kamera açılamadı.");
        }
      }
    }
    checkCamera();
    return () => {
      cancelled = true;
    };
  }, []);

  // GPS (olmazsa 000)
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const x = String(pos.coords.latitude ?? "000");
        const y = String(pos.coords.longitude ?? "000");
        setGps({ x, y });
      },
      () => setGps({ x: "000", y: "000" }),
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
    );
  }, []);

  // Kapı listesini getir (show ve manual için)
  useEffect(() => {
    const fetchGates = async () => {
      if (activeTab !== "manual" && activeTab !== "show") return;

      setLoadingGates(true);
      setStatusMsg("Kapı listesi yükleniyor...");
      try {
        const res = await fetch(`/api/mobil-user/QRGATEINFO?dbName=${encodeURIComponent(dbName)}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-db-name": dbName,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data && Array.isArray(data.data)) {
            setGateList(data.data);
            if (data.data.length > 0) {
              setSelectedGate((prev) => prev || data.data[0].GATEID);
              setStatusMsg("Kapı listesi yüklendi. Kapı seçin.");
            } else {
              setStatusMsg("Sistemde kayıtlı kapı bulunamadı.");
            }
          } else {
            setStatusMsg(data?.message || "Kapı listesi alınamadı.");
          }
        } else {
          const errorData = await res.json().catch(() => ({}));
          setStatusMsg(errorData?.message || "Kapı listesi alınamadı.");
        }
      } catch (error) {
        console.error("Kapı listesi alınamadı:", error);
        setStatusMsg("Bağlantı hatası. Lütfen tekrar deneyin.");
      } finally {
        setLoadingGates(false);
      }
    };

    fetchGates();
  }, [activeTab, dbName]);

  // Kamera ile ZXing tarama (mobil-friendly alan)
  useEffect(() => {
    if (!isScanning || !hasCamera || activeTab !== "scan") return;

    const reader = new BrowserMultiFormatReader();
    let stopped = false;

    async function start() {
      if (!videoRef.current) return;
      try {
        controlsRef.current = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } },
          videoRef.current,
          (result, err) => {
            if (stopped) return;
            if (result) {
              const text = result.getText();
              setLastScan(text);
              handleSend(text);
            } else if (err && !(err instanceof NotFoundException)) {
              setCameraError("Kamera açılamadı veya okuma sırasında hata oluştu.");
              setHasCamera(false);
              setIsScanning(false);
            }
          }
        );
      } catch {
        setCameraError("Kamera başlatılamadı.");
        setHasCamera(false);
        setIsScanning(false);
      }
    }

    start();

    return () => {
      stopped = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
      if (reader.stop) reader.stop();
    };
  }, [isScanning, hasCamera, activeTab]);

  // QR kodu oluştur (kapı seçimine göre)
  const generateQRCode = useCallback(async () => {
    if (!persidValue) {
      setStatusMsg("PersID bulunamadı. Lütfen oturum açın.");
      return;
    }
    if (!selectedGate) {
      setStatusMsg("Lütfen bir kapı seçin.");
      return;
    }

    setQrLoading(true);
    try {
      // Kapı bilgisini içeren QR URL oluştur
      const qrData = `${window.location.origin}/api/mobil-user/QR?dbName=${encodeURIComponent(dbName)}&persid=${encodeURIComponent(persidValue)}&gate=${encodeURIComponent(selectedGate)}`;
      
      setQrCodeUrl(qrData);
      setStatusMsg(`"${selectedGate}" kapısı için QR kodu oluşturuldu.`);
    } catch (err) {
      setStatusMsg("QR oluşturulurken hata oluştu.");
    } finally {
      setQrLoading(false);
    }
  }, [dbName, persidValue, selectedGate]);

  // Kapı seçimi değiştiğinde QR'ı otomatik yenile
  useEffect(() => {
    if (activeTab === "show" && selectedGate) {
      setQrCodeUrl(""); // Eski QR'ı temizle
      generateQRCode(); // Yeni QR oluştur
    }
  }, [activeTab, selectedGate]);

  const handleSend = useCallback(
    async (gate: string) => {
      if (!gate) {
        setSendState("error");
        setStatusMsg("Geçerli bir GATEID gerekli.");
        return;
      }
      if (!persidValue) {
        setSendState("error");
        setStatusMsg("persid bulunamadı. Lütfen oturumun açık olduğundan emin olun.");
        return;
      }

      const now = new Date();
      const DATEINFO = formatDateSlash(now);
      const TIMEINFO = formatTime(now);

      setBusy(true);
      setSendState("sending");
      setStatusMsg("Gönderiliyor...");

      try {
        const res = await fetch(`/api/mobil-user/QR?dbName=${encodeURIComponent(dbName)}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-db-name": dbName,
          },
          body: JSON.stringify({
            persid: persidValue,
            PERSID: persidValue,
            DATEINFO,
            TIMEINFO,
            GPS: "000",
            GPS_X: gps.x || "000",
            GPS_Y: gps.y || "000",
            GATEID: gate,
          }),
        });

        const isConflict = res.status === 409;
        const json = await res.json().catch(() => ({} as any));

        if (res.ok) {
          setSendState("success");
          setStatusMsg(json?.message || "QR başarıyla alındı.");
          setShowSuccessAnimation(true);
          setTimeout(() => setShowSuccessAnimation(false), 3000);
        } else if (isConflict) {
          setSendState("duplicate");
          setStatusMsg(json?.message || "Bu QR kısa süre önce okutulmuş.");
        } else {
          setSendState("error");
          setStatusMsg(json?.message || "Gönderim başarısız. Tekrar deneyin.");
        }
      } catch {
        setSendState("error");
        setStatusMsg("Bağlantı hatası veya zaman aşımı.");
      } finally {
        setBusy(false);
      }
    },
    [dbName, gps.x, gps.y, persidValue]
  );

  const resetStatus = () => {
    setSendState("idle");
    setStatusMsg("");
  };

  const statusBlock = {
    idle: { color: "text-slate-300", icon: <Sparkles className="h-4 w-4" /> },
    sending: { color: "text-amber-300", icon: <Loader2 className="h-4 w-4 animate-spin" /> },
    success: { color: "text-emerald-300", icon: <CheckCircle2 className="h-4 w-4" /> },
    duplicate: { color: "text-amber-300", icon: <AlertCircle className="h-4 w-4" /> },
    error: { color: "text-rose-300", icon: <AlertCircle className="h-4 w-4" /> },
  }[sendState];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setStatusMsg("Panoya kopyalandı!");
    setTimeout(() => setStatusMsg(""), 2000);
  };

  // QR görseli için URL oluştur (kapı bilgisi dahil)
  const qrImageSrc = useMemo(() => {
    if (!qrCodeUrl) return "";
    
    // QR içeriği: PersID ve kapı bilgisi
    const qrContent = JSON.stringify({
      db: dbName,
      persid: persidValue,
      gate: selectedGate,
      timestamp: new Date().toISOString(),
    });
    
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrContent)}&format=png&margin=10`;
  }, [qrCodeUrl, dbName, persidValue, selectedGate]);

  // Seçilen kapının detaylarını bul
  const selectedGateDetails = useMemo(() => {
    return gateList.find(gate => gate.GATEID === selectedGate);
  }, [gateList, selectedGate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white pb-28 pt-2">
      {/* Başarı Animasyonu */}
      {showSuccessAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative animate-pulse">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl"></div>
            <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-800 p-8 rounded-3xl shadow-2xl">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <CheckCircle2 className="h-24 w-24 text-white animate-bounce" />
                  <div className="absolute inset-0 bg-emerald-400 rounded-full blur-xl"></div>
                </div>
                <div className="mt-6 text-center">
                  <h3 className="text-2xl font-bold text-white">BAŞARILI!</h3>
                  <p className="text-emerald-100 mt-2">QR başarıyla doğrulandı</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Butonları */}
      <div className="px-5 pt-4 flex gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab("scan")}
          className={`flex-1 py-3 rounded-t-xl flex items-center justify-center gap-2 font-bold transition ${
            activeTab === "scan"
              ? "bg-slate-800 text-cyan-300 border-t border-x border-white/10"
              : "bg-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Scan className="h-5 w-5" />
          QR Okut
        </button>
        <button
          onClick={() => setActiveTab("show")}
          className={`flex-1 py-3 rounded-t-xl flex items-center justify-center gap-2 font-bold transition ${
            activeTab === "show"
              ? "bg-slate-800 text-emerald-300 border-t border-x border-white/10"
              : "bg-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Eye className="h-5 w-5" />
          QR Göster
        </button>
        <button
          onClick={() => setActiveTab("manual")}
          className={`flex-1 py-3 rounded-t-xl flex items-center justify-center gap-2 font-bold transition ${
            activeTab === "manual"
              ? "bg-slate-800 text-amber-300 border-t border-x border-white/10"
              : "bg-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Keyboard className="h-5 w-5" />
          Manuel
        </button>
      </div>

      {/* Tab İçerikleri */}
      <div className="px-5 pt-4">
        {/* QR OKUTMA */}
        {activeTab === "scan" && (
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-800/60 p-4 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.12),transparent_45%)] pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-cyan-300" />
                  <p className="font-semibold">Kamera ile QR Okut</p>
                </div>
                {hasCamera === false && (
                  <span className="text-xs text-amber-300 flex items-center gap-1">
                    <CameraOff className="h-4 w-4" /> Kamera kapalı
                  </span>
                )}
              </div>

              {hasCamera && isScanning && (
                <div className="relative mx-auto w-full max-w-[420px] aspect-[4/3] rounded-2xl border border-white/10 bg-black overflow-hidden shadow-xl">
                  <video
                    ref={videoRef}
                    className="absolute inset-0 h-full w-full object-cover"
                    autoPlay
                    muted
                    playsInline
                  />
                  <div className="pointer-events-none absolute inset-0 rounded-2xl border-[3px] border-cyan-400/70 mix-blend-screen shadow-[0_0_30px_rgba(34,211,238,0.35)]" />
                  <div className="pointer-events-none absolute inset-5 rounded-xl border-[2px] border-white/30 shadow-inner shadow-cyan-500/20" />
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-3 top-3 h-8 w-8 border-l-4 border-t-4 border-cyan-300/90 rounded-tl-xl" />
                    <div className="absolute right-3 top-3 h-8 w-8 border-r-4 border-t-4 border-cyan-300/90 rounded-tr-xl" />
                    <div className="absolute left-3 bottom-3 h-8 w-8 border-l-4 border-b-4 border-cyan-300/90 rounded-bl-xl" />
                    <div className="absolute right-3 bottom-3 h-8 w-8 border-r-4 border-b-4 border-cyan-300/90 rounded-br-xl" />
                  </div>
                  <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-white/90 bg-black/60 px-3 py-1 rounded-full backdrop-blur">
                    Kamerayı kare içine hizalayın
                  </div>
                </div>
              )}

              {!hasCamera && (
                <div className="rounded-xl border border-dashed border-amber-400/40 bg-amber-500/10 p-4 text-sm text-amber-100">
                  <div className="flex items-center gap-2 font-semibold">
                    <CameraOff className="h-5 w-5" />
                    Kameraya erişilemiyor
                  </div>
                  <p className="mt-2 text-amber-50/80">
                    İzin verilmedi veya cihazda kamera bulunmuyor. Manuel doğrulamayı kullanabilirsiniz.
                  </p>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    resetStatus();
                    setIsScanning((prev) => !prev);
                    setCameraError(null);
                    if (!hasCamera) setHasCamera(true);
                  }}
                  className="px-3 py-2 rounded-lg bg-white/10 border border-white/15 text-sm flex items-center gap-2 hover:bg-white/15 active:scale-95 transition"
                >
                  <RefreshCw className="h-4 w-4" />
                  {isScanning ? "Durdur" : "Tekrar Başlat"}
                </button>
                <button
                  onClick={() => {
                    resetStatus();
                    setLastScan("");
                  }}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10 active:scale-95 transition"
                >
                  Temizle
                </button>
              </div>

              {cameraError && (
                <div className="mt-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QR GÖSTERME */}
        {activeTab === "show" && (
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-900/30 to-slate-800/60 p-4 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),transparent_45%)] pointer-events-none" />
            <div className="relative z-10 space-y-3">
              {/* Kapı seçimi (QR üretimi için) */}
              <div>
                <label className="text-xs text-slate-400 flex items-center gap-2 mb-2">
                  <DoorOpen className="h-4 w-4" />
                  Kapı Seçimi (QR için)
                </label>
                {loadingGates ? (
                  <div className="flex items-center justify-center py-3">
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-300" />
                    <span className="ml-2 text-sm text-slate-300">Kapılar yükleniyor...</span>
                  </div>
                ) : gateList.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={selectedGate}
                      onChange={(e) => setSelectedGate(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white text-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                    >
                      {gateList.map((gate) => (
                        <option key={gate.GATEID} value={gate.GATEID}>
                          {gate.DESCRIPTION} - {gate.GATETYPE}
                        </option>
                      ))}
                    </select>
                    
                    {selectedGateDetails && (
                      <div className="mt-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-emerald-300">Kapı Tipi:</span>
                            <span className="ml-2 text-slate-200">{selectedGateDetails.GATETYPE}</span>
                          </div>
                          <div>
                            <span className="text-emerald-300">Açıklama:</span>
                            <span className="ml-2 text-slate-200">{selectedGateDetails.DESCRIPTION}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                    Kapı listesi yüklenemedi. Lütfen internet bağlantınızı kontrol edin.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-emerald-300" />
                  <p className="font-semibold">Kişisel QR Kodunuz</p>
                </div>
                <button
                  onClick={generateQRCode}
                  disabled={qrLoading || !selectedGate}
                  className="text-xs text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-lg hover:bg-emerald-500/20 transition disabled:opacity-60"
                >
                  {qrLoading ? "Yenileniyor..." : "QR Oluştur"}
                </button>
              </div>

              {qrLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-emerald-300" />
                  <p className="mt-4 text-slate-300">QR kodu oluşturuluyor...</p>
                </div>
              ) : qrCodeUrl && selectedGate ? (
                <div className="flex flex-col items-center">
                  {/* QR Kodu Görseli */}
                  <div className="w-72 h-72 bg-white rounded-2xl p-4 flex items-center justify-center border-4 border-emerald-400/50 shadow-2xl shadow-emerald-500/20">
                    {qrImageSrc ? (
                      <img
                        src={qrImageSrc}
                        alt="QR code"
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="text-slate-800 text-center">
                        <div className="text-4xl mb-2">📱</div>
                        <p className="text-xs font-bold">QR KODU</p>
                        <p className="text-xs mt-2">PersID: {persidValue}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Kapı Bilgileri */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-800/50 border border-emerald-500/30 w-full">
                    <div className="text-xs text-slate-400 mb-1">Kapı Bilgisi:</div>
                    <div className="text-sm text-slate-200 font-medium">{selectedGate}</div>
                    {selectedGateDetails && (
                      <div className="text-xs text-slate-400 mt-1">
                        {selectedGateDetails.DESCRIPTION} - {selectedGateDetails.GATETYPE}
                      </div>
                    )}
                  </div>
                  
                  {/* QR İçeriği */}
                  <div className="mt-4 w-full">
                    <div className="text-xs text-slate-400 mb-2">QR İçeriği:</div>
                    <div className="flex gap-2">
                      <input
                        readOnly
                        value={qrCodeUrl}
                        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm truncate"
                      />
                      <button
                        onClick={() => copyToClipboard(qrCodeUrl)}
                        className="px-3 py-2 rounded-lg bg-white/10 border border-white/15 hover:bg-white/20 transition"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-xs text-slate-500 mt-2 text-center">
                      Bu QR kodu yalnızca seçili kapıda geçerlidir.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  {selectedGate 
                    ? 'QR oluşturmak için "QR Oluştur" butonuna basın.'
                    : 'Önce bir kapı seçin.'}
                </div>
              )}

              <div className="mt-2 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveTab("scan")}
                  className="py-3 rounded-xl bg-white/10 border border-white/15 hover:bg-white/20 transition flex items-center justify-center gap-2"
                >
                  <Scan className="h-4 w-4" />
                  QR Okut
                </button>
                <button
                  onClick={() => setActiveTab("manual")}
                  className="py-3 rounded-xl bg-white/10 border border-white/15 hover:bg-white/20 transition flex items-center justify-center gap-2"
                >
                  <Keyboard className="h-4 w-4" />
                  Manuel Giriş
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MANUEL GİRİŞ */}
        {activeTab === "manual" && (
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-amber-900/30 to-slate-800/60 p-4 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.12),transparent_45%)] pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Keyboard className="h-5 w-5 text-amber-300" />
                <p className="font-semibold">Manuel Doğrulama</p>
              </div>
              <div className="text-xs text-slate-300 mb-3">
                Kameraya erişim yoksa kapı seçerek manuel doğrulama yapabilirsiniz.
              </div>

              <div className="space-y-4">
                {/* Kapı Seçimi */}
                <div>
                  <label className="text-xs text-slate-400 flex items-center gap-2 mb-2">
                    <DoorOpen className="h-4 w-4" />
                    Kapı Seçimi
                  </label>
                  {loadingGates ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-amber-300" />
                      <span className="ml-2 text-sm text-slate-300">Kapılar yükleniyor...</span>
                    </div>
                  ) : gateList.length > 0 ? (
                    <div className="space-y-2">
                      <select
                        value={selectedGate}
                        onChange={(e) => setSelectedGate(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white text-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                      >
                        {gateList.map((gate) => (
                          <option key={gate.GATEID} value={gate.GATEID}>
                            {gate.DESCRIPTION} - {gate.GATETYPE}
                          </option>
                        ))}
                      </select>
                      {selectedGate && selectedGateDetails && (
                        <div className="mt-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <div className="text-xs">
                            <div className="text-amber-300 mb-1">Seçilen Kapı:</div>
                            <div className="text-slate-200">{selectedGateDetails.DESCRIPTION}</div>
                            <div className="text-slate-400 text-[11px] mt-1">Tip: {selectedGateDetails.GATETYPE}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                      Kapı listesi yüklenemedi. Lütfen internet bağlantınızı kontrol edin.
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Clock4 className="h-4 w-4 text-cyan-300" />
                  <span>{formatDateSlash(new Date())}</span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <MapPin className="h-4 w-4 text-amber-300" />
                  <span>
                    {gps.x}, {gps.y}
                  </span>
                </div>
              </div>

              <button
                disabled={busy || !selectedGate}
                onClick={() => handleSend(selectedGate)}
                className="mt-4 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-3 text-sm font-bold shadow-lg shadow-amber-500/30 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99] transition flex items-center justify-center gap-2"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {busy ? "Gönderiliyor..." : "Kapı Doğrulamasını Gönder"}
              </button>
            </div>
          </div>
        )}

        {/* Durum kartı */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {statusBlock.icon}
              <p className="font-semibold text-sm">Durum</p>
            </div>
            <span className={`text-xs ${statusBlock.color}`}>
              {
                {
                  idle: "Hazır",
                  sending: "Gönderiliyor",
                  success: "Başarılı",
                  duplicate: "Tekrar okutuldu",
                  error: "Hata",
                }[sendState]
              }
            </span>
          </div>
          <p className="text-sm text-slate-200">{statusMsg || "Okut veya manuel girerek gönder."}</p>
          {lastScan && (
            <div className="mt-2 text-xs text-slate-400 break-all">
              Son okunan: <span className="text-slate-100">{lastScan}</span>
            </div>
          )}
        </div>

        {/* Hızlı Erişim Butonları */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            onClick={() => setActiveTab("scan")}
            className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1 ${
              activeTab === "scan"
                ? "bg-cyan-500/20 border border-cyan-500/30"
                : "bg-white/5 border border-white/10 hover:bg-white/10"
            }`}
          >
            <Scan className="h-5 w-5" />
            <span className="text-xs">QR Okut</span>
          </button>
          <button
            onClick={() => setActiveTab("show")}
            className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1 ${
              activeTab === "show"
                ? "bg-emerald-500/20 border border-emerald-500/30"
                : "bg-white/5 border border-white/10 hover:bg-white/10"
            }`}
          >
            <Eye className="h-5 w-5" />
            <span className="text-xs">QR Göster</span>
          </button>
          <button
            onClick={() => setActiveTab("manual")}
            className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1 ${
              activeTab === "manual"
                ? "bg-amber-500/20 border border-amber-500/30"
                : "bg-white/5 border border-white/10 hover:bg-white/10"
            }`}
          >
            <Keyboard className="h-5 w-5" />
            <span className="text-xs">Manuel</span>
          </button>
        </div>
      </div>

      <div className="h-1" />
    </div>
  );
}