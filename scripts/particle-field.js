class ParticleConcept {
  constructor(canvas, options = {}) {
    if (!canvas) {
      throw new Error("ParticleConcept requires a canvas element.");
    }

    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.options = {
      bindControls: true,
      interactive: true,
      setDataset: true,
      ...options
    };
    this.pointer = { x: 0, y: 0, active: false };
    this.particles = [];
    this.frame = 0;
    this.speedFactor = 1;
    this.running = true;
    this.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.refreshThemeColors();
    if (this.options.setDataset) {
      document.documentElement.dataset.particleShape = "polygon";
    }
    this.resize();
    this.bind();
    this.createParticles();
    this.draw();
  }

  bind() {
    this.handleResize = () => {
      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => {
        this.resize();
        this.createParticles();
      }, 120);
    };

    this.handlePointerMove = (event) => {
      this.pointer.x = event.clientX;
      this.pointer.y = event.clientY;
      this.pointer.active = true;
    };

    this.handlePointerLeave = () => {
      this.pointer.active = false;
    };

    this.handlePointerDown = (event) => {
      this.burst(event.clientX, event.clientY);
    };

    this.handleThemeChange = () => {
      this.refreshThemeColors();
    };

    window.addEventListener("resize", this.handleResize);
    window.addEventListener("themechange", this.handleThemeChange);

    if (this.options.interactive) {
      window.addEventListener("pointermove", this.handlePointerMove);
      window.addEventListener("pointerleave", this.handlePointerLeave);
      window.addEventListener("pointerdown", this.handlePointerDown);
    }

    const speedInput = document.getElementById("particleSpeed");
    if (this.options.bindControls && speedInput) {
      this.setSpeedFromControl(speedInput.value);
      speedInput.addEventListener("input", () => this.setSpeedFromControl(speedInput.value));
      speedInput.addEventListener("change", () => this.setSpeedFromControl(speedInput.value));
    }
  }

  setSpeedFromControl(value) {
    const controlValue = Number(value);
    this.speedControlValue = Number.isFinite(controlValue) ? controlValue : 1;
    this.speedFactor = this.speedControlValue <= 1
      ? 0.25 + this.speedControlValue * 0.75
      : 1 + (this.speedControlValue - 1) * 3.5;
    document.documentElement.dataset.particleSpeed = this.speedFactor.toFixed(2);
  }

  resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * ratio;
    this.canvas.height = this.height * ratio;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  createParticles() {
    const area = this.width * this.height;
    const target = this.reduceMotion ? 120 : Math.min(720, Math.max(260, Math.floor(area * 0.00046)));
        this.particles = Array.from({ length: target }, () => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * 0.26,
      vy: (Math.random() - 0.5) * 0.26,
      size: 1.2 + Math.random() * 2.4,
      sides: 6,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.012,
      opacity: 0.34 + Math.random() * 0.28,
      hue: Math.random() > 0.74 ? "mint" : Math.random() > 0.45 ? "blue" : "white",
      phase: Math.random() * Math.PI * 2
    }));
  }

  burst(x, y) {
    if (this.reduceMotion) return;
    for (const p of this.particles) {
      const dx = p.x - x;
      const dy = p.y - y;
      const dist = Math.max(18, Math.hypot(dx, dy));
      if (dist < 180) {
        const force = (1 - dist / 180) * 4.4;
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }
    }
  }

  readRgbVariable(styles, name, fallback) {
    const rawValue = styles.getPropertyValue(name).trim();
    const values = rawValue.split(/\s+/).map((value) => Number(value));
    return values.length === 3 && values.every((value) => Number.isFinite(value))
      ? values
      : fallback;
  }

  readNumberVariable(styles, name, fallback) {
    const value = Number(styles.getPropertyValue(name).trim());
    return Number.isFinite(value) ? value : fallback;
  }

  refreshThemeColors() {
    const styles = getComputedStyle(document.documentElement);
    this.particleColors = {
      mint: this.readRgbVariable(styles, "--particle-mint-rgb", [155, 201, 191]),
      blue: this.readRgbVariable(styles, "--particle-blue-rgb", [142, 168, 255]),
      white: this.readRgbVariable(styles, "--particle-neutral-rgb", [244, 247, 251])
    };
    this.connectionColor = this.readRgbVariable(styles, "--particle-line-rgb", [142, 168, 255]);
    this.particleAlphaScale = this.readNumberVariable(styles, "--particle-alpha-scale", 1);
    this.connectionAlphaScale = this.readNumberVariable(styles, "--particle-line-alpha-scale", 1);
  }

  colorFor(p, alpha) {
    const [red, green, blue] = this.particleColors[p.hue] || this.particleColors.white;
    const finalAlpha = Math.min(1, Math.max(0, alpha * this.particleAlphaScale));
    return `rgba(${red}, ${green}, ${blue}, ${finalAlpha})`;
  }

  update() {
    if (this.reduceMotion) return;
    const speed = this.speedFactor;
    for (const p of this.particles) {
      const driftX = Math.cos(this.frame * 0.0042 * speed + p.phase) * 0.022 * speed;
      const driftY = Math.sin(this.frame * 0.0036 * speed + p.phase) * 0.022 * speed;
      p.vx += driftX;
      p.vy += driftY;

      if (this.pointer.active) {
        const dx = p.x - this.pointer.x;
        const dy = p.y - this.pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 130 && dist > 1) {
          const force = (1 - dist / 130) * 0.03 * speed;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }

      p.vx *= 0.986;
      p.vy *= 0.986;
      const maxVelocity = 1.35 * Math.max(1, speed);
      p.vx = Math.max(-maxVelocity, Math.min(maxVelocity, p.vx));
      p.vy = Math.max(-maxVelocity, Math.min(maxVelocity, p.vy));
      p.x += p.vx * Math.min(speed, 3.2);
      p.y += p.vy * Math.min(speed, 3.2);
      p.rotation += p.spin * speed;

      if (p.x < -20) p.x = this.width + 20;
      if (p.x > this.width + 20) p.x = -20;
      if (p.y < -20) p.y = this.height + 20;
      if (p.y > this.height + 20) p.y = -20;
    }
  }

  drawConnections() {
    const max = Math.min(this.particles.length, 160);
    for (let i = 0; i < max; i += 1) {
      const a = this.particles[i];
      for (let j = i + 1; j < max; j += 9) {
        const b = this.particles[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 92) {
          const [red, green, blue] = this.connectionColor;
          const alpha = (1 - dist / 92) * 0.16 * this.connectionAlphaScale;
          this.ctx.beginPath();
          this.ctx.moveTo(a.x, a.y);
          this.ctx.lineTo(b.x, b.y);
          this.ctx.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
          this.ctx.lineWidth = 1;
          this.ctx.stroke();
        }
      }
    }
  }

  drawParticle(p) {
    const alpha = this.reduceMotion ? 0.28 : p.opacity;
    const radius = p.size * (p.sides === 3 ? 1.28 : 1);
    this.ctx.beginPath();
    for (let i = 0; i < p.sides; i += 1) {
      const angle = p.rotation + (Math.PI * 2 * i) / p.sides;
      const x = p.x + Math.cos(angle) * radius;
      const y = p.y + Math.sin(angle) * radius;
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.closePath();
    this.ctx.fillStyle = this.colorFor(p, alpha);
    this.ctx.fill();
    this.ctx.strokeStyle = this.colorFor(p, Math.min(alpha + 0.12, 0.72));
    this.ctx.lineWidth = 0.45;
    this.ctx.stroke();
  }

  draw() {
    if (!this.running) return;

    this.frame += 1;
    this.update();
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawConnections();
    for (const p of this.particles) {
      this.drawParticle(p);
    }
    this.raf = window.requestAnimationFrame(() => this.draw());
  }

  stop() {
    this.running = false;
    window.cancelAnimationFrame(this.raf);
    window.clearTimeout(this.resizeTimer);
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("themechange", this.handleThemeChange);
    window.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerleave", this.handlePointerLeave);
    window.removeEventListener("pointerdown", this.handlePointerDown);
  }
}

window.ParticleConcept = ParticleConcept;
