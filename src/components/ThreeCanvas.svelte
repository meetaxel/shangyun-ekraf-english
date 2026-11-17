<script>
  import { onMount, onDestroy } from 'svelte';
  import * as THREE from 'three';

  let container;
  let scene, camera, renderer;
  let particles, ringMesh;
  let animationFrameId;
  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;

  function onMouseMove(event) {
    mouseX = (event.clientX - window.innerWidth / 2) * 0.0008;
    mouseY = (event.clientY - window.innerHeight / 2) * 0.0008;
  }

  function onWindowResize() {
    if (!renderer || !camera || !container) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onMount(() => {
    if (typeof window === 'undefined' || !container) return;

    // 1. Scene setup
    scene = new THREE.Scene();

    // 2. Camera setup
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 24;

    // 3. Renderer setup
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xfff2c2, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xd4af37, 2.5, 100);
    pointLight.position.set(10, 15, 15);
    scene.add(pointLight);

    const crimsonLight = new THREE.PointLight(0x8b1524, 2, 80);
    crimsonLight.position.set(-15, -10, 10);
    scene.add(crimsonLight);

    // 5. Golden Particles (Gold Dust / Auspicious Flakes)
    const particleCount = 280;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 55;
      positions[i + 1] = (Math.random() - 0.5) * 40;
      positions[i + 2] = (Math.random() - 0.5) * 35;
      scales[i / 3] = Math.random() * 0.8 + 0.3;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Particle Material
    const pMaterial = new THREE.PointsMaterial({
      color: 0xd4af37,
      size: 0.28,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });

    particles = new THREE.Points(geometry, pMaterial);
    scene.add(particles);

    // 6. Ornamental Celestial Torus (Auspicious Imperial Ring)
    const ringGeo = new THREE.TorusGeometry(8.5, 0.08, 16, 100);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.2,
      wireframe: true,
      transparent: true,
      opacity: 0.35
    });
    ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.set(8, -2, -6);
    scene.add(ringMesh);

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);

    // Animation Loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      if (particles) {
        particles.rotation.y += 0.0008;
        particles.rotation.x += 0.0004;
      }

      if (ringMesh) {
        ringMesh.rotation.x += 0.002;
        ringMesh.rotation.y += 0.003;
      }

      camera.position.x = targetX * 12;
      camera.position.y = -targetY * 12;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('mousemove', onMouseMove);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (renderer) {
        renderer.dispose();
      }
    }
  });
</script>

<div bind:this={container} class="three-background-canvas" aria-hidden="true"></div>

<style>
  .three-background-canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 0;
    opacity: 0.85;
  }
</style>
