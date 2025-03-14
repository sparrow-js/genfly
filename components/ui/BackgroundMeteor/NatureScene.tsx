"use client"

import { useEffect, useRef } from 'react';
import { drawSun, drawGrass, drawRiver, drawClouds, drawBird } from './sceneElements';

const NatureScene = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas to full window size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);
    
    // Scene elements state
    let clouds: { x: number; y: number; width: number; speed: number }[] = [];
    let birdPosition = { x: -100, y: 150, direction: 1, visible: false };
    let birdTimer = 0;
    
    // Calculate river position for proper placement of fish and crab
    // Move river position lower to make more room for the larger grass field
    const riverY = canvas.height * 0.9;  // Changed from 0.85 to 0.9
    const riverHeight = canvas.height * 0.1;  // Changed from 0.15 to 0.1
    
    // Fish positions with direction and movement state - one fat, one thin
    // Positioned within the river bounds
    let fishPositions = [
      { 
        x: canvas.width * 0.3, 
        y: riverY + riverHeight * 0.4, // Position in the middle of the river
        size: 15, 
        direction: 1, 
        speed: 0.8, 
        type: 'fat' 
      },
      { 
        x: canvas.width * 0.6, 
        y: riverY + riverHeight * 0.6, // Position in the lower part of the river
        size: 12, 
        direction: -1, 
        speed: 0.6, 
        type: 'thin' 
      }
    ];
    
    // Crab position with direction and movement state
    // Positioned at the bottom of the river
    let crabPosition = { 
      x: canvas.width * 0.5, 
      y: riverY + riverHeight * 0.8, // Position near the bottom of the river
      size: 15, 
      direction: 1, 
      speed: 0.4 
    };
    
    // River flow animation offset
    let riverFlowOffset = 0;
    
    // Initialize clouds - fewer, smaller clouds
    for (let i = 0; i < 4; i++) {
      clouds.push({
        x: Math.random() * canvas.width,
        y: 50 + Math.random() * 100,
        width: 60 + Math.random() * 80, // Reduced cloud size
        speed: 0.2 + Math.random() * 0.3
      });
    }
    
    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw sky gradient (soft pastel colors)
      const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.7);
      skyGradient.addColorStop(0, '#e6f0ff');
      skyGradient.addColorStop(1, '#d4e6ff');
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw sun with enhanced glow - REDUCED SIZE (from 60 to 45)
      drawSun(ctx, canvas.width * 0.85, canvas.height * 0.15, 45);
      
      // Draw and update clouds
      clouds.forEach(cloud => {
        drawClouds(ctx, cloud.x, cloud.y, cloud.width);
        cloud.x += cloud.speed;
        if (cloud.x > canvas.width + 200) {
          cloud.x = -200;
          cloud.y = 50 + Math.random() * 100;
        }
      });
      
      // Draw grass with optimized edge (static, no animation)
      // Increased grass height by changing from 0.75 to 0.65 (starts higher)
      drawGrass(ctx, 0, canvas.height * 0.65, canvas.width, canvas.height * 0.35);
      
      // Update river flow animation
      riverFlowOffset += 0.5; // Speed of river flow from left to right
      if (riverFlowOffset > 100) riverFlowOffset = 0;
      
      // Draw river at the bottom with flow animation
      drawRiver(ctx, 0, riverY, canvas.width, riverHeight, riverFlowOffset, fishPositions, crabPosition);
      
      // Update fish positions
      fishPositions.forEach(fish => {
        // Move fish based on direction
        fish.x += fish.speed * fish.direction;
        
        // Reverse direction when reaching edges
        if (fish.x > canvas.width - 50 && fish.direction > 0) {
          fish.direction = -1;
        } else if (fish.x < 50 && fish.direction < 0) {
          fish.direction = 1;
        }
      });
      
      // Update crab position
      crabPosition.x += crabPosition.speed * crabPosition.direction;
      
      // Reverse crab direction when reaching edges
      if (crabPosition.x > canvas.width - 100 && crabPosition.direction > 0) {
        crabPosition.direction = -1;
      } else if (crabPosition.x < 100 && crabPosition.direction < 0) {
        crabPosition.direction = 1;
      }
      
      // Handle bird appearance
      birdTimer++;
      if (birdTimer > 600 && !birdPosition.visible) {
        birdPosition.visible = true;
        birdPosition.x = -100; // Always start from left
        birdPosition.y = 100 + Math.random() * 150;
        birdTimer = 0;
      }
      
      // Draw and update bird if visible
      if (birdPosition.visible) {
        drawBird(ctx, birdPosition.x, birdPosition.y, 1); // Always direction 1 (left to right)
        birdPosition.x += 1.5; // Slightly slower movement for more elegance
        
        if (birdPosition.x > canvas.width + 100) {
          birdPosition.visible = false;
        }
      }
      
      requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);
  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full -z-9"
      style={{ touchAction: 'none', background: 'transparent' }}
    />
  );
};

export default NatureScene;
