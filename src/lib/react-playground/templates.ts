/**
 * Playground Templates
 *
 * Pre-built templates for faculty to use as starting points.
 * Includes basic React, THREE.js, and the Braitenberg vehicles simulation.
 */

import type { PlaygroundTemplate, PlaygroundCategory } from '@/types/react-playground';

// Basic React Counter
export const BASIC_COUNTER_TEMPLATE: PlaygroundTemplate = {
  id: 'basic-counter',
  name: 'Interactive Counter',
  description: 'A simple React counter demonstrating useState and event handling',
  category: 'tutorials',
  tags: ['beginner', 'hooks', 'state'],
  dependencies: [],
  isPublic: true,
  sourceCode: `import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
    }}>
      <h1 style={{ fontSize: '4rem', margin: 0 }}>{count}</h1>
      <p style={{ marginBottom: '2rem', opacity: 0.8 }}>Click the buttons to change the count</p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => setCount(c => c - 1)}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.5rem',
            border: 'none',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          -
        </button>
        <button
          onClick={() => setCount(0)}
          style={{
            padding: '1rem 2rem',
            fontSize: '1rem',
            border: 'none',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
        <button
          onClick={() => setCount(c => c + 1)}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.5rem',
            border: 'none',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.2)',
            color: 'white',
            cursor: 'pointer',
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}
`,
};

// THREE.js Spinning Cube with React Three Fiber
export const THREEJS_CUBE_TEMPLATE: PlaygroundTemplate = {
  id: 'threejs-cube',
  name: '3D Spinning Cube',
  description: 'Interactive 3D cube using React Three Fiber with orbit controls',
  category: '3d-graphics',
  tags: ['3d', 'three.js', 'interactive'],
  dependencies: ['three', '@react-three/fiber', '@react-three/drei'],
  isPublic: true,
  sourceCode: `import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, MeshWobbleMaterial } from '@react-three/drei';

function SpinningBox({ position, color }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  useFrame((state, delta) => {
    meshRef.current.rotation.x += delta * 0.5;
    meshRef.current.rotation.y += delta * 0.5;
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={clicked ? 1.5 : 1}
      onClick={() => setClicked(!clicked)}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <MeshWobbleMaterial
        color={hovered ? 'hotpink' : color}
        speed={2}
        factor={0.5}
      />
    </mesh>
  );
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0f' }}>
      <Canvas camera={{ position: [3, 3, 3], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        <SpinningBox position={[0, 0, 0]} color="#6366f1" />
        <OrbitControls enablePan enableZoom enableRotate />
        <gridHelper args={[10, 10, '#333', '#222']} />
      </Canvas>
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        color: '#888',
        fontFamily: 'system-ui',
        fontSize: '14px',
      }}>
        Click cube to scale • Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
}
`,
};

// Neural Network Visualization
export const NEURAL_NETWORK_TEMPLATE: PlaygroundTemplate = {
  id: 'neural-network-viz',
  name: 'Neural Network Visualization',
  description: 'Interactive visualization of a simple neural network with animated signals',
  category: 'neural-networks',
  tags: ['neural', 'visualization', 'educational'],
  dependencies: [],
  isPublic: true,
  sourceCode: `import { useState, useEffect, useRef } from 'react';

const LAYERS = [3, 4, 4, 2]; // Input, hidden, hidden, output

function Neuron({ x, y, isActive, onClick }) {
  return (
    <circle
      cx={x}
      cy={y}
      r={20}
      fill={isActive ? '#6366f1' : '#1a1a2e'}
      stroke={isActive ? '#818cf8' : '#333'}
      strokeWidth={2}
      style={{ cursor: 'pointer', transition: 'all 0.3s' }}
      onClick={onClick}
    />
  );
}

function Connection({ x1, y1, x2, y2, isActive }) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={isActive ? '#6366f1' : '#222'}
      strokeWidth={isActive ? 2 : 1}
      style={{ transition: 'all 0.3s' }}
    />
  );
}

export default function App() {
  const [activeNeurons, setActiveNeurons] = useState(new Set());
  const [signals, setSignals] = useState([]);
  const containerRef = useRef(null);

  const width = 600;
  const height = 400;
  const padding = 60;

  // Calculate neuron positions
  const getNeuronPos = (layerIndex, neuronIndex) => {
    const layerX = padding + (layerIndex / (LAYERS.length - 1)) * (width - 2 * padding);
    const layerHeight = LAYERS[layerIndex] * 60;
    const startY = (height - layerHeight) / 2 + 30;
    const neuronY = startY + neuronIndex * 60;
    return { x: layerX, y: neuronY };
  };

  // Propagate signal through network
  const propagateSignal = (layerIndex, neuronIndex) => {
    const key = \`\${layerIndex}-\${neuronIndex}\`;
    setActiveNeurons(prev => new Set([...prev, key]));

    if (layerIndex < LAYERS.length - 1) {
      setTimeout(() => {
        for (let i = 0; i < LAYERS[layerIndex + 1]; i++) {
          if (Math.random() > 0.3) {
            propagateSignal(layerIndex + 1, i);
          }
        }
      }, 200);
    }

    setTimeout(() => {
      setActiveNeurons(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, 500);
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#0a0a0f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui',
    }}>
      <h2 style={{ color: '#fff', marginBottom: '1rem' }}>Neural Network</h2>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Click input neurons (left) to send signals through the network
      </p>
      <svg width={width} height={height} ref={containerRef}>
        {/* Connections */}
        {LAYERS.map((layerSize, layerIndex) => {
          if (layerIndex === LAYERS.length - 1) return null;
          const connections = [];
          for (let i = 0; i < layerSize; i++) {
            for (let j = 0; j < LAYERS[layerIndex + 1]; j++) {
              const pos1 = getNeuronPos(layerIndex, i);
              const pos2 = getNeuronPos(layerIndex + 1, j);
              const isActive = activeNeurons.has(\`\${layerIndex}-\${i}\`) &&
                               activeNeurons.has(\`\${layerIndex + 1}-\${j}\`);
              connections.push(
                <Connection
                  key={\`\${layerIndex}-\${i}-\${j}\`}
                  x1={pos1.x}
                  y1={pos1.y}
                  x2={pos2.x}
                  y2={pos2.y}
                  isActive={isActive}
                />
              );
            }
          }
          return connections;
        })}

        {/* Neurons */}
        {LAYERS.map((layerSize, layerIndex) =>
          Array.from({ length: layerSize }).map((_, neuronIndex) => {
            const pos = getNeuronPos(layerIndex, neuronIndex);
            const isActive = activeNeurons.has(\`\${layerIndex}-\${neuronIndex}\`);
            return (
              <Neuron
                key={\`\${layerIndex}-\${neuronIndex}\`}
                x={pos.x}
                y={pos.y}
                isActive={isActive}
                onClick={() => layerIndex === 0 && propagateSignal(0, neuronIndex)}
              />
            );
          })
        )}

        {/* Labels */}
        <text x={padding} y={height - 10} fill="#666" fontSize="12">Input</text>
        <text x={width - padding - 30} y={height - 10} fill="#666" fontSize="12">Output</text>
      </svg>
    </div>
  );
}
`,
};

// Data Visualization Template
export const DATA_VIZ_TEMPLATE: PlaygroundTemplate = {
  id: 'data-viz',
  name: 'Interactive Data Chart',
  description: 'Real-time animated bar chart with dynamic data updates',
  category: 'visualizations',
  tags: ['charts', 'data', 'animation'],
  dependencies: [],
  isPublic: true,
  sourceCode: `import { useState, useEffect } from 'react';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function App() {
  const [data, setData] = useState([
    { label: 'A', value: 65 },
    { label: 'B', value: 45 },
    { label: 'C', value: 80 },
    { label: 'D', value: 35 },
    { label: 'E', value: 55 },
  ]);

  const [animating, setAnimating] = useState(false);

  const randomize = () => {
    setAnimating(true);
    setData(prev => prev.map(d => ({
      ...d,
      value: Math.floor(Math.random() * 100) + 10,
    })));
    setTimeout(() => setAnimating(false), 500);
  };

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#0a0a0f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui',
      color: 'white',
    }}>
      <h2 style={{ marginBottom: '2rem' }}>Interactive Bar Chart</h2>

      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        height: '300px',
        gap: '20px',
        padding: '20px',
        background: '#111',
        borderRadius: '12px',
      }}>
        {data.map((d, i) => (
          <div
            key={d.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '14px', color: '#888' }}>{d.value}</span>
            <div
              style={{
                width: '60px',
                height: \`\${(d.value / maxValue) * 250}px\`,
                background: COLORS[i],
                borderRadius: '8px 8px 0 0',
                transition: 'height 0.5s ease-out',
              }}
            />
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{d.label}</span>
          </div>
        ))}
      </div>

      <button
        onClick={randomize}
        disabled={animating}
        style={{
          marginTop: '2rem',
          padding: '12px 24px',
          fontSize: '16px',
          background: '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: animating ? 'not-allowed' : 'pointer',
          opacity: animating ? 0.7 : 1,
        }}
      >
        Randomize Data
      </button>
    </div>
  );
}
`,
};

// Braitenberg Vehicles Simulation with THREE.js
export const BRAITENBERG_VEHICLES_TEMPLATE: PlaygroundTemplate = {
  id: 'braitenberg-vehicles',
  name: 'Braitenberg Vehicles',
  description: '3D simulation of Braitenberg vehicles with emergent behavior - fear, aggression, love, and exploration',
  category: 'simulations',
  tags: ['3d', 'three.js', 'simulation', 'ai', 'emergent-behavior'],
  dependencies: ['three'],
  isPublic: true,
  sourceCode: `import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';

// Vehicle behavior types based on Braitenberg's original descriptions
const VEHICLE_TYPES = {
  FEAR: { name: 'Fear (2a)', color: '#ff6b6b', description: 'Same-side excitatory - Runs away from light' },
  AGGRESSION: { name: 'Aggression (2b)', color: '#ffd93d', description: 'Crossed excitatory - Attacks light sources' },
  LOVE: { name: 'Love (3a)', color: '#6bcb77', description: 'Same-side inhibitory - Approaches and rests near light' },
  EXPLORER: { name: 'Explorer (3b)', color: '#4d96ff', description: 'Crossed inhibitory - Explores the environment' },
};

class BraitenbergVehicle {
  constructor(type, position, scene) {
    this.type = type;
    this.position = position.clone();
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.angle = Math.random() * Math.PI * 2;
    this.baseSpeed = 0.015;
    this.sensorDistance = 0.4;
    this.maxSpeed = 0.05;
    this.isDragging = false;

    // Create vehicle mesh group
    this.mesh = new THREE.Group();
    this.mesh.userData = { type: 'vehicle', instance: this };

    // Body - elongated hexagonal prism shape
    const bodyGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.15, 6);
    const bodyMaterial = new THREE.MeshPhongMaterial({
      color: VEHICLE_TYPES[type].color,
      shininess: 80,
      specular: 0x444444
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;
    this.mesh.add(body);

    // Add glow effect
    const glowGeometry = new THREE.CylinderGeometry(0.28, 0.33, 0.12, 6);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: VEHICLE_TYPES[type].color,
      transparent: true,
      opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.rotation.x = Math.PI / 2;
    this.mesh.add(glow);

    // Sensors (eyes)
    const sensorGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const sensorMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0x333333,
      shininess: 100
    });

    this.leftSensor = new THREE.Mesh(sensorGeometry, sensorMaterial.clone());
    this.leftSensor.position.set(-0.15, 0, 0.25);
    this.mesh.add(this.leftSensor);

    this.rightSensor = new THREE.Mesh(sensorGeometry, sensorMaterial.clone());
    this.rightSensor.position.set(0.15, 0, 0.25);
    this.mesh.add(this.rightSensor);

    // Sensor pupils
    const pupilGeometry = new THREE.SphereGeometry(0.04, 8, 8);
    const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x111111 });

    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.set(0, 0, 0.05);
    this.leftSensor.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.set(0, 0, 0.05);
    this.rightSensor.add(rightPupil);

    // Direction indicator
    const coneGeometry = new THREE.ConeGeometry(0.08, 0.15, 8);
    const coneMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
    const cone = new THREE.Mesh(coneGeometry, coneMaterial);
    cone.rotation.x = -Math.PI / 2;
    cone.position.set(0, 0, 0.35);
    this.mesh.add(cone);

    // Connection lines (visualize wiring)
    this.createConnectionLines();

    this.mesh.position.copy(position);
    this.mesh.rotation.y = this.angle;
    scene.add(this.mesh);

    this.leftIntensity = 0;
    this.rightIntensity = 0;
  }

  createConnectionLines() {
    const lineMaterial = new THREE.LineBasicMaterial({
      color: VEHICLE_TYPES[this.type].color,
      transparent: true,
      opacity: 0.6
    });

    const isCrossed = this.type === 'AGGRESSION' || this.type === 'EXPLORER';

    if (isCrossed) {
      const points1 = [
        new THREE.Vector3(-0.15, -0.05, 0.15),
        new THREE.Vector3(0.15, -0.05, -0.1)
      ];
      const points2 = [
        new THREE.Vector3(0.15, -0.05, 0.15),
        new THREE.Vector3(-0.15, -0.05, -0.1)
      ];

      const line1 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points1), lineMaterial);
      const line2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points2), lineMaterial);
      this.mesh.add(line1);
      this.mesh.add(line2);
    } else {
      const points1 = [
        new THREE.Vector3(-0.15, -0.05, 0.15),
        new THREE.Vector3(-0.15, -0.05, -0.1)
      ];
      const points2 = [
        new THREE.Vector3(0.15, -0.05, 0.15),
        new THREE.Vector3(0.15, -0.05, -0.1)
      ];

      const line1 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points1), lineMaterial);
      const line2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points2), lineMaterial);
      this.mesh.add(line1);
      this.mesh.add(line2);
    }
  }

  sense(lightSources) {
    const leftSensorWorld = new THREE.Vector3();
    const rightSensorWorld = new THREE.Vector3();
    this.leftSensor.getWorldPosition(leftSensorWorld);
    this.rightSensor.getWorldPosition(rightSensorWorld);

    let leftTotal = 0;
    let rightTotal = 0;

    lightSources.forEach(light => {
      const lightPos = light.position;
      const leftDist = leftSensorWorld.distanceTo(lightPos);
      const rightDist = rightSensorWorld.distanceTo(lightPos);

      const leftIntensity = light.intensity / Math.max(leftDist * leftDist, 0.5);
      const rightIntensity = light.intensity / Math.max(rightDist * rightDist, 0.5);

      leftTotal += leftIntensity;
      rightTotal += rightIntensity;
    });

    this.leftIntensity = leftTotal;
    this.rightIntensity = rightTotal;

    const leftEmissive = Math.min(leftTotal * 0.3, 1);
    const rightEmissive = Math.min(rightTotal * 0.3, 1);
    this.leftSensor.material.emissive.setRGB(leftEmissive, leftEmissive * 0.8, 0);
    this.rightSensor.material.emissive.setRGB(rightEmissive, rightEmissive * 0.8, 0);
  }

  calculateMotorSpeeds() {
    let leftMotor, rightMotor;
    const isInhibitory = this.type === 'LOVE' || this.type === 'EXPLORER';
    const isCrossed = this.type === 'AGGRESSION' || this.type === 'EXPLORER';

    if (isInhibitory) {
      if (isCrossed) {
        leftMotor = this.baseSpeed * (1 + 0.5 / (1 + this.rightIntensity));
        rightMotor = this.baseSpeed * (1 + 0.5 / (1 + this.leftIntensity));
      } else {
        leftMotor = this.baseSpeed * (1 + 0.5 / (1 + this.leftIntensity));
        rightMotor = this.baseSpeed * (1 + 0.5 / (1 + this.rightIntensity));
      }
    } else {
      if (isCrossed) {
        leftMotor = this.baseSpeed + this.rightIntensity * 0.02;
        rightMotor = this.baseSpeed + this.leftIntensity * 0.02;
      } else {
        leftMotor = this.baseSpeed + this.leftIntensity * 0.02;
        rightMotor = this.baseSpeed + this.rightIntensity * 0.02;
      }
    }

    leftMotor = Math.min(Math.max(leftMotor, 0), this.maxSpeed);
    rightMotor = Math.min(Math.max(rightMotor, 0), this.maxSpeed);

    return { left: leftMotor, right: rightMotor };
  }

  update(lightSources, bounds) {
    if (this.isDragging) return;

    this.sense(lightSources);
    const motors = this.calculateMotorSpeeds();

    const speed = (motors.left + motors.right) / 2;
    const turn = (motors.right - motors.left) * 2;

    this.angle += turn;

    const dx = Math.sin(this.angle) * speed;
    const dz = Math.cos(this.angle) * speed;

    this.position.x += dx;
    this.position.z += dz;

    if (this.position.x > bounds) this.position.x = -bounds;
    if (this.position.x < -bounds) this.position.x = bounds;
    if (this.position.z > bounds) this.position.z = -bounds;
    if (this.position.z < -bounds) this.position.z = bounds;

    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.angle;
  }

  setPosition(x, z) {
    this.position.x = x;
    this.position.z = z;
    this.mesh.position.x = x;
    this.mesh.position.z = z;
  }

  dispose(scene) {
    scene.remove(this.mesh);
    this.mesh.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
}

class LightSource {
  constructor(position, scene, intensity = 1) {
    this.position = position.clone();
    this.intensity = intensity;
    this.pulsePhase = Math.random() * Math.PI * 2;
    this.isDragging = false;

    this.mesh = new THREE.Group();
    this.mesh.userData = { type: 'light', instance: this };

    const coreGeometry = new THREE.SphereGeometry(0.15, 32, 32);
    const coreMaterial = new THREE.MeshBasicMaterial({ color: 0xffee88 });
    this.core = new THREE.Mesh(coreGeometry, coreMaterial);
    this.mesh.add(this.core);

    for (let i = 1; i <= 3; i++) {
      const glowGeometry = new THREE.SphereGeometry(0.15 + i * 0.1, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xffdd44,
        transparent: true,
        opacity: 0.15 / i
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      this.mesh.add(glow);
    }

    this.rays = [];
    const rayCount = 8;
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2;
      const rayGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.3);
      const rayMaterial = new THREE.MeshBasicMaterial({
        color: 0xffee88,
        transparent: true,
        opacity: 0.4
      });
      const ray = new THREE.Mesh(rayGeometry, rayMaterial);
      ray.position.set(Math.cos(angle) * 0.35, 0, Math.sin(angle) * 0.35);
      ray.rotation.y = angle;
      this.rays.push(ray);
      this.mesh.add(ray);
    }

    this.light = new THREE.PointLight(0xffee88, 2, 10);
    this.mesh.add(this.light);

    this.mesh.position.copy(position);
    scene.add(this.mesh);
  }

  update(time) {
    const pulse = 1 + Math.sin(time * 2 + this.pulsePhase) * 0.1;
    this.core.scale.setScalar(pulse);
    this.light.intensity = 2 * pulse;

    this.rays.forEach((ray, i) => {
      const baseAngle = (i / this.rays.length) * Math.PI * 2;
      const currentAngle = baseAngle + time * 0.5;
      ray.position.set(Math.cos(currentAngle) * 0.35, 0, Math.sin(currentAngle) * 0.35);
      ray.rotation.y = currentAngle;
    });
  }

  setPosition(x, z) {
    this.position.x = x;
    this.position.z = z;
    this.mesh.position.x = x;
    this.mesh.position.z = z;
  }

  dispose(scene) {
    scene.remove(this.mesh);
    this.mesh.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
}

class SimpleOrbitControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.enabled = true;

    this.target = new THREE.Vector3(0, 0, 0);
    this.spherical = new THREE.Spherical();
    this.sphericalDelta = new THREE.Spherical();

    this.rotateSpeed = 0.5;
    this.zoomSpeed = 1.0;
    this.panSpeed = 0.5;

    this.minDistance = 3;
    this.maxDistance = 25;
    this.minPolarAngle = 0.1;
    this.maxPolarAngle = Math.PI / 2 - 0.1;

    this.isMouseDown = false;
    this.mouseButton = -1;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    const offset = new THREE.Vector3().subVectors(camera.position, this.target);
    this.spherical.setFromVector3(offset);

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onContextMenu = (e) => e.preventDefault();

    this.bindEvents();
  }

  bindEvents() {
    this.domElement.addEventListener('mousedown', this.onMouseDown);
    this.domElement.addEventListener('mousemove', this.onMouseMove);
    this.domElement.addEventListener('mouseup', this.onMouseUp);
    this.domElement.addEventListener('wheel', this.onWheel);
    this.domElement.addEventListener('contextmenu', this.onContextMenu);
  }

  onMouseDown(event) {
    if (!this.enabled) return;
    this.isMouseDown = true;
    this.mouseButton = event.button;
    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;
  }

  onMouseMove(event) {
    if (!this.enabled || !this.isMouseDown) return;

    const deltaX = event.clientX - this.lastMouseX;
    const deltaY = event.clientY - this.lastMouseY;

    if (this.mouseButton === 0) {
      this.sphericalDelta.theta -= deltaX * this.rotateSpeed * 0.01;
      this.sphericalDelta.phi -= deltaY * this.rotateSpeed * 0.01;
    } else if (this.mouseButton === 2) {
      const panOffset = new THREE.Vector3();
      const targetDistance = this.camera.position.distanceTo(this.target);

      panOffset.setFromMatrixColumn(this.camera.matrix, 0);
      panOffset.multiplyScalar(-deltaX * this.panSpeed * targetDistance * 0.001);
      this.target.add(panOffset);

      const forward = new THREE.Vector3();
      this.camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      forward.multiplyScalar(deltaY * this.panSpeed * targetDistance * 0.001);
      this.target.add(forward);
    }

    this.lastMouseX = event.clientX;
    this.lastMouseY = event.clientY;

    this.update();
  }

  onMouseUp() {
    this.isMouseDown = false;
    this.mouseButton = -1;
  }

  onWheel(event) {
    if (!this.enabled) return;
    event.preventDefault();

    if (event.deltaY > 0) {
      this.spherical.radius *= 1.1;
    } else {
      this.spherical.radius *= 0.9;
    }

    this.spherical.radius = Math.max(this.minDistance, Math.min(this.maxDistance, this.spherical.radius));
    this.update();
  }

  update() {
    this.spherical.theta += this.sphericalDelta.theta;
    this.spherical.phi += this.sphericalDelta.phi;
    this.spherical.phi = Math.max(this.minPolarAngle, Math.min(this.maxPolarAngle, this.spherical.phi));
    this.sphericalDelta.set(0, 0, 0);

    const offset = new THREE.Vector3().setFromSpherical(this.spherical);
    this.camera.position.copy(this.target).add(offset);
    this.camera.lookAt(this.target);
  }

  dispose() {
    this.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.domElement.removeEventListener('mouseup', this.onMouseUp);
    this.domElement.removeEventListener('wheel', this.onWheel);
    this.domElement.removeEventListener('contextmenu', this.onContextMenu);
  }
}

export default function BraitenbergSimulation() {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const vehiclesRef = useRef([]);
  const lightsRef = useRef([]);
  const animationRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  const draggedObjectRef = useRef(null);
  const dragPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  const isRunningRef = useRef(true);

  const [selectedVehicleType, setSelectedVehicleType] = useState('FEAR');
  const [isRunning, setIsRunning] = useState(true);
  const [showInfo, setShowInfo] = useState(true);
  const [interactionMode, setInteractionMode] = useState('orbit');
  const [vehicleCounts, setVehicleCounts] = useState({
    FEAR: 0, AGGRESSION: 0, LOVE: 0, EXPLORER: 0
  });
  const [lightCount, setLightCount] = useState(0);

  const updateCounts = useCallback(() => {
    const counts = { FEAR: 0, AGGRESSION: 0, LOVE: 0, EXPLORER: 0 };
    vehiclesRef.current.forEach(v => counts[v.type]++);
    setVehicleCounts(counts);
    setLightCount(lightsRef.current.length);
  }, []);

  const addVehicle = useCallback((type) => {
    if (!sceneRef.current) return;
    const bounds = 4;
    const position = new THREE.Vector3(
      (Math.random() - 0.5) * bounds * 2, 0.1,
      (Math.random() - 0.5) * bounds * 2
    );
    const vehicle = new BraitenbergVehicle(type, position, sceneRef.current);
    vehiclesRef.current.push(vehicle);
    updateCounts();
  }, [updateCounts]);

  const addLight = useCallback((pos = null) => {
    if (!sceneRef.current) return;
    const bounds = 3;
    const position = pos || new THREE.Vector3(
      (Math.random() - 0.5) * bounds * 2, 0.3,
      (Math.random() - 0.5) * bounds * 2
    );
    const light = new LightSource(position, sceneRef.current);
    lightsRef.current.push(light);
    updateCounts();
  }, [updateCounts]);

  const clearAll = useCallback(() => {
    vehiclesRef.current.forEach(v => v.dispose(sceneRef.current));
    vehiclesRef.current = [];
    lightsRef.current.forEach(l => l.dispose(sceneRef.current));
    lightsRef.current = [];
    updateCounts();
  }, [updateCounts]);

  const resetSimulation = useCallback(() => {
    clearAll();
    setTimeout(() => {
      addLight();
      addLight();
      addVehicle('FEAR');
      addVehicle('AGGRESSION');
      addVehicle('LOVE');
      addVehicle('EXPLORER');
    }, 100);
  }, [clearAll, addLight, addVehicle]);

  // Sync isRunning state with ref
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);
    scene.fog = new THREE.Fog(0x0a0a0f, 8, 25);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 100
    );
    camera.position.set(0, 8, 8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new SimpleOrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0x8888ff, 0.3);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);

    const groundGeometry = new THREE.PlaneGeometry(30, 30);
    const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x111118, shininess: 20 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.userData = { type: 'ground' };
    scene.add(ground);

    const gridHelper = new THREE.GridHelper(30, 60, 0x222233, 0x181822);
    scene.add(gridHelper);

    const bounds = 5;
    const boundaryGeometry = new THREE.BufferGeometry();
    const boundaryPoints = [
      new THREE.Vector3(-bounds, 0.01, -bounds),
      new THREE.Vector3(bounds, 0.01, -bounds),
      new THREE.Vector3(bounds, 0.01, bounds),
      new THREE.Vector3(-bounds, 0.01, bounds),
      new THREE.Vector3(-bounds, 0.01, -bounds),
    ];
    boundaryGeometry.setFromPoints(boundaryPoints);
    const boundaryMaterial = new THREE.LineBasicMaterial({ color: 0x334455, transparent: true, opacity: 0.5 });
    const boundary = new THREE.Line(boundaryGeometry, boundaryMaterial);
    scene.add(boundary);

    setTimeout(() => {
      addLight();
      addLight();
      addVehicle('FEAR');
      addVehicle('AGGRESSION');
      addVehicle('LOVE');
      addVehicle('EXPLORER');
    }, 100);

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      const time = clockRef.current.getElapsedTime();

      lightsRef.current.forEach(light => light.update(time));

      if (isRunningRef.current) {
        vehiclesRef.current.forEach(vehicle => {
          vehicle.update(lightsRef.current, 5);
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
      controls.dispose();
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = interactionMode === 'orbit';
    }
  }, [interactionMode]);

  const getIntersectedObject = useCallback((event) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return null;

    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    const objects = [];
    vehiclesRef.current.forEach(v => objects.push(v.mesh));
    lightsRef.current.forEach(l => objects.push(l.mesh));

    const intersects = raycasterRef.current.intersectObjects(objects, true);

    if (intersects.length > 0) {
      let obj = intersects[0].object;
      while (obj && !obj.userData.type) {
        obj = obj.parent;
      }
      return obj;
    }
    return null;
  }, []);

  const handleMouseDown = useCallback((event) => {
    if (interactionMode !== 'drag') return;

    const obj = getIntersectedObject(event);
    if (obj && obj.userData.instance) {
      draggedObjectRef.current = obj.userData.instance;
      draggedObjectRef.current.isDragging = true;
      if (controlsRef.current) controlsRef.current.enabled = false;
    }
  }, [interactionMode, getIntersectedObject]);

  const handleMouseMove = useCallback((event) => {
    const obj = getIntersectedObject(event);
    if (obj && obj.userData.type) {
      if (containerRef.current) {
        containerRef.current.style.cursor = interactionMode === 'drag' ? 'grab' : 'default';
      }
    } else {
      if (containerRef.current) {
        containerRef.current.style.cursor = 'default';
      }
    }

    if (draggedObjectRef.current && interactionMode === 'drag') {
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

      const intersectPoint = new THREE.Vector3();
      raycasterRef.current.ray.intersectPlane(dragPlaneRef.current, intersectPoint);

      if (intersectPoint) {
        draggedObjectRef.current.setPosition(intersectPoint.x, intersectPoint.z);
      }

      if (containerRef.current) {
        containerRef.current.style.cursor = 'grabbing';
      }
    }
  }, [interactionMode, getIntersectedObject]);

  const handleMouseUp = useCallback(() => {
    if (draggedObjectRef.current) {
      draggedObjectRef.current.isDragging = false;
      draggedObjectRef.current = null;
    }
    if (controlsRef.current && interactionMode === 'orbit') {
      controlsRef.current.enabled = true;
    }
  }, [interactionMode]);

  const handleDoubleClick = useCallback((event) => {
    if (!sceneRef.current || !cameraRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

    const intersectPoint = new THREE.Vector3();
    raycasterRef.current.ray.intersectPlane(dragPlaneRef.current, intersectPoint);

    if (intersectPoint) {
      const position = new THREE.Vector3(intersectPoint.x, 0.3, intersectPoint.z);
      addLight(position);
    }
  }, [addLight]);

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#0a0a0f',
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      overflow: 'hidden', position: 'relative'
    }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      />

      {/* Title */}
      <div style={{
        position: 'absolute', top: 20, left: 20, color: '#fff', zIndex: 10, pointerEvents: 'none'
      }}>
        <h1 style={{
          margin: 0, fontSize: '1.5rem', fontWeight: 300, letterSpacing: '0.2em',
          textTransform: 'uppercase',
          background: 'linear-gradient(90deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text'
        }}>
          Braitenberg Vehicles
        </h1>
        <p style={{ margin: '5px 0 0 0', fontSize: '0.7rem', color: '#666', letterSpacing: '0.1em' }}>
          3D Simulation - Emergent Behavior
        </p>
      </div>

      {/* Mode Toggle */}
      <div style={{
        position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 5, background: 'rgba(10, 10, 15, 0.9)',
        border: '1px solid #222', borderRadius: 8, padding: 5, zIndex: 10
      }}>
        <button
          onClick={() => setInteractionMode('orbit')}
          style={{
            padding: '8px 16px', borderRadius: 6, border: 'none',
            background: interactionMode === 'orbit' ? '#2a4a6a' : 'transparent',
            color: interactionMode === 'orbit' ? '#6af' : '#666',
            cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', transition: 'all 0.2s'
          }}
        >
          Orbit Camera
        </button>
        <button
          onClick={() => setInteractionMode('drag')}
          style={{
            padding: '8px 16px', borderRadius: 6, border: 'none',
            background: interactionMode === 'drag' ? '#4a3a2a' : 'transparent',
            color: interactionMode === 'drag' ? '#fa6' : '#666',
            cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', transition: 'all 0.2s'
          }}
        >
          Drag Objects
        </button>
      </div>

      {/* Controls hint */}
      <div style={{
        position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)',
        background: 'rgba(10, 10, 15, 0.8)', border: '1px solid #222', borderRadius: 6,
        padding: '6px 12px', color: '#555', fontSize: '0.65rem', zIndex: 10,
        textAlign: 'center', pointerEvents: 'none'
      }}>
        {interactionMode === 'orbit' ? (
          <>Left-click drag to rotate - Right-click drag to pan - Scroll to zoom</>
        ) : (
          <>Click and drag vehicles or lights - Double-click to place a light</>
        )}
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div style={{
          position: 'absolute', top: 110, left: 20, background: 'rgba(10, 10, 15, 0.9)',
          border: '1px solid #222', borderRadius: 8, padding: 15, color: '#888',
          fontSize: '0.7rem', maxWidth: 280, zIndex: 10
        }}>
          <div style={{ marginBottom: 10, color: '#aaa', fontWeight: 600 }}>How It Works</div>
          <p style={{ margin: '0 0 10px 0', lineHeight: 1.6 }}>
            Each vehicle has two light sensors connected to two motors. The wiring determines emergent behavior:
          </p>
          {Object.entries(VEHICLE_TYPES).map(([key, value]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 8, gap: 8 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%', background: value.color, flexShrink: 0, marginTop: 3
              }} />
              <div>
                <div style={{ color: value.color, fontWeight: 600 }}>{value.name}</div>
                <div style={{ color: '#666', fontSize: '0.65rem' }}>{value.description}</div>
              </div>
            </div>
          ))}
          <button
            onClick={() => setShowInfo(false)}
            style={{
              marginTop: 10, background: 'transparent', border: '1px solid #333',
              color: '#666', padding: '5px 10px', borderRadius: 4, cursor: 'pointer', fontSize: '0.65rem'
            }}
          >
            Hide Info
          </button>
        </div>
      )}

      {/* Control Panel */}
      <div style={{
        position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 10, background: 'rgba(10, 10, 15, 0.9)',
        border: '1px solid #222', borderRadius: 12, padding: 15, zIndex: 10
      }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {Object.entries(VEHICLE_TYPES).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setSelectedVehicleType(key)}
              style={{
                width: 36, height: 36, borderRadius: 8,
                border: selectedVehicleType === key ? \`2px solid \${value.color}\` : '1px solid #333',
                background: selectedVehicleType === key ? \`\${value.color}22\` : 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
              }}
              title={value.name}
            >
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: value.color }} />
            </button>
          ))}
        </div>

        <div style={{ width: 1, background: '#333' }} />

        <button
          onClick={() => addVehicle(selectedVehicleType)}
          style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #444',
            background: 'linear-gradient(180deg, #2a2a35 0%, #1a1a22 100%)', color: '#fff',
            cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', transition: 'all 0.2s'
          }}
        >
          + Vehicle
        </button>

        <button
          onClick={() => addLight()}
          style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #554422',
            background: 'linear-gradient(180deg, #3a3520 0%, #2a2510 100%)', color: '#ffee88',
            cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit', transition: 'all 0.2s'
          }}
        >
          + Light
        </button>

        <div style={{ width: 1, background: '#333' }} />

        <button
          onClick={() => setIsRunning(!isRunning)}
          style={{
            width: 36, height: 36, borderRadius: 8, border: '1px solid #333',
            background: isRunning ? '#1a3a1a' : '#3a1a1a', color: isRunning ? '#6bcb77' : '#ff6b6b',
            cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          {isRunning ? '||' : '>'}
        </button>

        <button
          onClick={resetSimulation}
          style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #333',
            background: 'transparent', color: '#888', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit'
          }}
        >
          Reset
        </button>

        <button
          onClick={clearAll}
          style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #442222',
            background: 'transparent', color: '#ff6b6b', cursor: 'pointer', fontSize: '0.75rem', fontFamily: 'inherit'
          }}
        >
          Clear
        </button>
      </div>

      {/* Stats */}
      <div style={{
        position: 'absolute', top: 20, right: 20, background: 'rgba(10, 10, 15, 0.9)',
        border: '1px solid #222', borderRadius: 8, padding: 12, color: '#666', fontSize: '0.7rem', zIndex: 10
      }}>
        <div style={{ marginBottom: 8, color: '#888', fontWeight: 600 }}>Population</div>
        {Object.entries(VEHICLE_TYPES).map(([key, value]) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 4 }}>
            <span style={{ color: value.color }}>{value.name.split(' ')[0]}</span>
            <span>{vehicleCounts[key]}</span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid #222', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#ffee88' }}>Lights</span>
          <span>{lightCount}</span>
        </div>
      </div>

      {!showInfo && (
        <button
          onClick={() => setShowInfo(true)}
          style={{
            position: 'absolute', top: 110, left: 20, background: 'rgba(10, 10, 15, 0.9)',
            border: '1px solid #222', borderRadius: 8, padding: '8px 12px',
            color: '#666', cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'inherit', zIndex: 10
          }}
        >
          Show Info
        </button>
      )}
    </div>
  );
}
`,
};

// All templates registry
export const PLAYGROUND_TEMPLATES: PlaygroundTemplate[] = [
  BASIC_COUNTER_TEMPLATE,
  THREEJS_CUBE_TEMPLATE,
  NEURAL_NETWORK_TEMPLATE,
  DATA_VIZ_TEMPLATE,
  BRAITENBERG_VEHICLES_TEMPLATE,
];

// Get template by ID
export const getTemplateById = (id: string): PlaygroundTemplate | undefined => {
  return PLAYGROUND_TEMPLATES.find(t => t.id === id);
};

// Get templates by category
export const getTemplatesByCategory = (category: PlaygroundCategory): PlaygroundTemplate[] => {
  return PLAYGROUND_TEMPLATES.filter(t => t.category === category);
};

// Search templates
export const searchTemplates = (query: string): PlaygroundTemplate[] => {
  const q = query.toLowerCase();
  return PLAYGROUND_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    t.tags.some(tag => tag.toLowerCase().includes(q))
  );
};
