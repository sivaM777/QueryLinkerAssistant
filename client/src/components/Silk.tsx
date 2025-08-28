import { useEffect, useRef } from 'react';

export interface SilkProps {
  children?: React.ReactNode;
  className?: string;
  speed?: number;
  scale?: number;
  color?: string;
  noiseIntensity?: number;
  rotation?: number;
}

const Silk: React.FC<SilkProps> = ({
  children,
  className = "",
  speed = 0.5,
  scale = 1,
  color = "#7B7481",
  noiseIntensity = 1.5,
  rotation = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    let animationId: number;
    let startTime = performance.now();

    const drawSilkPattern = (time: number) => {
      const elapsed = (time - startTime) * 0.001 * speed;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, `${color}20`);
      gradient.addColorStop(0.5, `${color}40`);
      gradient.addColorStop(1, `${color}20`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw silk-like flowing patterns
      ctx.strokeStyle = `${color}80`;
      ctx.lineWidth = 2;
      
      const waves = 6;
      for (let i = 0; i < waves; i++) {
        ctx.beginPath();
        const offsetY = (i * canvas.height) / waves;
        const frequency = 0.01 * scale;
        const amplitude = 50 + i * 20;
        
        for (let x = 0; x <= canvas.width; x += 2) {
          const y = offsetY + 
            amplitude * Math.sin(x * frequency + elapsed + i * 0.5) + 
            amplitude * 0.5 * Math.sin(x * frequency * 2 + elapsed * 0.7 + i * 0.3) +
            amplitude * 0.25 * Math.sin(x * frequency * 4 + elapsed * 1.2 + i * 0.8);
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // Add flowing vertical waves
      ctx.strokeStyle = `${color}60`;
      ctx.lineWidth = 1.5;
      
      const verticalWaves = 4;
      for (let i = 0; i < verticalWaves; i++) {
        ctx.beginPath();
        const offsetX = (i * canvas.width) / verticalWaves;
        const frequency = 0.008 * scale;
        const amplitude = 40 + i * 15;
        
        for (let y = 0; y <= canvas.height; y += 2) {
          const x = offsetX + 
            amplitude * Math.sin(y * frequency + elapsed * 0.8 + i * 0.7) + 
            amplitude * 0.6 * Math.sin(y * frequency * 1.5 + elapsed * 1.1 + i * 0.4);
          
          if (y === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // Add noise particles
      if (noiseIntensity > 0) {
        ctx.fillStyle = `${color}30`;
        const particleCount = Math.floor(noiseIntensity * 20);
        
        for (let i = 0; i < particleCount; i++) {
          const x = (Math.sin(elapsed * 0.5 + i) * 0.5 + 0.5) * canvas.width;
          const y = (Math.sin(elapsed * 0.3 + i * 1.7) * 0.5 + 0.5) * canvas.height;
          const size = Math.sin(elapsed + i) * 2 + 3;
          
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationId = requestAnimationFrame(drawSilkPattern);
    };

    drawSilkPattern(performance.now());

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', setCanvasSize);
    };
  }, [speed, scale, color, noiseIntensity, rotation]);

  return (
    <div className={`relative min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/30" style={{ zIndex: 1 }} />
      <div className="relative" style={{ zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
};

export default Silk;