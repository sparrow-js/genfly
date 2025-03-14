// Function to draw the sun with glow effect
export const drawSun = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number
  ) => {
    // Create radial gradient for sun glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
    gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 230, 128, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 180, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 180, 0, 0)');
    
    // Draw sun glow
    ctx.beginPath();
    ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw sun body
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFEE99';
    ctx.fill();
  };
  
  // Function to draw grass field with smooth undulating curves using Bezier curves (no lines)
  export const drawGrass = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    // Create gradient for grass
    const grassGradient = ctx.createLinearGradient(0, y, 0, y + height);
    grassGradient.addColorStop(0, '#7cba5d');
    grassGradient.addColorStop(1, '#5a9e3d');
    
    // Draw base grass area with smooth top edge
    ctx.fillStyle = grassGradient;
    
    // Create grass field with smooth curves
    ctx.beginPath();
    
    // Start at bottom left
    ctx.moveTo(x, y + height);
    
    // Bottom edge
    ctx.lineTo(x + width, y + height);
    
    // Right edge
    ctx.lineTo(x + width, y);
    
    // Create smoother top edge with fewer, more gentle control points
    // Use a single large bezier curve for the entire top edge for a smoother appearance
    ctx.bezierCurveTo(
      x + width * 0.75, y - height * 0.05, // First control point
      x + width * 0.25, y - height * 0.05, // Second control point
      x, y                                 // End point
    );
    
    // Close the path
    ctx.closePath();
    ctx.fill();
    
    // Add subtle texture to grass (no lines, just color variations)
    for (let i = 0; i < height; i += 10) {
      // Create horizontal bands of slightly different colors
      const bandGradient = ctx.createLinearGradient(x, y + i, x + width, y + i);
      
      // Alternate slightly different shades
      if (i % 20 === 0) {
        bandGradient.addColorStop(0, 'rgba(124, 186, 93, 0.4)');
        bandGradient.addColorStop(0.5, 'rgba(124, 186, 93, 0.1)');
        bandGradient.addColorStop(1, 'rgba(124, 186, 93, 0.4)');
      } else {
        bandGradient.addColorStop(0, 'rgba(90, 158, 61, 0.1)');
        bandGradient.addColorStop(0.5, 'rgba(90, 158, 61, 0.3)');
        bandGradient.addColorStop(1, 'rgba(90, 158, 61, 0.1)');
      }
      
      // Draw subtle curved bands instead of straight lines
      ctx.fillStyle = bandGradient;
      ctx.beginPath();
      ctx.moveTo(x, y + i);
      
      // Create subtle curves for each band
      for (let j = 0; j <= width; j += width / 10) {
        const curveHeight = Math.sin(j * 0.01 + i * 0.05) * 5;
        
        if (j === 0) {
          ctx.moveTo(x + j, y + i + curveHeight);
        } else {
          const prevX = x + j - width / 10;
          const prevY = y + i + Math.sin(prevX * 0.01 + i * 0.05) * 5;
          
          const cpX = x + j - width / 20;
          const cpY = y + i + Math.sin(cpX * 0.01 + i * 0.05) * 5;
          
          ctx.quadraticCurveTo(cpX, cpY, x + j, y + i + curveHeight);
        }
      }
      
      ctx.lineTo(x + width, y + i + 10);
      ctx.lineTo(x, y + i + 10);
      ctx.closePath();
      ctx.fill();
    }
    
    // Draw some flowers scattered in the grass (static, no animation)
    const flowerColors = ['#FF6B6B', '#FFCB77', '#FFFFFF', '#A5D8FF', '#E5B9FF'];
    
    // Use fixed seed for consistent flower positions
    const flowerPositions = [
      { x: width * 0.1, y: y + height * 0.3, size: 3, color: flowerColors[0] },
      { x: width * 0.2, y: y + height * 0.5, size: 4, color: flowerColors[1] },
      { x: width * 0.35, y: y + height * 0.2, size: 3.5, color: flowerColors[2] },
      { x: width * 0.45, y: y + height * 0.6, size: 2.5, color: flowerColors[3] },
      { x: width * 0.6, y: y + height * 0.4, size: 3, color: flowerColors[4] },
      { x: width * 0.7, y: y + height * 0.3, size: 4, color: flowerColors[0] },
      { x: width * 0.8, y: y + height * 0.5, size: 3, color: flowerColors[2] },
      { x: width * 0.9, y: y + height * 0.2, size: 3.5, color: flowerColors[3] },
      { x: width * 0.15, y: y + height * 0.7, size: 2.5, color: flowerColors[1] },
      { x: width * 0.25, y: y + height * 0.3, size: 3, color: flowerColors[4] },
      { x: width * 0.4, y: y + height * 0.4, size: 4, color: flowerColors[0] },
      { x: width * 0.55, y: y + height * 0.2, size: 3, color: flowerColors[2] },
      { x: width * 0.65, y: y + height * 0.6, size: 3.5, color: flowerColors[3] },
      { x: width * 0.75, y: y + height * 0.4, size: 2.5, color: flowerColors[1] },
      { x: width * 0.85, y: y + height * 0.3, size: 3, color: flowerColors[4] },
      { x: width * 0.05, y: y + height * 0.5, size: 4, color: flowerColors[0] },
      { x: width * 0.3, y: y + height * 0.7, size: 3, color: flowerColors[2] },
      { x: width * 0.5, y: y + height * 0.3, size: 3.5, color: flowerColors[3] },
      { x: width * 0.7, y: y + height * 0.7, size: 2.5, color: flowerColors[1] },
      { x: width * 0.95, y: y + height * 0.4, size: 3, color: flowerColors[4] }
    ];
    
    // Draw each flower at fixed positions
    flowerPositions.forEach(flower => {
      // Draw flower
      ctx.fillStyle = flower.color;
      
      // Draw petals
      for (let j = 0; j < 5; j++) {
        const angle = (j / 5) * Math.PI * 2;
        const petalX = flower.x + Math.cos(angle) * flower.size;
        const petalY = flower.y + Math.sin(angle) * flower.size;
        
        ctx.beginPath();
        ctx.arc(petalX, petalY, flower.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw center
      ctx.fillStyle = '#FFFF00';
      ctx.beginPath();
      ctx.arc(flower.x, flower.y, flower.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    });
  };
  
  // Function to draw river with flow animation
  export const drawRiver = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    flowOffset: number,
    fishPositions: { x: number; y: number; size: number; direction: number; speed: number; type: string }[],
    crabPosition: { x: number; y: number; size: number; direction: number; speed: number }
  ) => {
    // Create gradient for river
    const riverGradient = ctx.createLinearGradient(0, y, 0, y + height);
    riverGradient.addColorStop(0, '#7ec0ee');
    riverGradient.addColorStop(1, '#5a9eee');
    
    // Draw river base
    ctx.fillStyle = riverGradient;
    
    // Draw river with curved top edge
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x + width, y);
    
    // Create curved top edge with 3 control points
    const segment = width / 4;
    ctx.lineTo(x + width, y);
    
    // Curved top edge with more pronounced curves
    ctx.bezierCurveTo(
      x + segment * 3, y - height * 0.1,
      x + segment * 2, y + height * 0.15,
      x + segment, y - height * 0.05
    );
    
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();
    
    // Draw ripples on the river with left-to-right flow animation
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < 8; i++) {
      const yPos = y + (height * i) / 8;
      
      ctx.beginPath();
      ctx.moveTo(x, yPos);
      
      for (let xPos = 0; xPos <= width; xPos += 20) {
        // Use flowOffset to create left-to-right movement
        const waveHeight = Math.sin((xPos - flowOffset) * 0.05) * 2;
        ctx.lineTo(xPos, yPos + waveHeight);
      }
      
      ctx.stroke();
    }
    
    // Draw fish in the river
    fishPositions.forEach(fish => {
      if (fish.type === 'fat') {
        drawFatFish(ctx, fish.x, fish.y, fish.size, fish.direction);
      } else {
        drawThinFish(ctx, fish.x, fish.y, fish.size, fish.direction);
      }
    });
    
    // Draw crab
    drawCrab(ctx, crabPosition.x, crabPosition.y, crabPosition.size, crabPosition.direction);
    
    // Draw rocks
    drawRocks(ctx, x, y, width, height);
  };
  
  // Function to draw clouds
  export const drawClouds = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number
  ) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    
    // Draw main cloud body
    ctx.beginPath();
    ctx.arc(x, y, width * 0.2, 0, Math.PI * 2);
    ctx.arc(x + width * 0.15, y - width * 0.1, width * 0.25, 0, Math.PI * 2);
    ctx.arc(x + width * 0.3, y, width * 0.2, 0, Math.PI * 2);
    ctx.arc(x + width * 0.2, y + width * 0.1, width * 0.2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  };
  
  // Function to draw a simple flying bird (replacing eagle)
  export const drawBird = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    direction: number
  ) => {
    // Save context for rotation if needed
    ctx.save();
    
    // If direction is -1, flip the bird
    if (direction === -1) {
      ctx.translate(x, y);
      ctx.scale(-1, 1);
      ctx.translate(-x, -y);
    }
    
    // Calculate wing position based on time for flapping effect
    const wingOffset = Math.sin(Date.now() * 0.005) * 5;
    
    // Draw simple bird silhouette
    ctx.fillStyle = '#555';
    
    // Bird body - simple oval
    ctx.beginPath();
    ctx.ellipse(x, y, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Bird head
    ctx.beginPath();
    ctx.arc(x + 6, y - 1, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Bird tail - simple triangle
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.lineTo(x - 14, y - 3);
    ctx.lineTo(x - 14, y + 3);
    ctx.closePath();
    ctx.fill();
    
    // Bird wings - simple curved shapes with flapping animation
    // Top wing
    ctx.beginPath();
    ctx.moveTo(x, y - 3);
    ctx.quadraticCurveTo(
      x - 5, 
      y - 10 - wingOffset, 
      x - 10, 
      y - 5 - wingOffset
    );
    ctx.quadraticCurveTo(
      x - 5, 
      y - 5, 
      x, 
      y - 3
    );
    ctx.fill();
    
    // Bottom wing (only visible on downstroke)
    if (wingOffset < 0) {
      ctx.beginPath();
      ctx.moveTo(x, y + 3);
      ctx.quadraticCurveTo(
        x - 5, 
        y + 8 - wingOffset, 
        x - 10, 
        y + 5 - wingOffset
      );
      ctx.quadraticCurveTo(
        x - 5, 
        y + 3, 
        x, 
        y + 3
      );
      ctx.fill();
    }
    
    // Bird beak - simple triangle
    ctx.fillStyle = '#FF9800';
    ctx.beginPath();
    ctx.moveTo(x + 10, y);
    ctx.lineTo(x + 14, y);
    ctx.lineTo(x + 10, y + 2);
    ctx.closePath();
    ctx.fill();
    
    // Bird eye
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(x + 8, y - 2, 1, 0, Math.PI * 2);
    ctx.fill();
    
    // Restore context
    ctx.restore();
  };
  
  // Function to draw a fat fish
  export const drawFatFish = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    direction: number
  ) => {
    // Calculate tail movement
    const tailWag = Math.sin(Date.now() * 0.01) * 5;
    
    ctx.save();
    
    // If direction is -1, flip the fish
    if (direction === -1) {
      ctx.translate(x, y);
      ctx.scale(-1, 1);
      ctx.translate(-x, -y);
    }
    
    // Fat fish body - rounder and wider
    ctx.fillStyle = '#FF9D5C';
    ctx.beginPath();
    ctx.moveTo(x + size, y);
    // Make the body wider and rounder
    ctx.quadraticCurveTo(x + size * 0.5, y - size * 0.8, x - size, y);
    ctx.quadraticCurveTo(x + size * 0.5, y + size * 0.8, x + size, y);
    ctx.fill();
    
    // Fish tail - shorter for fat fish
    ctx.fillStyle = '#FF9D5C';
    ctx.beginPath();
    ctx.moveTo(x - size, y);
    ctx.lineTo(x - size * 1.3, y - size * 0.4 + tailWag);
    ctx.lineTo(x - size * 1.3, y + size * 0.4 + tailWag);
    ctx.closePath();
    ctx.fill();
    
    // Fish eye
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(x + size * 0.7, y - size * 0.2, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // Fish fins - top and bottom
    ctx.fillStyle = '#FF8D4C';
    
    // Top fin
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.5);
    ctx.quadraticCurveTo(x - size * 0.2, y - size * 1, x - size * 0.4, y - size * 0.5);
    ctx.lineTo(x, y - size * 0.5);
    ctx.fill();
    
    // Bottom fin
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.5);
    ctx.quadraticCurveTo(x - size * 0.2, y + size * 1, x - size * 0.4, y + size * 0.5);
    ctx.lineTo(x, y + size * 0.5);
    ctx.fill();
    
    // Add some spots for the fat fish
    ctx.fillStyle = '#FF7D3C';
    ctx.beginPath();
    ctx.arc(x + size * 0.3, y - size * 0.3, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(x - size * 0.3, y + size * 0.2, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  };
  
  // Function to draw a thin fish
  export const drawThinFish = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    direction: number
  ) => {
    // Calculate tail movement
    const tailWag = Math.sin(Date.now() * 0.01) * 5;
    
    ctx.save();
    
    // If direction is -1, flip the fish
    if (direction === -1) {
      ctx.translate(x, y);
      ctx.scale(-1, 1);
      ctx.translate(-x, -y);
    }
    
    // Thin fish body - longer and slimmer - CHANGED COLOR TO PURPLE
    ctx.fillStyle = '#9C6ADE';  // Changed from #4DB6AC (blue-green) to purple
    ctx.beginPath();
    ctx.moveTo(x + size, y);
    // Make the body longer and thinner
    ctx.quadraticCurveTo(x, y - size * 0.3, x - size * 1.2, y);
    ctx.quadraticCurveTo(x, y + size * 0.3, x + size, y);
    ctx.fill();
    
    // Fish tail - longer for thin fish - CHANGED COLOR TO PURPLE
    ctx.fillStyle = '#9C6ADE';  // Changed from #4DB6AC (blue-green) to purple
    ctx.beginPath();
    ctx.moveTo(x - size * 1.2, y);
    ctx.lineTo(x - size * 1.8, y - size * 0.6 + tailWag);
    ctx.lineTo(x - size * 1.8, y + size * 0.6 + tailWag);
    ctx.closePath();
    ctx.fill();
    
    // Fish eye
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(x + size * 0.7, y - size * 0.1, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    // Fish fins - more elongated for thin fish - CHANGED COLOR TO DARKER PURPLE
    ctx.fillStyle = '#8A57D4';  // Changed from #3DA69C to darker purple
    
    // Top fin - taller
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.2);
    ctx.quadraticCurveTo(x - size * 0.3, y - size * 0.8, x - size * 0.6, y - size * 0.2);
    ctx.lineTo(x, y - size * 0.2);
    ctx.fill();
    
    // Bottom fin
    ctx.beginPath();
    ctx.moveTo(x - size * 0.4, y + size * 0.2);
    ctx.quadraticCurveTo(x - size * 0.6, y + size * 0.5, x - size * 0.8, y + size * 0.2);
    ctx.lineTo(x - size * 0.4, y + size * 0.2);
    ctx.fill();
    
    // Add some stripes for the thin fish - CHANGED COLOR TO DARKER PURPLE
    ctx.strokeStyle = '#7A47C4';  // Changed from #2D968C to darker purple
    ctx.lineWidth = size * 0.05;
    
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x - size * 0.2 - i * size * 0.3, y - size * 0.2);
      ctx.lineTo(x - size * 0.2 - i * size * 0.3, y + size * 0.2);
      ctx.stroke();
    }
    
    ctx.restore();
  };
  
  // Function to draw a crab with sideways movement
  export const drawCrab = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    direction: number
  ) => {
    // Calculate claw movement
    const clawAngle = Math.sin(Date.now() * 0.003) * 0.2;
    const legOffset = Math.sin(Date.now() * 0.005) * 2;
    
    // Save context for potential flipping
    ctx.save();
    
    // If direction is -1, flip the crab
    if (direction === -1) {
      ctx.translate(x, y);
      ctx.scale(-1, 1);
      ctx.translate(-x, -y);
    }
    
    // Crab body
    ctx.fillStyle = '#E74C3C';
    ctx.beginPath();
    ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Eyes
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.1, 0, Math.PI * 2);
    ctx.arc(x + size * 0.3, y - size * 0.3, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw claws
    ctx.save();
    ctx.translate(x - size * 0.8, y);
    ctx.rotate(-clawAngle);
    drawCrabClaw(ctx, 0, 0, size * 0.7, -1);
    ctx.restore();
    
    ctx.save();
    ctx.translate(x + size * 0.8, y);
    ctx.rotate(clawAngle);
    drawCrabClaw(ctx, 0, 0, size * 0.7, 1);
    ctx.restore();
    
    // Draw legs (4 pairs) - animated for sideways walking
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 0.7 + Math.PI * 0.15;
      const legX = Math.cos(angle) * size * 0.6;
      const legY = Math.sin(angle) * size * 0.6;
      
      // Leg animation offset based on direction and time
      const walkOffset = Math.sin(Date.now() * 0.01 + i * Math.PI * 0.5) * 3;
      
      // Left leg
      ctx.strokeStyle = '#E74C3C';
      ctx.lineWidth = size * 0.15;
      ctx.beginPath();
      ctx.moveTo(x - legX, y + legY);
      ctx.quadraticCurveTo(
        x - legX * 1.5 + walkOffset, 
        y + legY + size * 0.5, 
        x - legX * 2 + walkOffset, 
        y + legY + size * 0.3
      );
      ctx.stroke();
      
      // Right leg
      ctx.beginPath();
      ctx.moveTo(x + legX, y + legY);
      ctx.quadraticCurveTo(
        x + legX * 1.5 + walkOffset, 
        y + legY + size * 0.5, 
        x + legX * 2 + walkOffset, 
        y + legY + size * 0.3
      );
      ctx.stroke();
    }
    
    ctx.restore();
  };
  
  // Helper function to draw crab claw
  const drawCrabClaw = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    direction: number
  ) => {
    // Claw arm
    ctx.strokeStyle = '#E74C3C';
    ctx.lineWidth = size * 0.25;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + size * direction, y);
    ctx.stroke();
    
    // Claw pincers
    ctx.fillStyle = '#E74C3C';
    
    // Upper pincer
    ctx.beginPath();
    ctx.moveTo(x + size * direction, y);
    ctx.lineTo(x + size * 1.3 * direction, y - size * 0.3);
    ctx.lineTo(x + size * 1.5 * direction, y - size * 0.1);
    ctx.lineTo(x + size * 1.3 * direction, y);
    ctx.closePath();
    ctx.fill();
    
    // Lower pincer
    ctx.beginPath();
    ctx.moveTo(x + size * direction, y);
    ctx.lineTo(x + size * 1.3 * direction, y + size * 0.3);
    ctx.lineTo(x + size * 1.5 * direction, y + size * 0.1);
    ctx.lineTo(x + size * 1.3 * direction, y);
    ctx.closePath();
    ctx.fill();
  };
  
  // Function to draw rocks in the river with different shapes
  export const drawRocks = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    // Define rock positions with different shapes
    const rockPositions = [
      { x: width * 0.3, y: y + height * 0.85, size: 25, type: 'round' },
      { x: width * 0.7, y: y + height * 0.85,size: 22, type: 'angular' }
    ];
    
    // Draw each rock with different shapes
    rockPositions.forEach(rock => {
      if (rock.type === 'round') {
        drawRoundRock(ctx, rock.x, rock.y, rock.size);
      } else {
        drawAngularRock(ctx, rock.x, rock.y, rock.size);
      }
    });
  };
  
  // Function to draw a round, smoother rock
  const drawRoundRock = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number
  ) => {
    // Create rock gradient for 3D effect
    const rockGradient = ctx.createRadialGradient(
      x - size * 0.2, y - size * 0.2, 0,
      x, y, size
    );
    rockGradient.addColorStop(0, '#888888');
    rockGradient.addColorStop(0.5, '#666666');
    rockGradient.addColorStop(1, '#444444');
    
    // Draw rock with smooth, round shape
    ctx.beginPath();
    
    // Create smooth rock shape using bezier curves
    const segments = 8;
    for (let i = 0; i <=segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      // Use fixed random values for consistent shape - smoother variations
      const radiusVariation = [0.9, 1.0, 1.0, 0.95, 1.05, 0.92, 1.02, 0.97, 0.98, 1.0][i % 9];const radius = size * radiusVariation;
      const pointX = x + Math.cos(angle) * radius;
      const pointY = y + Math.sin(angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(pointX, pointY);
      } else {
        const prevAngle = ((i - 1) / segments) * Math.PI * 2;
        // Use fixed random values for consistent control points - smoother
        const cpVariation = [1.05, 0.95, 1.1, 1.0, 1.08, 0.97, 1.02, 1.05, 1.0][i % 9];
        const cpX = x + Math.cos(prevAngle + (angle - prevAngle) / 2) * size * cpVariation;
        const cpY = y + Math.sin(prevAngle + (angle - prevAngle) / 2) * size * cpVariation;
        
        ctx.quadraticCurveTo(cpX, cpY, pointX, pointY);
      }
    }
    
    ctx.closePath();
    ctx.fillStyle = rockGradient;
    ctx.fill();
    
    // Add highlight for 3D effect
    ctx.beginPath();
    ctx.arc(
      x - size * 0.3, 
      y - size * 0.3, 
      size * 0.2, 
      0, 
      Math.PI * 2
    );
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
  };
  
  // Function to draw an angular, more jagged rock
  const drawAngularRock = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number
  ) => {
    // Create rock gradient for 3D effect - slightly different color
    const rockGradient = ctx.createRadialGradient(
      x - size * 0.2, y - size * 0.2, 0,
      x, y, size
    );
    rockGradient.addColorStop(0, '#7A7A7A');
    rockGradient.addColorStop(0.5, '#5A5A5A');
    rockGradient.addColorStop(1, '#3A3A3A');
    
    // Draw rock with angular, jagged shape
    ctx.beginPath();
    
    // Create angular rock shape using straight lines
    const points = 7; // Fewer points for more angular shape
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      // Use fixed random values for consistent shape - more extreme variations
      const radiusVariation = [0.7, 1.2, 0.8, 1.3, 0.75, 1.1, 0.9][i % 7];
      const radius = size * radiusVariation;
      const pointX = x + Math.cos(angle) * radius;
      const pointY = y + Math.sin(angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(pointX, pointY);
      } else {
        // Use straight lines for angular look
        ctx.lineTo(pointX, pointY);
      }
    }
    
    ctx.closePath();
    ctx.fillStyle = rockGradient;
    ctx.fill();
    
    // Add highlight for 3D effect - smaller, sharper highlight
    ctx.beginPath();
    ctx.arc(
      x - size * 0.25, 
      y - size * 0.25, 
      size * 0.15, 
      0, 
      Math.PI * 2
    );
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fill();
    
    // Add some cracks for texture
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    
    // Crack 1
    ctx.beginPath();
    ctx.moveTo(x - size * 0.3, y - size * 0.1);
    ctx.lineTo(x + size * 0.1, y + size * 0.2);
    ctx.stroke();
    
    // Crack 2
    ctx.beginPath();
    ctx.moveTo(x + size * 0.2, y - size * 0.3);
    ctx.lineTo(x - size * 0.1, y + size * 0.1);
    ctx.stroke();
  };
  