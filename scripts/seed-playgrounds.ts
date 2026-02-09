/**
 * Playground Template Seeding Script
 *
 * Runs during deployment to ensure featured playground templates exist in the database.
 * This script can be executed via: npm run seed:playgrounds
 *
 * Uses upsert to:
 * - Create new templates if they don't exist
 * - Update existing templates if definitions change
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
    description: 'Interactive 3D simulation with fish tank, draggable lamps, and nematodes',
    category: 'simulations',
    tags: ['3d', 'three.js', 'braitenberg', 'simulation', 'client'],
    dependencies: ['react', 'react-dom', 'three'],
    sourceCode: `import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';

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
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🖥️</div>
      <h2 style={{ marginBottom: '0.5rem' }}>Desktop Recommended</h2>
      <p style={{ color: '#888', marginBottom: '2rem', maxWidth: 300 }}>This 3D simulation requires mouse controls for the best experience.</p>
      <button onClick={onContinue} style={styles.btn}>Continue Anyway</button>
    </div>
  );
}

function LabDescription() {
  return (
    <div style={{ padding: '2rem', color: 'white', maxWidth: 900, margin: '0 auto', fontFamily: 'system-ui' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', background: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>Braitenberg Vehicles 3D Lab</h1>
        <p style={{ color: '#888', fontSize: '1.1rem' }}>Explore emergent behavior from simple sensor-motor connections</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { icon: '🐛', title: 'Nematodes', desc: 'Simple creatures that swim in the tank with two different behavior patterns' },
          { icon: '💡', title: 'Light Sources', desc: 'Double-click lamps to toggle them and observe how creatures respond' },
          { icon: '🎥', title: 'Camera Control', desc: 'Click and drag to orbit around the scene, scroll to zoom in/out' },
        ].map(item => (
          <div key={item.title} style={styles.card}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>{item.icon}</div>
            <h3 style={{ color: '#a5b4fc', marginBottom: '0.5rem', fontSize: '1.1rem' }}>{item.title}</h3>
            <p style={{ color: '#888', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
          </div>
        ))}
      </div>

      <div style={{ ...styles.card, background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)' }}>
        <h3 style={{ color: '#a5b4fc', marginBottom: '1rem', fontSize: '1rem' }}>Vehicle Behaviors</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(255, 153, 153, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '1.2rem' }}>🔴</span>
            </div>
            <div>
              <div style={{ color: '#ff9999', fontWeight: 600, marginBottom: '0.25rem' }}>Vehicle 1: Sinusoidal</div>
              <div style={{ color: '#888', fontSize: '0.85rem' }}>Smooth, wave-like movement patterns</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(153, 255, 153, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '1.2rem' }}>🟢</span>
            </div>
            <div>
              <div style={{ color: '#99ff99', fontWeight: 600, marginBottom: '0.25rem' }}>Vehicle 2: Erratic</div>
              <div style={{ color: '#888', fontSize: '0.85rem' }}>Random, unpredictable movements</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '1rem', color: '#666', fontSize: '0.9rem' }}>
        👆 Select <strong style={{ color: '#a5b4fc' }}>Vehicle 1</strong> or <strong style={{ color: '#a5b4fc' }}>Vehicle 2</strong> tabs to start the simulation
      </div>
    </div>
  );
}

function ThreeScene({ behaviorType, isPaused, lamps, onLampToggle }) {
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

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080810);
    scene.fog = new THREE.Fog(0x080810, 15, 35);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    cameraRef.current = camera;
    updateCameraPosition();

    // Renderer with better quality
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0x404060, 0.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.6);
    mainLight.position.set(8, 12, 8);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    scene.add(mainLight);

    // Subtle blue rim light
    const rimLight = new THREE.DirectionalLight(0x6366f1, 0.3);
    rimLight.position.set(-5, 5, -5);
    scene.add(rimLight);

    // Room floor with gradient effect
    const floorGeo = new THREE.PlaneGeometry(25, 25);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x12121a, roughness: 0.9, metalness: 0.1 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Enhanced table with wood grain effect
    const tableGeo = new THREE.BoxGeometry(7, 0.35, 4.5);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x5a4030, roughness: 0.7, metalness: 0.05 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(0, 1.5, 0);
    table.castShadow = true;
    table.receiveShadow = true;
    scene.add(table);

    // Table legs
    const legGeo = new THREE.CylinderGeometry(0.08, 0.1, 1.5, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x3a2a20, roughness: 0.8 });
    [[-3, 0.75, -2], [3, 0.75, -2], [-3, 0.75, 2], [3, 0.75, 2]].forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      scene.add(leg);
    });

    // Enhanced fish tank
    const tankGroup = new THREE.Group();
    tankGroup.position.set(0, 2.45, 0);

    // Tank glass with better transparency
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xaaddff, transparent: true, opacity: 0.25,
      roughness: 0.05, metalness: 0, transmission: 0.9,
      thickness: 0.1, envMapIntensity: 1
    });
    [[0, 0.8, 1.8, 5.5, 1.6, 0.06], [0, 0.8, -1.8, 5.5, 1.6, 0.06], [2.7, 0.8, 0, 0.06, 1.6, 3.6], [-2.7, 0.8, 0, 0.06, 1.6, 3.6]].forEach(([x, y, z, w, h, d]) => {
      const wallGeo = new THREE.BoxGeometry(w, h, d);
      const wall = new THREE.Mesh(wallGeo, glassMat);
      wall.position.set(x, y, z);
      tankGroup.add(wall);
    });

    // Water with animated caustics effect
    const waterGeo = new THREE.BoxGeometry(5.3, 1.2, 3.5);
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a5a8a, transparent: true, opacity: 0.5,
      roughness: 0.1, metalness: 0.1, transmission: 0.6
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.set(0, 0.55, 0);
    tankGroup.add(water);

    // Tank bottom with sand texture
    const bottomGeo = new THREE.BoxGeometry(5.5, 0.15, 3.6);
    const bottomMat = new THREE.MeshStandardMaterial({ color: 0x3a6a5a, roughness: 0.9 });
    const bottom = new THREE.Mesh(bottomGeo, bottomMat);
    tankGroup.add(bottom);

    // Add some decorative pebbles
    const pebbleGeo = new THREE.SphereGeometry(0.08, 8, 6);
    const pebbleMat = new THREE.MeshStandardMaterial({ color: 0x556655, roughness: 0.8 });
    for (let i = 0; i < 15; i++) {
      const pebble = new THREE.Mesh(pebbleGeo, pebbleMat);
      pebble.position.set((Math.random() - 0.5) * 4.5, 0.1, (Math.random() - 0.5) * 3);
      pebble.scale.set(0.8 + Math.random() * 0.5, 0.6 + Math.random() * 0.3, 0.8 + Math.random() * 0.5);
      tankGroup.add(pebble);
    }

    scene.add(tankGroup);

    // Worm-like nematodes - thin and long
    const nematodeColor = behaviorType === 1 ? 0xff7777 : 0x77ff77;
    const nematodeMat = new THREE.MeshStandardMaterial({
      color: nematodeColor, roughness: 0.5, metalness: 0.05,
      emissive: nematodeColor, emissiveIntensity: 0.2
    });

    for (let i = 0; i < 10; i++) {
      // Create segmented worm body using multiple small spheres
      const wormGroup = new THREE.Group();
      const numSegments = 8;
      const segmentRadius = 0.025;
      const segmentSpacing = 0.045;

      for (let s = 0; s < numSegments; s++) {
        const segGeo = new THREE.SphereGeometry(segmentRadius * (1 - s * 0.05), 8, 6);
        const segment = new THREE.Mesh(segGeo, nematodeMat.clone());
        segment.position.x = s * segmentSpacing;
        segment.castShadow = true;
        wormGroup.add(segment);
      }

      wormGroup.position.set((Math.random() - 0.5) * 4.5, 2.45 + 0.35 + Math.random() * 0.9, (Math.random() - 0.5) * 3);
      const vx = (Math.random() - 0.5) * 0.025;
      const vz = (Math.random() - 0.5) * 0.025;
      wormGroup.userData.velocity = new THREE.Vector3(vx, (Math.random() - 0.5) * 0.008, vz);
      wormGroup.userData.phase = Math.random() * Math.PI * 2;
      wormGroup.rotation.y = Math.atan2(vx, vz);
      scene.add(wormGroup);
      nematodesRef.current.push(wormGroup);
    }

    // Larger, more visible lamps
    lamps.forEach((lamp, idx) => {
      const lampGroup = new THREE.Group();
      lampGroup.position.set(lamp.position[0], lamp.position[1], lamp.position[2]);

      // Larger lamp base
      const baseGeo = new THREE.CylinderGeometry(0.5, 0.55, 0.15, 20);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.3, metalness: 0.7 });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.075;
      base.castShadow = true;
      lampGroup.add(base);

      // Thicker lamp pole
      const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.3, 12);
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.4, metalness: 0.6 });
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 0.8;
      pole.castShadow = true;
      lampGroup.add(pole);

      // Larger lamp shade
      const shadeGeo = new THREE.ConeGeometry(0.4, 0.22, 16, 1, true);
      const shadeMat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.5, metalness: 0.5, side: THREE.DoubleSide });
      const shade = new THREE.Mesh(shadeGeo, shadeMat);
      shade.position.y = 1.4;
      shade.rotation.x = Math.PI;
      lampGroup.add(shade);

      // Much larger bulb for visibility
      const bulbGeo = new THREE.SphereGeometry(0.22, 20, 20);
      const bulbMat = new THREE.MeshStandardMaterial({
        color: lamp.isOn ? 0xffffcc : 0x444444,
        emissive: lamp.isOn ? 0xffaa44 : 0x000000,
        emissiveIntensity: lamp.isOn ? 1.0 : 0,
        roughness: 0.15
      });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.y = 1.52;
      bulb.userData.lampIndex = idx;
      lampGroup.add(bulb);

      // Stronger light source
      if (lamp.isOn) {
        const light = new THREE.PointLight(0xffdd88, 4, 12);
        light.position.y = 1.52;
        light.castShadow = true;
        lampGroup.add(light);
        lampLightsRef.current[idx] = light;
      }

      scene.add(lampGroup);
      lampMeshesRef.current[idx] = { group: lampGroup, bulb, mat: bulbMat };
    });

    // Animation loop
    function animate() {
      animationRef.current = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      const elapsed = clockRef.current.getElapsedTime();

      if (!isPaused) {
        nematodesRef.current.forEach(worm => {
          const pos = worm.position;
          const vel = worm.userData.velocity;
          const phase = worm.userData.phase || 0;

          // Different movement behaviors
          if (behaviorType === 1) {
            // Vehicle 1: Smooth sinusoidal - coordinated, wave-like swimming
            vel.x += Math.sin(elapsed * 2 + pos.z + phase) * 0.0015;
            vel.z += Math.cos(elapsed * 1.5 + pos.x + phase) * 0.0015;
          } else {
            // Vehicle 2: Erratic - sudden direction changes, unpredictable
            if (Math.random() < 0.05) {
              vel.x += (Math.random() - 0.5) * 0.008;
              vel.z += (Math.random() - 0.5) * 0.008;
            }
            vel.x += (Math.random() - 0.5) * 0.002;
            vel.z += (Math.random() - 0.5) * 0.002;
          }
          vel.clampLength(0, 0.04);

          pos.x += vel.x * delta * 60;
          pos.y += vel.y * delta * 60;
          pos.z += vel.z * delta * 60;

          // Tank bounds
          if (pos.x > 2.3) { pos.x = 2.3; vel.x *= -1; }
          if (pos.x < -2.3) { pos.x = -2.3; vel.x *= -1; }
          if (pos.z > 1.5) { pos.z = 1.5; vel.z *= -1; }
          if (pos.z < -1.5) { pos.z = -1.5; vel.z *= -1; }
          if (pos.y > 3.7) { pos.y = 3.7; vel.y *= -1; }
          if (pos.y < 2.65) { pos.y = 2.65; vel.y *= -1; }

          // Face movement direction
          worm.rotation.y = Math.atan2(vel.x, vel.z);

          // Wriggling animation - segments undulate
          const segments = worm.children;
          segments.forEach((seg, i) => {
            const wave = Math.sin(elapsed * 6 + phase + i * 0.8) * 0.015;
            seg.position.y = wave;
            seg.position.z = Math.sin(elapsed * 5 + phase + i * 0.6) * 0.01;
          });
        });
      }

      renderer.render(scene, camera);
    }
    animate();

    // Event handlers
    function handleResize() {
      const w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
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
      if (intersects.length > 0) {
        const idx = intersects[0].object.userData.lampIndex;
        if (idx !== undefined) onLampToggle(idx);
      }
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
      cameraRef.current.lookAt(0, 2.2, 0);
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
        light.position.y = 1.52;
        light.castShadow = true;
        meshData.group.add(light);
        lampLightsRef.current[idx] = light;
      } else if (!lamp.isOn && existingLight) {
        meshData.group.remove(existingLight);
        existingLight.dispose();
        lampLightsRef.current[idx] = null;
      }
    });
  }, [lamps]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#080810' }} />;
}

function VehicleTab({ behaviorType, tabState, setTabState }) {
  const [isPaused, setIsPaused] = useState(tabState?.isPaused || false);
  const [lamps, setLamps] = useState(tabState?.lamps || [{ position: [-3.5, 0, -2], isOn: false }, { position: [3.5, 0, 2], isOn: true }]);
  const [key, setKey] = useState(0);

  useEffect(() => { setTabState({ isPaused, lamps }); }, [isPaused, lamps]);

  const handleReset = () => { setIsPaused(false); setLamps([{ position: [-3.5, 0, -2], isOn: false }, { position: [3.5, 0, 2], isOn: true }]); setKey(k => k + 1); };
  const handleLampToggle = useCallback((i) => { setLamps(prev => prev.map((l, idx) => idx === i ? { ...l, isOn: !l.isOn } : l)); }, []);

  const color = behaviorType === 1 ? '#ff7777' : '#77ff77';
  const behaviorName = behaviorType === 1 ? 'Sinusoidal' : 'Erratic';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 56, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderBottom: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', padding: '0 1.25rem', gap: '0.75rem' }}>
        <button onClick={() => setIsPaused(!isPaused)} style={isPaused ? styles.btnSuccess : styles.btnDanger}>
          {isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button onClick={handleReset} style={styles.btnSecondary}>↺ Reset</button>

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '6px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: 20, border: \`1px solid \${color}40\` }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: \`0 0 8px \${color}\` }} />
            <span style={{ color, fontWeight: 600, fontSize: '0.85rem' }}>Vehicle {behaviorType}: {behaviorName}</span>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <ThreeScene key={key} behaviorType={behaviorType} isPaused={isPaused} lamps={lamps} onLampToggle={handleLampToggle} />
        <div style={{ position: 'absolute', bottom: 16, left: 16, padding: '8px 14px', background: 'rgba(0,0,0,0.7)', borderRadius: 8, fontSize: '0.75rem', color: '#888' }}>
          🖱️ Drag to orbit • Scroll to zoom • Double-click lamp to toggle
        </div>
      </div>
    </div>
  );
}

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
        <div style={{ display: 'flex', background: 'rgba(15, 15, 26, 0.8)', borderBottom: '1px solid rgba(99, 102, 241, 0.1)', padding: '0 1rem' }}>
          {tabs.map((tab, i) => (
            <button key={tab.id} onClick={() => setActiveTab(i)}
              style={{ padding: '14px 24px', background: 'transparent', color: activeTab === i ? '#fff' : '#666', border: 'none',
                borderBottom: activeTab === i ? '2px solid #6366f1' : '2px solid transparent', cursor: 'pointer', fontWeight: activeTab === i ? 600 : 400, transition: 'all 0.2s' }}>
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>{tabs[activeTab].render(tabStates[tabs[activeTab].id], (s) => setTabStates(prev => ({ ...prev, [tabs[activeTab].id]: s })))}</div>
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
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: 16, border: '1px solid rgba(99, 102, 241, 0.3)', maxWidth: 500, width: '100%', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🧬</span> Braitenberg Vehicles 3D Lab
          </h2>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <p style={{ color: '#a5b4fc', marginTop: 0, marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Explore emergent behavior from simple sensor-motor connections. Watch how different wiring patterns produce distinct movement behaviors.
          </p>

          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Controls</h3>
            <div style={{ display: 'grid', gap: '0.5rem', color: '#ccc', fontSize: '0.9rem' }}>
              <div>🖱️ <strong>Drag</strong> - Orbit camera around the scene</div>
              <div>🔍 <strong>Scroll</strong> - Zoom in/out</div>
              <div>💡 <strong>Double-click lamp</strong> - Toggle light on/off</div>
              <div>⏸️ <strong>Pause/Resume</strong> - Control simulation</div>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '1rem' }}>
            <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vehicle Types</h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff7777', boxShadow: '0 0 8px #ff7777' }} />
                <div><strong style={{ color: '#ff9999' }}>Vehicle 1</strong><span style={{ color: '#888' }}> - Sinusoidal, smooth wave-like swimming</span></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#77ff77', boxShadow: '0 0 8px #77ff77' }} />
                <div><strong style={{ color: '#99ff99' }}>Vehicle 2</strong><span style={{ color: '#888' }}> - Erratic, unpredictable movements</span></div>
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
    { id: 'desc', label: 'Lab Description', render: () => <LabDescription /> },
    { id: 'v1', label: 'Vehicle 1', render: (s, set) => <VehicleTab behaviorType={1} tabState={s} setTabState={set} /> },
    { id: 'v2', label: 'Vehicle 2', render: (s, set) => <VehicleTab behaviorType={2} tabState={s} setTabState={set} /> },
  ];
  const leftMenuButtons = [
    { id: 'info', icon: 'ℹ️', title: 'About', onClick: () => setShowInfo(true) },
    { id: 'reset', icon: '↺', title: 'Reset', onClick: () => window.confirm('Reset the simulation?') && window.location.reload() },
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
  try {
    console.log('🌱 Starting playground template seeding...');

    let created = 0;
    let skipped = 0;

    for (const template of PLAYGROUND_TEMPLATES) {
      // Check if template already exists - if so, skip (don't overwrite user edits)
      const existing = await prisma.playgrounds.findUnique({
        where: { id: template.id },
        select: { id: true },
      });

      if (existing) {
        console.log(`   ⏭️  Skipping "${template.name}" (already exists)`);
        skipped++;
        continue;
      }

      // Create new template
      await prisma.playgrounds.create({
        data: {
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
          // Note: created_by is nullable for system-seeded templates
        },
      });
      console.log(`   ✅ Created "${template.name}"`);
      created++;
    }

    console.log(`\n✅ Playground template seeding complete!`);
    console.log(`   - Created: ${created} new templates`);
    console.log(`   - Skipped: ${skipped} existing templates`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding playground templates:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seedPlaygrounds();
