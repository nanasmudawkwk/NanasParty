// NanasParty - Core Game Engine & Mini-Games
(function() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // Virtual resolution
  const V_WIDTH = 1280;
  const V_HEIGHT = 720;
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const scaleX = canvas.width / V_WIDTH;
    const scaleY = canvas.height / V_HEIGHT;
    scale = Math.min(scaleX, scaleY);
    offsetX = (canvas.width - V_WIDTH * scale) / 2;
    offsetY = (canvas.height - V_HEIGHT * scale) / 2;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Color theme per player
  const PLAYER_CONFIG = [
    { id: 0, name: 'Nanas Merah', color: '#e53935', leafColor: '#2e7d32', bandana: '#d32f2f', text: 'P1' },
    { id: 1, name: 'Nanas Biru',  color: '#1e88e5', leafColor: '#2e7d32', bandana: '#1976d2', text: 'P2' },
    { id: 2, name: 'Nanas Hijau', color: '#43a047', leafColor: '#1b5e20', bandana: '#388e3c', text: 'P3' },
    { id: 3, name: 'Nanas Kuning',color: '#fbc02d', leafColor: '#2e7d32', bandana: '#f57f17', text: 'P4' }
  ];

  // Game Global State
  const State = {
    humanCount: 1,
    mode: 'QUICK', // QUICK or CUP
    currentMinigameIndex: 0,
    cupRound: 1,
    totalCupRounds: 5,
    tournamentScores: [0, 0, 0, 0],
    activeGame: null,
    isPaused: false,
    particles: []
  };

  // Input Manager
  const Input = {
    players: [
      { x: 0, y: 0, action: false, isBot: false },
      { x: 0, y: 0, action: false, isBot: true },
      { x: 0, y: 0, action: false, isBot: true },
      { x: 0, y: 0, action: false, isBot: true }
    ],
    keys: {}
  };

  window.addEventListener('keydown', e => {
    Input.keys[e.code] = true;
    window.soundCtrl.init();
  });
  window.addEventListener('keyup', e => {
    Input.keys[e.code] = false;
  });

  // Touch Controls Setup
  function setupTouchControls() {
    for (let i = 0; i < 4; i++) {
      const pIdx = i + 1;
      const corner = document.getElementById(`touch-p${pIdx}`);
      const base = document.getElementById(`joy-base-p${pIdx}`);
      const knob = document.getElementById(`joy-knob-p${pIdx}`);
      const actBtn = document.getElementById(`act-p${pIdx}`);

      if (!base || !knob || !actBtn) continue;

      let touchId = null;
      let startX = 0, startY = 0;

      base.addEventListener('touchstart', e => {
        e.preventDefault();
        window.soundCtrl.init();
        if (touchId !== null) return;
        const touch = e.changedTouches[0];
        touchId = touch.identifier;
        const rect = base.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
        updateKnob(touch.clientX, touch.clientY);
      }, { passive: false });

      window.addEventListener('touchmove', e => {
        for (let t of e.changedTouches) {
          if (t.identifier === touchId) {
            e.preventDefault();
            updateKnob(t.clientX, t.clientY);
          }
        }
      }, { passive: false });

      const endTouch = e => {
        for (let t of e.changedTouches) {
          if (t.identifier === touchId) {
            touchId = null;
            knob.style.transform = 'translate(0px, 0px)';
            Input.players[i].x = 0;
            Input.players[i].y = 0;
          }
        }
      };
      window.addEventListener('touchend', endTouch);
      window.addEventListener('touchcancel', endTouch);

      function updateKnob(cx, cy) {
        let dx = cx - startX;
        let dy = cy - startY;
        const dist = Math.hypot(dx, dy);
        const maxDist = 38;
        if (dist > maxDist) {
          dx = (dx / dist) * maxDist;
          dy = (dy / dist) * maxDist;
        }
        knob.style.transform = `translate(${dx}px, ${dy}px)`;

        // Adjust for corner rotations
        let nx = dx / maxDist;
        let ny = dy / maxDist;
        if (i === 1) { // top-left (90deg)
          const rx = -ny;
          const ry = nx;
          nx = rx; ny = ry;
        } else if (i === 2) { // top-right (180deg)
          nx = -nx; ny = -ny;
        } else if (i === 3) { // bottom-right (-90deg)
          const rx = ny;
          const ry = -nx;
          nx = rx; ny = ry;
        }
        Input.players[i].x = nx;
        Input.players[i].y = ny;
      }

      actBtn.addEventListener('touchstart', e => {
        e.preventDefault();
        window.soundCtrl.init();
        Input.players[i].action = true;
      }, { passive: false });

      actBtn.addEventListener('touchend', e => {
        e.preventDefault();
        Input.players[i].action = false;
      }, { passive: false });
    }
  }

  function updateKeyboardInputs() {
    // P1: WASD + Space
    let p1X = 0, p1Y = 0;
    if (Input.keys['KeyA']) p1X -= 1;
    if (Input.keys['KeyD']) p1X += 1;
    if (Input.keys['KeyW']) p1Y -= 1;
    if (Input.keys['KeyS']) p1Y += 1;
    if (p1X !== 0 || p1Y !== 0) {
      const len = Math.hypot(p1X, p1Y);
      Input.players[0].x = p1X / len;
      Input.players[0].y = p1Y / len;
    }
    if (Input.keys['Space']) Input.players[0].action = true;
    else if (!Input.players[0].touchAction) Input.players[0].action = false;

    // P2: Arrows + Enter
    let p2X = 0, p2Y = 0;
    if (Input.keys['ArrowLeft']) p2X -= 1;
    if (Input.keys['ArrowRight']) p2X += 1;
    if (Input.keys['ArrowUp']) p2Y -= 1;
    if (Input.keys['ArrowDown']) p2Y += 1;
    if (p2X !== 0 || p2Y !== 0) {
      const len = Math.hypot(p2X, p2Y);
      Input.players[1].x = p2X / len;
      Input.players[1].y = p2Y / len;
    }
    if (Input.keys['Enter'] || Input.keys['Numpad0']) Input.players[1].action = true;
    else if (!Input.players[1].touchAction) Input.players[1].action = false;

    // P3: IJKL + U
    let p3X = 0, p3Y = 0;
    if (Input.keys['KeyJ']) p3X -= 1;
    if (Input.keys['KeyL']) p3X += 1;
    if (Input.keys['KeyI']) p3Y -= 1;
    if (Input.keys['KeyK']) p3Y += 1;
    if (p3X !== 0 || p3Y !== 0) {
      const len = Math.hypot(p3X, p3Y);
      Input.players[2].x = p3X / len;
      Input.players[2].y = p3Y / len;
    }
    if (Input.keys['KeyU']) Input.players[2].action = true;
    else if (!Input.players[2].touchAction) Input.players[2].action = false;

    // P4: Numpad 4862 + Numpad 5
    let p4X = 0, p4Y = 0;
    if (Input.keys['Numpad4']) p4X -= 1;
    if (Input.keys['Numpad6']) p4X += 1;
    if (Input.keys['Numpad8']) p4Y -= 1;
    if (Input.keys['Numpad5'] || Input.keys['Numpad2']) p4Y += 1;
    if (p4X !== 0 || p4Y !== 0) {
      const len = Math.hypot(p4X, p4Y);
      Input.players[3].x = p4X / len;
      Input.players[3].y = p4Y / len;
    }
    if (Input.keys['NumpadEnter'] || Input.keys['ControlRight']) Input.players[3].action = true;
    else if (!Input.players[3].touchAction) Input.players[3].action = false;
  }

  // Particle System
  function addParticle(x, y, color, count = 10, speed = 4) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * speed + 1;
      State.particles.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        color,
        size: Math.random() * 6 + 3,
        alpha: 1,
        life: 1
      });
    }
  }

  function updateParticles(dt) {
    for (let i = State.particles.length - 1; i >= 0; i--) {
      const p = State.particles[i];
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.life -= dt * 1.5;
      p.alpha = Math.max(0, p.life);
      if (p.life <= 0) {
        State.particles.splice(i, 1);
      }
    }
  }

  function drawParticles() {
    for (let p of State.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Draw Cute Pineapple Character
  function drawPineapple(x, y, angle, radius, playerIndex, options = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const cfg = PLAYER_CONFIG[playerIndex];
    const isDead = options.isDead || false;

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, radius * 0.7, radius * 0.9, radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pineapple Green Crown (Leaves)
    ctx.fillStyle = cfg.leafColor;
    const leaves = [-0.4, -0.15, 0.15, 0.4];
    for (let la of leaves) {
      ctx.save();
      ctx.rotate(la);
      ctx.beginPath();
      ctx.moveTo(-radius * 0.2, -radius * 0.6);
      ctx.quadraticCurveTo(0, -radius * 1.3, radius * 0.2, -radius * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Pineapple Body (Oval)
    ctx.fillStyle = cfg.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * 0.85, radius, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#212121';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Diamond Crosshatch pattern (Pineapple texture)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.5, -radius * 0.4); ctx.lineTo(radius * 0.5, radius * 0.4);
    ctx.moveTo(-radius * 0.6, 0); ctx.lineTo(radius * 0.6, 0);
    ctx.moveTo(-radius * 0.5, radius * 0.4); ctx.lineTo(radius * 0.5, -radius * 0.4);
    ctx.stroke();

    // Bandana / Headband with player number
    ctx.fillStyle = cfg.bandana;
    ctx.beginPath();
    ctx.rect(-radius * 0.8, -radius * 0.45, radius * 1.6, radius * 0.35);
    ctx.fill();
    ctx.strokeStyle = '#212121';
    ctx.lineWidth = 2;
    ctx.strokeRect(-radius * 0.8, -radius * 0.45, radius * 1.6, radius * 0.35);

    // Eyes
    if (isDead) {
      // X eyes
      ctx.strokeStyle = '#212121';
      ctx.lineWidth = 3;
      // Left eye X
      ctx.beginPath();
      ctx.moveTo(-radius * 0.45, -radius * 0.1); ctx.lineTo(-radius * 0.15, 0.1 * radius);
      ctx.moveTo(-radius * 0.15, -radius * 0.1); ctx.lineTo(-radius * 0.45, 0.1 * radius);
      // Right eye X
      ctx.moveTo(radius * 0.15, -radius * 0.1); ctx.lineTo(radius * 0.45, 0.1 * radius);
      ctx.moveTo(radius * 0.45, -radius * 0.1); ctx.lineTo(radius * 0.15, 0.1 * radius);
      ctx.stroke();
    } else {
      // Big cartoon eyes
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(-radius * 0.3, -radius * 0.05, radius * 0.22, 0, Math.PI * 2);
      ctx.arc(radius * 0.3, -radius * 0.05, radius * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#212121';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pupils looking forward
      ctx.fillStyle = '#212121';
      ctx.beginPath();
      ctx.arc(-radius * 0.26, -radius * 0.02, radius * 0.1, 0, Math.PI * 2);
      ctx.arc(radius * 0.34, -radius * 0.02, radius * 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Smile
      ctx.beginPath();
      ctx.arc(0, radius * 0.25, radius * 0.22, 0, Math.PI);
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  // ==========================================
  // MINI-GAMES DEFINITIONS (8 ICONIC GAMES)
  // ==========================================

  const MINIGAMES = [
    // 1. NANAS TANKS
    {
      id: 'tanks',
      title: '🍍 Nanas Tanks',
      desc: 'Tembak peluru memantul dan hancurkan tank lawan!',
      icon: '🚀',
      init() {
        this.tanks = [
          { x: 150, y: 150, angle: 0, alive: true, cooldown: 0 },
          { x: V_WIDTH - 150, y: 150, angle: Math.PI, alive: true, cooldown: 0 },
          { x: 150, y: V_HEIGHT - 150, angle: 0, alive: true, cooldown: 0 },
          { x: V_WIDTH - 150, y: V_HEIGHT - 150, angle: Math.PI, alive: true, cooldown: 0 }
        ];
        this.bullets = [];
        this.obstacles = [
          { x: 350, y: 220, w: 100, h: 280 },
          { x: V_WIDTH - 450, y: 220, w: 100, h: 280 },
          { x: 550, y: 310, w: 180, h: 100 }
        ];
        this.timer = 45;
      },
      update(dt) {
        this.timer -= dt;
        for (let i = 0; i < 4; i++) {
          const t = this.tanks[i];
          if (!t.alive) continue;
          const inp = Input.players[i];

          // Bot AI
          if (inp.isBot) {
            // Find closest alive opponent
            let target = null, minDist = 9999;
            for (let j = 0; j < 4; j++) {
              if (i !== j && this.tanks[j].alive) {
                const d = Math.hypot(this.tanks[j].x - t.x, this.tanks[j].y - t.y);
                if (d < minDist) { minDist = d; target = this.tanks[j]; }
              }
            }
            if (target) {
              const targetAngle = Math.atan2(target.y - t.y, target.x - t.x);
              t.angle = targetAngle;
              t.x += Math.cos(t.angle) * 2.2;
              t.y += Math.sin(t.angle) * 2.2;
              if (Math.random() < 0.04 && t.cooldown <= 0) {
                this.shoot(i);
              }
            }
          } else {
            // Human Control
            if (Math.hypot(inp.x, inp.y) > 0.2) {
              t.angle = Math.atan2(inp.y, inp.x);
              t.x += Math.cos(t.angle) * 3.5;
              t.y += Math.sin(t.angle) * 3.5;
            }
            if (inp.action && t.cooldown <= 0) {
              this.shoot(i);
            }
          }

          t.cooldown -= dt;
          // Bounds
          t.x = Math.max(50, Math.min(V_WIDTH - 50, t.x));
          t.y = Math.max(50, Math.min(V_HEIGHT - 50, t.y));
        }

        // Bullets
        for (let i = this.bullets.length - 1; i >= 0; i--) {
          const b = this.bullets[i];
          b.x += b.vx * dt * 60;
          b.y += b.vy * dt * 60;
          b.life -= dt;

          // Bounce walls
          if (b.x < 20 || b.x > V_WIDTH - 20) { b.vx = -b.vx; b.bounces++; window.soundCtrl.playBounce(); }
          if (b.y < 20 || b.y > V_HEIGHT - 20) { b.vy = -b.vy; b.bounces++; window.soundCtrl.playBounce(); }

          // Check hit tanks
          for (let j = 0; j < 4; j++) {
            const t = this.tanks[j];
            if (t.alive && Math.hypot(b.x - t.x, b.y - t.y) < 30) {
              t.alive = false;
              b.life = 0;
              window.soundCtrl.playExplosion();
              addParticle(t.x, t.y, PLAYER_CONFIG[j].color, 25, 6);
            }
          }

          if (b.life <= 0 || b.bounces > 3) {
            this.bullets.splice(i, 1);
          }
        }

        // Check winner
        const aliveTanks = this.tanks.map((t, idx) => t.alive ? idx : -1).filter(idx => idx !== -1);
        if (aliveTanks.length <= 1 || this.timer <= 0) {
          endCurrentRound(aliveTanks[0] !== undefined ? aliveTanks[0] : 0);
        }
      },
      shoot(idx) {
        const t = this.tanks[idx];
        t.cooldown = 0.5;
        this.bullets.push({
          x: t.x + Math.cos(t.angle) * 36,
          y: t.y + Math.sin(t.angle) * 36,
          vx: Math.cos(t.angle) * 8,
          vy: Math.sin(t.angle) * 8,
          owner: idx,
          bounces: 0,
          life: 4
        });
        window.soundCtrl.playShoot();
      },
      draw() {
        // Floor
        ctx.fillStyle = '#2b3648';
        ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

        // Obstacles
        ctx.fillStyle = '#455a64';
        for (let obs of this.obstacles) {
          ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
          ctx.strokeStyle = '#607d8b';
          ctx.lineWidth = 4;
          ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
        }

        // Bullets
        ctx.fillStyle = '#ffeb3b';
        for (let b of this.bullets) {
          ctx.beginPath();
          ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Tanks
        for (let i = 0; i < 4; i++) {
          const t = this.tanks[i];
          if (!t.alive) continue;
          // Tank Base
          ctx.save();
          ctx.translate(t.x, t.y);
          ctx.rotate(t.angle);
          ctx.fillStyle = '#37474f';
          ctx.fillRect(-28, -22, 56, 44);
          ctx.fillStyle = '#263238';
          ctx.fillRect(-32, -26, 64, 10);
          ctx.fillRect(-32, 16, 64, 10);
          // Turret Cannon
          ctx.fillStyle = '#212121';
          ctx.fillRect(0, -5, 38, 10);
          ctx.restore();

          drawPineapple(t.x, t.y, t.angle, 22, i, { isDead: !t.alive });
        }
      }
    },

    // 2. NANAS SOCCER
    {
      id: 'soccer',
      title: '⚽ Nanas Soccer',
      desc: 'Giring dan tendang bola ke gawang lawan!',
      icon: '⚽',
      init() {
        this.players = [
          { x: 300, y: V_HEIGHT / 2 - 80, angle: 0, score: 0 },
          { x: V_WIDTH - 300, y: V_HEIGHT / 2 - 80, angle: Math.PI, score: 0 },
          { x: 300, y: V_HEIGHT / 2 + 80, angle: 0, score: 0 },
          { x: V_WIDTH - 300, y: V_HEIGHT / 2 + 80, angle: Math.PI, score: 0 }
        ];
        this.ball = { x: V_WIDTH / 2, y: V_HEIGHT / 2, vx: 0, vy: 0, radius: 24 };
        this.timer = 50;
        this.teamRedScore = 0;
        this.teamBlueScore = 0;
      },
      update(dt) {
        this.timer -= dt;
        // Ball movement with friction
        this.ball.x += this.ball.vx * dt * 60;
        this.ball.y += this.ball.vy * dt * 60;
        this.ball.vx *= 0.96;
        this.ball.vy *= 0.96;

        // Player updates
        for (let i = 0; i < 4; i++) {
          const p = this.players[i];
          const inp = Input.players[i];
          if (inp.isBot) {
            // Seek ball
            const targetX = this.ball.x;
            const targetY = this.ball.y;
            p.angle = Math.atan2(targetY - p.y, targetX - p.x);
            p.x += Math.cos(p.angle) * 3.4;
            p.y += Math.sin(p.angle) * 3.4;
          } else {
            if (Math.hypot(inp.x, inp.y) > 0.2) {
              p.angle = Math.atan2(inp.y, inp.x);
              const spd = inp.action ? 5.5 : 3.8;
              p.x += Math.cos(p.angle) * spd;
              p.y += Math.sin(p.angle) * spd;
            }
          }

          // Ball collision
          const d = Math.hypot(this.ball.x - p.x, this.ball.y - p.y);
          if (d < this.ball.radius + 24) {
            const pushAngle = Math.atan2(this.ball.y - p.y, this.ball.x - p.x);
            const kickPower = inp.action ? 12 : 6;
            this.ball.vx = Math.cos(pushAngle) * kickPower;
            this.ball.vy = Math.sin(pushAngle) * kickPower;
            window.soundCtrl.playKick();
            addParticle(this.ball.x, this.ball.y, '#ffffff', 6, 4);
          }
        }

        // Ball bounds & Goal
        const goalTop = V_HEIGHT / 2 - 120;
        const goalBottom = V_HEIGHT / 2 + 120;

        if (this.ball.x < 80 && this.ball.y > goalTop && this.ball.y < goalBottom) {
          // Goal Team Blue (P2/P4)
          this.teamBlueScore++;
          window.soundCtrl.playGoal();
          this.resetBall();
        } else if (this.ball.x > V_WIDTH - 80 && this.ball.y > goalTop && this.ball.y < goalBottom) {
          // Goal Team Red (P1/P3)
          this.teamRedScore++;
          window.soundCtrl.playGoal();
          this.resetBall();
        }

        if (this.ball.x < 40 || this.ball.x > V_WIDTH - 40) this.ball.vx = -this.ball.vx;
        if (this.ball.y < 40 || this.ball.y > V_HEIGHT - 40) this.ball.vy = -this.ball.vy;

        if (this.timer <= 0) {
          endCurrentRound(this.teamRedScore >= this.teamBlueScore ? 0 : 1);
        }
      },
      resetBall() {
        this.ball.x = V_WIDTH / 2;
        this.ball.y = V_HEIGHT / 2;
        this.ball.vx = 0;
        this.ball.vy = 0;
      },
      draw() {
        // Field
        ctx.fillStyle = '#388e3c';
        ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 6;
        ctx.strokeRect(50, 40, V_WIDTH - 100, V_HEIGHT - 80);
        // Center line & circle
        ctx.beginPath();
        ctx.moveTo(V_WIDTH / 2, 40); ctx.lineTo(V_WIDTH / 2, V_HEIGHT - 40);
        ctx.arc(V_WIDTH / 2, V_HEIGHT / 2, 80, 0, Math.PI * 2);
        ctx.stroke();

        // Goals
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(10, V_HEIGHT / 2 - 120, 40, 240);
        ctx.fillRect(V_WIDTH - 50, V_HEIGHT / 2 - 120, 40, 240);

        // Scores
        ctx.fillStyle = 'white';
        ctx.font = 'bold 36px Arial';
        ctx.fillText(`MERAH: ${this.teamRedScore}  -  BIRU: ${this.teamBlueScore}`, V_WIDTH / 2 - 180, 80);

        // Players
        for (let i = 0; i < 4; i++) {
          const p = this.players[i];
          drawPineapple(p.x, p.y, p.angle, 25, i);
        }

        // Ball
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    },

    // 3. NANAS MICRO RALLY
    {
      id: 'rally',
      title: '🏎️ Nanas Micro Rally',
      desc: 'Balapan 3 lap dan jadilah yang tercepat!',
      icon: '🏎️',
      init() {
        this.racers = [
          { x: 300, y: 550, angle: 0, speed: 0, laps: 0, checkpoint: 0 },
          { x: 300, y: 590, angle: 0, speed: 0, laps: 0, checkpoint: 0 },
          { x: 230, y: 550, angle: 0, speed: 0, laps: 0, checkpoint: 0 },
          { x: 230, y: 590, angle: 0, speed: 0, laps: 0, checkpoint: 0 }
        ];
        this.trackWaypoints = [
          { x: 950, y: 570 },
          { x: 1080, y: 360 },
          { x: 950, y: 150 },
          { x: 300, y: 150 },
          { x: 180, y: 360 },
          { x: 300, y: 570 }
        ];
      },
      update(dt) {
        for (let i = 0; i < 4; i++) {
          const r = this.racers[i];
          const inp = Input.players[i];

          if (inp.isBot) {
            const wp = this.trackWaypoints[r.checkpoint % this.trackWaypoints.length];
            const targetAngle = Math.atan2(wp.y - r.y, wp.x - r.x);
            let diff = targetAngle - r.angle;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            r.angle += diff * 0.1;
            r.speed = 4.8;
            if (Math.hypot(wp.x - r.x, wp.y - r.y) < 100) {
              r.checkpoint++;
              if (r.checkpoint % this.trackWaypoints.length === 0) {
                r.laps++;
              }
            }
          } else {
            if (Math.hypot(inp.x, inp.y) > 0.2) {
              const targetAngle = Math.atan2(inp.y, inp.x);
              let diff = targetAngle - r.angle;
              while (diff < -Math.PI) diff += Math.PI * 2;
              while (diff > Math.PI) diff -= Math.PI * 2;
              r.angle += diff * 0.12;
              r.speed = inp.action ? 6.2 : 5.0;
            } else {
              r.speed *= 0.95;
            }

            const wp = this.trackWaypoints[r.checkpoint % this.trackWaypoints.length];
            if (Math.hypot(wp.x - r.x, wp.y - r.y) < 120) {
              r.checkpoint++;
              if (r.checkpoint % this.trackWaypoints.length === 0) {
                r.laps++;
                window.soundCtrl.playClick();
              }
            }
          }

          r.x += Math.cos(r.angle) * r.speed;
          r.y += Math.sin(r.angle) * r.speed;

          if (r.laps >= 3) {
            endCurrentRound(i);
            break;
          }
        }
      },
      draw() {
        // Track Asphalt
        ctx.fillStyle = '#424242';
        ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
        // Outer green grass
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.roundRect(50, 40, V_WIDTH - 100, V_HEIGHT - 80, 160);
        ctx.fill();

        // Inner grass island
        ctx.fillStyle = '#1b5e20';
        ctx.beginPath();
        ctx.roundRect(320, 240, V_WIDTH - 640, V_HEIGHT - 480, 80);
        ctx.fill();

        // Track road
        ctx.strokeStyle = '#616161';
        ctx.lineWidth = 140;
        ctx.stroke();

        // Finish line
        ctx.fillStyle = 'white';
        ctx.fillRect(320, 480, 20, 150);

        // Racers
        for (let i = 0; i < 4; i++) {
          const r = this.racers[i];
          drawPineapple(r.x, r.y, r.angle, 22, i);
        }
      }
    },

    // 4. NANAS SUMO CLASH
    {
      id: 'sumo',
      title: '🥋 Nanas Sumo Clash',
      desc: 'Dorong lawan keluar dari pulau es yang mencair!',
      icon: '🥋',
      init() {
        this.radius = 280;
        this.players = [
          { x: V_WIDTH / 2 - 140, y: V_HEIGHT / 2 - 140, vx: 0, vy: 0, alive: true },
          { x: V_WIDTH / 2 + 140, y: V_HEIGHT / 2 - 140, vx: 0, vy: 0, alive: true },
          { x: V_WIDTH / 2 - 140, y: V_HEIGHT / 2 + 140, vx: 0, vy: 0, alive: true },
          { x: V_WIDTH / 2 + 140, y: V_HEIGHT / 2 + 140, vx: 0, vy: 0, alive: true }
        ];
        this.timer = 40;
      },
      update(dt) {
        this.radius = Math.max(120, this.radius - dt * 3.5);

        for (let i = 0; i < 4; i++) {
          const p = this.players[i];
          if (!p.alive) continue;
          const inp = Input.players[i];

          if (inp.isBot) {
            // Seek center or push nearby enemy
            let targetX = V_WIDTH / 2;
            let targetY = V_HEIGHT / 2;
            for (let j = 0; j < 4; j++) {
              if (i !== j && this.players[j].alive) {
                targetX = this.players[j].x;
                targetY = this.players[j].y;
                break;
              }
            }
            const angle = Math.atan2(targetY - p.y, targetX - p.x);
            p.vx += Math.cos(angle) * 0.4;
            p.vy += Math.sin(angle) * 0.4;
          } else {
            p.vx += inp.x * (inp.action ? 0.9 : 0.5);
            p.vy += inp.y * (inp.action ? 0.9 : 0.5);
          }

          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.92;
          p.vy *= 0.92;

          // Check if pushed off ring
          const distFromCenter = Math.hypot(p.x - V_WIDTH / 2, p.y - V_HEIGHT / 2);
          if (distFromCenter > this.radius) {
            p.alive = false;
            window.soundCtrl.playBounce();
            addParticle(p.x, p.y, '#00bcd4', 20, 5); // water splash
          }
        }

        // Bumper collisions
        for (let i = 0; i < 4; i++) {
          for (let j = i + 1; j < 4; j++) {
            const p1 = this.players[i];
            const p2 = this.players[j];
            if (p1.alive && p2.alive) {
              const d = Math.hypot(p2.x - p1.x, p2.y - p1.y);
              if (d < 50) {
                const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                const force = 8;
                p1.vx -= Math.cos(angle) * force;
                p1.vy -= Math.sin(angle) * force;
                p2.vx += Math.cos(angle) * force;
                p2.vy += Math.sin(angle) * force;
                window.soundCtrl.playKick();
                addParticle((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, '#fff', 8, 3);
              }
            }
          }
        }

        const alive = this.players.map((p, idx) => p.alive ? idx : -1).filter(idx => idx !== -1);
        if (alive.length <= 1) {
          endCurrentRound(alive[0] !== undefined ? alive[0] : 0);
        }
      },
      draw() {
        // Water ocean
        ctx.fillStyle = '#0288d1';
        ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

        // Island Ring
        ctx.fillStyle = '#81d4fa';
        ctx.beginPath();
        ctx.arc(V_WIDTH / 2, V_HEIGHT / 2, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e1f5fe';
        ctx.lineWidth = 10;
        ctx.stroke();

        // Players
        for (let i = 0; i < 4; i++) {
          const p = this.players[i];
          if (p.alive) {
            drawPineapple(p.x, p.y, Math.atan2(p.vy, p.vx), 25, i);
          }
        }
      }
    },

    // 5. NANAS COLOR CLASH
    {
      id: 'color',
      title: '🎨 Nanas Color Clash',
      desc: 'Warnai ubin lantai sebanyak-banyaknya!',
      icon: '🎨',
      init() {
        this.cols = 16;
        this.rows = 9;
        this.tileW = V_WIDTH / this.cols;
        this.tileH = V_HEIGHT / this.rows;
        this.grid = Array(this.cols * this.rows).fill(-1);
        this.players = [
          { x: 100, y: 100, angle: 0 },
          { x: V_WIDTH - 100, y: 100, angle: Math.PI },
          { x: 100, y: V_HEIGHT - 100, angle: 0 },
          { x: V_WIDTH - 100, y: V_HEIGHT - 100, angle: Math.PI }
        ];
        this.timer = 30;
      },
      update(dt) {
        this.timer -= dt;
        for (let i = 0; i < 4; i++) {
          const p = this.players[i];
          const inp = Input.players[i];

          if (inp.isBot) {
            // Wander around to uncolored tiles
            p.angle += (Math.random() - 0.5) * 0.4;
            p.x += Math.cos(p.angle) * 3.6;
            p.y += Math.sin(p.angle) * 3.6;
          } else {
            if (Math.hypot(inp.x, inp.y) > 0.2) {
              p.angle = Math.atan2(inp.y, inp.x);
              p.x += Math.cos(p.angle) * 4.6;
              p.y += Math.sin(p.angle) * 4.6;
            }
          }

          p.x = Math.max(30, Math.min(V_WIDTH - 30, p.x));
          p.y = Math.max(30, Math.min(V_HEIGHT - 30, p.y));

          // Paint tile
          const col = Math.floor(p.x / this.tileW);
          const row = Math.floor(p.y / this.tileH);
          if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            const idx = row * this.cols + col;
            if (this.grid[idx] !== i) {
              this.grid[idx] = i;
              addParticle(p.x, p.y, PLAYER_CONFIG[i].color, 2, 2);
            }
          }
        }

        if (this.timer <= 0) {
          // Count painted tiles
          const counts = [0, 0, 0, 0];
          for (let val of this.grid) {
            if (val >= 0) counts[val]++;
          }
          let maxCount = -1, winner = 0;
          for (let i = 0; i < 4; i++) {
            if (counts[i] > maxCount) { maxCount = counts[i]; winner = i; }
          }
          endCurrentRound(winner);
        }
      },
      draw() {
        // Grid Tiles
        for (let r = 0; r < this.rows; r++) {
          for (let c = 0; c < this.cols; c++) {
            const idx = r * this.cols + c;
            const owner = this.grid[idx];
            ctx.fillStyle = owner >= 0 ? PLAYER_CONFIG[owner].color : '#37474f';
            ctx.fillRect(c * this.tileW + 2, r * this.tileH + 2, this.tileW - 4, this.tileH - 4);
          }
        }

        for (let i = 0; i < 4; i++) {
          const p = this.players[i];
          drawPineapple(p.x, p.y, p.angle, 24, i);
        }
      }
    },

    // 6. NANAS PASS THE BOMB
    {
      id: 'bomb',
      title: '💣 Nanas Pass The Bomb',
      desc: 'Oper bom kelapa ke teman sebelum meledak!',
      icon: '💣',
      init() {
        this.players = [
          { x: 200, y: 200, alive: true },
          { x: V_WIDTH - 200, y: 200, alive: true },
          { x: 200, y: V_HEIGHT - 200, alive: true },
          { x: V_WIDTH - 200, y: V_HEIGHT - 200, alive: true }
        ];
        this.bombHolder = Math.floor(Math.random() * 4);
        this.fuseTimer = 10;
      },
      update(dt) {
        this.fuseTimer -= dt;

        for (let i = 0; i < 4; i++) {
          const p = this.players[i];
          if (!p.alive) continue;
          const inp = Input.players[i];
          const hasBomb = (i === this.bombHolder);

          if (inp.isBot) {
            if (hasBomb) {
              // Chase closest alive enemy
              let closest = null, minDist = 9999;
              for (let j = 0; j < 4; j++) {
                if (i !== j && this.players[j].alive) {
                  const d = Math.hypot(this.players[j].x - p.x, this.players[j].y - p.y);
                  if (d < minDist) { minDist = d; closest = this.players[j]; }
                }
              }
              if (closest) {
                const angle = Math.atan2(closest.y - p.y, closest.x - p.x);
                p.x += Math.cos(angle) * 4.2;
                p.y += Math.sin(angle) * 4.2;
              }
            } else {
              // Run away from bomb holder
              const holder = this.players[this.bombHolder];
              const angle = Math.atan2(p.y - holder.y, p.x - holder.x);
              p.x += Math.cos(angle) * 3.8;
              p.y += Math.sin(angle) * 3.8;
            }
          } else {
            p.x += inp.x * (hasBomb ? 4.6 : 3.8);
            p.y += inp.y * (hasBomb ? 4.6 : 3.8);
          }

          p.x = Math.max(50, Math.min(V_WIDTH - 50, p.x));
          p.y = Math.max(50, Math.min(V_HEIGHT - 50, p.y));
        }

        // Tag to pass bomb
        const holder = this.players[this.bombHolder];
        for (let i = 0; i < 4; i++) {
          if (i !== this.bombHolder && this.players[i].alive) {
            if (Math.hypot(holder.x - this.players[i].x, holder.y - this.players[i].y) < 50) {
              this.bombHolder = i;
              window.soundCtrl.playBombTick();
              addParticle(holder.x, holder.y, '#ff9800', 10, 4);
              break;
            }
          }
        }

        // Bomb explodes!
        if (this.fuseTimer <= 0) {
          window.soundCtrl.playExplosion();
          this.players[this.bombHolder].alive = false;
          addParticle(this.players[this.bombHolder].x, this.players[this.bombHolder].y, '#ff5722', 40, 8);

          const alive = this.players.map((p, idx) => p.alive ? idx : -1).filter(idx => idx !== -1);
          if (alive.length <= 1) {
            endCurrentRound(alive[0] !== undefined ? alive[0] : 0);
          } else {
            this.bombHolder = alive[Math.floor(Math.random() * alive.length)];
            this.fuseTimer = 8;
          }
        }
      },
      draw() {
        ctx.fillStyle = '#263238';
        ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

        for (let i = 0; i < 4; i++) {
          const p = this.players[i];
          if (!p.alive) continue;
          drawPineapple(p.x, p.y, 0, 26, i);

          // Bomb on top of holder
          if (i === this.bombHolder) {
            ctx.fillStyle = '#212121';
            ctx.beginPath();
            ctx.arc(p.x, p.y - 45, 18, 0, Math.PI * 2);
            ctx.fill();
            // Burning Fuse
            ctx.strokeStyle = '#ff9800';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y - 63);
            ctx.lineTo(p.x + 8, p.y - 75);
            ctx.stroke();
            // Spark
            ctx.fillStyle = '#f44336';
            ctx.beginPath();
            ctx.arc(p.x + 8, p.y - 75, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    },

    // 7. NANAS GHOST SURVIVAL
    {
      id: 'ghost',
      title: '👻 Nanas Ghost Survival',
      desc: 'Bertahan di dalam lingkaran cahaya lampu!',
      icon: '👻',
      init() {
        this.players = [
          { x: 300, y: 300, alive: true },
          { x: V_WIDTH - 300, y: 300, alive: true },
          { x: 300, y: V_HEIGHT - 300, alive: true },
          { x: V_WIDTH - 300, y: V_HEIGHT - 300, alive: true }
        ];
        this.light = { x: V_WIDTH / 2, y: V_HEIGHT / 2, vx: 2, vy: 1.5, radius: 200 };
        this.ghosts = [
          { x: 100, y: 100, vx: 3, vy: 2 },
          { x: V_WIDTH - 100, y: 100, vx: -2, vy: 3 },
          { x: 500, y: 600, vx: 2.5, vy: -2.5 }
        ];
        this.timer = 35;
      },
      update(dt) {
        this.timer -= dt;

        // Move light zone
        this.light.x += this.light.vx;
        this.light.y += this.light.vy;
        if (this.light.x < 250 || this.light.x > V_WIDTH - 250) this.light.vx = -this.light.vx;
        if (this.light.y < 250 || this.light.y > V_HEIGHT - 250) this.light.vy = -this.light.vy;

        // Move ghosts
        for (let g of this.ghosts) {
          g.x += g.vx;
          g.y += g.vy;
          if (g.x < 50 || g.x > V_WIDTH - 50) g.vx = -g.vx;
          if (g.y < 50 || g.y > V_HEIGHT - 50) g.vy = -g.vy;
        }

        // Players
        for (let i = 0; i < 4; i++) {
          const p = this.players[i];
          if (!p.alive) continue;
          const inp = Input.players[i];

          if (inp.isBot) {
            // Stay inside light
            const angle = Math.atan2(this.light.y - p.y, this.light.x - p.x);
            p.x += Math.cos(angle) * 3.5;
            p.y += Math.sin(angle) * 3.5;
          } else {
            p.x += inp.x * 4.2;
            p.y += inp.y * 4.2;
          }

          // Check hit ghost
          for (let g of this.ghosts) {
            if (Math.hypot(p.x - g.x, p.y - g.y) < 36) {
              p.alive = false;
              window.soundCtrl.playExplosion();
              addParticle(p.x, p.y, '#9c27b0', 20, 5);
            }
          }
        }

        const alive = this.players.map((p, idx) => p.alive ? idx : -1).filter(idx => idx !== -1);
        if (alive.length <= 1 || this.timer <= 0) {
          endCurrentRound(alive[0] !== undefined ? alive[0] : 0);
        }
      },
      draw() {
        // Dark background
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

        // Safe light lantern circle
        const grad = ctx.createRadialGradient(this.light.x, this.light.y, 20, this.light.x, this.light.y, this.light.radius);
        grad.addColorStop(0, 'rgba(255, 235, 59, 0.45)');
        grad.addColorStop(1, 'rgba(255, 235, 59, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(this.light.x, this.light.y, this.light.radius, 0, Math.PI * 2);
        ctx.fill();

        // Ghosts
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        for (let g of this.ghosts) {
          ctx.beginPath();
          ctx.arc(g.x, g.y, 20, 0, Math.PI * 2);
          ctx.fill();
          // Ghost eyes
          ctx.fillStyle = '#f44336';
          ctx.fillRect(g.x - 8, g.y - 4, 4, 6);
          ctx.fillRect(g.x + 4, g.y - 4, 4, 6);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        }

        // Players
        for (let i = 0; i < 4; i++) {
          const p = this.players[i];
          if (p.alive) {
            drawPineapple(p.x, p.y, 0, 24, i);
          }
        }
      }
    },

    // 8. NANAS OBSTACLE RUN
    {
      id: 'runner',
      title: '🏃 Nanas Obstacle Run',
      desc: 'Lari ke kanan dan hindari rintangan berputar!',
      icon: '🏃',
      init() {
        this.players = [
          { x: 100, y: 150, alive: true },
          { x: 100, y: 280, alive: true },
          { x: 100, y: 430, alive: true },
          { x: 100, y: 570, alive: true }
        ];
        this.obstacles = [
          { x: 350, y: 100, vy: 3, h: 140 },
          { x: 600, y: 400, vy: -3.5, h: 140 },
          { x: 850, y: 200, vy: 4, h: 140 }
        ];
        this.finishLineX = V_WIDTH - 120;
      },
      update(dt) {
        for (let obs of this.obstacles) {
          obs.y += obs.vy;
          if (obs.y < 80 || obs.y > V_HEIGHT - 220) obs.vy = -obs.vy;
        }

        for (let i = 0; i < 4; i++) {
          const p = this.players[i];
          if (!p.alive) continue;
          const inp = Input.players[i];

          if (inp.isBot) {
            p.x += 3.2;
            // Dodging
            for (let obs of this.obstacles) {
              if (Math.abs(p.x - obs.x) < 80 && Math.abs(p.y - obs.y) < 100) {
                p.y += obs.vy > 0 ? -2 : 2;
              }
            }
          } else {
            p.x += (inp.x > 0 ? inp.x * 4.5 : 2.5);
            p.y += inp.y * 4.0;
          }

          p.y = Math.max(60, Math.min(V_HEIGHT - 60, p.y));

          // Check hit obstacle
          for (let obs of this.obstacles) {
            if (p.x > obs.x - 20 && p.x < obs.x + 40 && p.y > obs.y && p.y < obs.y + obs.h) {
              p.x = 100; // Reset back to start
              window.soundCtrl.playBounce();
              addParticle(p.x, p.y, '#f44336', 12, 4);
            }
          }

          // Check finish
          if (p.x >= this.finishLineX) {
            endCurrentRound(i);
            break;
          }
        }
      },
      draw() {
        ctx.fillStyle = '#37474f';
        ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

        // Finish line
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(this.finishLineX, 0, 40, V_HEIGHT);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('FINISH', this.finishLineX - 10, V_HEIGHT / 2);

        // Obstacles
        ctx.fillStyle = '#e53935';
        for (let obs of this.obstacles) {
          ctx.fillRect(obs.x, obs.y, 25, obs.h);
        }

        // Players
        for (let i = 0; i < 4; i++) {
          const p = this.players[i];
          drawPineapple(p.x, p.y, 0, 24, i);
        }
      }
    }
  ];

  // ==========================================
  // GAME FLOW & UI CONTROLLER
  // ==========================================

  function populateMinigamesGrid() {
    const grid = document.getElementById('minigames-grid');
    grid.innerHTML = '';
    MINIGAMES.forEach((mg, idx) => {
      const card = document.createElement('div');
      card.className = 'game-card';
      card.innerHTML = `
        <span class="game-card-icon">${mg.icon}</span>
        <div class="game-card-title">${mg.title}</div>
        <div class="game-card-desc">${mg.desc}</div>
      `;
      card.addEventListener('click', () => {
        window.soundCtrl.playClick();
        startMinigame(idx);
      });
      grid.appendChild(card);
    });
  }

  function startMinigame(index) {
    State.currentMinigameIndex = index;
    State.activeGame = MINIGAMES[index];
    State.activeGame.init();

    // Configure Bots based on Human Count
    for (let i = 0; i < 4; i++) {
      Input.players[i].isBot = (i >= State.humanCount);
    }

    // Switch Screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('in-game-hud').classList.remove('hidden');
    document.getElementById('hud-game-title').innerText = State.activeGame.title;

    window.soundCtrl.playWhistle();
  }

  function endCurrentRound(winnerIndex) {
    window.soundCtrl.playWinFanfare();
    State.tournamentScores[winnerIndex] += 3;

    // Show round over modal
    const modal = document.getElementById('screen-round-over');
    modal.classList.remove('hidden');
    document.getElementById('round-winner-title').innerText = `Ronde Selesai!`;
    document.getElementById('round-winner-desc').innerText = `${PLAYER_CONFIG[winnerIndex].name} Memenangkan Ronde!`;

    const standings = document.getElementById('round-standings');
    standings.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const item = document.createElement('div');
      item.className = 'standing-item';
      item.style.backgroundColor = PLAYER_CONFIG[i].color + '33';
      item.innerHTML = `<span>${PLAYER_CONFIG[i].name}</span> <span>Skor: ${State.tournamentScores[i]}</span>`;
      standings.appendChild(item);
    }

    // Update HUD scores
    for (let i = 0; i < 4; i++) {
      document.getElementById(`score-p${i + 1}`).innerText = `P${i + 1}: ${State.tournamentScores[i]}`;
    }
  }

  function handleNextRound() {
    document.getElementById('screen-round-over').classList.add('hidden');
    if (State.mode === 'CUP') {
      State.cupRound++;
      if (State.cupRound > State.totalCupRounds) {
        showGrandPodium();
      } else {
        const nextIdx = Math.floor(Math.random() * MINIGAMES.length);
        startMinigame(nextIdx);
      }
    } else {
      // Return to game select
      document.getElementById('in-game-hud').classList.add('hidden');
      document.getElementById('screen-games').classList.add('active');
    }
  }

  function showGrandPodium() {
    document.getElementById('in-game-hud').classList.add('hidden');
    document.getElementById('screen-podium').classList.remove('hidden');

    // Sort players by score
    const ranked = [0, 1, 2, 3].sort((a, b) => State.tournamentScores[b] - State.tournamentScores[a]);

    document.getElementById('podium-name-p1').innerText = `${PLAYER_CONFIG[ranked[0]].name} (${State.tournamentScores[ranked[0]]} Pts)`;
    document.getElementById('podium-name-p2').innerText = `${PLAYER_CONFIG[ranked[1]].name} (${State.tournamentScores[ranked[1]]} Pts)`;
    document.getElementById('podium-name-p3').innerText = `${PLAYER_CONFIG[ranked[2]].name} (${State.tournamentScores[ranked[2]]} Pts)`;
  }

  // Event Listeners for UI
  document.querySelectorAll('.btn-player-count').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-player-count').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.humanCount = parseInt(btn.dataset.players);
      window.soundCtrl.playClick();
    });
  });

  document.getElementById('btn-quick-play').addEventListener('click', () => {
    State.mode = 'QUICK';
    window.soundCtrl.playClick();
    document.getElementById('screen-menu').classList.remove('active');
    document.getElementById('screen-games').classList.add('active');
  });

  document.getElementById('btn-cup-tournament').addEventListener('click', () => {
    State.mode = 'CUP';
    State.cupRound = 1;
    State.tournamentScores = [0, 0, 0, 0];
    window.soundCtrl.playClick();
    const randomFirstGame = Math.floor(Math.random() * MINIGAMES.length);
    startMinigame(randomFirstGame);
  });

  document.getElementById('btn-back-to-menu').addEventListener('click', () => {
    window.soundCtrl.playClick();
    document.getElementById('screen-games').classList.remove('active');
    document.getElementById('screen-menu').classList.add('active');
  });

  document.getElementById('btn-next-round').addEventListener('click', handleNextRound);
  document.getElementById('btn-exit-to-menu').addEventListener('click', () => {
    document.getElementById('screen-round-over').classList.add('hidden');
    document.getElementById('in-game-hud').classList.add('hidden');
    document.getElementById('screen-menu').classList.add('active');
  });

  document.getElementById('btn-podium-restart').addEventListener('click', () => {
    document.getElementById('screen-podium').classList.add('hidden');
    State.cupRound = 1;
    State.tournamentScores = [0, 0, 0, 0];
    startMinigame(Math.floor(Math.random() * MINIGAMES.length));
  });

  document.getElementById('btn-podium-menu').addEventListener('click', () => {
    document.getElementById('screen-podium').classList.add('hidden');
    document.getElementById('screen-menu').classList.add('active');
  });

  document.getElementById('btn-sound-toggle').addEventListener('click', () => {
    const unmuted = window.soundCtrl.toggleMute();
    document.getElementById('btn-sound-toggle').innerText = unmuted ? '🔊 Suara: ON' : '🔇 Suara: OFF';
  });

  document.getElementById('btn-how-to-play').addEventListener('click', () => {
    document.getElementById('screen-guide').classList.remove('hidden');
  });
  document.getElementById('btn-close-guide').addEventListener('click', () => {
    document.getElementById('screen-guide').classList.add('hidden');
  });

  // Main Game Loop
  let lastTime = performance.now();
  function gameLoop(currentTime) {
    const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
    lastTime = currentTime;

    updateKeyboardInputs();

    if (State.activeGame && !State.isPaused) {
      State.activeGame.update(dt);
      if (State.activeGame.timer !== undefined) {
        document.getElementById('hud-timer').innerText = Math.max(0, Math.ceil(State.activeGame.timer));
      }
    }

    updateParticles(dt);

    // Render
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    if (State.activeGame) {
      State.activeGame.draw();
    } else {
      // Menu background ambient
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
    }

    drawParticles();
    ctx.restore();

    requestAnimationFrame(gameLoop);
  }

  // Initialization
  setupTouchControls();
  populateMinigamesGrid();
  requestAnimationFrame(gameLoop);
})();
