import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const HeroBackgroundEffect: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;

        // Settings for the "Funnel Flow" look
        const settings = {
            lineCount: 80,
            segmentCount: 60,
            signalCount: 40,
            lineColor: 0xC5D63D,
            accentColor: 0xffffff,
            opacity: 0.12,
        };

        // Responsive check
        let isMobile = window.innerWidth <= 968;

        // Scene Setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 3000);
        camera.position.z = isMobile ? 800 : 600;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        // Dynamic Funnel Math: Handles both orientations
        const getPathPoint = (t: number, index: number, total: number, mobile: boolean) => {
            const funnelShape = 0.1 + 0.9 * Math.pow(t, 2.5);
            const radius = (mobile ? 200 : 300) * funnelShape;
            const angle = (index / total) * Math.PI * 2;

            if (mobile) {
                // Vertical: Top to Bottom (Wide at Top, Narrow at Bottom)
                const y = (t - 0.5) * 1400; // Vertical span
                const x = radius * Math.cos(angle);
                const z = radius * Math.sin(angle);
                return new THREE.Vector3(x, y, z);
            } else {
                // Horizontal: Right to Left (Wide at Right, Narrow at Left)
                const x = (t - 0.5) * 1200; // Horizontal span
                const y = radius * Math.cos(angle);
                const z = radius * Math.sin(angle);
                return new THREE.Vector3(x, y, z);
            }
        };

        // Create Lines
        let lines: THREE.Line[] = [];
        const createLines = () => {
            lines.forEach(l => {
                scene.remove(l);
                l.geometry.dispose();
                (l.material as THREE.Material).dispose();
            });
            lines = [];

            for (let i = 0; i < settings.lineCount; i++) {
                const points = [];
                for (let j = 0; j <= settings.segmentCount; j++) {
                    points.push(getPathPoint(j / settings.segmentCount, i, settings.lineCount, isMobile));
                }

                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineBasicMaterial({
                    color: settings.lineColor,
                    transparent: true,
                    opacity: settings.opacity,
                    blending: THREE.AdditiveBlending
                });

                const line = new THREE.Line(geometry, material);
                scene.add(line);
                lines.push(line);
            }
        };
        createLines();

        // Signals
        const signals: { mesh: THREE.Mesh; lineIndex: number; progress: number; speed: number }[] = [];
        const signalGeom = new THREE.SphereGeometry(1.5, 6, 6);
        const signalMat = new THREE.MeshBasicMaterial({
            color: settings.accentColor,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.6
        });

        for (let i = 0; i < settings.signalCount; i++) {
            const mesh = new THREE.Mesh(signalGeom, signalMat);
            const lineIndex = Math.floor(Math.random() * settings.lineCount);
            const progress = Math.random();
            const speed = (isMobile ? 0.002 : 0.003) + Math.random() * 0.008;

            scene.add(mesh);
            signals.push({ mesh, lineIndex, progress, speed });
        }

        let frame = 0;
        const animate = () => {
            const animationId = requestAnimationFrame(animate);
            frame += 0.008;

            // Wave motion
            lines.forEach((line, i) => {
                const positions = line.geometry.attributes.position.array as Float32Array;
                for (let j = 0; j <= settings.segmentCount; j++) {
                    const t = j / settings.segmentCount;
                    const p = getPathPoint(t, i, settings.lineCount, isMobile);

                    const wave = Math.sin(frame + t * 4 + i * 0.1) * (15 * t);
                    const angle = (i / settings.lineCount) * Math.PI * 2;

                    if (isMobile) {
                        positions[j * 3] = p.x + Math.cos(angle) * wave;
                        positions[j * 3 + 1] = p.y;
                        positions[j * 3 + 2] = p.z + Math.sin(angle) * wave;
                    } else {
                        positions[j * 3] = p.x;
                        positions[j * 3 + 1] = p.y + Math.cos(angle) * wave;
                        positions[j * 3 + 2] = p.z + Math.sin(angle) * wave;
                    }
                }
                line.geometry.attributes.position.needsUpdate = true;
            });

            // Update Signals
            signals.forEach(sig => {
                // Speed up as it moves towards the narrow end (t=0)
                const speedMultiplier = 0.5 + 2.0 * (1 - sig.progress);

                // Progress moves from 1 (Wide) to 0 (Narrow)
                sig.progress -= sig.speed * speedMultiplier;
                if (sig.progress < 0) sig.progress = 1;

                const p = getPathPoint(sig.progress, sig.lineIndex, settings.lineCount, isMobile);
                const wave = Math.sin(frame + sig.progress * 4 + sig.lineIndex * 0.1) * (15 * sig.progress);
                const angle = (sig.lineIndex / settings.lineCount) * Math.PI * 2;

                if (isMobile) {
                    sig.mesh.position.set(
                        p.x + Math.cos(angle) * wave,
                        p.y,
                        p.z + Math.sin(angle) * wave
                    );
                } else {
                    sig.mesh.position.set(
                        p.x,
                        p.y + Math.cos(angle) * wave,
                        p.z + Math.sin(angle) * wave
                    );
                }
            });

            // Subtle rotation for depth
            scene.rotation.y = Math.sin(frame * 0.5) * 0.1;
            if (!isMobile) scene.rotation.x = Math.cos(frame * 0.3) * 0.05;

            renderer.render(scene, camera);
            return animationId;
        };

        const animId = animate();

        const handleResize = () => {
            const newIsMobile = window.innerWidth <= 968;
            if (newIsMobile !== isMobile) {
                isMobile = newIsMobile;
                camera.position.z = isMobile ? 800 : 600;
                createLines(); // Re-create lines with new orientation math
            }
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', handleResize);
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            lines.forEach(l => {
                l.geometry.dispose();
                (l.material as THREE.Material).dispose();
            });
            signals.forEach(s => {
                s.mesh.geometry.dispose();
                (s.mesh.material as THREE.Material).dispose();
            });
            renderer.dispose();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="hero-background-effect"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 1,
                pointerEvents: 'none',
                overflow: 'hidden'
            }}
        />
    );
};

export default HeroBackgroundEffect;
