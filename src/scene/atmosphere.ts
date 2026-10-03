import * as THREE from 'three';

export class AtmosphereManager {
  private scene: THREE.Scene;
  private dustPoints!: THREE.Points;
  private bokehGroup: THREE.Group;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.bokehGroup = new THREE.Group();
    this.createDustParticles();
    this.createBokehDots();
  }

  private createDustParticles() {
    const particleCount = 1200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const radius = 150 + Math.random() * 1400;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      positions[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
      positions[i * 3 + 1] = radius * Math.sin(phi);
      positions[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);

      scales[i] = 1.5 + Math.random() * 3.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Create soft particle dot texture
    const texture = this.createDotTexture();

    const material = new THREE.PointsMaterial({
      color: 0xff7686,
      size: 4,
      map: texture,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.dustPoints = new THREE.Points(geometry, material);
    this.scene.add(this.dustPoints);
  }

  private createBokehDots() {
    const bokehTexture = this.createDotTexture();

    for (let i = 0; i < 24; i++) {
      const mat = new THREE.SpriteMaterial({
        map: bokehTexture,
        color: i % 2 === 0 ? 0xff2c4a : 0xff7686,
        transparent: true,
        opacity: 0.12 + Math.random() * 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const sprite = new THREE.Sprite(mat);
      const radius = 300 + Math.random() * 1000;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      sprite.position.set(
        radius * Math.cos(theta) * Math.cos(phi),
        radius * Math.sin(phi),
        radius * Math.sin(theta) * Math.cos(phi)
      );

      const size = 60 + Math.random() * 120;
      sprite.scale.set(size, size, 1);

      this.bokehGroup.add(sprite);
    }

    this.scene.add(this.bokehGroup);
  }

  public animate(time: number) {
    if (this.dustPoints) {
      this.dustPoints.rotation.y = time * 0.00003;
      this.dustPoints.rotation.x = Math.sin(time * 0.00002) * 0.05;
    }

    this.bokehGroup.children.forEach((child, idx) => {
      child.position.y += Math.sin(time * 0.0005 + idx) * 0.15;
    });
  }

  private createDotTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.4, 'rgba(255, 118, 134, 0.6)');
    grad.addColorStop(1, 'rgba(255, 44, 74, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
}
