"use client"

import { useEffect, useRef, useMemo } from 'react';
import { throttle } from './throttle';

interface Meteor {
  x: number;
  y: number;
  z: number;
  size: number;
  speed: number;
  acceleration: number;
  color: string;
  angle: number;
  tailLength: number;
  brightness: number;
  maxSpeed: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
  glowSize: number;
  isSpecial: boolean;
}

const MeteorShower = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const meteorsRef = useRef<Meteor[]>([]);
  const starsRef = useRef<Star[]>([]);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  
  // Memoize color arrays to avoid recreating them on each render
  const meteorColors = useMemo(() => [
    '#FFFFFF', // White
    '#FF7F00', // Orange
    '#FF4500', // Red-Orange
    '#FF0000', // Red
    '#8A2BE2', // Purple
    '#9370DB', // Medium Purple
    '#BA55D3', // Medium Orchid (light purple)
    '#FFD700', // Gold (warm orange)
  ], []);
  
  const starColors = useMemo(() => [
    '#FFFFFF', // Pure white (brightest)
    '#F8F7FF', // Bluish white
    '#FFF4EA', // Yellowish
    '#FFEBE0', // Orange
    '#FFD2A1', // Red
    '#CAE1FF', // Blue
    '#F0F8FF', // Alice blue (bright blue-white)
    '#FFFAFA', // Snow (bright white with red tint)
    '#F0FFFF', // Azure (bright cyan-white)
    '#F5F5F5', // White smoke (bright gray-white)
  ], []);

  // Generate random color for meteors
  const getRandomColor = () => {
    return meteorColors[Math.floor(Math.random() * meteorColors.length)];
  };

  // Get star color
  const getStarColor = () => {
    return starColors[Math.floor(Math.random() * starColors.length)];
  };

  // Initialize stars with optimized distribution
  const initStars = () => {
    const stars: Star[] = [];
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Use a grid for more even distribution
    const gridSize = 50;
    const cols = Math.ceil(width / gridSize);
    const rows = Math.ceil(height / gridSize);
    
    // Create main stars (larger, brighter)
    const mainStarCount = Math.floor((width * height) / 15000);
    
    // Pre-calculate random values to reduce Math.random() calls
    const randomValues = Array(mainStarCount * 6).fill(0).map(() => Math.random());
    
    for (let i = 0; i < mainStarCount; i++) {
      const col = Math.floor(randomValues[i * 6] * cols);
      const row = Math.floor(randomValues[i * 6 + 1] * rows);
      
      const x = (col * gridSize) + (randomValues[i * 6 + 2] * gridSize);
      const y = (row * gridSize) + (randomValues[i * 6 + 3] * gridSize);
      
      const isSpecial = randomValues[i * 6 + 4] < 0.1;
      
      stars.push({
        x: Math.min(x, width),
        y: Math.min(y, height),
        size: isSpecial ? randomValues[i * 6 + 5] * 2 + 1.5 : randomValues[i * 6 + 5] * 1.5 + 1,
        brightness: isSpecial ? 0.9 + randomValues[i * 6 + 5] * 0.1 : 0.7 + randomValues[i * 6 + 5] * 0.3,
        twinkleSpeed: 0.5 + randomValues[i * 6 + 5] * 1.5,
        twinklePhase: randomValues[i * 6 + 5] * Math.PI * 2,
        color: getStarColor(),
        glowSize: isSpecial ? 5 + randomValues[i * 6 + 5] * 3 : 3 + randomValues[i * 6 + 5] * 2,
        isSpecial
      });
    }
    
    // Add smaller background stars
    const bgStarCount = Math.floor((width * height) / 8000);
    const bgRandomValues = Array(bgStarCount * 6).fill(0).map(() => Math.random());
    
    for (let i = 0; i < bgStarCount; i++) {
      const isSpecial = bgRandomValues[i * 6] < 0.05;
      
      stars.push({
        x: bgRandomValues[i * 6 + 1] * width,
        y: bgRandomValues[i * 6 + 2] * height,
        size: isSpecial ? bgRandomValues[i * 6 + 3] * 1.2 + 0.6 : bgRandomValues[i * 6 + 3] * 0.7 + 0.3,
        brightness: isSpecial ? 0.7 + bgRandomValues[i * 6 + 4] * 0.3 : 0.4 + bgRandomValues[i * 6 + 4] * 0.4,
        twinkleSpeed: 0.2 + bgRandomValues[i * 6 + 5] * 0.8,
        twinklePhase: bgRandomValues[i * 6 + 5] * Math.PI * 2,
        color: getStarColor(),
        glowSize: isSpecial ? 3 + bgRandomValues[i * 6 + 5] * 2 : 1.5 + bgRandomValues[i * 6 + 5] * 1.5,
        isSpecial
      });
    }
    
    starsRef.current = stars;
  };

  // Initialize meteors
  const initMeteors = () => {
    const meteors: Meteor[] = [];
    for (let i = 0; i < 2; i++) {
      meteors.push(createMeteor());
    }
    meteorsRef.current = meteors;
  };

  // Create a new meteor with realistic properties
  const createMeteor = (): Meteor => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return {
        x: -100,
        y: -100,
        z: 1,
        size: 0.8,
        speed: 0.8,
        acceleration: 0.01,
        color: getRandomColor(),
        angle: Math.PI / 4,
        tailLength: 40,
        brightness: 0.8,
        maxSpeed: 2.5
      };
    }
    
    // Position meteors to start from left 1/3 and top 1/2 of the screen
    let x, y;
    
    // Pre-calculate random values
    const rand1 = Math.random();
    const rand2 = Math.random();
    const rand3 = Math.random();
    const rand4 = Math.random();
    const rand5 = Math.random();
    
    if (rand1 < 0.6) {
      // 60% chance to start from left edge
      x = rand2 * (canvas.width / 3);
      y = rand3 * (canvas.height / 2);
    } else {
      // 40% chance to start from top edge
      x = rand2 * (canvas.width / 3);
      y = rand3 * (canvas.height / 2);
    }
    
    // Fixed angle range
    const angle = Math.PI / 6 + (rand4 * Math.PI / 6);
    
    // Smaller head size
    const size = rand5 * 0.8 + 0.4;
    
    // Slower initial speed
    const speed = rand5 * 0.7 + 0.5;
    
    // Depth for 3D effect
    const z = rand5 * 0.8 + 0.8;
    
    // Longer tail length
    const tailLength = (size * 15) + (speed * 10);
    
    // Calculate reasonable max speed
    const screenDiagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height);
    const minCrossingTime = 3 + rand5 * 2;
    const calculatedMaxSpeed = screenDiagonal / (60 * minCrossingTime);
    
    // Use a reasonable max speed cap
    const maxSpeed = Math.min(Math.max(calculatedMaxSpeed, 2.0), 3.0);
    
    return {
      x,
      y,
      z,
      size,
      speed,
      acceleration: rand5 * 0.015 + 0.01,
      color: getRandomColor(),
      angle,
      tailLength,
      brightness: 0.8 + rand5 * 0.2,
      maxSpeed
    };
  };

  // Draw meteor with optimized rendering
  const drawMeteor = (
    ctx: CanvasRenderingContext2D, 
    meteor: Meteor
  ) => {
    const { x, y, z, size, color, angle, tailLength, brightness } = meteor;
    const actualSize = size * z;
    
    // Safety check
    if (!isFinite(x) || !isFinite(y) || !isFinite(actualSize)) {
      return;
    }
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    
    try {
      const headRadius = actualSize * 0.7;
      
      // Apply shadow only once for better performance
      ctx.shadowColor = color;
      ctx.shadowBlur = headRadius * 4;
      
      // Draw the head
      ctx.beginPath();
      ctx.arc(0, 0, headRadius, 0, Math.PI * 2);
      
      // Create gradient for head
      const headGradient = ctx.createRadialGradient(
        0, 0, 0,
        0, 0, Math.max(0.1, headRadius * 2)
      );
      
      headGradient.addColorStop(0, '#FFFFFF');
      headGradient.addColorStop(0.3, color);
      headGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = headGradient;
      ctx.fill();
      
      // Draw the tail
      const actualTailLength = tailLength * z;
      
      ctx.beginPath();
      ctx.moveTo(0, headRadius * 0.5);
      ctx.quadraticCurveTo(
        -actualTailLength * 0.5, headRadius * 0.3,
        -actualTailLength, 0
      );
      ctx.quadraticCurveTo(
        -actualTailLength * 0.5, -headRadius * 0.3,
        0, -headRadius * 0.5
      );
      ctx.closePath();
      
      // Create gradient for tail
      const tailGradient = ctx.createLinearGradient(0, 0, -actualTailLength, 0);
      
      const opacityFactor = brightness * 0.9;
      
      tailGradient.addColorStop(0, color);
      tailGradient.addColorStop(0.1, color + Math.floor(opacityFactor * 255).toString(16).padStart(2, '0'));
      tailGradient.addColorStop(0.7, color + '40');
      tailGradient.addColorStop(1, color + '00');
      
      ctx.fillStyle = tailGradient;
      ctx.fill();
      
      // Add bright core
      ctx.beginPath();
      ctx.arc(0, 0, headRadius * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      
      // Add outer glow (simplified for performance)
      ctx.beginPath();
      ctx.arc(0, 0, headRadius * 1.5, 0, Math.PI * 2);
      const outerGlow = ctx.createRadialGradient(
        0, 0, headRadius,
        0, 0, headRadius * 1.5
      );
      outerGlow.addColorStop(0, color + '40');
      outerGlow.addColorStop(1, color + '00');
      ctx.fillStyle = outerGlow;
      ctx.fill();
      
    } catch (error) {
      // Fallback rendering
      ctx.beginPath();
      ctx.arc(0, 0, actualSize, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
    
    ctx.restore();
  };

  // Draw star with optimized rendering
  const drawStar = (
    ctx: CanvasRenderingContext2D,
    star: Star,
    time: number
  ) => {
    // Safety check
    if (!isFinite(star.x) || !isFinite(star.y) || !isFinite(star.size)) {
      return;
    }
    
    // Calculate twinkle effect
    const twinkle = 0.5 + 0.5 * Math.sin(time * star.twinkleSpeed + star.twinklePhase);
    const brightness = star.brightness * (0.6 + 0.4 * twinkle);
    
    // Optimize by only drawing detailed stars for larger/special ones
    if (star.isSpecial || star.size > 1) {
      // Layer 1: Outer glow (large, soft)
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * star.glowSize * (0.8 + 0.2 * twinkle), 0, Math.PI * 2);
      
      try {
        const outerGlow = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, star.size * star.glowSize * (0.8 + 0.2 * twinkle)
        );
        
        outerGlow.addColorStop(0, star.color + '40');
        outerGlow.addColorStop(0.5, star.color + '20');
        outerGlow.addColorStop(1, star.color + '00');
        
        ctx.fillStyle = outerGlow;
        ctx.fill();
      } catch (error) {
        ctx.fillStyle = star.color + '10';
        ctx.fill();
      }
      
      // Layer 2: Middle glow (medium, brighter)
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size * 2 * (0.8 + 0.2 * twinkle), 0, Math.PI * 2);
      
      try {
        const midGlow = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, star.size * 2 * (0.8 + 0.2 * twinkle)
        );
        
        const midAlpha = Math.floor(brightness * 128).toString(16).padStart(2, '0');
        midGlow.addColorStop(0, star.color + '80');
        midGlow.addColorStop(0.5, star.color + midAlpha);
        midGlow.addColorStop(1, star.color + '00');
        
        ctx.fillStyle = midGlow;
        ctx.fill();
      } catch (error) {
        ctx.fillStyle = star.color + '30';
        ctx.fill();
      }
    }
    
    // Layer 3: Core star (small, brightest) - draw for all stars
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size * (0.8 + 0.2 * twinkle), 0, Math.PI * 2);
    
    // Apply shadow only for special stars to improve performance
    if (star.isSpecial) {
      ctx.shadowColor = star.color;
      ctx.shadowBlur = star.size * 8 * (1 + twinkle);
    }
    
    try {
      const coreGlow = ctx.createRadialGradient(
        star.x, star.y, 0,
        star.x, star.y, star.size * (0.8 + 0.2 * twinkle)
      );
      
      coreGlow.addColorStop(0, '#FFFFFF');
      coreGlow.addColorStop(0.3, star.color);
      coreGlow.addColorStop(1, star.color + '40');
      
      ctx.fillStyle = coreGlow;
    } catch (error) {
      ctx.fillStyle = star.color;
    }
    
    ctx.fill();
    
    // Only draw sparkle effect for special stars to improve performance
    if (star.isSpecial) {
      const sparkleSize = star.size * (0.5 + twinkle) * 1.5;
      const sparkleOpacity = '60';
      
      // Horizontal sparkle line
      ctx.beginPath();
      ctx.moveTo(star.x - sparkleSize * 3, star.y);
      ctx.lineTo(star.x + sparkleSize * 3, star.y);
      ctx.strokeStyle = star.color + sparkleOpacity;
      ctx.lineWidth = star.size * 0.4;
      ctx.stroke();
      
      // Vertical sparkle line
      ctx.beginPath();
      ctx.moveTo(star.x, star.y - sparkleSize * 3);
      ctx.lineTo(star.x, star.y + sparkleSize * 3);
      ctx.stroke();
      
      // Diagonal sparkle lines
      const diagonalSize = sparkleSize * 2;
      
      // Diagonal line 1
      ctx.beginPath();
      ctx.moveTo(star.x - diagonalSize, star.y - diagonalSize);
      ctx.lineTo(star.x + diagonalSize, star.y + diagonalSize);
      ctx.strokeStyle = star.color + '30';
      ctx.lineWidth = star.size * 0.2;
      ctx.stroke();
      
      // Diagonal line 2
      ctx.beginPath();
      ctx.moveTo(star.x + diagonalSize, star.y - diagonalSize);
      ctx.lineTo(star.x - diagonalSize, star.y + diagonalSize);
      ctx.stroke();
    }
    
    // Reset shadow to avoid affecting other elements
    if (star.isSpecial) {
      ctx.shadowBlur = 0;
    }
  };

  // Animation loop with time-based updates
  const animate = (timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    
    // Calculate delta time for smooth animation regardless of frame rate
    const deltaTime = timestamp - (lastTimeRef.current || timestamp);
    lastTimeRef.current = timestamp;
    
    // Limit delta time to avoid large jumps after tab switching
    const limitedDelta = Math.min(deltaTime, 100) / 16.67; // Normalize to 60fps
    
    // Clear canvas with solid black
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Current time for animations
    const time = timestamp / 1000;
    
    // Draw stars with batching for better performance
    // Draw non-special stars first (less detailed)
    ctx.shadowBlur = 0; // Disable shadow for non-special stars
    starsRef.current.forEach(star => {
      if (!star.isSpecial) {
        drawStar(ctx, star, time);
      }
    });
    
    // Then draw special stars (more detailed)
    starsRef.current.forEach(star => {
      if (star.isSpecial) {
        drawStar(ctx, star, time);
      }
    });
    
    // Update and draw meteors
    meteorsRef.current.forEach((meteor, index) => {
      // Update position with acceleration but cap the maximum speed
      meteor.speed = Math.min(meteor.speed + meteor.acceleration * limitedDelta, meteor.maxSpeed);
      
      // Move along the angle with delta time adjustment
      meteor.x += meteor.speed * Math.cos(meteor.angle) * meteor.z * limitedDelta;
      meteor.y += meteor.speed * Math.sin(meteor.angle) * meteor.z * limitedDelta;
      
      // Draw meteor
      drawMeteor(ctx, meteor);
      
      // Reset meteor if it goes off screen
      const buffer = 200;
      if (
        meteor.x > canvas.width + buffer || 
        meteor.y > canvas.height + buffer
      ) {
        // Add random delay before creating a new meteor
        if (Math.random() > 0.95) {
          meteorsRef.current[index] = createMeteor();
        } else {
          // Move meteor far off-screen to hide it temporarily
          meteor.x = -1000;
          meteor.y = -1000;
          // Schedule reappearance with longer delays
          setTimeout(() => {
            meteorsRef.current[index] = createMeteor();
          }, Math.random() * 8000 + 3000);
        }
      }
    });
    
    // Continue animation
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Handle resize with throttling
  const handleResize = throttle(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Use devicePixelRatio for better rendering on high-DPI displays
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;
    
    // Set canvas size with device pixel ratio consideration
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    
    // Reinitialize stars on resize
    initStars();
  }, 500);

  useEffect(() => {
    // Initialize canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Set black background
    const ctx = canvas.getContext('2d', { alpha: false });
    if (ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Initialize stars and meteors
    initStars();
    initMeteors();
    
    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full -z-10"
      style={{ pointerEvents: 'none', background: 'transparent' }}
    />
  );
};

export default MeteorShower;
