document.addEventListener('DOMContentLoaded', () => {
    
    const athletesDatabase = {
        garrett: { name: "Garrett Graham", bio: "O Capitão tático dos Hawks. Dono de passes de precisão milimétrica e nervos de aço no rinque da Briar.", speed: 85, power: 75, skill: 95 },
        logan: { name: "John Logan", bio: "Velocidade explosiva pura nas alas esquerdas. Destrói qualquer linha de defesa compacta num piscar de olhos.", speed: 98, power: 70, skill: 88 },
        dean: { name: "Dean Di Laurentis", bio: "Estrategista defensivo supremo. Consegue ler e antecipar qualquer contra-ataque antes mesmo do oponente reagir.", speed: 80, power: 90, skill: 85 },
        tucker: { name: "John Tucker", bio: "A autêntica muralha robusta de Briar. Traz equilíbrio perfeito, força física brutal e resiliência à equipa.", speed: 75, power: 95, skill: 80 }
    };

    const winSequence = [2, 4, 1]; // Garrett -> Tucker -> Logan
    let currentStep = 0;

    const screens = {
        intro: document.getElementById('screen-intro'),
        selection: document.getElementById('screen-selection'),
        game: document.getElementById('screen-game'),
        muralOriginal: document.getElementById('screen-mural-original'),
        login: document.getElementById('screen-login'),
        mural: document.getElementById('screen-mural')
    };

    const gameContainer = document.querySelector('.game-container');

    function changeScreen(targetKey) {
        Object.keys(screens).forEach(key => {
            if(screens[key]) screens[key].classList.remove('active');
        });
        if(screens[targetKey]) screens[targetKey].classList.add('active');
    }

    // --- PASSO 1: INTRODUÇÃO ---
    document.getElementById('btn-start').addEventListener('click', () => {
        changeScreen('selection');
    });

    // --- PASSO 2: SELEÇÃO GIGANTE ---
    const giantDisplay = document.getElementById('giant-display');
    const thumbs = document.querySelectorAll('.thumb-item');

    function renderGiantProfile(key) {
        const data = athletesDatabase[key];
        if (!giantDisplay) return;
        giantDisplay.innerHTML = `
            <div class="giant-frame"><img src="./img/${key}.png" alt="${data.name}"></div>
            <div class="giant-info">
                <h3 class="pixel-text">${data.name}</h3>
                <p class="pixel-text">${data.bio}</p>
                <div class="stats-holder">
                    <div class="stat-bar-row">
                        <span class="pixel-text stat-label">VEL</span>
                        <div class="stat-bg"><div class="stat-fill" style="width: ${data.speed}%"></div></div>
                    </div>
                    <div class="stat-bar-row">
                        <span class="pixel-text stat-label">FOR</span>
                        <div class="stat-bg"><div class="stat-fill" style="width: ${data.power}%"></div></div>
                    </div>
                    <div class="stat-bar-row">
                        <span class="pixel-text stat-label">MIR</span>
                        <div class="stat-bg"><div class="stat-fill" style="width: ${data.skill}%"></div></div>
                    </div>
                </div>
            </div>
        `;
    }
    renderGiantProfile('garrett');

    thumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
            thumbs.forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
            renderGiantProfile(thumb.getAttribute('data-char'));
        });
    });

    document.getElementById('btn-confirm-character').addEventListener('click', () => {
        changeScreen('game');
        initCanvasEffects();
        resetPuck();
    });

    // --- PASSO 3: ENGINE DA ARENA ---
    const puck = document.getElementById('puck');
    const playerSlots = document.querySelectorAll('.player-slot');
    const msgField = document.getElementById('game-message');
    const dots = [document.getElementById('dot-1'), document.getElementById('dot-2'), document.getElementById('dot-3')];
    
    let canvas, ctx;
    let isDragging = false;
    let activeHoveredSlot = null;
    let puckTrail = [];
    let particles = [];

    function initCanvasEffects() {
        canvas = document.getElementById('trail-canvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        requestAnimationFrame(updateEffectsLoop);
    }

    function resizeCanvas() {
        if (!canvas) return;
        const arenaRect = document.getElementById('arena-surface').getBoundingClientRect();
        canvas.width = arenaRect.width;
        canvas.height = arenaRect.height;
    }

    function resetPuck() {
        if (!puck) return;
        puck.style.transition = 'none';
        puck.style.bottom = "12%";
        puck.style.left = "50%";
        puck.style.top = "";
        puck.style.transform = 'translateX(-50%)';
        puck.classList.remove('dragging');
        if (gameContainer) gameContainer.classList.remove('arrastando-puck');
        isDragging = false;
        puckTrail = [];
    }

    const dragStart = () => {
        if (currentStep >= winSequence.length) return;
        isDragging = true;
        puck.classList.add('dragging');
        if (gameContainer) gameContainer.classList.add('arrastando-puck');
        puck.style.transition = 'none';
        puck.style.transform = 'none';
        if (msgField) msgField.innerText = "";
    };

    const dragMove = (e) => {
        if (!isDragging || !puck) return;
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        if (!clientX || !clientY) return;

        const arenaRect = document.getElementById('arena-surface').getBoundingClientRect();
        let posX = clientX - arenaRect.left - (puck.offsetWidth / 2);
        let posY = clientY - arenaRect.top - (puck.offsetHeight / 2);

        puck.style.left = `${posX}px`;
        puck.style.top = `${posY}px`;

        puckTrail.push({ x: posX + puck.offsetWidth / 2, y: posY + puck.offsetHeight / 2, alpha: 1.0 });

        let currentHit = null;
        playerSlots.forEach(slot => {
            const box = slot.getBoundingClientRect();
            if (clientX >= box.left && clientX <= box.right && clientY >= box.top && clientY <= box.bottom) {
                currentHit = slot;
            }
        });
        activeHoveredSlot = currentHit;
    };

    const dragEnd = () => {
        if (!isDragging || !puck) return;
        isDragging = false;
        puck.classList.remove('dragging');
        if (gameContainer) gameContainer.classList.remove('arrastando-puck');

        if (activeHoveredSlot) {
            const targetId = parseInt(activeHoveredSlot.getAttribute('data-id'));
            if (targetId === winSequence[currentStep]) {
                const box = activeHoveredSlot.getBoundingClientRect();
                const arena = document.getElementById('arena-surface').getBoundingClientRect();
                spawnBurstParticles(box.left - arena.left + box.width / 2, box.top - arena.top + box.height / 2);

                activeHoveredSlot.classList.add('hit');
                if(dots[currentStep]) dots[currentStep].classList.add('active');
                currentStep++;
                renderLaserLines();
                resetPuck();

                if (currentStep === winSequence.length) {
                    if (msgField) {
                        msgField.innerText = "FORMAÇÃO DE TIME COMPLETA!";
                        msgField.className = "pixel-text feedback-message success";
                    }
                    
                    setTimeout(() => {
                        changeScreen('muralOriginal');
                    }, 1500);
                }
            } else {
                if (msgField) {
                    msgField.innerText = "PASSE ERRADO. TENTE NOVAMENTE.";
                    msgField.className = "pixel-text feedback-message error";
                }
                currentStep = 0;
                dots.forEach(d => { if(d) d.classList.remove('active'); });
                playerSlots.forEach(s => s.classList.remove('hit'));
                document.getElementById('line-1').style.opacity = '0';
                document.getElementById('line-2').style.opacity = '0';
                resetPuck();
            }
        } else {
            puck.style.transition = 'all 0.25s ease-out';
            puck.style.top = '';
            puck.style.bottom = "12%";
            puck.style.left = "50%";
            puck.style.transform = 'translateX(-50%)';
        }
    };

    if (puck) {
        puck.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', dragMove);
        document.addEventListener('mouseup', dragEnd);
        puck.addEventListener('touchstart', dragStart);
        document.addEventListener('touchmove', dragMove);
        document.addEventListener('touchend', dragEnd);
    }

    function spawnBurstParticles(x, y) {
        for (let i = 0; i < 25; i++) {
            particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                size: Math.random() * 4 + 2,
                color: '#00ffcc',
                life: 1.0
            });
        }
    }

    function updateEffectsLoop() {
        if (!ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (puckTrail.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(0, 255, 204, 0.4)';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            for (let i = 0; i < puckTrail.length; i++) {
                if (i === 0) ctx.moveTo(puckTrail[i].x, puckTrail[i].y);
                else ctx.lineTo(puckTrail[i].x, puckTrail[i].y);
                puckTrail[i].alpha -= 0.03;
            }
            ctx.stroke();
            puckTrail = puckTrail.filter(t => t.alpha > 0);
        }

        particles.forEach(p => {
            ctx.beginPath();
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.02;
        });
        ctx.globalAlpha = 1.0;
        particles = particles.filter(p => p.life > 0);

        requestAnimationFrame(updateEffectsLoop);
    }

    function renderLaserLines() {
        const getCenterCoords = (id) => {
            const slot = document.getElementById(`char-${id}`).getBoundingClientRect();
            const arena = document.querySelector('.laser-svg').getBoundingClientRect();
            return {
                x: slot.left - arena.left + (slot.width / 2),
                y: slot.top - arena.top + (slot.height / 2)
            };
        };

        if (currentStep >= 1) {
            const p2 = getCenterCoords(2), p4 = getCenterCoords(4);
            const l1 = document.getElementById('line-1');
            l1.setAttribute('x1', p2.x); l1.setAttribute('y1', p2.y);
            l1.setAttribute('x2', p4.x); l1.setAttribute('y2', p4.y);
            l1.style.opacity = '1';
        }
        if (currentStep >= 2) {
            const p4 = getCenterCoords(4), p1 = getCenterCoords(1);
            const l2 = document.getElementById('line-2');
            l2.setAttribute('x1', p4.x); l2.setAttribute('y1', p4.y);
            l2.setAttribute('x2', p1.x); l2.setAttribute('y2', p1.y);
            l2.style.opacity = '1';
        }
    }

    // --- PASSO 4: MURAL ACADÊMICO TO LOGIN ---
    document.getElementById('btn-next-to-login').addEventListener('click', () => {
        changeScreen('login');
    });

    // --- PASSO 5: FORMULÁRIO DE LOGIN FINAL TO MURAL DE FOTOS ---
    document.getElementById('hawks-login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const successToast = document.getElementById('login-success');
        successToast.style.display = 'block';
        
        document.querySelectorAll('#hawks-login-form input').forEach(inp => inp.disabled = true);
        document.querySelector('.btn-enter').style.display = 'none';
        
        setTimeout(() => {
            changeScreen('mural');
        }, 1500);
    });

    // --- PASSO 6: CONCLUIR JOGO ---
    document.getElementById('btn-finish-game').addEventListener('click', () => {
        alert("Obrigado por jogar Briar University Hawks!");
    });
});