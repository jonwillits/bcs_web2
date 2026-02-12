/**
 * Playground Template Seeding Script
 *
 * Runs during deployment to ensure featured playground templates exist in the database.
 * This script can be executed via: npm run seed:playgrounds
 *
 * Default behavior: creates new templates, skips existing ones (preserves UI edits).
 * Use --force flag to update existing templates with source code from this file:
 *   npx tsx scripts/seed-playgrounds.ts --force
 */

import { PrismaClient } from '@prisma/client';

// Use DIRECT_URL for seeding (like migrations) to bypass PgBouncer
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL
    }
  }
});

// Template definitions (duplicated from src/lib/react-playground/templates.ts to avoid import issues during build)
// Keep these in sync with the source file
const PLAYGROUND_TEMPLATES = [
  {
    id: 'client-vehicles-demo',
    name: 'Braitenberg Vehicles 3D Lab',
    description: 'Interactive 3D simulation demonstrating Braitenberg vehicle sensor-motor wiring with four vehicle types',
    category: 'simulations',
    tags: ['3d', 'three.js', 'braitenberg', 'simulation', 'client'],
    dependencies: ['react', 'react-dom', 'three'],
    sourceCode: `import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';

/* ── Constants ── */
const TANK_HALF_X = 2.3, TANK_HALF_Z = 1.5;
const TANK_Y_MIN = 2.8, TANK_Y_MAX = 3.7;
const TANK_BASE_Y = 2.45;
const WALL_MARGIN = 0.3;
const NUM_WORMS = 6;
const NUM_SEGMENTS = 8;
const SEG_RADIUS = 0.04;
const SEG_SPACING = 0.07;
const SENSOR_OFFSET_ANGLE = 0.35; // ~20 degrees
const BASE_SPEED = 0.6;
const SENSOR_GAIN = 2.5;
const WHEEL_BASE = 0.12;
const EPSILON = 0.01;

const VEHICLE_CONFIG = {
  fear:       { color: 0xff7777, label: '2a: Fear',       cross: false, inhibit: false },
  aggression: { color: 0x77ff77, label: '2b: Aggression', cross: true,  inhibit: false },
  love:       { color: 0x77ddff, label: '3a: Love',       cross: true,  inhibit: true  },
  explorer:   { color: 0xffcc77, label: '3b: Explorer',   cross: false, inhibit: true  },
};

const styles = {
  card: { background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: 12, border: '1px solid rgba(99, 102, 241, 0.2)', padding: '1.5rem', marginBottom: '1rem' },
  btn: { padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)' },
  btnSecondary: { padding: '10px 20px', background: 'rgba(255,255,255,0.1)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: 8, cursor: 'pointer', fontWeight: 500 },
  btnDanger: { padding: '10px 20px', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)' },
  btnSuccess: { padding: '10px 20px', background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)' },
};

function MobileWarning({ onContinue }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '2rem', textAlign: 'center', color: 'white', fontFamily: 'system-ui' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>&#128421;</div>
      <h2 style={{ marginBottom: '0.5rem' }}>Desktop Recommended</h2>
      <p style={{ color: '#888', marginBottom: '2rem', maxWidth: 300 }}>This 3D simulation requires mouse controls for the best experience.</p>
      <button onClick={onContinue} style={styles.btn}>Continue Anyway</button>
    </div>
  );
}

/* ── Wiring Diagram Overlay ── */
function WiringDiagram({ behaviorType }) {
  const cfg = VEHICLE_CONFIG[behaviorType];
  const sign = cfg.inhibit ? '(-)' : '(+)';
  return (
    <div style={{ position: 'absolute', bottom: 16, right: 16, background: 'rgba(0,0,0,0.75)', borderRadius: 10, padding: '12px 16px', fontSize: '0.72rem', color: '#ccc', fontFamily: 'monospace', lineHeight: 1.8, border: '1px solid rgba(99,102,241,0.25)', pointerEvents: 'none', minWidth: 170 }}>
      <div style={{ color: '#a5b4fc', fontWeight: 700, marginBottom: 4, fontFamily: 'system-ui', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Wiring: {cfg.label}</div>
      {cfg.cross ? (
        <>
          <div>L-sensor --\\  /-- R-motor {sign}</div>
          <div style={{ paddingLeft: '5.5ch' }}>X</div>
          <div>R-sensor --/  \\-- L-motor {sign}</div>
        </>
      ) : (
        <>
          <div>L-sensor -------- L-motor {sign}</div>
          <div>R-sensor -------- R-motor {sign}</div>
        </>
      )}
    </div>
  );
}

/* ── Sensor HUD ── */
function SensorHUD({ data }) {
  if (!data) return null;
  const bar = (val, max, color) => (
    <div style={{ width: 80, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{ width: Math.min(val / max, 1) * 100 + '%', height: '100%', background: color, borderRadius: 3 }} />
    </div>
  );
  return (
    <div style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.75)', borderRadius: 10, padding: '10px 14px', fontSize: '0.7rem', color: '#ccc', fontFamily: 'monospace', border: '1px solid rgba(99,102,241,0.25)', pointerEvents: 'none', minWidth: 150 }}>
      <div style={{ color: '#a5b4fc', fontWeight: 700, marginBottom: 6, fontFamily: 'system-ui', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Focus Nematode</div>
      <div style={{ display: 'grid', gridTemplateColumns: '58px 1fr', gap: '4px 8px', alignItems: 'center' }}>
        <span>L-sensor</span>{bar(data.sL, 3, '#f9a825')}
        <span>R-sensor</span>{bar(data.sR, 3, '#f9a825')}
        <span>L-motor</span>{bar(data.mL, 4, '#66bb6a')}
        <span>R-motor</span>{bar(data.mR, 4, '#66bb6a')}
      </div>
    </div>
  );
}

/* ── Lab Description ── */
function LabDescription() {
  const wiringCard = (title, color, cross, inhibit, desc, why) => {
    const sign = inhibit ? '(-)' : '(+)';
    return (
      <div style={{ ...styles.card, borderColor: color + '40' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: color, boxShadow: '0 0 8px ' + color }} />
          <h4 style={{ margin: 0, color, fontSize: '1rem' }}>{title}</h4>
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: 6, marginBottom: '0.75rem', lineHeight: 1.7, color: '#aaa' }}>
          {cross ? (
            <>{('L-sensor --\\\\  /-- R-motor ' + sign)}<br/>{('             X')}<br/>{('R-sensor --/  \\\\-- L-motor ' + sign)}</>
          ) : (
            <>{('L-sensor ---- L-motor ' + sign)}<br/>{('R-sensor ---- R-motor ' + sign)}</>
          )}
        </div>
        <p style={{ color: '#bbb', fontSize: '0.85rem', margin: '0 0 0.5rem 0', lineHeight: 1.5 }}>{desc}</p>
        <p style={{ color: '#888', fontSize: '0.8rem', margin: 0, fontStyle: 'italic', lineHeight: 1.5 }}>{why}</p>
      </div>
    );
  };

  return (
    <div style={{ padding: '2rem', color: 'white', maxWidth: 920, margin: '0 auto', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.2rem', background: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>Braitenberg Vehicles 3D Lab</h1>
        <p style={{ color: '#888', fontSize: '1.05rem', maxWidth: 600, margin: '0 auto' }}>In 1984, Valentino Braitenberg showed that wiring two sensors to two motors in different ways produces creatures that appear to have personalities -- fear, aggression, love, and curiosity -- from nothing but simple circuits.</p>
      </div>

      <h2 style={{ color: '#a5b4fc', fontSize: '1.1rem', marginBottom: '1rem' }}>How It Works</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { title: 'Sensors', desc: 'Each creature has two light sensors on its head (left and right). Each sensor measures how much light it receives from the lamps. The closer and brighter the light source, the stronger the reading.' },
          { title: 'Motors', desc: 'Each creature has two motors (left and right) that control its movement. A faster left motor turns the creature right, and vice versa. Speed difference = turning.' },
          { title: 'Wiring', desc: 'The key insight: HOW you connect sensors to motors determines the entire personality. Same-side or crossed? Stronger signal means faster or slower? These two choices create four distinct behaviors.' },
        ].map(item => (
          <div key={item.title} style={styles.card}>
            <h3 style={{ color: '#a5b4fc', marginBottom: '0.5rem', fontSize: '1rem', marginTop: 0 }}>{item.title}</h3>
            <p style={{ color: '#888', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
          </div>
        ))}
      </div>

      <h2 style={{ color: '#a5b4fc', fontSize: '1.1rem', marginBottom: '1rem' }}>The Four Vehicle Types</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {wiringCard('Vehicle 2a: Fear', '#ff7777', false, false,
          'Same-side wiring, excitatory. More light on left sensor = faster left motor = turns AWAY from light. Speeds up near light sources.',
          'Why it works: The motor on the same side as the brighter sensor spins faster, pivoting the creature away. And since more light means more speed, it flees faster the closer it gets.'
        )}
        {wiringCard('Vehicle 2b: Aggression', '#77ff77', true, false,
          'Crossed wiring, excitatory. More light on left sensor = faster RIGHT motor = turns TOWARD light. Charges at light sources at high speed.',
          'Why it works: Crossing the wires reverses the turning direction. Now the creature steers toward stimulation, and excitatory connections mean it accelerates on approach -- ramming straight into the light.'
        )}
        {wiringCard('Vehicle 3a: Love', '#77ddff', true, true,
          'Crossed wiring, inhibitory. More light on left sensor = SLOWER right motor = turns toward light but slows down. Gently approaches and hovers near light sources.',
          'Why it works: Crossed wires still steer it toward light, but inhibitory connections mean more stimulation produces less motor output. It approaches gently and comes to rest near the light -- as if attracted.'
        )}
        {wiringCard('Vehicle 3b: Explorer', '#ffcc77', false, true,
          'Same-side wiring, inhibitory. More light on left sensor = SLOWER left motor = turns away from light and slows near it. Moves fastest in dark areas.',
          'Why it works: Same-side wiring pushes it away from light, and inhibitory connections mean light slows it down. It speeds up in darkness and sluggishly drifts away from bright areas -- exploring the dim regions.'
        )}
      </div>

      <div style={{ ...styles.card, background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)', textAlign: 'center', padding: '1.5rem 2rem' }}>
        <h3 style={{ color: '#a5b4fc', marginTop: 0, marginBottom: '0.75rem' }}>The Key Insight</h3>
        <p style={{ color: '#ccc', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>Same sensors + same motors + <strong style={{ color: '#fff' }}>different wiring</strong> = completely different personalities. No programming, no intelligence, no goals -- just circuits.</p>
      </div>

      <div style={{ textAlign: 'center', padding: '1.5rem 1rem 0.5rem', color: '#666', fontSize: '0.9rem' }}>
        Select a vehicle tab above to start the simulation. Toggle lamps on/off to see how behavior changes in real time.
      </div>
    </div>
  );
}

/* ── ThreeScene ── */
function ThreeScene({ behaviorType, isPaused, lamps, onLampToggle, focusDataRef }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const nematodesRef = useRef([]);
  const lampMeshesRef = useRef([]);
  const lampLightsRef = useRef([]);
  const animationRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const orbitRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3, radius: 14 });
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const lampsRef = useRef(lamps);
  const isPausedRef = useRef(isPaused);
  const heatmapRef = useRef(null);
  const frameCountRef = useRef(0);

  useEffect(() => { lampsRef.current = lamps; }, [lamps]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080810);
    scene.fog = new THREE.Fog(0x080810, 15, 35);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    cameraRef.current = camera;
    updateCameraPosition();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    scene.add(new THREE.AmbientLight(0x404060, 0.4));
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.6);
    mainLight.position.set(8, 12, 8);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.set(2048, 2048);
    scene.add(mainLight);
    const rimLight = new THREE.DirectionalLight(0x6366f1, 0.3);
    rimLight.position.set(-5, 5, -5);
    scene.add(rimLight);

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(25, 25), new THREE.MeshStandardMaterial({ color: 0x12121a, roughness: 0.9, metalness: 0.1 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Table
    const table = new THREE.Mesh(new THREE.BoxGeometry(7, 0.35, 4.5), new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: 0.7, metalness: 0.05 }));
    table.position.set(0, 1.5, 0);
    table.castShadow = true;
    table.receiveShadow = true;
    scene.add(table);
    const legGeo = new THREE.CylinderGeometry(0.08, 0.1, 1.5, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x3a2a20, roughness: 0.8 });
    [[-3, 0.75, -2], [3, 0.75, -2], [-3, 0.75, 2], [3, 0.75, 2]].forEach(([x, y, z]) => { const leg = new THREE.Mesh(legGeo, legMat); leg.position.set(x, y, z); leg.castShadow = true; scene.add(leg); });

    // Tank
    const tankGroup = new THREE.Group();
    tankGroup.position.set(0, TANK_BASE_Y, 0);
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xaaddff, transparent: true, opacity: 0.25, roughness: 0.05, metalness: 0, transmission: 0.9, thickness: 0.1 });
    [[0, 0.8, 1.8, 5.5, 1.6, 0.06], [0, 0.8, -1.8, 5.5, 1.6, 0.06], [2.7, 0.8, 0, 0.06, 1.6, 3.6], [-2.7, 0.8, 0, 0.06, 1.6, 3.6]].forEach(([x, y, z, w, h, d]) => { const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), glassMat); wall.position.set(x, y, z); tankGroup.add(wall); });
    const water = new THREE.Mesh(new THREE.BoxGeometry(5.3, 1.2, 3.5), new THREE.MeshPhysicalMaterial({ color: 0x1a5a8a, transparent: true, opacity: 0.5, roughness: 0.1, metalness: 0.1, transmission: 0.6 }));
    water.position.set(0, 0.55, 0);
    tankGroup.add(water);
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.15, 3.6), new THREE.MeshStandardMaterial({ color: 0x3a6a5a, roughness: 0.9 }));
    tankGroup.add(bottom);
    const pebbleGeo = new THREE.SphereGeometry(0.08, 8, 6);
    const pebbleMat = new THREE.MeshStandardMaterial({ color: 0x556655, roughness: 0.8 });
    for (let i = 0; i < 15; i++) { const p = new THREE.Mesh(pebbleGeo, pebbleMat); p.position.set((Math.random() - 0.5) * 4.5, 0.1, (Math.random() - 0.5) * 3); p.scale.set(0.8 + Math.random() * 0.5, 0.6 + Math.random() * 0.3, 0.8 + Math.random() * 0.5); tankGroup.add(p); }
    scene.add(tankGroup);

    // Heatmap plane
    const hmCanvas = document.createElement('canvas');
    hmCanvas.width = 64; hmCanvas.height = 64;
    const hmCtx = hmCanvas.getContext('2d');
    const hmTexture = new THREE.CanvasTexture(hmCanvas);
    const hmPlane = new THREE.Mesh(new THREE.PlaneGeometry(5.3, 3.5), new THREE.MeshBasicMaterial({ map: hmTexture, transparent: true, opacity: 0.35, depthWrite: false }));
    hmPlane.rotation.x = -Math.PI / 2;
    hmPlane.position.set(0, TANK_BASE_Y + 1.21, 0);
    scene.add(hmPlane);
    heatmapRef.current = { canvas: hmCanvas, ctx: hmCtx, texture: hmTexture, mesh: hmPlane };

    // Nematodes
    const cfg = VEHICLE_CONFIG[behaviorType];
    const nematodeMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.5, metalness: 0.05, emissive: cfg.color, emissiveIntensity: 0.2 });
    const sensorMat = new THREE.MeshStandardMaterial({ color: 0xffff88, emissive: 0xffaa00, emissiveIntensity: 0, roughness: 0.3 });

    for (let i = 0; i < NUM_WORMS; i++) {
      const wormGroup = new THREE.Group();
      for (let s = 0; s < NUM_SEGMENTS; s++) {
        const seg = new THREE.Mesh(new THREE.SphereGeometry(SEG_RADIUS * (1 - s * 0.04), 8, 6), nematodeMat.clone());
        seg.position.x = -s * SEG_SPACING;
        seg.castShadow = true;
        wormGroup.add(seg);
      }
      // Sensor dots
      const sL = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), sensorMat.clone());
      sL.position.set(0.04, 0.02, -0.03);
      sL.userData.isSensor = 'left';
      wormGroup.add(sL);
      const sR = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), sensorMat.clone());
      sR.position.set(0.04, 0.02, 0.03);
      sR.userData.isSensor = 'right';
      wormGroup.add(sR);

      const heading = Math.random() * Math.PI * 2;
      wormGroup.position.set((Math.random() - 0.5) * (TANK_HALF_X * 2 - 0.4), TANK_Y_MIN + Math.random() * (TANK_Y_MAX - TANK_Y_MIN), (Math.random() - 0.5) * (TANK_HALF_Z * 2 - 0.4));
      wormGroup.userData = { heading, sensorLeft: 0, sensorRight: 0, motorLeft: 0, motorRight: 0, phase: Math.random() * Math.PI * 2 };
      wormGroup.rotation.y = heading;
      scene.add(wormGroup);
      nematodesRef.current.push(wormGroup);
    }

    // Lamps
    lamps.forEach((lamp, idx) => {
      const lampGroup = new THREE.Group();
      lampGroup.position.set(lamp.position[0], lamp.position[1], lamp.position[2]);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.15, 20), new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.3, metalness: 0.7 }));
      base.position.y = 0.075; base.castShadow = true; lampGroup.add(base);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.3, 12), new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.4, metalness: 0.6 }));
      pole.position.y = 0.8; pole.castShadow = true; lampGroup.add(pole);
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.22, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.5, metalness: 0.5, side: THREE.DoubleSide }));
      shade.position.y = 1.4; shade.rotation.x = Math.PI; lampGroup.add(shade);
      const bulbMat = new THREE.MeshStandardMaterial({ color: lamp.isOn ? 0xffffcc : 0x444444, emissive: lamp.isOn ? 0xffaa44 : 0x000000, emissiveIntensity: lamp.isOn ? 1.0 : 0, roughness: 0.15 });
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.22, 20, 20), bulbMat);
      bulb.position.y = 1.52; bulb.userData.lampIndex = idx; lampGroup.add(bulb);
      if (lamp.isOn) {
        const light = new THREE.PointLight(0xffdd88, 4, 12);
        light.position.y = 1.52; light.castShadow = true; lampGroup.add(light);
        lampLightsRef.current[idx] = light;
      }
      scene.add(lampGroup);
      lampMeshesRef.current[idx] = { group: lampGroup, bulb, mat: bulbMat };
    });

    // Compute lamp world positions for sensors
    function getLampWorldPositions() {
      const positions = [];
      lampsRef.current.forEach((lamp, idx) => {
        if (!lamp.isOn) return;
        const meshData = lampMeshesRef.current[idx];
        if (!meshData) return;
        const bulbWorld = new THREE.Vector3();
        meshData.bulb.getWorldPosition(bulbWorld);
        positions.push(bulbWorld);
      });
      return positions;
    }

    // Sensor reading: sum of lampIntensity / (dist^2 + epsilon) for all active lamps
    function computeSensor(sensorWorldPos, lampPositions) {
      let total = 0;
      for (const lp of lampPositions) {
        const distSq = sensorWorldPos.distanceToSquared(lp);
        total += 1.0 / (distSq + EPSILON);
      }
      return total;
    }

    // Update heatmap
    function updateHeatmap() {
      const hm = heatmapRef.current;
      if (!hm) return;
      const ctx = hm.ctx;
      const w = hm.canvas.width, h = hm.canvas.height;
      const imgData = ctx.createImageData(w, h);
      const lampPositions = getLampWorldPositions();
      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          const wx = (px / w - 0.5) * 5.3;
          const wz = (py / h - 0.5) * 3.5;
          const worldPos = new THREE.Vector3(wx, TANK_BASE_Y + 1.0, wz);
          let intensity = 0;
          for (const lp of lampPositions) {
            const distSq = worldPos.distanceToSquared(lp);
            intensity += 1.0 / (distSq + EPSILON);
          }
          const v = Math.min(intensity * 0.5, 1.0);
          const idx = (py * w + px) * 4;
          imgData.data[idx] = Math.floor(v * 255);
          imgData.data[idx + 1] = Math.floor(v * 140);
          imgData.data[idx + 2] = 0;
          imgData.data[idx + 3] = Math.floor(v * 180);
        }
      }
      ctx.putImageData(imgData, 0, 0);
      hm.texture.needsUpdate = true;
    }

    // Animation loop
    function animate() {
      animationRef.current = requestAnimationFrame(animate);
      const delta = Math.min(clockRef.current.getDelta(), 0.05);
      const elapsed = clockRef.current.getElapsedTime();
      frameCountRef.current++;

      if (frameCountRef.current % 5 === 0) updateHeatmap();

      if (!isPausedRef.current) {
        const lampPositions = getLampWorldPositions();
        const vehicleCfg = VEHICLE_CONFIG[behaviorType];

        nematodesRef.current.forEach((worm, wormIdx) => {
          const ud = worm.userData;
          const pos = worm.position;

          // Compute sensor positions in world space
          const headDir = new THREE.Vector3(Math.sin(ud.heading), 0, Math.cos(ud.heading));
          const leftAngle = ud.heading - SENSOR_OFFSET_ANGLE;
          const rightAngle = ud.heading + SENSOR_OFFSET_ANGLE;
          const sensorDist = SEG_SPACING * 0.8;
          const sLPos = new THREE.Vector3(pos.x + Math.sin(leftAngle) * sensorDist, pos.y, pos.z + Math.cos(leftAngle) * sensorDist);
          const sRPos = new THREE.Vector3(pos.x + Math.sin(rightAngle) * sensorDist, pos.y, pos.z + Math.cos(rightAngle) * sensorDist);

          // Sensor readings
          const sL = computeSensor(sLPos, lampPositions);
          const sR = computeSensor(sRPos, lampPositions);
          ud.sensorLeft = sL;
          ud.sensorRight = sR;

          // Wiring: determine which sensor drives which motor
          let inputL, inputR;
          if (vehicleCfg.cross) { inputL = sR; inputR = sL; } // contralateral
          else { inputL = sL; inputR = sR; } // ipsilateral

          // Motor output
          let mL, mR;
          if (vehicleCfg.inhibit) {
            mL = Math.max(0.05, BASE_SPEED - SENSOR_GAIN * inputL);
            mR = Math.max(0.05, BASE_SPEED - SENSOR_GAIN * inputR);
          } else {
            mL = BASE_SPEED + SENSOR_GAIN * inputL;
            mR = BASE_SPEED + SENSOR_GAIN * inputR;
          }
          ud.motorLeft = mL;
          ud.motorRight = mR;

          // Differential drive
          const forwardSpeed = (mL + mR) / 2;
          const angularVel = (mR - mL) / WHEEL_BASE;

          ud.heading += angularVel * delta;

          // Soft wall avoidance
          const wallForce = 8.0;
          const margin = WALL_MARGIN;
          if (pos.x > TANK_HALF_X - margin) ud.heading += wallForce * (pos.x - (TANK_HALF_X - margin)) * delta;
          if (pos.x < -TANK_HALF_X + margin) ud.heading -= wallForce * ((-TANK_HALF_X + margin) - pos.x) * delta;
          if (pos.z > TANK_HALF_Z - margin) ud.heading += wallForce * (pos.z - (TANK_HALF_Z - margin)) * delta;
          if (pos.z < -TANK_HALF_Z + margin) ud.heading -= wallForce * ((-TANK_HALF_Z + margin) - pos.z) * delta;

          // Update position
          const dx = Math.sin(ud.heading) * forwardSpeed * delta;
          const dz = Math.cos(ud.heading) * forwardSpeed * delta;
          pos.x = Math.max(-TANK_HALF_X + 0.05, Math.min(TANK_HALF_X - 0.05, pos.x + dx));
          pos.z = Math.max(-TANK_HALF_Z + 0.05, Math.min(TANK_HALF_Z - 0.05, pos.z + dz));

          // Gentle vertical bobbing
          pos.y = TANK_Y_MIN + 0.4 + Math.sin(elapsed * 0.8 + ud.phase) * 0.15;

          // Hard clamp
          pos.y = Math.max(TANK_Y_MIN, Math.min(TANK_Y_MAX, pos.y));

          // Set rotation
          worm.rotation.y = ud.heading;

          // Body flex: segments undulate + lateral offset proportional to angular velocity
          const lateralFlex = Math.min(Math.max(angularVel * 0.01, -0.02), 0.02);
          worm.children.forEach((seg, i) => {
            if (seg.userData.isSensor) return;
            seg.position.x = -i * SEG_SPACING;
            const wave = Math.sin(elapsed * 6 + ud.phase + i * 0.8) * 0.02;
            seg.position.y = wave;
            seg.position.z = Math.sin(elapsed * 5 + ud.phase + i * 0.6) * 0.015 + lateralFlex * i;
          });

          // Update sensor dot emissive intensity
          worm.children.forEach(child => {
            if (child.userData.isSensor === 'left') {
              child.material.emissiveIntensity = Math.min(sL * 0.8, 2.0);
            } else if (child.userData.isSensor === 'right') {
              child.material.emissiveIntensity = Math.min(sR * 0.8, 2.0);
            }
          });

          // Update focus data for HUD (first worm)
          if (wormIdx === 0 && focusDataRef) {
            focusDataRef.current = { sL: ud.sensorLeft, sR: ud.sensorRight, mL: ud.motorLeft, mR: ud.motorRight };
          }
        });
      }

      renderer.render(scene, camera);
    }
    animate();

    // Event handlers
    function handleResize() { const w = container.clientWidth, h = container.clientHeight; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); }
    window.addEventListener('resize', handleResize);
    function handleMouseDown(e) { isDraggingRef.current = true; lastMouseRef.current = { x: e.clientX, y: e.clientY }; }
    function handleMouseMove(e) {
      if (!isDraggingRef.current) return;
      orbitRef.current.theta -= (e.clientX - lastMouseRef.current.x) * 0.01;
      orbitRef.current.phi = Math.max(0.2, Math.min(Math.PI - 0.2, orbitRef.current.phi - (e.clientY - lastMouseRef.current.y) * 0.01));
      updateCameraPosition();
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    }
    function handleMouseUp() { isDraggingRef.current = false; }
    function handleWheel(e) { e.preventDefault(); orbitRef.current.radius = Math.max(6, Math.min(22, orbitRef.current.radius + e.deltaY * 0.01)); updateCameraPosition(); }
    function handleDblClick(e) {
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const bulbs = lampMeshesRef.current.map(l => l.bulb);
      const intersects = raycaster.intersectObjects(bulbs);
      if (intersects.length > 0) { const idx = intersects[0].object.userData.lampIndex; if (idx !== undefined) onLampToggle(idx); }
    }
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mouseleave', handleMouseUp);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });
    renderer.domElement.addEventListener('dblclick', handleDblClick);

    function updateCameraPosition() {
      if (!cameraRef.current) return;
      const { theta, phi, radius } = orbitRef.current;
      cameraRef.current.position.x = radius * Math.sin(phi) * Math.cos(theta);
      cameraRef.current.position.y = radius * Math.cos(phi);
      cameraRef.current.position.z = radius * Math.sin(phi) * Math.sin(theta);
      cameraRef.current.lookAt(0, 2.5, 0);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('mouseleave', handleMouseUp);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      renderer.domElement.removeEventListener('dblclick', handleDblClick);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [behaviorType]);

  useEffect(() => {
    lamps.forEach((lamp, idx) => {
      const meshData = lampMeshesRef.current[idx];
      if (!meshData) return;
      meshData.mat.color.setHex(lamp.isOn ? 0xffffcc : 0x444444);
      meshData.mat.emissive.setHex(lamp.isOn ? 0xffaa44 : 0x000000);
      meshData.mat.emissiveIntensity = lamp.isOn ? 1.0 : 0;
      const existingLight = lampLightsRef.current[idx];
      if (lamp.isOn && !existingLight) {
        const light = new THREE.PointLight(0xffdd88, 4, 12);
        light.position.y = 1.52; light.castShadow = true; meshData.group.add(light);
        lampLightsRef.current[idx] = light;
      } else if (!lamp.isOn && existingLight) {
        meshData.group.remove(existingLight); existingLight.dispose(); lampLightsRef.current[idx] = null;
      }
    });
  }, [lamps]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#080810' }} />;
}

/* ── VehicleTab ── */
function VehicleTab({ behaviorType, tabState, setTabState }) {
  const [isPaused, setIsPaused] = useState(tabState?.isPaused || false);
  const [lamps, setLamps] = useState(tabState?.lamps || [{ position: [-3.5, 0, -2], isOn: true }, { position: [3.5, 0, 2], isOn: true }]);
  const [key, setKey] = useState(0);
  const [focusData, setFocusData] = useState(null);
  const focusDataRef = useRef(null);

  useEffect(() => { setTabState({ isPaused, lamps }); }, [isPaused, lamps]);

  // Sync ref data to state at low frequency
  useEffect(() => {
    const interval = setInterval(() => {
      if (focusDataRef.current) setFocusData({ ...focusDataRef.current });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const handleReset = () => { setIsPaused(false); setLamps([{ position: [-3.5, 0, -2], isOn: true }, { position: [3.5, 0, 2], isOn: true }]); setKey(k => k + 1); focusDataRef.current = null; setFocusData(null); };
  const handleLampToggle = useCallback((i) => { setLamps(prev => prev.map((l, idx) => idx === i ? { ...l, isOn: !l.isOn } : l)); }, []);

  const cfg = VEHICLE_CONFIG[behaviorType];
  const colorHex = '#' + cfg.color.toString(16).padStart(6, '0');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 56, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderBottom: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', padding: '0 1.25rem', gap: '0.75rem' }}>
        <button onClick={() => setIsPaused(!isPaused)} style={isPaused ? styles.btnSuccess : styles.btnDanger}>
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button onClick={handleReset} style={styles.btnSecondary}>Reset</button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#666' }}>Lamps:</span>
            {lamps.map((l, i) => (
              <div key={i} onClick={() => handleLampToggle(i)} style={{
                width: 24, height: 24, borderRadius: '50%', cursor: 'pointer',
                background: l.isOn ? 'radial-gradient(circle, #ffdd88 0%, #ffaa44 100%)' : '#333',
                boxShadow: l.isOn ? '0 0 12px #ffaa44' : 'none', border: '2px solid #555', transition: 'all 0.3s'
              }} title={\`Lamp \${i + 1}: \${l.isOn ? 'ON' : 'OFF'}\`} />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '6px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: 20, border: \`1px solid \${colorHex}40\` }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: colorHex, boxShadow: \`0 0 8px \${colorHex}\` }} />
            <span style={{ color: colorHex, fontWeight: 600, fontSize: '0.85rem' }}>{cfg.label}</span>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <ThreeScene key={key} behaviorType={behaviorType} isPaused={isPaused} lamps={lamps} onLampToggle={handleLampToggle} focusDataRef={focusDataRef} />
        <WiringDiagram behaviorType={behaviorType} />
        <SensorHUD data={focusData} />
        <div style={{ position: 'absolute', bottom: 16, left: 16, padding: '8px 14px', background: 'rgba(0,0,0,0.7)', borderRadius: 8, fontSize: '0.75rem', color: '#888' }}>
          Drag to orbit | Scroll to zoom | Double-click lamp to toggle
        </div>
      </div>
    </div>
  );
}

/* ── AppShell ── */
function AppShell({ tabs, leftMenuButtons }) {
  const [activeTab, setActiveTab] = useState(0);
  const [tabStates, setTabStates] = useState({});
  return (
    <div style={{ display: 'flex', height: '100vh', paddingTop: 40, boxSizing: 'border-box', background: 'linear-gradient(180deg, #0a0a0f 0%, #0f0f1a 100%)', fontFamily: 'system-ui' }}>
      <div style={{ width: 44, background: 'rgba(15, 15, 26, 0.8)', borderRight: '1px solid rgba(99, 102, 241, 0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 12 }}>
        {leftMenuButtons.map(btn => (
          <button key={btn.id} onClick={btn.onClick} title={btn.title}
            style={{ width: 32, height: 32, background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: 8, color: '#a5b4fc', cursor: 'pointer', marginBottom: 8, fontSize: '14px' }}>
            {btn.icon}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', background: 'rgba(15, 15, 26, 0.8)', borderBottom: '1px solid rgba(99, 102, 241, 0.1)', padding: '0 0.5rem', overflowX: 'auto' }}>
          {tabs.map((tab, i) => (
            <button key={tab.id} onClick={() => setActiveTab(i)}
              style={{ padding: '14px 16px', background: 'transparent', color: activeTab === i ? '#fff' : '#666', border: 'none',
                borderBottom: activeTab === i ? '2px solid #6366f1' : '2px solid transparent', cursor: 'pointer', fontWeight: activeTab === i ? 600 : 400, transition: 'all 0.2s', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>{tabs[activeTab].render(tabStates[tabs[activeTab].id], (s) => setTabStates(prev => ({ ...prev, [tabs[activeTab].id]: s })))}</div>
      </div>
    </div>
  );
}

/* ── InfoModal ── */
function InfoModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => e.key === 'Escape' && onClose();
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);
  if (!isOpen) return null;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: 16, border: '1px solid rgba(99, 102, 241, 0.3)', maxWidth: 550, width: '100%', maxHeight: '85vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#fff' }}>Braitenberg Vehicles 3D Lab</h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>x</button>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <p style={{ color: '#a5b4fc', marginTop: 0, marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Valentino Braitenberg (1984) demonstrated that simple sensor-motor wiring creates creatures that appear to have complex personalities. This simulation lets you observe four wiring configurations and how they produce fear, aggression, love, and exploration from nothing but simple circuits.
          </p>
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Controls</h3>
            <div style={{ display: 'grid', gap: '0.5rem', color: '#ccc', fontSize: '0.9rem' }}>
              <div><strong>Drag</strong> - Orbit camera</div>
              <div><strong>Scroll</strong> - Zoom in/out</div>
              <div><strong>Double-click lamp</strong> - Toggle light on/off</div>
              <div><strong>Lamp buttons</strong> - Toggle from toolbar</div>
            </div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '1rem' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vehicle Types</h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {[
                { color: '#ff7777', label: '2a: Fear', desc: 'Same-side excitatory -- flees light' },
                { color: '#77ff77', label: '2b: Aggression', desc: 'Crossed excitatory -- charges at light' },
                { color: '#77ddff', label: '3a: Love', desc: 'Crossed inhibitory -- approaches gently' },
                { color: '#ffcc77', label: '3b: Explorer', desc: 'Same-side inhibitory -- avoids, explores dark' },
              ].map(v => (
                <div key={v.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: v.color, boxShadow: '0 0 8px ' + v.color, flexShrink: 0 }} />
                  <div><strong style={{ color: v.color }}>{v.label}</strong><span style={{ color: '#888' }}> -- {v.desc}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── App ── */
export default function App() {
  const [showMobile, setShowMobile] = useState(false);
  const [bypass, setBypass] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  useEffect(() => { setShowMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768); }, []);
  if (showMobile && !bypass) return <MobileWarning onContinue={() => setBypass(true)} />;
  const tabs = [
    { id: 'desc', label: 'Lab Description', render: () => <LabDescription /> },
    { id: 'fear', label: '2a: Fear', render: (s, set) => <VehicleTab behaviorType="fear" tabState={s} setTabState={set} /> },
    { id: 'aggression', label: '2b: Aggression', render: (s, set) => <VehicleTab behaviorType="aggression" tabState={s} setTabState={set} /> },
    { id: 'love', label: '3a: Love', render: (s, set) => <VehicleTab behaviorType="love" tabState={s} setTabState={set} /> },
    { id: 'explorer', label: '3b: Explorer', render: (s, set) => <VehicleTab behaviorType="explorer" tabState={s} setTabState={set} /> },
  ];
  const leftMenuButtons = [
    { id: 'info', icon: 'i', title: 'About', onClick: () => setShowInfo(true) },
    { id: 'reset', icon: 'R', title: 'Reset', onClick: () => window.confirm('Reset the simulation?') && window.location.reload() },
  ];
  return (
    <>
      <AppShell tabs={tabs} leftMenuButtons={leftMenuButtons} />
      <InfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} />
    </>
  );
}`,
  },
  {
    id: 'client-experiment',
    name: 'Experiment Lab',
    description: 'A/B testing simulation with statistical analysis',
    category: 'statistics',
    tags: ['statistics', 'a/b testing', 'experiment', 'client'],
    dependencies: ['react', 'react-dom'],
    sourceCode: `import React, { useState, useEffect } from 'react';

function MobileWarning({ onContinue }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '2rem', textAlign: 'center', color: 'white', fontFamily: 'system-ui' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🖥️</div>
      <h2>Desktop Recommended</h2>
      <p style={{ color: '#888', marginBottom: '2rem' }}>This simulation is optimized for desktop.</p>
      <button onClick={onContinue} style={{ padding: '12px 24px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Continue Anyway</button>
    </div>
  );
}

function normalCDF(x) {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1; x = Math.abs(x) / Math.sqrt(2);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1.0 + sign * y);
}

function SetupTab({ tabState, setTabState }) {
  const [controlRate, setControlRate] = useState(tabState?.controlRate || 0.10);
  const [treatmentRate, setTreatmentRate] = useState(tabState?.treatmentRate || 0.12);
  const [sampleSize, setSampleSize] = useState(tabState?.sampleSize || 1000);
  useEffect(() => { setTabState({ controlRate, treatmentRate, sampleSize }); }, [controlRate, treatmentRate, sampleSize]);
  return (
    <div style={{ padding: '2rem', color: 'white', maxWidth: 600 }}>
      <h2 style={{ color: '#22c55e', marginBottom: '1.5rem' }}>Experiment Setup</h2>
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Control Rate: {(controlRate * 100).toFixed(1)}%</label>
        <input type="range" min="0.01" max="0.30" step="0.01" value={controlRate} onChange={(e) => setControlRate(Number(e.target.value))} style={{ width: '100%' }} />
      </div>
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Treatment Rate: {(treatmentRate * 100).toFixed(1)}%</label>
        <input type="range" min="0.01" max="0.30" step="0.01" value={treatmentRate} onChange={(e) => setTreatmentRate(Number(e.target.value))} style={{ width: '100%' }} />
      </div>
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>Sample Size: {sampleSize.toLocaleString()}</label>
        <input type="range" min="100" max="10000" step="100" value={sampleSize} onChange={(e) => setSampleSize(Number(e.target.value))} style={{ width: '100%' }} />
      </div>
      <div style={{ background: '#1a1a2e', padding: '1rem', borderRadius: 8 }}>
        <h3 style={{ color: '#a5b4fc' }}>Expected Lift</h3>
        <p style={{ fontSize: '2rem', color: treatmentRate > controlRate ? '#22c55e' : '#ef4444' }}>{(((treatmentRate - controlRate) / controlRate) * 100).toFixed(1)}%</p>
      </div>
    </div>
  );
}

function RunTab({ tabState, setTabState }) {
  const config = { controlRate: tabState?.controlRate ?? 0.10, treatmentRate: tabState?.treatmentRate ?? 0.12, sampleSize: tabState?.sampleSize ?? 1000 };
  const [results, setResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const runExperiment = () => {
    setIsRunning(true); setResults(null); setProgress(0);
    let controlSuccess = 0, treatmentSuccess = 0; const iterations = 20; let current = 0;
    const interval = setInterval(() => {
      current++; const samplesPerIteration = config.sampleSize / iterations;
      for (let i = 0; i < samplesPerIteration; i++) { if (Math.random() < config.controlRate) controlSuccess++; if (Math.random() < config.treatmentRate) treatmentSuccess++; }
      const n = current * samplesPerIteration;
      const cRate = controlSuccess / n, tRate = treatmentSuccess / n;
      const cSE = Math.sqrt((cRate * (1 - cRate)) / n), tSE = Math.sqrt((tRate * (1 - tRate)) / n);
      const pooled = (controlSuccess + treatmentSuccess) / (2 * n);
      const pooledSE = Math.sqrt(2 * pooled * (1 - pooled) / n);
      const z = pooledSE > 0 ? (tRate - cRate) / pooledSE : 0;
      const pValue = 2 * (1 - normalCDF(Math.abs(z)));
      setProgress(current / iterations);
      const newResults = { controlRate: cRate, treatmentRate: tRate, controlCI: [cRate - 1.96 * cSE, cRate + 1.96 * cSE], treatmentCI: [tRate - 1.96 * tSE, tRate + 1.96 * tSE], lift: ((tRate - cRate) / cRate) * 100, pValue, significant: pValue < 0.05, n };
      setResults(newResults); setTabState({ results: newResults });
      if (current >= iterations) { clearInterval(interval); setIsRunning(false); }
    }, 150);
  };
  return (
    <div style={{ padding: '2rem', color: 'white' }}>
      <h2 style={{ color: '#22c55e', marginBottom: '1rem' }}>Run Experiment</h2>
      <button onClick={runExperiment} disabled={isRunning} style={{ padding: '12px 24px', background: isRunning ? '#666' : '#22c55e', color: 'white', border: 'none', borderRadius: 8, cursor: isRunning ? 'not-allowed' : 'pointer', marginBottom: '1rem' }}>{isRunning ? \`Running... \${Math.round(progress * 100)}%\` : 'Start Experiment'}</button>
      {results && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ background: '#1a1a2e', padding: '1.5rem', borderRadius: 8, textAlign: 'center' }}><p style={{ color: '#888' }}>Control</p><p style={{ fontSize: '2rem', color: '#60a5fa' }}>{(results.controlRate * 100).toFixed(2)}%</p></div>
          <div style={{ background: '#1a1a2e', padding: '1.5rem', borderRadius: 8, textAlign: 'center' }}><p style={{ color: '#888' }}>Treatment</p><p style={{ fontSize: '2rem', color: '#22c55e' }}>{(results.treatmentRate * 100).toFixed(2)}%</p></div>
        </div>
      )}
    </div>
  );
}

function ResultsTab({ tabState }) {
  const results = tabState?.results;
  if (!results) return <div style={{ padding: '2rem', color: '#888', textAlign: 'center' }}>Run an experiment first.</div>;
  return (
    <div style={{ padding: '2rem', color: 'white' }}>
      <h2 style={{ color: '#22c55e', marginBottom: '1rem' }}>Results</h2>
      <div style={{ padding: '1.5rem', borderRadius: 8, marginBottom: '1rem', background: results.significant ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)', border: \`1px solid \${results.significant ? '#22c55e' : '#eab308'}\` }}>
        <h3 style={{ color: results.significant ? '#22c55e' : '#eab308' }}>{results.significant ? '✓ Statistically Significant!' : '⚠ Not Significant'}</h3>
        <p style={{ color: '#888' }}>p-value: {results.pValue.toFixed(4)}</p>
      </div>
      <div style={{ background: '#1a1a2e', padding: '1.5rem', borderRadius: 8 }}>
        <h3>Relative Lift</h3>
        <p style={{ fontSize: '3rem', color: results.lift > 0 ? '#22c55e' : '#ef4444' }}>{results.lift > 0 ? '+' : ''}{results.lift.toFixed(2)}%</p>
        <p style={{ color: '#888' }}>Based on {results.n.toLocaleString()} samples per group</p>
      </div>
    </div>
  );
}

function AppShell({ tabs, leftMenuButtons }) {
  const [activeTab, setActiveTab] = useState(0);
  const [tabStates, setTabStates] = useState({});
  return (
    <div style={{ display: 'flex', height: '100vh', paddingTop: 40, boxSizing: 'border-box', background: '#0a0a0f', fontFamily: 'system-ui' }}>
      <div style={{ width: 30, background: '#0f0f1a', borderRight: '1px solid #222', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8 }}>
        {leftMenuButtons.map(btn => <button key={btn.id} onClick={btn.onClick} title={btn.title} style={{ width: 24, height: 24, background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', marginBottom: 8 }}>{btn.icon}</button>)}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', background: '#0f0f1a', borderBottom: '1px solid #222' }}>
          {tabs.map((tab, i) => <button key={tab.id} onClick={() => setActiveTab(i)} style={{ padding: '12px 20px', background: activeTab === i ? '#1a1a2e' : 'transparent', color: activeTab === i ? '#fff' : '#666', border: 'none', borderBottom: activeTab === i ? '2px solid #22c55e' : '2px solid transparent', cursor: 'pointer' }}>{tab.label}</button>)}
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>{tabs[activeTab].render(tabStates, (s) => setTabStates(prev => ({ ...prev, [tabs[activeTab].id]: { ...prev[tabs[activeTab].id], ...s } })))}</div>
      </div>
    </div>
  );
}

function InfoModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => e.key === 'Escape' && onClose();
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: 16, border: '1px solid rgba(34, 197, 94, 0.3)', maxWidth: 500, width: '100%', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(34, 197, 94, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🧪</span> Experiment Lab
          </h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <p style={{ color: '#86efac', marginTop: 0, marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Simulate A/B tests and understand statistical significance. Configure experiment parameters and watch results accumulate in real-time.
          </p>

          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>How to Use</h3>
            <div style={{ display: 'grid', gap: '0.5rem', color: '#ccc', fontSize: '0.9rem' }}>
              <div>1️⃣ <strong>Setup</strong> - Set control/treatment conversion rates and sample size</div>
              <div>2️⃣ <strong>Run</strong> - Click "Start Experiment" to simulate data collection</div>
              <div>3️⃣ <strong>Results</strong> - View statistical analysis and significance</div>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '1rem' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Key Metrics</h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#60a5fa', boxShadow: '0 0 8px #60a5fa' }} />
                <div><strong style={{ color: '#93c5fd' }}>Control Rate</strong><span style={{ color: '#888' }}> - Baseline conversion rate</span></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
                <div><strong style={{ color: '#4ade80' }}>Treatment Rate</strong><span style={{ color: '#888' }}> - Variant conversion rate</span></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 8px #f59e0b' }} />
                <div><strong style={{ color: '#fbbf24' }}>P-Value</strong><span style={{ color: '#888' }}> - Statistical significance (p &lt; 0.05)</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [showMobile, setShowMobile] = useState(false);
  const [bypass, setBypass] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  useEffect(() => { setShowMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768); }, []);
  if (showMobile && !bypass) return <MobileWarning onContinue={() => setBypass(true)} />;
  const tabs = [
    { id: 'setup', label: 'Setup', render: (states, setState) => <SetupTab tabState={states?.setup} setTabState={setState} /> },
    { id: 'run', label: 'Run Experiment', render: (states, setState) => <RunTab tabState={states?.setup} setTabState={setState} /> },
    { id: 'results', label: 'Results', render: (states) => <ResultsTab tabState={states?.run} /> },
  ];
  const leftMenuButtons = [
    { id: 'info', icon: 'ℹ', title: 'Info', onClick: () => setShowInfo(true) },
    { id: 'reset', icon: '↺', title: 'Reset', onClick: () => window.confirm('Reset?') && window.location.reload() },
  ];
  return (
    <>
      <AppShell tabs={tabs} leftMenuButtons={leftMenuButtons} />
      <InfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} />
    </>
  );
}`,
  },
];

async function seedPlaygrounds() {
  const forceUpdate = process.argv.includes('--force');

  try {
    console.log('Starting playground template seeding...');
    if (forceUpdate) console.log('   --force flag detected: will update existing templates');

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const template of PLAYGROUND_TEMPLATES) {
      const existing = await prisma.playgrounds.findUnique({
        where: { id: template.id },
        select: { id: true },
      });

      if (existing && !forceUpdate) {
        console.log(`   Skipping "${template.name}" (already exists)`);
        skipped++;
        continue;
      }

      await prisma.playgrounds.upsert({
        where: { id: template.id },
        update: {
          title: template.name,
          description: template.description || '',
          category: template.category,
          source_code: template.sourceCode,
          requirements: template.dependencies || [],
        },
        create: {
          id: template.id,
          title: template.name,
          description: template.description || '',
          category: template.category,
          source_code: template.sourceCode,
          requirements: template.dependencies || [],
          is_public: true,
          is_featured: true,
          is_protected: true,
          app_type: 'sandpack',
        },
      });

      if (existing) {
        console.log(`   Updated "${template.name}"`);
        updated++;
      } else {
        console.log(`   Created "${template.name}"`);
        created++;
      }
    }

    console.log(`\nPlayground template seeding complete!`);
    console.log(`   - Created: ${created} new templates`);
    console.log(`   - Updated: ${updated} existing templates`);
    console.log(`   - Skipped: ${skipped} existing templates`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding playground templates:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seedPlaygrounds();
