"use client";

import React, { useEffect, useRef, memo } from "react";
import * as THREE from "three";
import { AICoreState } from "@prosis/orchestrator";
import { VoiceState } from "../../voice/services/voice-session";

export type CoreVisualState =
  | "idle"
  | "listening"
  | "processing"
  | "thinking"
  | "executing"
  | "speaking"
  | "interrupted"
  | "approval"
  | "success"
  | "error";

interface AICoreVisualProps {
  state: CoreVisualState | AICoreState | VoiceState;
  audioLevel?: number; // 0.0 - 1.0 (real-time voice amplitude)
  size?: number;
  className?: string;
  onClick?: () => void;
}

const STATE_CONFIGS: Record<
  string,
  {
    primaryColor: number;
    secondaryColor: number;
    ambientGlow: string;
    rotationSpeed: number;
    displacementScale: number;
    label: string;
    statusText: string;
  }
> = {
  idle: {
    primaryColor: 0x38bdf8, // Soft titanium cyan
    secondaryColor: 0x818cf8, // Muted indigo
    ambientGlow: "rgba(56, 189, 248, 0.08)",
    rotationSpeed: 0.5,
    displacementScale: 0.7,
    label: "IDLE",
    statusText: "Prosis OS Standby",
  },
  connecting: {
    primaryColor: 0x38bdf8,
    secondaryColor: 0x818cf8,
    ambientGlow: "rgba(56, 189, 248, 0.15)",
    rotationSpeed: 1.5,
    displacementScale: 1.2,
    label: "CONNECTING",
    statusText: "Initializing realtime session...",
  },
  connected: {
    primaryColor: 0x34d399,
    secondaryColor: 0x38bdf8,
    ambientGlow: "rgba(52, 211, 153, 0.16)",
    rotationSpeed: 0.8,
    displacementScale: 0.9,
    label: "CONNECTED",
    statusText: "Realtime audio channel active",
  },
  disconnected: {
    primaryColor: 0x64748b,
    secondaryColor: 0x475569,
    ambientGlow: "rgba(100, 116, 139, 0.08)",
    rotationSpeed: 0.3,
    displacementScale: 0.5,
    label: "DISCONNECTED",
    statusText: "Realtime session offline",
  },
  listening: {
    primaryColor: 0x38bdf8, // Cyan
    secondaryColor: 0x34d399, // Soft emerald
    ambientGlow: "rgba(56, 189, 248, 0.18)",
    rotationSpeed: 1.2,
    displacementScale: 1.6,
    label: "LISTENING",
    statusText: "Acoustic intake active",
  },
  processing: {
    primaryColor: 0x38bdf8,
    secondaryColor: 0x818cf8,
    ambientGlow: "rgba(56, 189, 248, 0.16)",
    rotationSpeed: 1.6,
    displacementScale: 1.3,
    label: "PROCESSING",
    statusText: "Parsing vocal directive",
  },
  interrupted: {
    primaryColor: 0xfbbf24,
    secondaryColor: 0x38bdf8,
    ambientGlow: "rgba(251, 191, 36, 0.25)",
    rotationSpeed: 2.2,
    displacementScale: 0.8,
    label: "INTERRUPTED",
    statusText: "Barge-in acknowledged — listening",
  },
  thinking: {
    primaryColor: 0x818cf8, // Muted violet
    secondaryColor: 0xc084fc, // Soft purple
    ambientGlow: "rgba(129, 140, 248, 0.16)",
    rotationSpeed: 0.8,
    displacementScale: 1.1,
    label: "THINKING",
    statusText: "Synthesizing cross-product context",
  },
  executing: {
    primaryColor: 0x38bdf8, // Bright titanium
    secondaryColor: 0x60a5fa, // Sky
    ambientGlow: "rgba(56, 189, 248, 0.18)",
    rotationSpeed: 2.2,
    displacementScale: 1.8,
    label: "EXECUTING",
    statusText: "Dispatching authorized API commands",
  },
  speaking: {
    primaryColor: 0x38bdf8, // Cyan
    secondaryColor: 0xa78bfa, // Violet
    ambientGlow: "rgba(56, 189, 248, 0.15)",
    rotationSpeed: 1.4,
    displacementScale: 1.4,
    label: "SPEAKING",
    statusText: "Multimodal voice stream",
  },
  approval: {
    primaryColor: 0xfbbf24, // Warm amber
    secondaryColor: 0xf59e0b, // Dark amber
    ambientGlow: "rgba(251, 191, 36, 0.2)",
    rotationSpeed: 0.6,
    displacementScale: 0.8,
    label: "AWAITING APPROVAL",
    statusText: "Action intercepted — awaiting confirmation",
  },
  WAITING_FOR_APPROVAL: {
    primaryColor: 0xfbbf24,
    secondaryColor: 0xf59e0b,
    ambientGlow: "rgba(251, 191, 36, 0.2)",
    rotationSpeed: 0.6,
    displacementScale: 0.8,
    label: "AWAITING APPROVAL",
    statusText: "Action intercepted — awaiting confirmation",
  },
  success: {
    primaryColor: 0x34d399, // Soft emerald
    secondaryColor: 0x38bdf8, // Cyan
    ambientGlow: "rgba(52, 211, 153, 0.2)",
    rotationSpeed: 0.9,
    displacementScale: 0.9,
    label: "CONFIRMED",
    statusText: "Execution verified in audit trail",
  },
  SUCCESS: {
    primaryColor: 0x34d399,
    secondaryColor: 0x38bdf8,
    ambientGlow: "rgba(52, 211, 153, 0.2)",
    rotationSpeed: 0.9,
    displacementScale: 0.9,
    label: "CONFIRMED",
    statusText: "Execution verified in audit trail",
  },
  error: {
    primaryColor: 0xf87171, // Muted ruby
    secondaryColor: 0xb91c1c, // Deep red
    ambientGlow: "rgba(248, 113, 113, 0.2)",
    rotationSpeed: 1.2,
    displacementScale: 1.5,
    label: "EXCEPTION",
    statusText: "Operational alert or halted action",
  },
  ERROR: {
    primaryColor: 0xf87171,
    secondaryColor: 0xb91c1c,
    ambientGlow: "rgba(248, 113, 113, 0.2)",
    rotationSpeed: 1.2,
    displacementScale: 1.5,
    label: "EXCEPTION",
    statusText: "Operational alert or halted action",
  },
};

export const AICoreVisual: React.FC<AICoreVisualProps> = memo(
  ({ state, audioLevel = 0, size = 320, className = "", onClick }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const groupRef = useRef<THREE.Group | null>(null);
    const innerMeshRef = useRef<THREE.Mesh | null>(null);
    const outerMeshRef = useRef<THREE.Mesh | null>(null);
    const particlesRef = useRef<THREE.Points | null>(null);
    const ringRef = useRef<THREE.LineLoop | null>(null);

    const stateKey = String(state).toLowerCase();
    const config =
      STATE_CONFIGS[stateKey] ||
      STATE_CONFIGS[state as string] ||
      STATE_CONFIGS.idle;

    const stateRef = useRef(config);
    const audioLevelRef = useRef(audioLevel);

    useEffect(() => {
      stateRef.current = config;
    }, [config]);

    useEffect(() => {
      audioLevelRef.current = audioLevel;
    }, [audioLevel]);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      // 1. Scene & Camera Setup
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 1000);
      camera.position.z = 5.2;

      // 2. High-performance Antialiased WebGL Renderer
      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(size, size);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.innerHTML = "";
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // 3. Root 3D Transform Group
      const masterGroup = new THREE.Group();
      scene.add(masterGroup);
      groupRef.current = masterGroup;

      // Inner Core: High-density Icosahedron Lattice
      const innerGeom = new THREE.IcosahedronGeometry(1.32, 14);
      const originalPositions = innerGeom.attributes.position.clone();
      const innerMat = new THREE.MeshBasicMaterial({
        color: config.primaryColor,
        wireframe: true,
        transparent: true,
        opacity: 0.32,
      });
      const innerMesh = new THREE.Mesh(innerGeom, innerMat);
      masterGroup.add(innerMesh);
      innerMeshRef.current = innerMesh;

      // Outer Secondary Geometric Shell
      const outerGeom = new THREE.IcosahedronGeometry(1.68, 2);
      const outerMat = new THREE.MeshBasicMaterial({
        color: config.secondaryColor,
        wireframe: true,
        transparent: true,
        opacity: 0.16,
      });
      const outerMesh = new THREE.Mesh(outerGeom, outerMat);
      masterGroup.add(outerMesh);
      outerMeshRef.current = outerMesh;

      // Harmonic Orbit Ring (waveform responsive)
      const ringSegments = 72;
      const ringPositions = new Float32Array((ringSegments + 1) * 3);
      for (let i = 0; i <= ringSegments; i++) {
        const theta = (i / ringSegments) * Math.PI * 2;
        ringPositions[i * 3] = Math.cos(theta) * 2.15;
        ringPositions[i * 3 + 1] = 0;
        ringPositions[i * 3 + 2] = Math.sin(theta) * 2.15;
      }
      const ringGeom = new THREE.BufferGeometry();
      ringGeom.setAttribute(
        "position",
        new THREE.BufferAttribute(ringPositions, 3)
      );
      const ringMat = new THREE.LineBasicMaterial({
        color: config.primaryColor,
        transparent: true,
        opacity: 0.28,
      });
      const ring = new THREE.LineLoop(ringGeom, ringMat);
      ring.rotation.x = Math.PI / 5;
      masterGroup.add(ring);
      ringRef.current = ring;

      // Particle Nebula
      const particleCount = 120;
      const particlePositions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = u * 2.0 * Math.PI;
        const phi = Math.acos(2.0 * v - 1.0);
        const r = 2.0 + Math.random() * 0.45;

        particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        particlePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        particlePositions[i * 3 + 2] = r * Math.cos(phi);
      }
      const particleGeom = new THREE.BufferGeometry();
      particleGeom.setAttribute(
        "position",
        new THREE.BufferAttribute(particlePositions, 3)
      );
      const particleMat = new THREE.PointsMaterial({
        color: config.primaryColor,
        size: 0.038,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
      });
      const particles = new THREE.Points(particleGeom, particleMat);
      masterGroup.add(particles);
      particlesRef.current = particles;

      // Animation Loop with Tab Visibility Optimization
      let animationFrameId: number;
      const clock = new THREE.Clock();

      const renderLoop = () => {
        // Pause execution if tab is backgrounded
        if (document.hidden) {
          animationFrameId = requestAnimationFrame(renderLoop);
          return;
        }

        animationFrameId = requestAnimationFrame(renderLoop);

        const elapsedTime = clock.getElapsedTime();
        const currentCfg = stateRef.current;
        const audio = audioLevelRef.current;

        // Respect Reduced Motion Preferences
        const prefersReducedMotion =
          typeof window !== "undefined" &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const motionFactor = prefersReducedMotion ? 0.2 : 1.0;

        // Smooth color interpolation
        const targetColor1 = new THREE.Color(currentCfg.primaryColor);
        const targetColor2 = new THREE.Color(currentCfg.secondaryColor);
        innerMat.color.lerp(targetColor1, 0.08);
        outerMat.color.lerp(targetColor2, 0.08);
        ringMat.color.lerp(targetColor1, 0.08);
        particleMat.color.lerp(targetColor1, 0.08);

        // State-Specific Motion Profiles
        const isExecuting = currentCfg.label === "EXECUTING";
        const isWaitingApproval = currentCfg.label === "AWAITING APPROVAL";
        const isSpeaking = currentCfg.label === "SPEAKING";
        const isListening = currentCfg.label === "LISTENING";
        const isSuccess = currentCfg.label === "CONFIRMED";

        // Core Rotation dynamics
        const execSpeed = isExecuting ? 2.4 : 1.0;
        const speedMultiplier = currentCfg.rotationSpeed * (1 + audio * 1.8) * execSpeed * motionFactor;
        masterGroup.rotation.y += 0.004 * speedMultiplier;
        outerMesh.rotation.x -= 0.0025 * speedMultiplier;
        particles.rotation.y -= 0.003 * speedMultiplier;
        ring.rotation.z += (isExecuting ? 0.012 : 0.005) * speedMultiplier;

        // Amplitude Vertex Distortion
        const pos = innerGeom.attributes.position;
        const orig = originalPositions;
        const t = elapsedTime * currentCfg.rotationSpeed;

        for (let i = 0; i < pos.count; i++) {
          const ox = orig.getX(i);
          const oy = orig.getY(i);
          const oz = orig.getZ(i);

          // Acoustic frequency waves
          const wave =
            Math.sin(t * 2.2 + ox * 2.8 + oy * 1.9) *
            0.045 *
            currentCfg.displacementScale *
            motionFactor;

          const voiceDeformation =
            isListening || isSpeaking
              ? Math.sin(t * 6.5 + oz * 3.5) * audio * 0.24 * motionFactor
              : 0;

          const scale = 1 + wave + voiceDeformation;
          pos.setXYZ(i, ox * scale, oy * scale, oz * scale);
        }
        pos.needsUpdate = true;

        // Semantic Breathing & Heartbeat scale
        let stateModulation = 0;
        if (isWaitingApproval) {
          // Slow Amber Heartbeat
          stateModulation = Math.sin(elapsedTime * 3.2) * 0.035 * motionFactor;
        } else if (isSpeaking) {
          // Rhythmic Vocal Cadence
          stateModulation = Math.sin(elapsedTime * 4.5) * 0.025 * (1 + audio * 0.8) * motionFactor;
        } else if (isSuccess) {
          // Settling radiant pulse
          stateModulation = Math.max(0, Math.sin(elapsedTime * 1.8)) * 0.02 * motionFactor;
        } else {
          // Calm organic idle breath
          stateModulation = Math.sin(elapsedTime * 1.4) * 0.018 * motionFactor;
        }

        const totalScale = 1 + stateModulation + audio * 0.12 * motionFactor;
        masterGroup.scale.set(totalScale, totalScale, totalScale);

        renderer.render(scene, camera);
      };

      renderLoop();

      return () => {
        cancelAnimationFrame(animationFrameId);
        renderer.dispose();
        innerGeom.dispose();
        outerGeom.dispose();
        ringGeom.dispose();
        particleGeom.dispose();
        if (container) {
          container.innerHTML = "";
        }
      };
    }, [size]);

    return (
      <div
        className={`relative flex flex-col items-center justify-center select-none group cursor-pointer ${className}`}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`Prosis AI Core - State: ${config.label}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            onClick?.();
          }
        }}
      >
        {/* Soft Ambient Depth Glow (No harsh neon) */}
        <div
          className="absolute rounded-full transition-all duration-700 ease-out pointer-events-none blur-3xl opacity-80"
          style={{
            width: size * 0.9,
            height: size * 0.9,
            background: config.ambientGlow,
          }}
        />

        {/* 3D WebGL Canvas */}
        <div
          ref={containerRef}
          style={{ width: size, height: size }}
          className="relative z-10 transition-transform duration-500 group-hover:scale-[1.03]"
        />

        {/* Minimalist Telemetry Pill */}
        <div className="relative z-20 -mt-2 flex flex-col items-center text-center">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full surface-glass border border-white/10 shadow-lg">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: `#${config.primaryColor
                  .toString(16)
                  .padStart(6, "0")}`,
              }}
            />
            <span className="font-mono text-[11px] tracking-widest uppercase font-medium text-gray-300">
              {config.label}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 font-mono tracking-tight mt-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
            {config.statusText}
          </p>
        </div>
      </div>
    );
  }
);

AICoreVisual.displayName = "AICoreVisual";
