import * as THREE from 'three';
import { OrbitScene } from './scene';
import { NodeManager } from './nodes';
import { EdgeManager } from './edges';
import { LayoutNode, PhysicsLayout } from '../lib/layout';
import { store } from '../state/store';

export type NodeClickCallback = (personId: string | null) => void;

export class InteractionManager {
  private sceneObj: OrbitScene;
  private nodeManager: NodeManager;
  private edgeManager: EdgeManager;
  private layout: PhysicsLayout;

  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  private hoveredId: string | null = null;
  private selectedId: string | null = null;

  private isDraggingNode: boolean = false;
  private draggedNodeId: string | null = null;
  private dragPlane: THREE.Plane;

  private lastInputTime: number = Date.now();
  private autoRotateEnabled: boolean = true;

  private cameraAnimation: {
    active: boolean;
    startPos: THREE.Vector3;
    targetPos: THREE.Vector3;
    startLookAt: THREE.Vector3;
    targetLookAt: THREE.Vector3;
    startTime: number;
    duration: number;
  } | null = null;

  private onSelectNodeCallback?: NodeClickCallback;

  constructor(
    sceneObj: OrbitScene,
    nodeManager: NodeManager,
    edgeManager: EdgeManager,
    layout: PhysicsLayout
  ) {
    this.sceneObj = sceneObj;
    this.nodeManager = nodeManager;
    this.edgeManager = edgeManager;
    this.layout = layout;

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2(-999, -999);
    this.dragPlane = new THREE.Plane();

    this.setupEventListeners();
  }

  public setOnSelectNode(cb: NodeClickCallback) {
    this.onSelectNodeCallback = cb;
  }

  public setAutoRotateEnabled(enabled: boolean) {
    this.autoRotateEnabled = enabled;
  }

  private setupEventListeners() {
    const dom = this.sceneObj.renderer.domElement;

    dom.addEventListener('pointermove', this.onPointerMove.bind(this));
    dom.addEventListener('pointerdown', this.onPointerDown.bind(this));
    dom.addEventListener('pointerup', this.onPointerUp.bind(this));
    dom.addEventListener('dblclick', this.onDoubleClick.bind(this));

    // Stop auto rotate on user interaction
    ['pointerdown', 'wheel', 'touchstart', 'keydown'].forEach((evt) => {
      window.addEventListener(evt, () => {
        this.lastInputTime = Date.now();
      });
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.clearSelection();
      }
    });
  }

  private onPointerMove(e: PointerEvent) {
    const rect = this.sceneObj.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Node Dragging logic
    if (this.isDraggingNode && this.draggedNodeId) {
      this.raycaster.setFromCamera(this.mouse, this.sceneObj.camera);
      const intersectPoint = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(this.dragPlane, intersectPoint);

      const layoutNode = this.layout.getNode(this.draggedNodeId);
      if (layoutNode && !layoutNode.isMe) {
        layoutNode.x = intersectPoint.x;
        layoutNode.y = intersectPoint.y;
        layoutNode.z = intersectPoint.z;
        layoutNode.fx = intersectPoint.x;
        layoutNode.fy = intersectPoint.y;
        layoutNode.fz = intersectPoint.z;
        this.layout.reheat();
      }
      return;
    }

    // Hover raycasting
    this.raycaster.setFromCamera(this.mouse, this.sceneObj.camera);
    const nodeGroups = Array.from(this.nodeManager.getNodeGroupMap().values());
    const meshes = nodeGroups.map((g) => g.discMesh);

    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object as THREE.Mesh;
      const hitId = hitMesh.userData.id;
      this.setHoveredNode(hitId, e.clientX, e.clientY);
    } else {
      this.setHoveredNode(null);
    }
  }

  private onPointerDown(e: PointerEvent) {
    if (e.button !== 0) return; // Only left click

    this.raycaster.setFromCamera(this.mouse, this.sceneObj.camera);
    const nodeGroups = Array.from(this.nodeManager.getNodeGroupMap().values());
    const meshes = nodeGroups.map((g) => g.discMesh);

    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object as THREE.Mesh;
      const hitId = hitMesh.userData.id;

      if (hitId !== 'me') {
        this.isDraggingNode = true;
        this.draggedNodeId = hitId;
        this.sceneObj.controls.enabled = false;

        // Set drag plane parallel to camera facing
        const normal = this.sceneObj.camera.getWorldDirection(new THREE.Vector3()).negate();
        this.dragPlane.setFromNormalAndCoplanarPoint(normal, hitMesh.position);
      }
    }
  }

  private onPointerUp(e: PointerEvent) {
    if (this.isDraggingNode && this.draggedNodeId) {
      const layoutNode = this.layout.getNode(this.draggedNodeId);
      if (layoutNode && layoutNode.x !== undefined && layoutNode.y !== undefined && layoutNode.z !== undefined) {
        store.pinPerson(this.draggedNodeId, { x: layoutNode.x, y: layoutNode.y, z: layoutNode.z });
      }

      this.isDraggingNode = false;
      this.draggedNodeId = null;
      this.sceneObj.controls.enabled = true;
      return;
    }

    // Single Click Node Focus
    this.raycaster.setFromCamera(this.mouse, this.sceneObj.camera);
    const nodeGroups = Array.from(this.nodeManager.getNodeGroupMap().values());
    const meshes = nodeGroups.map((g) => g.discMesh);

    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hitId = (intersects[0].object as THREE.Mesh).userData.id;
      this.selectNode(hitId);
    } else {
      // Clicked empty space
      this.clearSelection();
    }
  }

  private onDoubleClick(e: MouseEvent) {
    this.raycaster.setFromCamera(this.mouse, this.sceneObj.camera);
    const nodeGroups = Array.from(this.nodeManager.getNodeGroupMap().values());
    const meshes = nodeGroups.map((g) => g.discMesh);

    const intersects = this.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const hitId = (intersects[0].object as THREE.Mesh).userData.id;
      // Double click on a pinned node unpins it
      if (hitId !== 'me') {
        store.unpinPerson(hitId);
      }
    } else {
      // Double click empty space resets overview camera
      this.resetCameraOverview();
    }
  }

  public selectNode(id: string) {
    this.selectedId = id;
    const layoutNode = this.layout.getNode(id);

    if (layoutNode && layoutNode.x !== undefined && layoutNode.y !== undefined && layoutNode.z !== undefined) {
      const targetLook = new THREE.Vector3(layoutNode.x, layoutNode.y, layoutNode.z);
      const camOffset = new THREE.Vector3()
        .subVectors(this.sceneObj.camera.position, this.sceneObj.controls.target)
        .normalize()
        .multiplyScalar(220);

      const targetCamPos = new THREE.Vector3().addVectors(targetLook, camOffset);

      this.flyCameraTo(targetCamPos, targetLook);
    }

    if (this.onSelectNodeCallback) {
      this.onSelectNodeCallback(id === 'me' ? null : id);
    }
  }

  public clearSelection() {
    this.selectedId = null;
    this.setHoveredNode(null);
    if (this.onSelectNodeCallback) {
      this.onSelectNodeCallback(null);
    }
  }

  public resetCameraOverview() {
    this.flyCameraTo(new THREE.Vector3(0, 450, 750), new THREE.Vector3(0, 0, 0));
  }

  private flyCameraTo(targetCamPos: THREE.Vector3, targetLookAt: THREE.Vector3) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duration = prefersReducedMotion ? 200 : 800;

    this.cameraAnimation = {
      active: true,
      startPos: this.sceneObj.camera.position.clone(),
      targetPos: targetCamPos.clone(),
      startLookAt: this.sceneObj.controls.target.clone(),
      targetLookAt: targetLookAt.clone(),
      startTime: performance.now(),
      duration
    };
  }

  private setHoveredNode(id: string | null, clientX: number = 0, clientY: number = 0) {
    if (this.hoveredId === id) {
      if (id) this.updateTooltipPosition(clientX, clientY);
      return;
    }

    this.hoveredId = id;

    if (!id) {
      this.nodeManager.setHighlightState(null, null);
      this.edgeManager.setHighlightState(null, null);
      this.hideTooltip();
      return;
    }

    // Gather connected node IDs
    const connected = new Set<string>();
    connected.add('me'); // always connected to ME

    const appState = store.getState();
    appState.links.forEach((link) => {
      if (link.a === id) connected.add(link.b);
      if (link.b === id) connected.add(link.a);
    });

    this.nodeManager.setHighlightState(id, connected);
    this.edgeManager.setHighlightState(id, connected);

    this.showTooltip(id, clientX, clientY);
  }

  private showTooltip(id: string, x: number, y: number) {
    const tooltip = document.getElementById('tooltip');
    if (!tooltip) return;

    const layoutNode = this.layout.getNode(id);
    if (!layoutNode) return;

    const nameEl = tooltip.querySelector('.tooltip-name') as HTMLElement;
    const metaEl = tooltip.querySelector('.tooltip-meta') as HTMLElement;

    if (layoutNode.isMe) {
      nameEl.textContent = store.getState().me.name;
      metaEl.textContent = 'Central Node';
    } else if (layoutNode.person) {
      nameEl.textContent = layoutNode.person.name;
      metaEl.innerHTML = `<span>${layoutNode.person.category.replace('_', ' ')}</span><span>Strength ${(
        layoutNode.strength * 100
      ).toFixed(0)}%</span>`;
    }

    tooltip.classList.add('visible');
    this.updateTooltipPosition(x, y);
  }

  private updateTooltipPosition(x: number, y: number) {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
    }
  }

  private hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
      tooltip.classList.remove('visible');
    }
  }

  public update(now: number) {
    // 1. Smooth Camera Fly-To Interpolation
    if (this.cameraAnimation && this.cameraAnimation.active) {
      const elapsed = now - this.cameraAnimation.startTime;
      const progress = Math.min(1, elapsed / this.cameraAnimation.duration);

      // Smooth cubic ease-in-out curve
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      this.sceneObj.camera.position.lerpVectors(
        this.cameraAnimation.startPos,
        this.cameraAnimation.targetPos,
        ease
      );
      this.sceneObj.controls.target.lerpVectors(
        this.cameraAnimation.startLookAt,
        this.cameraAnimation.targetLookAt,
        ease
      );

      if (progress >= 1) {
        this.cameraAnimation.active = false;
      }
    }

    // 2. Idle Auto-Rotate
    const idleTime = Date.now() - this.lastInputTime;
    const isIdle = idleTime > 10000;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (this.autoRotateEnabled && isIdle && !this.isDraggingNode && !prefersReducedMotion) {
      this.sceneObj.controls.autoRotate = true;
      this.sceneObj.controls.autoRotateSpeed = 0.4;
    } else {
      this.sceneObj.controls.autoRotate = false;
    }
  }
}
