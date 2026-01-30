import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const HeroPlasmaCore: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const isMobile = window.innerWidth <= 968;

        // --- CONFIGURATION ---
        const params = {
            timeScale: 0.6,
            rotationSpeedX: 0.001,
            rotationSpeedY: 0.002,
            plasmaScale: 0.15,
            plasmaBrightness: 1.5,
            voidThreshold: 0.05,
            colorDeep: new THREE.Color(0x001433),
            colorMid: new THREE.Color(0x0084ff),
            colorBright: new THREE.Color(0xC5D63D), // Lime highlight for brand consistency
            shellColor: new THREE.Color(0xC5D63D),
            shellOpacity: 0.3
        };

        // Scene Setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        camera.position.z = isMobile ? 3.5 : 2.5;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        container.appendChild(renderer.domElement);

        const mainGroup = new THREE.Group();
        scene.add(mainGroup);

        // GLSL Noise Functions
        const noiseFunctions = `
            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
            vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

            float snoise(vec3 v) {
                const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
                const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
                vec3 i  = floor(v + dot(v, C.yyy) );
                vec3 x0 = v - i + dot(i, C.xxx) ;
                vec3 g = step(x0.yzx, x0.xyz);
                vec3 l = 1.0 - g;
                vec3 i1 = min( g.xyz, l.zxy );
                vec3 i2 = max( g.xyz, l.zxy );
                vec3 x1 = x0 - i1 + C.xxx;
                vec3 x2 = x0 - i2 + C.yyy;
                vec3 x3 = x0 - D.yyy;
                i = mod289(i);
                vec4 p = permute( permute( permute(
                            i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                        + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                        + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
                float n_ = 0.142857142857;
                vec3  ns = n_ * D.wyz - D.xzx;
                vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
                vec4 x_ = floor(j * ns.z);
                vec4 y_ = floor(j - 7.0 * x_ );
                vec4 x = x_ *ns.x + ns.yyyy;
                vec4 y = y_ *ns.x + ns.yyyy;
                vec4 h = 1.0 - abs(x) - abs(y);
                vec4 b0 = vec4( x.xy, y.xy );
                vec4 b1 = vec4( x.zw, y.zw );
                vec4 s0 = floor(b0)*2.0 + 1.0;
                vec4 s1 = floor(b1)*2.0 + 1.0;
                vec4 sh = -step(h, vec4(0.0));
                vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
                vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
                vec3 p0 = vec3(a0.xy,h.x);
                vec3 p1 = vec3(a0.zw,h.y);
                vec3 p2 = vec3(a1.xy,h.z);
                vec3 p3 = vec3(a1.zw,h.w);
                vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
                p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
                vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
                m = m * m;
                return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
            }

            float fbm(vec3 p) {
                float total = 0.0;
                float amplitude = 0.5;
                float frequency = 1.0;
                for (int i = 0; i < 3; i++) { 
                    total += snoise(p * frequency) * amplitude;
                    amplitude *= 0.5;
                    frequency *= 2.0;
                }
                return total;
            }
        `;

        // Outer Shell (Glass effect)
        const shellGeo = new THREE.SphereGeometry(1.0, 64, 64);
        const shellShader = {
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vViewPosition;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    vViewPosition = -mvPosition.xyz;
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vNormal;
                varying vec3 vViewPosition;
                uniform vec3 uColor;
                uniform float uOpacity;
                
                void main() {
                    float fresnel = pow(1.0 - dot(normalize(vNormal), normalize(vViewPosition)), 2.5);
                    gl_FragColor = vec4(uColor, fresnel * uOpacity);
                }
            `
        };

        const shellBackMat = new THREE.ShaderMaterial({
            vertexShader: shellShader.vertexShader,
            fragmentShader: shellShader.fragmentShader,
            uniforms: {
                uColor: { value: new THREE.Color(0x000055) },
                uOpacity: { value: 0.2 }
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            depthWrite: false
        });

        const shellFrontMat = new THREE.ShaderMaterial({
            vertexShader: shellShader.vertexShader,
            fragmentShader: shellShader.fragmentShader,
            uniforms: {
                uColor: { value: params.shellColor },
                uOpacity: { value: params.shellOpacity }
            },
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.FrontSide,
            depthWrite: false
        });

        mainGroup.add(new THREE.Mesh(shellGeo, shellBackMat));
        mainGroup.add(new THREE.Mesh(shellGeo, shellFrontMat));

        // Plasma Core
        const plasmaGeo = new THREE.SphereGeometry(0.998, 128, 128);
        const plasmaMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uScale: { value: params.plasmaScale },
                uBrightness: { value: params.plasmaBrightness },
                uThreshold: { value: params.voidThreshold },
                uColorDeep: { value: params.colorDeep },
                uColorMid: { value: params.colorMid },
                uColorBright: { value: params.colorBright }
            },
            vertexShader: `
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying vec3 vViewPosition;
                void main() {
                    vPosition = position;
                    vNormal = normalize(normalMatrix * normal);
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    vViewPosition = -mvPosition.xyz; 
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform float uScale;
                uniform float uBrightness;
                uniform float uThreshold;
                uniform vec3 uColorDeep;
                uniform vec3 uColorMid;
                uniform vec3 uColorBright;
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying vec3 vViewPosition;
                ${noiseFunctions}
                void main() {
                    vec3 p = vPosition * uScale; 
                    vec3 q = vec3(
                        fbm(p + vec3(0.0, uTime * 0.05, 0.0)),
                        fbm(p + vec3(5.2, 1.3, 2.8) + uTime * 0.05),
                        fbm(p + vec3(2.2, 8.4, 0.5) - uTime * 0.02)
                    );
                    float density = fbm(p + 2.0 * q);
                    float t = (density + 0.4) * 0.8;
                    float alpha = smoothstep(uThreshold, 0.7, t);
                    vec3 cWhite = vec3(1.0, 1.0, 1.0);
                    vec3 color = mix(uColorDeep, uColorMid, smoothstep(uThreshold, 0.5, t));
                    color = mix(color, uColorBright, smoothstep(0.5, 0.8, t));
                    color = mix(color, cWhite, smoothstep(0.8, 1.0, t));
                    float facing = dot(normalize(vNormal), normalize(vViewPosition));
                    float depthFactor = (facing + 1.0) * 0.5;
                    float finalAlpha = alpha * (0.02 + 0.98 * depthFactor);
                    gl_FragColor = vec4(color * uBrightness, finalAlpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        const plasmaMesh = new THREE.Mesh(plasmaGeo, plasmaMat);
        mainGroup.add(plasmaMesh);

        // Internal Particles
        const pCount = isMobile ? 300 : 600;
        const pPos = new Float32Array(pCount * 3);
        const pSizes = new Float32Array(pCount);
        for (let i = 0; i < pCount; i++) {
            const r = 0.95 * Math.cbrt(Math.random());
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            pPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            pPos[i * 3 + 2] = r * Math.cos(phi);
            pSizes[i] = Math.random();
        }

        const pGeo = new THREE.BufferGeometry();
        pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        pGeo.setAttribute('aSize', new THREE.BufferAttribute(pSizes, 1));

        const pMat = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new THREE.Color(0xffffff) }
            },
            vertexShader: `
                uniform float uTime;
                attribute float aSize;
                varying float vAlpha;
                void main() {
                    vec3 pos = position;
                    pos.y += sin(uTime * 0.2 + pos.x) * 0.02;
                    pos.x += cos(uTime * 0.15 + pos.z) * 0.02;
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    float baseSize = 8.0 * aSize + 4.0;
                    gl_PointSize = baseSize * (1.0 / -mvPosition.z);
                    vAlpha = 0.8 + 0.2 * sin(uTime + aSize * 10.0);
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                varying float vAlpha;
                void main() {
                    vec2 uv = gl_PointCoord - vec2(0.5);
                    float dist = length(uv);
                    if(dist > 0.5) discard;
                    float glow = 1.0 - (dist * 2.0);
                    glow = pow(glow, 1.8);
                    gl_FragColor = vec4(uColor, glow * vAlpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        const particles = new THREE.Points(pGeo, pMat);
        mainGroup.add(particles);

        // Animation loop
        const clock = new THREE.Clock();
        let animationId: number;

        const animate = () => {
            animationId = requestAnimationFrame(animate);
            const t = clock.getElapsedTime();

            plasmaMat.uniforms.uTime.value = t * params.timeScale;
            pMat.uniforms.uTime.value = t;

            plasmaMesh.rotation.y = t * 0.08;
            mainGroup.rotation.x += params.rotationSpeedX;
            mainGroup.rotation.y += params.rotationSpeedY;

            renderer.render(scene, camera);
        };

        animate();

        const handleResize = () => {
            if (!container.parentElement) return;
            const width = container.parentElement.clientWidth;
            const height = container.parentElement.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // Initial call

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            scene.traverse((object) => {
                if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
                    object.geometry.dispose();
                    if (Array.isArray(object.material)) {
                        object.material.forEach(m => m.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            renderer.dispose();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="hero-plasma-core"
            style={{
                width: '100%',
                height: '100%',
                minHeight: '400px',
                zIndex: 2,
                pointerEvents: 'none',
                mixBlendMode: 'screen'
            }}
        />
    );
};

export default HeroPlasmaCore;
