// AURA — Scene Atmosphere Engine for SillyTavern
// Detects [AURA:scene] tags from AI output and transforms the UI atmosphere.
// GitHub: https://github.com/chonnicha7075-creator/aura-scene-engine

import { eventSource, event_types } from '../../../../script.js';
import { extension_settings, getContext } from '../../../extensions.js';
import { saveSettingsDebounced } from '../../../../script.js';

const EXT_NAME = 'aura-scene-engine';
const TAG_REGEX = /\[AURA:(\w+)\]/gi;
const SETTINGS_KEY = EXT_NAME;

// ────────────────────────────────────────────
// Scene Definitions
// ────────────────────────────────────────────

const SCENES = {
    neutral: {
        label: 'Neutral',
        icon: '◈',
        accent: null,
        overlay: null,
        particles: null,
    },
    dark: {
        label: 'Dark / Noir',
        icon: '🌑',
        accent: '#7f77dd',
        overlay: 'rgba(10, 0, 25, 0.55)',
        particles: { color: '#7f77dd', secondary: '#3c3489', type: 'float', count: 22 },
    },
    action: {
        label: 'Action / Battle',
        icon: '🔥',
        accent: '#ef9f27',
        overlay: 'rgba(20, 5, 0, 0.55)',
        particles: { color: '#ef9f27', secondary: '#d85a30', type: 'rise', count: 28 },
    },
    romance: {
        label: 'Romance',
        icon: '🌸',
        accent: '#ed93b1',
        overlay: 'rgba(25, 0, 18, 0.50)',
        particles: { color: '#f4c0d1', secondary: '#ed93b1', type: 'float', count: 20 },
    },
    mystery: {
        label: 'Mystery / Fog',
        icon: '🌫️',
        accent: '#85b7eb',
        overlay: 'rgba(8, 14, 20, 0.60)',
        particles: { color: '#85b7eb', secondary: '#378add', type: 'drift', count: 16 },
    },
    magic: {
        label: 'Magic / Fantasy',
        icon: '✦',
        accent: '#5dcaa5',
        overlay: 'rgba(10, 26, 10, 0.55)',
        particles: { color: '#5dcaa5', secondary: '#1d9e75', type: 'sparkle', count: 24 },
    },
    horror: {
        label: 'Horror',
        icon: '💀',
        accent: '#e24b4a',
        overlay: 'rgba(10, 0, 0, 0.65)',
        particles: { color: '#e24b4a', secondary: '#791f1f', type: 'drip', count: 14 },
    },
    wuxia: {
        label: 'Wuxia / Historical',
        icon: '⚔️',
        accent: '#fac775',
        overlay: 'rgba(15, 10, 0, 0.55)',
        particles: { color: '#fac775', secondary: '#ba7517', type: 'float', count: 18 },
    },
};

// ────────────────────────────────────────────
// State
// ────────────────────────────────────────────

let currentScene = 'neutral';
let canvas = null;
let ctx = null;
let animFrame = null;
let particleList = [];
let transitionTimeout = null;

const defaultSettings = {
    enabled: true,
    showCard: true,
    particles: true,
    opacity: 55,
    autoDetect: true,
};

function getSettings() {
    if (!extension_settings[SETTINGS_KEY]) {
        extension_settings[SETTINGS_KEY] = { ...defaultSettings };
    }
    return extension_settings[SETTINGS_KEY];
}

// ────────────────────────────────────────────
// Canvas Particle System
// ────────────────────────────────────────────

function createParticle(type, color, secondary) {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const base = {
        x: Math.random() * w,
        y: type === 'rise' || type === 'drip' ? h + 10 : Math.random() * h,
        size: 1.5 + Math.random() * 3,
        color: Math.random() > 0.4 ? color : secondary,
        alpha: 0.3 + Math.random() * 0.5,
        speedX: (Math.random() - 0.5) * 0.6,
        speedY: 0,
        life: 1.0,
        decay: 0.001 + Math.random() * 0.003,
        phase: Math.random() * Math.PI * 2,
        type,
    };

    if (type === 'float' || type === 'sparkle') {
        base.speedY = -(0.2 + Math.random() * 0.5);
    } else if (type === 'rise') {
        base.speedY = -(0.8 + Math.random() * 1.2);
        base.decay = 0.004 + Math.random() * 0.005;
    } else if (type === 'drip') {
        base.y = -10;
        base.speedY = 0.6 + Math.random() * 1.0;
    } else if (type === 'drift') {
        base.speedX = (Math.random() - 0.5) * 0.3;
        base.speedY = -(0.1 + Math.random() * 0.2);
        base.size = 2 + Math.random() * 5;
    }

    return base;
}

function spawnParticles(scene) {
    const s = SCENES[scene];
    if (!s || !s.particles) return;
    const { color, secondary, type, count } = s.particles;
    particleList = Array.from({ length: count }, () => createParticle(type, color, secondary));
}

function drawParticle(p) {
    ctx.save();
    ctx.globalAlpha = p.alpha * p.life;
    ctx.fillStyle = p.color;

    if (p.type === 'sparkle') {
        const r = p.size;
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI / 2) * i + p.phase;
            ctx.lineTo(p.x + Math.cos(angle) * r * 2, p.y + Math.sin(angle) * r * 2);
            ctx.lineTo(p.x + Math.cos(angle + Math.PI / 4) * r * 0.5, p.y + Math.sin(angle + Math.PI / 4) * r * 0.5);
        }
        ctx.closePath();
        ctx.fill();
    } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

function animateParticles(scene) {
    if (!canvas || !ctx) return;
    const s = SCENES[scene];
    const pCfg = s?.particles;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!pCfg || !getSettings().particles) {
        animFrame = requestAnimationFrame(() => animateParticles(scene));
        return;
    }

    particleList = particleList.filter(p => p.life > 0);

    while (particleList.length < pCfg.count) {
        particleList.push(createParticle(pCfg.type, pCfg.color, pCfg.secondary));
    }

    for (const p of particleList) {
        p.x += p.speedX + Math.sin(p.phase) * 0.3;
        p.y += p.speedY;
        p.phase += 0.02;
        p.life -= p.decay;
        drawParticle(p);
    }

    animFrame = requestAnimationFrame(() => animateParticles(scene));
}

function stopParticles() {
    if (animFrame) {
        cancelAnimationFrame(animFrame);
        animFrame = null;
    }
    if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    particleList = [];
}

// ────────────────────────────────────────────
// CSS Theme Overlay
// ────────────────────────────────────────────

function applyTheme(sceneName) {
    const scene = SCENES[sceneName];
    let styleEl = document.getElementById('aura-dynamic-style');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'aura-dynamic-style';
        document.head.appendChild(styleEl);
    }

    if (!scene || !scene.accent) {
        styleEl.textContent = '';
        document.body.classList.remove(...Object.keys(SCENES).map(k => `aura-${k}`));
        return;
    }

    const opacity = (getSettings().opacity || 55) / 100;

    styleEl.textContent = `
        body.aura-active #aura-overlay {
            background: ${scene.overlay} !important;
            opacity: ${opacity} !important;
        }
        body.aura-active .mes {
            border-left: 2px solid ${scene.accent}33 !important;
        }
        body.aura-active .mes:last-child {
            border-left: 2px solid ${scene.accent}88 !important;
        }
        body.aura-active .mes_block {
            text-shadow: 0 0 40px ${scene.accent}11;
        }
    `;

    document.body.classList.remove(...Object.keys(SCENES).map(k => `aura-${k}`));
    document.body.classList.add('aura-active', `aura-${sceneName}`);
}

// ────────────────────────────────────────────
// Scene Transition Card
// ────────────────────────────────────────────

function showTransitionCard(sceneName) {
    if (!getSettings().showCard) return;
    const scene = SCENES[sceneName];
    if (!scene || !scene.accent) return;

    const existing = document.getElementById('aura-card');
    if (existing) existing.remove();

    const card = document.createElement('div');
    card.id = 'aura-card';
    card.innerHTML = `
        <div class="aura-card-icon">${scene.icon}</div>
        <div class="aura-card-text">
            <span class="aura-card-label">SCENE</span>
            <span class="aura-card-name">${scene.label}</span>
        </div>
    `;
    card.style.setProperty('--aura-accent', scene.accent);
    document.body.appendChild(card);

    requestAnimationFrame(() => {
        card.classList.add('aura-card-show');
    });

    if (transitionTimeout) clearTimeout(transitionTimeout);
    transitionTimeout = setTimeout(() => {
        card.classList.remove('aura-card-show');
        card.classList.add('aura-card-hide');
        setTimeout(() => card.remove(), 500);
    }, 2500);
}

// ────────────────────────────────────────────
// Scene Change Entry Point
// ────────────────────────────────────────────

function setScene(sceneName) {
    if (!SCENES[sceneName]) sceneName = 'neutral';
    if (sceneName === currentScene) return;

    const prev = currentScene;
    currentScene = sceneName;

    stopParticles();
    applyTheme(sceneName);

    if (sceneName !== 'neutral') {
        showTransitionCard(sceneName);
        if (getSettings().particles) {
            spawnParticles(sceneName);
            animateParticles(sceneName);
        }
    } else {
        document.body.classList.remove('aura-active', ...Object.keys(SCENES).map(k => `aura-${k}`));
    }

    console.log(`[AURA] Scene: ${prev} → ${sceneName}`);
}

// ────────────────────────────────────────────
// Tag & Keyword Detection
// ────────────────────────────────────────────

function detectScene(text) {
    // 1. Tag-based detection (priority) — [AURA:sceneName]
    const match = text.match(/\[AURA:(\w+)\]/i);
    if (match) {
        const key = match[1].toLowerCase();
        if (SCENES[key]) return key;
    }

    // 2. Auto keyword detection (optional)
    if (!getSettings().autoDetect) return null;

    const t = text.toLowerCase();

    if (/ต่อสู้|ยิง|ระเบิด|โจมตี|battle|fight|combat|explosion|attack/i.test(t)) return 'action';
    if (/สยอง|น่ากลัว|กรีดร้อง|ผี|horror|terrif|scream|ghost|blood/i.test(t)) return 'horror';
    if (/รัก|จูบ|กอด|หัวใจ|สัมผัส|love|kiss|embrace|heart|romance/i.test(t)) return 'romance';
    if (/ความลับ|ปริศนา|ซ่อน|สืบสวน|mystery|secret|hidden|detective/i.test(t)) return 'mystery';
    if (/เวทย์|มนตร์|มายากล|magic|spell|enchant|sorcery|rune/i.test(t)) return 'magic';
    if (/กลางคืน|มืด|เงา|นัวร์|night|darkness|shadow|noir/i.test(t)) return 'dark';
    if (/กำลังภายใน|ดาบ|วิชา|ยุทธ|wuxia|martial|sword|technique/i.test(t)) return 'wuxia';

    return null;
}

function stripAuraTags(text) {
    return text.replace(TAG_REGEX, '').trim();
}

// ────────────────────────────────────────────
// ST Event Hooks
// ────────────────────────────────────────────

function onMessageReceived() {
    if (!getSettings().enabled) return;

    const context = getContext();
    const chat = context.chat;
    if (!chat || chat.length === 0) return;

    const last = chat[chat.length - 1];
    if (!last || last.is_user) return;

    const text = last.mes || '';
    const detected = detectScene(text);
    if (detected) setScene(detected);
}

// Strip [AURA:*] from rendered message DOM
function onMessageRendered(msgId) {
    const msgEl = document.querySelector(`.mes[mesid="${msgId}"] .mes_text`);
    if (!msgEl) return;
    msgEl.innerHTML = msgEl.innerHTML.replace(/\[AURA:\w+\]/gi, '');
}

// ────────────────────────────────────────────
// Settings Panel (injected into ST Extensions tab)
// ────────────────────────────────────────────

function buildSettingsPanel() {
    const s = getSettings();

    const html = `
    <div id="aura-settings" class="aura-settings-panel">
        <h4>✦ AURA — Scene Atmosphere Engine</h4>
        <div class="aura-setting-row">
            <label>
                <input type="checkbox" id="aura-enabled" ${s.enabled ? 'checked' : ''}/>
                เปิดใช้งาน AURA
            </label>
        </div>
        <div class="aura-setting-row">
            <label>
                <input type="checkbox" id="aura-show-card" ${s.showCard ? 'checked' : ''}/>
                แสดง Scene Transition Card
            </label>
        </div>
        <div class="aura-setting-row">
            <label>
                <input type="checkbox" id="aura-particles" ${s.particles ? 'checked' : ''}/>
                แสดง Particle Effects
            </label>
        </div>
        <div class="aura-setting-row">
            <label>
                <input type="checkbox" id="aura-auto-detect" ${s.autoDetect ? 'checked' : ''}/>
                Auto Keyword Detection (ไม่ต้องใช้ tag)
            </label>
        </div>
        <div class="aura-setting-row">
            <label>ความเข้มของ Overlay: <span id="aura-opacity-val">${s.opacity}</span>%</label>
            <input type="range" id="aura-opacity" min="10" max="90" value="${s.opacity}" style="width:100%"/>
        </div>
        <div class="aura-setting-row" style="margin-top:12px">
            <label style="font-size:12px;opacity:.7">Manual Override:</label>
            <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
                ${Object.entries(SCENES).map(([k, v]) => `
                    <button class="aura-scene-btn" data-scene="${k}" title="${v.label}">
                        ${v.icon} ${v.label}
                    </button>
                `).join('')}
            </div>
        </div>
    </div>`;

    $('#extensions_settings').append(html);

    // Bind controls
    $('#aura-enabled').on('change', function () {
        getSettings().enabled = this.checked;
        if (!this.checked) setScene('neutral');
        saveSettingsDebounced();
    });
    $('#aura-show-card').on('change', function () {
        getSettings().showCard = this.checked;
        saveSettingsDebounced();
    });
    $('#aura-particles').on('change', function () {
        getSettings().particles = this.checked;
        if (!this.checked) stopParticles();
        else if (currentScene !== 'neutral') { spawnParticles(currentScene); animateParticles(currentScene); }
        saveSettingsDebounced();
    });
    $('#aura-auto-detect').on('change', function () {
        getSettings().autoDetect = this.checked;
        saveSettingsDebounced();
    });
    $('#aura-opacity').on('input', function () {
        getSettings().opacity = parseInt(this.value);
        $('#aura-opacity-val').text(this.value);
        applyTheme(currentScene);
        saveSettingsDebounced();
    });
    $(document).on('click', '.aura-scene-btn', function () {
        setScene($(this).data('scene'));
    });
}

// ────────────────────────────────────────────
// DOM Setup
// ────────────────────────────────────────────

function setupDOM() {
    // Background overlay element
    if (!document.getElementById('aura-overlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'aura-overlay';
        document.body.appendChild(overlay);
    }

    // Particle canvas
    if (!document.getElementById('aura-canvas')) {
        canvas = document.createElement('canvas');
        canvas.id = 'aura-canvas';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        document.body.appendChild(canvas);
        ctx = canvas.getContext('2d');

        window.addEventListener('resize', () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }
}

// ────────────────────────────────────────────
// Init
// ────────────────────────────────────────────

jQuery(async () => {
    setupDOM();
    buildSettingsPanel();

    eventSource.on(event_types.MESSAGE_RECEIVED, onMessageReceived);

    if (event_types.MESSAGE_RENDERED) {
        eventSource.on(event_types.MESSAGE_RENDERED, onMessageRendered);
    }

    console.log('[AURA] Scene Atmosphere Engine loaded ✦');
});
