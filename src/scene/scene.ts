import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

const VignetteGrainShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0.0 },
    uVignette: { value: 1.2 },
    uGrain: { value: 0.04 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uVignette;
    uniform float uGrain;
    varying vec2 vUv;

    float rand(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }

    void main() {
      vec4 tex = texture2D(tDiffuse, vUv);
      vec2 uv = vUv - 0.5;
      float dist = length(uv);
      float vignette = smoothstep(0.7, 0.25, dist * uVignette);
      tex.rgb *= mix(1.0, vignette, 0.75);

      float grain = (rand(vUv * uTime) - 0.5) * uGrain;
      tex.rgb += grain;

      gl_FragColor = tex;
    }
  `
};

export class OrbitScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public labelRenderer: CSS2DRenderer;
  public controls: OrbitControls;
  public composer: EffectComposer;
  public bloomPass: UnrealBloomPass;
  public vignettePass: ShaderPass;
  public container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Three Scene & Fog
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0c0206, 0.00075);

    // 2. Camera
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(50, width / height, 1, 4000);
    this.camera.position.set(0, 450, 750);

    // 3. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    // 4. CSS2D Label Renderer
    this.labelRenderer = new CSS2DRenderer();
    this.labelRenderer.setSize(width, height);
    this.labelRenderer.domElement.style.position = 'absolute';
    this.labelRenderer.domElement.style.top = '0';
    this.labelRenderer.domElement.style.left = '0';
    this.labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(this.labelRenderer.domElement);

    // 5. Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 80;
    this.controls.maxDistance = 1800;
    this.controls.target.set(0, 0, 0);

    // 6. Post Processing Setup
    const renderPass = new RenderPass(this.scene, this.camera);
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      1.2, // strength
      0.4, // radius
      0.15 // threshold
    );

    this.vignettePass = new ShaderPass(VignetteGrainShader);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderPass);
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(this.vignettePass);

    // 7. Ambient & Soft Directional Lighting
    const ambient = new THREE.AmbientLight(0xff3d55, 0.8);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xff7686, 1.5);
    dirLight.position.set(200, 400, 300);
    this.scene.add(dirLight);

    // Resize handler
    window.addEventListener('resize', this.onResize.bind(this));
  }

  public setBloomStrength(strength: number) {
    this.bloomPass.strength = strength;
  }

  public render(time: number = 0) {
    this.controls.update();
    this.vignettePass.uniforms.uTime.value = time * 0.001;
    this.composer.render();
    this.labelRenderer.render(this.scene, this.camera);
  }

  private onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.labelRenderer.setSize(width, height);
    this.composer.setSize(width, height);
    this.bloomPass.resolution.set(width, height);
  }
}
