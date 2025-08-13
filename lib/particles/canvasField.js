/**
 * Canvas Particle Field System
 * Performant particle system with mouse interactions
 */

class CanvasParticleField {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: 0, y: 0, isActive: false };
    this.isVisible = true;
    this.animationId = null;
    
    // Configuration
    this.config = {
      particleCount: this.calculateParticleCount(),
      maxSpeed: 1.2,
      influenceRadius: 120,
      mouseRepulsion: 0.8, // Bounce away from mouse
      mouseAttraction: 0.3, // Slight attraction at distance
      clickForce: 15, // Strong pop on click
      settleDuration: 2000,
      noiseScale: 0.004,
      particleSize: { min: 1, max: 2.5 },
      colors: ['#7AA2FF', '#E6E8EC'],
      opacity: { idle: 0.6, active: 0.8, final: 0.4 },
      ...options
    };
    
    this.state = 'intro'; // intro, waitingForEnter, typing, complete
    this.lastActivity = Date.now();
    this.noiseOffset = 0;
    this.hasClicked = false;
    this.showEnterPrompt = false;
    this.setupIntroTimer();
    
    this.init();
  }
  
  calculateParticleCount() {
    const area = window.innerWidth * window.innerHeight;
    // Tripled density (3x more particles)
    const density = window.innerWidth < 768 ? 0.00063 : 0.00084;
    return Math.min(3600, Math.max(1800, Math.floor(area * density)));
  }
  
  init() {
    this.resize();
    this.createParticles();
    this.setupEventListeners();
    this.animate();
    
    // Handle reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.config.maxSpeed = 0;
      this.config.mouseInfluence = 0;
      this.showStaticGradient();
      return;
    }
  }
  
  showStaticGradient() {
    this.ctx.fillStyle = 'rgba(11, 12, 16, 1)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    gradient.addColorStop(0, 'rgba(122, 162, 255, 0.1)');
    gradient.addColorStop(0.5, 'rgba(124, 255, 196, 0.05)');
    gradient.addColorStop(1, 'rgba(122, 162, 255, 0.1)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  createParticles() {
    this.particles = [];
    const count = this.config.particleCount;
    
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * this.config.maxSpeed,
        vy: (Math.random() - 0.5) * this.config.maxSpeed,
        size: this.config.particleSize.min + Math.random() * (this.config.particleSize.max - this.config.particleSize.min),
        color: this.config.colors[Math.floor(Math.random() * this.config.colors.length)],
        opacity: this.config.opacity.idle + Math.random() * 0.2,
        noiseOffsetX: Math.random() * 1000,
        noiseOffsetY: Math.random() * 1000,
        targetX: null,
        targetY: null,
        isOrganizing: false
      });
    }
  }
  
  setupEventListeners() {
    // Mouse events - use document for global tracking since canvas has pointer-events: none
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    document.addEventListener('mouseleave', () => this.handleMouseLeave());
    
    // Keyboard events
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    
    // Window events
    window.addEventListener('resize', () => this.handleResize());
    window.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    
    // Reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', (e) => {
      if (e.matches) {
        this.stop();
        this.showStaticGradient();
      } else {
        this.animate();
      }
    });
  }
  
  handleMouseMove(e) {
    // Since canvas is now fixed and covers full viewport, use clientX/Y directly
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
    this.mouse.isActive = true;
    this.lastActivity = Date.now();
    
    if (this.state === 'organizing') {
      this.state = 'idle';
    }
  }
  
  handleMouseDown(e) {
    // Use direct client coordinates since canvas covers full viewport
    const clickX = e.clientX;
    const clickY = e.clientY;
    
    // Apply click force to make particles pop around
    this.applyClickForce(clickX, clickY);
    this.hasClicked = true;
  }
  
  handleMouseUp(e) {
    this.applySuctionForce();
  }
  
  handleMouseLeave() {
    this.mouse.isActive = false;
  }
  
  handleKeyDown(e) {
    if (e.key === 'Enter' && this.showEnterPrompt && this.state === 'intro') {
      this.state = 'waitingForEnter';
      this.canvas.dispatchEvent(new CustomEvent('particles:enter-pressed'));
    }
  }
  
  handleResize() {
    setTimeout(() => this.resize(), 100);
  }
  
  handleVisibilityChange() {
    this.isVisible = !document.hidden;
    
    if (this.isVisible && !this.animationId) {
      this.animate();
    } else if (!this.isVisible && this.animationId) {
      this.stop();
    }
  }
  
  resize() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    
    this.ctx.scale(dpr, dpr);
    
    // Update particle count based on new size
    const newCount = this.calculateParticleCount();
    if (newCount !== this.particles.length) {
      this.config.particleCount = newCount;
      this.createParticles();
    }
  }
  
  setupIntroTimer() {
    // No longer needed since we show enter prompt immediately in the HTML
    // setTimeout(() => {
    //   if (this.state === 'intro') {
    //     this.showEnterPrompt = true;
    //     this.canvas.dispatchEvent(new CustomEvent('particles:show-enter-prompt'));
    //   }
    // }, 2000);
  }
  
  organizeParticles() {
    if (this.state !== 'idle') return;
    
    this.state = 'organizing';
    
    // Get headline element bounds for organization
    const headline = document.querySelector('.hero__headline') || 
                    document.querySelector('h1') || 
                    { getBoundingClientRect: () => ({ 
                      left: this.canvas.width * 0.2, 
                      right: this.canvas.width * 0.8, 
                      top: this.canvas.height * 0.4, 
                      bottom: this.canvas.height * 0.6 
                    })};
    
    const bounds = headline.getBoundingClientRect();
    const canvasRect = this.canvas.getBoundingClientRect();
    
    // Convert to canvas coordinates
    const targetBounds = {
      left: bounds.left - canvasRect.left,
      right: bounds.right - canvasRect.left,
      top: bounds.top - canvasRect.top,
      bottom: bounds.bottom - canvasRect.top
    };
    
    // Organize particles around the headline perimeter
    this.particles.forEach((particle, i) => {
      const progress = i / this.particles.length;
      const perimeter = 2 * (targetBounds.right - targetBounds.left) + 2 * (targetBounds.bottom - targetBounds.top);
      const position = progress * perimeter;
      
      let targetX, targetY;
      
      if (position < (targetBounds.right - targetBounds.left)) {
        // Top edge
        targetX = targetBounds.left + position;
        targetY = targetBounds.top - 20;
      } else if (position < (targetBounds.right - targetBounds.left) + (targetBounds.bottom - targetBounds.top)) {
        // Right edge
        targetX = targetBounds.right + 20;
        targetY = targetBounds.top + (position - (targetBounds.right - targetBounds.left));
      } else if (position < 2 * (targetBounds.right - targetBounds.left) + (targetBounds.bottom - targetBounds.top)) {
        // Bottom edge
        targetX = targetBounds.right - (position - (targetBounds.right - targetBounds.left) - (targetBounds.bottom - targetBounds.top));
        targetY = targetBounds.bottom + 20;
      } else {
        // Left edge
        targetX = targetBounds.left - 20;
        targetY = targetBounds.bottom - (position - 2 * (targetBounds.right - targetBounds.left) - (targetBounds.bottom - targetBounds.top));
      }
      
      particle.targetX = targetX + (Math.random() - 0.5) * 40;
      particle.targetY = targetY + (Math.random() - 0.5) * 40;
      particle.isOrganizing = true;
    });
    
    // Trigger typing after organization completes
    setTimeout(() => {
      if (this.state === 'organizing') {
        this.triggerTyping();
      }
    }, 2200);
  }
  
  triggerTyping() {
    this.state = 'typing';
    
    // Fade particles
    this.particles.forEach(particle => {
      particle.opacity = this.config.opacity.final;
    });
    
    // Dispatch event for typing animation
    this.canvas.dispatchEvent(new CustomEvent('particles:typing-ready'));
  }
  
  applyClickForce(clickX, clickY) {
    // Apply strong outward force from click point
    this.particles.forEach(particle => {
      const dx = particle.x - clickX;
      const dy = particle.y - clickY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.config.influenceRadius * 1.5) {
        const force = (1 - distance / (this.config.influenceRadius * 1.5)) * this.config.clickForce;
        const angle = Math.atan2(dy, dx);
        
        // Add some randomness to the force direction
        const randomAngle = angle + (Math.random() - 0.5) * 0.5;
        
        particle.vx += Math.cos(randomAngle) * force;
        particle.vy += Math.sin(randomAngle) * force;
      }
    });
  }
  
  applySuctionForce() {
    const mouseX = this.mouse.x;
    const mouseY = this.mouse.y;
    
    this.particles.forEach(particle => {
      const dx = mouseX - particle.x;
      const dy = mouseY - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.config.influenceRadius) {
        const force = (1 - distance / this.config.influenceRadius) * 0.5;
        const angle = Math.atan2(dy, dx);
        
        particle.vx += Math.cos(angle) * force;
        particle.vy += Math.sin(angle) * force;
      }
    });
  }
  
  updateParticles() {
    this.noiseOffset += 0.001;
    
    this.particles.forEach(particle => {
      // Handle organization state
      if (particle.isOrganizing && particle.targetX !== null && particle.targetY !== null) {
        const dx = particle.targetX - particle.x;
        const dy = particle.targetY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 2) {
          particle.vx += dx * 0.02;
          particle.vy += dy * 0.02;
        } else {
          particle.vx *= 0.95;
          particle.vy *= 0.95;
        }
      } else {
        // Mouse bounce behavior
        if (this.mouse.isActive) {
          const dx = this.mouse.x - particle.x;
          const dy = this.mouse.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < this.config.influenceRadius) {
            const normalizedDistance = distance / this.config.influenceRadius;
            
            if (distance < this.config.influenceRadius * 0.5) {
              // Close to mouse - repel (bounce away)
              const repelForce = (1 - normalizedDistance) * this.config.mouseRepulsion;
              const angle = Math.atan2(-dy, -dx); // Away from mouse
              
              particle.vx += Math.cos(angle) * repelForce;
              particle.vy += Math.sin(angle) * repelForce;
            } else {
              // Far from mouse - slight attraction
              const attractForce = normalizedDistance * this.config.mouseAttraction;
              const angle = Math.atan2(dy, dx); // Toward mouse
              
              particle.vx += Math.cos(angle) * attractForce * 0.5;
              particle.vy += Math.sin(angle) * attractForce * 0.5;
            }
          }
        }
        
        // Perlin noise for natural drift
        const noiseX = this.noise(particle.noiseOffsetX + this.noiseOffset) * 0.5;
        const noiseY = this.noise(particle.noiseOffsetY + this.noiseOffset) * 0.5;
        
        particle.vx += noiseX * this.config.noiseScale;
        particle.vy += noiseY * this.config.noiseScale;
      }
      
      // Apply enhanced velocity damping for smoother motion
      particle.vx *= 0.96;
      particle.vy *= 0.96;
      
      // Limit velocity with higher threshold
      const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
      if (speed > this.config.maxSpeed * 3) {
        particle.vx = (particle.vx / speed) * this.config.maxSpeed * 3;
        particle.vy = (particle.vy / speed) * this.config.maxSpeed * 3;
      }
      
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Wrap around edges
      if (particle.x < 0) particle.x = this.canvas.width;
      if (particle.x > this.canvas.width) particle.x = 0;
      if (particle.y < 0) particle.y = this.canvas.height;
      if (particle.y > this.canvas.height) particle.y = 0;
    });
  }
  
  render() {
    // Clear canvas
    this.ctx.fillStyle = 'rgba(11, 12, 16, 1)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw particles
    this.particles.forEach(particle => {
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      
      // Parse color and apply opacity
      const color = particle.color;
      let rgba;
      if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        rgba = `rgba(${r}, ${g}, ${b}, ${particle.opacity})`;
      } else {
        rgba = color;
      }
      
      this.ctx.fillStyle = rgba;
      this.ctx.fill();
    });
  }
  
  animate() {
    if (!this.isVisible) return;
    
    this.updateParticles();
    this.render();
    
    // Limit FPS when tab is hidden
    const fps = document.hidden ? 30 : 60;
    const interval = 1000 / fps;
    
    this.animationId = setTimeout(() => {
      requestAnimationFrame(() => this.animate());
    }, interval);
  }
  
  stop() {
    if (this.animationId) {
      clearTimeout(this.animationId);
      this.animationId = null;
    }
  }
  
  destroy() {
    this.stop();
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mousedown', this.handleMouseDown);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mouseleave', this.handleMouseLeave);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
  
  // Simple Perlin noise implementation
  noise(x) {
    const intX = Math.floor(x);
    const fracX = x - intX;
    
    const a = this.fade(fracX);
    
    const res1 = this.lerp(this.grad(this.hash(intX), fracX), 
                          this.grad(this.hash(intX + 1), fracX - 1), a);
    
    return res1;
  }
  
  hash(x) {
    x = ((x >> 16) ^ x) * 0x45d9f3b;
    x = ((x >> 16) ^ x) * 0x45d9f3b;
    x = ((x >> 16) ^ x);
    return (x & 255);
  }
  
  grad(hash, x) {
    return (hash & 1) === 0 ? x : -x;
  }
  
  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }
  
  lerp(a, b, t) {
    return a + t * (b - a);
  }
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CanvasParticleField;
}

// Global export for script tag use
if (typeof window !== 'undefined') {
  window.CanvasParticleField = CanvasParticleField;
}