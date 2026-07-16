import { useEffect, useRef, useState } from 'react';
import { CCTVCamera } from '../types';

interface CCTVPlayerProps {
  camera: CCTVCamera;
  simulatedTime: string;
}

function getYouTubeId(url: string | undefined): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|live\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function LiveDateTime({ simulatedTime }: { simulatedTime: string }) {
  const [secStr, setSecStr] = useState('00');
  
  useEffect(() => {
    const timer = setInterval(() => {
      const sec = new Date().getSeconds();
      setSecStr(sec.toString().padStart(2, '0'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const now = new Date();
  const dateString = now.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeString = simulatedTime ? `${simulatedTime}:${secStr}` : now.toLocaleTimeString('id-ID', { hour12: false });
  return <>{dateString}  {timeString}</>;
}

export default function CCTVPlayer({ camera, simulatedTime }: CCTVPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number | null>(null);

  const rtspUrl = camera.rtspUrl || '';
  const ytId = getYouTubeId(rtspUrl);
  const hasStream = !!rtspUrl;

  const isYt = !!ytId;
  const isHls = !isYt && (rtspUrl.toLowerCase().includes('.m3u8') || rtspUrl.toLowerCase().includes('/hls/'));
  const isDirectVideo = !isYt && !isHls && (
    rtspUrl.toLowerCase().endsWith('.mp4') ||
    rtspUrl.toLowerCase().endsWith('.webm') ||
    rtspUrl.toLowerCase().endsWith('.ogg') ||
    rtspUrl.toLowerCase().endsWith('.mov') ||
    rtspUrl.toLowerCase().endsWith('.m4v') ||
    rtspUrl.toLowerCase().endsWith('.ogv')
  );
  // Webpage streaming portals (like ITS CCTV Bogor Regency)
  const isWebpage = !isYt && !isHls && !isDirectVideo && (rtspUrl.toLowerCase().startsWith('http://') || rtspUrl.toLowerCase().startsWith('https://'));

  // Effect for HLS Player initialization
  useEffect(() => {
    if (hasStream && isHls && videoRef.current) {
      let hlsInstance: any = null;
      const video = videoRef.current;

      const initHls = () => {
        // @ts-ignore
        if (window.Hls && window.Hls.isSupported()) {
          // @ts-ignore
          hlsInstance = new window.Hls({
            maxMaxBufferLength: 10,
            liveSyncDurationCount: 3,
            enableWorker: true
          });
          hlsInstance.loadSource(rtspUrl);
          hlsInstance.attachMedia(video);
          hlsInstance.on('hlsError', (event: any, data: any) => {
            if (data.fatal) {
              switch (data.type) {
                case 'networkError':
                  hlsInstance.startLoad();
                  break;
                case 'mediaError':
                  hlsInstance.recoverMediaError();
                  break;
                default:
                  hlsInstance.destroy();
                  break;
              }
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = rtspUrl;
        }
      };

      const scriptId = 'hls-js-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement;

      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.4.0/dist/hls.min.js';
        script.onload = () => {
          initHls();
        };
        document.body.appendChild(script);
      } else {
        // @ts-ignore
        if (window.Hls) {
          initHls();
        } else {
          script.addEventListener('load', initHls);
        }
      }

      return () => {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      };
    }
  }, [rtspUrl, isHls, hasStream]);

  let filterClass = '';
  let overlayColor = '';
  
  if (camera.colorTheme === 'monochrome') {
    filterClass = 'grayscale contrast-[1.2] brightness-[0.9]';
    overlayColor = 'bg-slate-500/10';
  } else if (camera.colorTheme === 'nightvision') {
    filterClass = 'sepia hue-rotate-[100deg] saturate-[3] contrast-[1.2] brightness-[0.85]';
    overlayColor = 'bg-green-500/15';
  } else if (camera.colorTheme === 'emerald') {
    filterClass = 'sepia hue-rotate-[80deg] saturate-[2.5] contrast-[1.1] brightness-[0.9]';
    overlayColor = 'bg-emerald-500/15';
  } else if (camera.colorTheme === 'amber') {
    filterClass = 'sepia hue-rotate-[15deg] saturate-[2.5] contrast-[1.2] brightness-[0.9]';
    overlayColor = 'bg-amber-500/15';
  }

  if (hasStream) {
    const safeOrigin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
    const encodedOrigin = safeOrigin ? encodeURIComponent(safeOrigin) : '';
    const embedUrl = `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1${encodedOrigin ? `&origin=${encodedOrigin}` : ''}`;

    return (
      <div className="relative w-full h-full overflow-hidden bg-black group rounded-lg border border-slate-800">
        <style>{`
          @keyframes scanlineMove {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(300%); }
          }
          .animate-scanline {
            animation: scanlineMove 8s linear infinite;
          }
        `}</style>

        {/* Stream Source */}
        <div className={`w-full h-full transition-all duration-300 ${filterClass}`}>
          {isYt ? (
            <iframe
              src={embedUrl}
              title={camera.name}
              className="w-full h-full object-cover border-0 pointer-events-none scale-[1.05]"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : isWebpage ? (
            <iframe
              src={rtspUrl}
              title={camera.name}
              className="w-full h-full object-cover border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              onError={(e) => {
                console.error("CCTV webpage stream error", e);
              }}
            />
          ) : (
            <video
              ref={videoRef}
              src={isHls ? undefined : rtspUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error("CCTV video error", e);
              }}
            />
          )}
        </div>

        {/* Mix-blend tint overlay to apply the precise color theme to iframe/video */}
        <div className={`absolute inset-0 pointer-events-none mix-blend-color ${overlayColor}`} />

        {/* CRT Scanline Overlay */}
        {camera.colorTheme !== 'normal' && (
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-25" />
        )}

        {/* Static noise scan line moving down */}
        {camera.colorTheme !== 'normal' && (
          <div className="absolute left-0 right-0 h-16 bg-white/5 opacity-10 pointer-events-none animate-scanline" />
        )}

        {/* CCTV HUD Details overlay */}
        <div className="absolute inset-0 p-3 flex flex-col justify-between pointer-events-none z-10 font-mono text-[9px] tracking-wider text-white">
          {/* Top Info */}
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-1.5">
              {camera.status === 'online' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  <span className="text-white font-semibold">● LIVE REC</span>
                </>
              ) : (
                <span className="text-red-500 font-semibold">⚡ OFFLINE</span>
              )}
            </div>
            <div>
              FPS: {camera.fps} | NOISE: {camera.noiseLevel}%
            </div>
          </div>

          {/* Alert Overlay if has motion */}
          {camera.hasMotion && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-600/10 border-2 border-red-600">
              <span className="text-red-500 font-extrabold text-[10px] bg-black/80 px-2 py-1 rounded border border-red-600 animate-pulse">
                ⚠️ MOTION ALERT ⚠️
              </span>
            </div>
          )}

          {/* Bottom Info */}
          <div className="flex justify-between items-end">
            <div className="text-left">
              <div className="text-[10px] font-bold text-white uppercase drop-shadow">
                {camera.name.toUpperCase()}
              </div>
              <div className="text-[8px] text-slate-300 drop-shadow mt-0.5">
                LOC: {camera.location.toUpperCase()}
              </div>
            </div>
            <div className="text-right text-slate-200 drop-shadow">
              <LiveDateTime simulatedTime={simulatedTime} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    if (hasStream) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas internal resolution to match container size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width || 320;
      canvas.height = rect.height || 180;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Simulation states
    let frameCount = 0;
    let panOffset = 0;
    let targetX = canvas.width / 2;
    let targetY = canvas.height / 2;
    let currentX = targetX;
    let currentY = targetY;
    let trackingTimer = 0;
    let isTracking = false;
    let targetLabel = 'PERSON';

    const render = () => {
      frameCount++;
      const { width, height } = canvas;
      if (width === 0 || height === 0) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      // 1. Color themes
      let primaryColor = '#10b981'; // emerald
      let bgColor = '#022c22';
      let accentColor = '#34d399';

      if (camera.colorTheme === 'monochrome') {
        primaryColor = '#e2e8f0'; // slate-200
        bgColor = '#0f172a'; // slate-900
        accentColor = '#94a3b8';
      } else if (camera.colorTheme === 'nightvision') {
        primaryColor = '#22c55e'; // green-500
        bgColor = '#052e16'; // dark green
        accentColor = '#4ade80';
      } else if (camera.colorTheme === 'amber') {
        primaryColor = '#f59e0b'; // amber-500
        bgColor = '#451a03'; // dark amber
        accentColor = '#fbbf24';
      } else if (camera.colorTheme === 'normal') {
        primaryColor = '#38bdf8'; // sleek light blue
        bgColor = '#020617'; // very sleek deep blue-gray slate-950
        accentColor = '#f43f5e'; // vivid rose accent for tracking
      }

      // Draw background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      // Save context for panning
      ctx.save();
      
      // Calculate simulated pan drift
      if (camera.panSpeed > 0) {
        panOffset = Math.sin(frameCount * 0.005 * camera.panSpeed) * (width * 0.12);
        ctx.translate(panOffset, 0);
      }

      // 2. Draw Simulated Room Geometry
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.35;

      // Draw floor grid lines
      ctx.beginPath();
      for (let i = -width * 0.5; i < width * 1.5; i += 40) {
        ctx.moveTo(i, height);
        ctx.lineTo(width / 2, height * 0.3);
      }
      ctx.stroke();

      // Draw perspective walls/pillars
      ctx.beginPath();
      // Far back wall outline
      ctx.strokeRect(width * 0.3, height * 0.25, width * 0.4, height * 0.35);
      // Perspective ceiling/floor lines
      ctx.moveTo(0, 0); ctx.lineTo(width * 0.3, height * 0.25);
      ctx.moveTo(width, 0); ctx.lineTo(width * 0.7, height * 0.25);
      ctx.moveTo(0, height); ctx.lineTo(width * 0.3, height * 0.6);
      ctx.moveTo(width, height); ctx.lineTo(width * 0.7, height * 0.6);
      // Pillar 1
      ctx.strokeRect(width * 0.1, height * 0.1, width * 0.08, height * 0.8);
      // Pillar 2 (farther back)
      ctx.strokeRect(width * 0.82, height * 0.15, width * 0.06, height * 0.7);
      ctx.stroke();

      // 3. Draw Simulated Moving Target (Person / Package)
      if (camera.status === 'online') {
        // Move target randomly
        if (frameCount % 180 === 0 || Math.random() < 0.005) {
          targetX = width * 0.15 + Math.random() * (width * 0.7);
          targetY = height * 0.4 + Math.random() * (height * 0.4);
          isTracking = Math.random() < 0.7;
          targetLabel = Math.random() < 0.25 ? 'OBJECT_DET' : Math.random() < 0.1 ? 'ALERT_DZR' : 'HUMAN_0' + Math.floor(Math.random() * 9 + 1);
          trackingTimer = 60 + Math.floor(Math.random() * 120);
        }

        // Interpolate current tracking dot towards target
        currentX += (targetX - currentX) * 0.05;
        currentY += (targetY - currentY) * 0.05;

        if (trackingTimer > 0) {
          trackingTimer--;
          if (trackingTimer === 0) isTracking = false;
        }

        if (isTracking) {
          // Draw a small heat signature indicator
          ctx.beginPath();
          ctx.arc(currentX, currentY, 15, 0, Math.PI * 2);
          ctx.fillStyle = accentColor;
          ctx.globalAlpha = 0.15;
          ctx.fill();

          // Draw tracking bounding box (simulating digital AI target tracking)
          ctx.globalAlpha = 0.8;
          ctx.strokeStyle = camera.hasMotion ? '#ef4444' : accentColor;
          ctx.lineWidth = 1;
          const boxSize = 25 + Math.sin(frameCount * 0.1) * 2;
          
          ctx.beginPath();
          // Corner marks for box
          const x = currentX - boxSize/2;
          const y = currentY - boxSize/2;
          
          // Top Left
          ctx.moveTo(x, y + 8); ctx.lineTo(x, y); ctx.lineTo(x + 8, y);
          // Top Right
          ctx.moveTo(x + boxSize - 8, y); ctx.lineTo(x + boxSize, y); ctx.lineTo(x + boxSize, y + 8);
          // Bottom Left
          ctx.moveTo(x, y + boxSize - 8); ctx.lineTo(x, y + boxSize); ctx.lineTo(x + 8, y + boxSize);
          // Bottom Right
          ctx.moveTo(x + boxSize - 8, y + boxSize); ctx.lineTo(x + boxSize, y + boxSize); ctx.lineTo(x + boxSize, y + boxSize - 8);
          ctx.stroke();

          // Draw target coordinate label
          ctx.font = '7px monospace';
          ctx.fillStyle = camera.hasMotion ? '#ef4444' : accentColor;
          ctx.fillText(`${targetLabel}: ${(currentX/width * 100).toFixed(1)}%, ${(currentY/height * 100).toFixed(1)}%`, x, y - 4);
        }
      }

      ctx.restore(); // Restore context to remove panning for overlay elements

      // 4. Overlays & HUD (Fixed coordinates, not affected by panning)
      ctx.globalAlpha = 1.0;

      // Draw Grid / Reticle
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.15;
      ctx.beginPath();
      ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, height);
      ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Corner bounds markings
      ctx.beginPath();
      ctx.moveTo(15, 25); ctx.lineTo(15, 15); ctx.lineTo(25, 15);
      ctx.moveTo(width - 25, 15); ctx.lineTo(width - 15, 15); ctx.lineTo(width - 15, 25);
      ctx.moveTo(15, height - 25); ctx.lineTo(15, height - 15); ctx.lineTo(25, height - 15);
      ctx.moveTo(width - 25, height - 15); ctx.lineTo(width - 15, height - 15); ctx.lineTo(width - 15, height - 25);
      ctx.stroke();

      // 5. Scanlines & Grain Noise
      if (camera.colorTheme !== 'normal') {
        ctx.globalAlpha = 0.08 + (camera.noiseLevel / 1000);
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < height; i += 3) {
          if (Math.random() < 0.95) {
            ctx.fillRect(0, i, width, 1.2);
          }
        }

        // Moving static interference bar
        const staticBarY = (frameCount * 1.5) % (height * 1.5) - (height * 0.25);
        if (staticBarY >= 0 && staticBarY < height) {
          ctx.fillStyle = primaryColor;
          ctx.globalAlpha = 0.06;
          ctx.fillRect(0, staticBarY, width, height * 0.12);
        }

        // Render pixel grain
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.05 + (camera.noiseLevel / 200);
        for (let i = 0; i < 80; i++) {
          const gx = Math.random() * width;
          const gy = Math.random() * height;
          ctx.fillRect(gx, gy, 1.5, 1.5);
        }
      }

      // 6. Camera Info texts
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = primaryColor;
      ctx.font = '9px monospace';

      // Flashing REC Dot
      if (camera.status === 'online') {
        const isFlashOn = Math.floor(frameCount / 30) % 2 === 0;
        if (isFlashOn) {
          ctx.fillStyle = '#ef4444'; // Red for REC
          ctx.beginPath();
          ctx.arc(20, 20, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = primaryColor;
        ctx.fillText('● LIVE REC', 30, 23);
      } else {
        ctx.fillStyle = '#ef4444';
        ctx.fillText('⚡ OFFLINE', 20, 23);
      }

      // Camera ID & Location
      ctx.fillStyle = primaryColor;
      ctx.fillText(camera.name.toUpperCase(), 20, height - 20);
      ctx.font = '8px monospace';
      ctx.fillStyle = accentColor;
      ctx.fillText(`LOC: ${camera.location.toUpperCase()}`, 20, height - 10);

      // System Stats (Top Right)
      ctx.font = '8px monospace';
      ctx.fillStyle = primaryColor;
      const cameraStatusText = `FPS: ${camera.fps} | NOISE: ${camera.noiseLevel}% | PAN: ${camera.panSpeed > 0 ? 'AUTO' : 'HOLD'}`;
      ctx.fillText(cameraStatusText, width - ctx.measureText(cameraStatusText).width - 20, 23);

      // Date & Live Time (Bottom Right)
      const now = new Date();
      const dateString = now.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });
      // Use simulated time if specified, else system time
      const timeParts = simulatedTime.split(':');
      const timeString = simulatedTime ? `${simulatedTime}:${now.getSeconds().toString().padStart(2, '0')}` : now.toLocaleTimeString('id-ID', { hour12: false });
      
      const fullTimeStr = `${dateString}  ${timeString}`;
      ctx.fillText(fullTimeStr, width - ctx.measureText(fullTimeStr).width - 20, height - 15);

      // Panning degree graphic scale
      ctx.lineWidth = 1;
      ctx.beginPath();
      const scaleX = width / 2;
      const scaleY = height - 12;
      ctx.moveTo(scaleX - 30, scaleY);
      ctx.lineTo(scaleX + 30, scaleY);
      // ticks
      ctx.moveTo(scaleX - 30, scaleY - 3); ctx.lineTo(scaleX - 30, scaleY + 3);
      ctx.moveTo(scaleX, scaleY - 5); ctx.lineTo(scaleX, scaleY + 5);
      ctx.moveTo(scaleX + 30, scaleY - 3); ctx.lineTo(scaleX + 30, scaleY + 3);
      ctx.stroke();
      
      // Draw simulated pointer indicating camera panning center
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      const pointerX = scaleX + (panOffset / (width * 0.12)) * 30;
      ctx.moveTo(pointerX, scaleY - 3);
      ctx.lineTo(pointerX - 3, scaleY + 3);
      ctx.lineTo(pointerX + 3, scaleY + 3);
      ctx.closePath();
      ctx.fill();

      // If active alert (simulated motion detection or red alert)
      if (camera.hasMotion) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 4;
        ctx.strokeRect(0, 0, width, height);

        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = '#ef4444';
        ctx.fillText('⚠️ MOTION ALERT ⚠️', width / 2 - 50, height / 2 - 5);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [camera, simulatedTime]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-black group rounded-lg border border-slate-800">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
