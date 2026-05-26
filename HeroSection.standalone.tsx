/* =============================================================================
 * HeroSection.standalone.tsx — KhilonFast hero "Funnel Flow" animasyonu
 * -----------------------------------------------------------------------------
 * TEK DOSYA. Başka dosya / CSS gerekmez. Tüm stiller inline.
 *
 * KURULUM (hedef projede):
 *   npm install three
 *   npm install -D @types/three     # TypeScript ise
 *
 * KULLANIM (ana sayfanda):
 *   import HeroSection from './HeroSection.standalone'
 *   ...
 *   <HeroSection />
 *
 * İçeriği değiştirmek için aşağıdaki <HeroSection> bileşenindeki metin/buton
 * kısımlarını düzenle. Sadece animasyonu istersen { HeroBackgroundEffect } export'unu kullan.
 *
 * AYARLAR: HeroBackgroundEffect içindeki `settings` objesi —
 *   lineColor / accentColor (renk), lineCount / signalCount (yoğunluk), opacity.
 * ===========================================================================*/
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/* ---------------------------------------------------------------------------
 * 1) ANİMASYON — Three.js WebGL "Funnel Flow" arka plan efekti
 * ------------------------------------------------------------------------- */
export const HeroBackgroundEffect: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;

        // Görünüm ayarları
        const settings = {
            lineCount: 80,
            segmentCount: 60,
            signalCount: 40,
            lineColor: 0xC5D63D,   // çizgi rengi (khilon yeşili)
            accentColor: 0xffffff, // akan sinyal rengi
            opacity: 0.12,
        };

        let isMobile = window.innerWidth <= 968;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 3000);
        camera.position.z = isMobile ? 800 : 600;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        container.appendChild(renderer.domElement);

        // Huni geometrisi — mobil dikey, masaüstü yatay
        const getPathPoint = (t: number, index: number, total: number, mobile: boolean) => {
            const funnelShape = 0.1 + 0.9 * Math.pow(t, 2.5);
            const radius = (mobile ? 200 : 300) * funnelShape;
            const angle = (index / total) * Math.PI * 2;
            if (mobile) {
                const y = (t - 0.5) * 1400;
                return new THREE.Vector3(radius * Math.cos(angle), y, radius * Math.sin(angle));
            }
            const x = (t - 0.5) * 1200;
            return new THREE.Vector3(x, radius * Math.cos(angle), radius * Math.sin(angle));
        };

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
                    blending: THREE.AdditiveBlending,
                });
                const line = new THREE.Line(geometry, material);
                scene.add(line);
                lines.push(line);
            }
        };
        createLines();

        // Akan ışık sinyalleri
        const signals: { mesh: THREE.Mesh; lineIndex: number; progress: number; speed: number }[] = [];
        const signalGeom = new THREE.SphereGeometry(1.5, 6, 6);
        const signalMat = new THREE.MeshBasicMaterial({
            color: settings.accentColor,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.6,
        });
        for (let i = 0; i < settings.signalCount; i++) {
            const mesh = new THREE.Mesh(signalGeom, signalMat);
            scene.add(mesh);
            signals.push({
                mesh,
                lineIndex: Math.floor(Math.random() * settings.lineCount),
                progress: Math.random(),
                speed: (isMobile ? 0.002 : 0.003) + Math.random() * 0.008,
            });
        }

        let frame = 0;
        const animate = (): number => {
            const animationId = requestAnimationFrame(animate);
            frame += 0.008;

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

            signals.forEach(sig => {
                const speedMultiplier = 0.5 + 2.0 * (1 - sig.progress);
                sig.progress -= sig.speed * speedMultiplier;
                if (sig.progress < 0) sig.progress = 1;
                const p = getPathPoint(sig.progress, sig.lineIndex, settings.lineCount, isMobile);
                const wave = Math.sin(frame + sig.progress * 4 + sig.lineIndex * 0.1) * (15 * sig.progress);
                const angle = (sig.lineIndex / settings.lineCount) * Math.PI * 2;
                if (isMobile) {
                    sig.mesh.position.set(p.x + Math.cos(angle) * wave, p.y, p.z + Math.sin(angle) * wave);
                } else {
                    sig.mesh.position.set(p.x, p.y + Math.cos(angle) * wave, p.z + Math.sin(angle) * wave);
                }
            });

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
                createLines();
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
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 1,
                pointerEvents: 'none',
                overflow: 'hidden',
            }}
        />
    );
};

/* ---------------------------------------------------------------------------
 * 2) HERO ALANI — animasyon + içerik (metinleri kendi projene göre değiştir)
 * ------------------------------------------------------------------------- */
type HeroSectionProps = {
    subtitle?: string;
    title?: string;
    titleHighlight?: string;
    description?: string;
    primaryLabel?: string;
    secondaryLabel?: string;
    onPrimaryClick?: () => void;
    onSecondaryClick?: () => void;
};

export default function HeroSection({
    subtitle = 'DİJİTAL PAZARLAMA',
    title = 'Markanızı büyütün,',
    titleHighlight = 'geleceği yakalayın',
    description = 'Veri odaklı stratejilerle işinizi bir sonraki seviyeye taşıyoruz.',
    primaryLabel = 'Hemen Başla',
    secondaryLabel = 'Hizmetler',
    onPrimaryClick,
    onSecondaryClick,
}: HeroSectionProps) {
    return (
        <section
            style={{
                position: 'relative',
                overflow: 'hidden',
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                background: '#0c1f2e',
                color: '#fff',
                fontFamily: 'Arial, Helvetica, sans-serif',
            }}
        >
            {/* Arka plan animasyonu */}
            <HeroBackgroundEffect />

            {/* İçerik — animasyonun üstünde (zIndex: 10) */}
            <div
                style={{
                    position: 'relative',
                    zIndex: 10,
                    maxWidth: 1200,
                    margin: '0 auto',
                    padding: '4rem 1.5rem',
                    width: '100%',
                }}
            >
                <div style={{ maxWidth: 640 }}>
                    <span
                        style={{
                            display: 'inline-block',
                            letterSpacing: 2,
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            color: '#C5D63D',
                            marginBottom: '1rem',
                        }}
                    >
                        {subtitle}
                    </span>
                    <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)', lineHeight: 1.15, margin: '0 0 1rem' }}>
                        {title}
                        <br />
                        <span style={{ color: '#C5D63D' }}>{titleHighlight}</span>
                    </h1>
                    <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: '#cbd5e1', margin: '0 0 2rem' }}>
                        {description}
                    </p>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <button
                            onClick={onPrimaryClick}
                            style={{
                                padding: '12px 26px',
                                borderRadius: 10,
                                border: 'none',
                                background: '#C5D63D',
                                color: '#0c1f2e',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                            }}
                        >
                            {primaryLabel}
                        </button>
                        <button
                            onClick={onSecondaryClick}
                            style={{
                                padding: '12px 26px',
                                borderRadius: 10,
                                border: '1px solid rgba(255,255,255,0.35)',
                                background: 'transparent',
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                            }}
                        >
                            {secondaryLabel}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
