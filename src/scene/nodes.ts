import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Person } from '../types';
import { LayoutNode } from '../lib/layout';

// Icon SVG path strings for procedural canvas drawing
export const SVG_ICONS: Record<string, string> = {
  user: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  heart: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  'user-check': 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm7.5-6.5l-3.5 3.5-1.5-1.5',
  home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  sun: 'M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1z',
  zap: 'M7 2v11h3v9l7-12h-4l4-8z',
  smile: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-3.5-9c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm7 0c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z',
  music: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
  compass: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.19 12.19L6 18l3.81-8.19L18 6l-3.81 8.19z',
  coffee: 'M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z',
  globe: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
  film: 'M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H9l2 4H8L6 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z',
  briefcase: 'M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z',
  code: 'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z',
  layers: 'M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z',
  'pie-chart': 'M11 2v20c5.52 0 10-4.48 10-10S16.52 2 11 2zm2 2.06c3.96.48 7 3.86 7 7.94 0 .58-.08 1.14-.2 1.69L13 7.82V4.06z',
  hash: 'M20 9h-5l1-5h-2l-1 5h-4l1-5H8l-1 5H2v2h5l-1 5H1l-1 2h5l-1 5h2l1-5h4l-1 5h2l1-5h5v-2h-5l1-5h6V9z'
};

// Procedural Halo texture
function createHaloTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255, 61, 85, 0.85)');
  grad.addColorStop(0.3, 'rgba(255, 44, 74, 0.4)');
  grad.addColorStop(0.7, 'rgba(168, 30, 52, 0.12)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const haloTexture = createHaloTexture();
const haloMaterial = new THREE.SpriteMaterial({
  map: haloTexture,
  blending: THREE.AdditiveBlending,
  transparent: true,
  depthWrite: false
});

// Procedural Node Disc texture with rim light & SVG icon
function createNodeTexture(iconKey: string, isMe: boolean = false, strength: number = 0.5): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const center = 128;
  const radius = 108;

  // 1. Dark glassy disc fill with soft inner glow
  const discGrad = ctx.createRadialGradient(center, center, 0, center, center, radius);
  if (isMe) {
    discGrad.addColorStop(0, '#ff3d55');
    discGrad.addColorStop(0.7, '#a81e34');
    discGrad.addColorStop(1, '#0c0206');
  } else {
    discGrad.addColorStop(0, 'rgba(45, 12, 22, 0.95)');
    discGrad.addColorStop(0.8, 'rgba(20, 4, 9, 0.98)');
    discGrad.addColorStop(1, 'rgba(8, 1, 3, 1)');
  }

  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fillStyle = discGrad;
  ctx.fill();

  // 2. Rim light highlight (brighter on top-left)
  const rimGrad = ctx.createLinearGradient(center - radius, center - radius, center + radius, center + radius);
  if (isMe) {
    rimGrad.addColorStop(0, '#ffffff');
    rimGrad.addColorStop(0.5, '#ff7686');
    rimGrad.addColorStop(1, 'rgba(168, 30, 52, 0.3)');
  } else {
    rimGrad.addColorStop(0, `rgba(255, 118, 134, ${0.4 + strength * 0.5})`);
    rimGrad.addColorStop(0.4, `rgba(255, 61, 85, ${0.2 + strength * 0.4})`);
    rimGrad.addColorStop(1, 'rgba(50, 10, 20, 0.2)');
  }

  ctx.lineWidth = isMe ? 8 : Math.max(3, 4 + strength * 4);
  ctx.strokeStyle = rimGrad;
  ctx.stroke();

  // 3. Draw SVG Line Icon inside disc
  const pathStr = SVG_ICONS[iconKey] || SVG_ICONS['user'];
  const path = new Path2D(pathStr);

  ctx.save();
  ctx.translate(center, center);
  ctx.scale(3.5, 3.5);
  ctx.translate(-12, -12); // center 24x24 icon

  ctx.fillStyle = isMe ? '#ffffff' : `rgba(255, 217, 221, ${0.7 + strength * 0.3})`;
  ctx.shadowColor = isMe ? '#ffffff' : '#ff3d55';
  ctx.shadowBlur = isMe ? 12 : 6;
  ctx.fill(path);
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export interface NodeMeshGroup {
  group: THREE.Group;
  discMesh: THREE.Mesh;
  haloSprite: THREE.Sprite;
  labelObject: CSS2DObject;
  labelDiv: HTMLDivElement;
  id: string;
  isMe: boolean;
  baseScale: number;
}

export class NodeManager {
  private scene: THREE.Scene;
  private nodeGroupsMap: Map<string, NodeMeshGroup> = new Map();
  private textureCache: Map<string, THREE.CanvasTexture> = new Map();

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public updateNodes(layoutNodes: Map<string, LayoutNode>, meName: string = 'YOU') {
    const activeIds = new Set<string>();

    layoutNodes.forEach((layoutNode, id) => {
      activeIds.add(id);
      let groupObj = this.nodeGroupsMap.get(id);

      if (!groupObj) {
        groupObj = this.createNodeGroup(layoutNode, meName);
        this.nodeGroupsMap.set(id, groupObj);
        this.scene.add(groupObj.group);
      } else {
        // Update label text if person name changed
        if (layoutNode.isMe) {
          groupObj.labelDiv.textContent = meName;
        } else if (layoutNode.person) {
          groupObj.labelDiv.textContent = layoutNode.person.name;
        }
      }

      // Update position from layout
      const x = layoutNode.x || 0;
      const y = layoutNode.y || 0;
      const z = layoutNode.z || 0;

      groupObj.group.position.set(x, y, z);
    });

    // Remove deleted nodes
    this.nodeGroupsMap.forEach((groupObj, id) => {
      if (!activeIds.has(id)) {
        this.scene.remove(groupObj.group);
        groupObj.labelObject.removeFromParent();
        this.nodeGroupsMap.delete(id);
      }
    });
  }

  private createNodeGroup(layoutNode: LayoutNode, meName: string): NodeMeshGroup {
    const group = new THREE.Group();
    const isMe = layoutNode.isMe;
    const strength = layoutNode.strength;
    const iconKey = isMe ? 'user' : layoutNode.person?.icon || 'user';

    // Base size scaling: ME = 32, Strength 1 = 28, Strength 0 = 16
    const discRadius = isMe ? 32 : 16 + strength * 12;

    // 1. Node Disc Mesh
    const cacheKey = `${iconKey}_${isMe}_${strength.toFixed(2)}`;
    let texture = this.textureCache.get(cacheKey);
    if (!texture) {
      texture = createNodeTexture(iconKey, isMe, strength);
      this.textureCache.set(cacheKey, texture);
    }

    const discGeo = new THREE.PlaneGeometry(discRadius * 2, discRadius * 2);
    const discMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const discMesh = new THREE.Mesh(discGeo, discMat);
    discMesh.userData = { id: layoutNode.id, isMe, isNodeDisc: true };
    group.add(discMesh);

    // Make disc face the camera dynamically or stay billboarded
    discMesh.onBeforeRender = (renderer, scene, camera) => {
      discMesh.quaternion.copy(camera.quaternion);
    };

    // 2. Halo Sprite
    const haloScale = isMe ? 180 : discRadius * (3.5 + strength * 1.5);
    const haloSprite = new THREE.Sprite(haloMaterial.clone());
    haloSprite.scale.set(haloScale, haloScale, 1);
    (haloSprite.material as THREE.SpriteMaterial).opacity = isMe ? 0.95 : 0.4 + strength * 0.4;
    group.add(haloSprite);

    // 3. CSS2D Label
    const labelDiv = document.createElement('div');
    labelDiv.className = isMe
      ? 'node-label is-me'
      : `node-label category-${layoutNode.person?.category || 'friend'}`;
    labelDiv.textContent = isMe ? meName : layoutNode.person?.name || '';

    const labelObject = new CSS2DObject(labelDiv);
    labelObject.position.set(0, -discRadius * 0.7, 0);
    group.add(labelObject);

    return {
      group,
      discMesh,
      haloSprite,
      labelObject,
      labelDiv,
      id: layoutNode.id,
      isMe,
      baseScale: discRadius
    };
  }

  public setHighlightState(hoveredId: string | null, connectedIds: Set<string> | null) {
    this.nodeGroupsMap.forEach((nodeGroup, id) => {
      const labelDiv = nodeGroup.labelDiv;

      if (!hoveredId && !connectedIds) {
        // Reset state
        labelDiv.classList.remove('is-dimmed', 'is-highlighted');
        (nodeGroup.discMesh.material as THREE.MeshBasicMaterial).opacity = 1.0;
        (nodeGroup.haloSprite.material as THREE.SpriteMaterial).opacity = nodeGroup.isMe ? 0.95 : 0.6;
        return;
      }

      const isTarget = id === hoveredId;
      const isConnected = connectedIds ? connectedIds.has(id) : false;

      if (isTarget || isConnected) {
        labelDiv.classList.remove('is-dimmed');
        labelDiv.classList.add('is-highlighted');
        (nodeGroup.discMesh.material as THREE.MeshBasicMaterial).opacity = 1.0;
        (nodeGroup.haloSprite.material as THREE.SpriteMaterial).opacity = 1.0;
      } else {
        labelDiv.classList.remove('is-highlighted');
        labelDiv.classList.add('is-dimmed');
        (nodeGroup.discMesh.material as THREE.MeshBasicMaterial).opacity = 0.25;
        (nodeGroup.haloSprite.material as THREE.SpriteMaterial).opacity = 0.1;
      }
    });
  }

  public setCategoryFilter(hiddenCategories: Set<string>) {
    this.nodeGroupsMap.forEach((nodeGroup, id) => {
      if (nodeGroup.isMe) return;

      const category = nodeGroup.group.userData.category;
      if (hiddenCategories.has(category)) {
        nodeGroup.group.visible = false;
        nodeGroup.labelDiv.style.display = 'none';
      } else {
        nodeGroup.group.visible = true;
        nodeGroup.labelDiv.style.display = 'block';
      }
    });
  }

  public getNodeGroupMap() {
    return this.nodeGroupsMap;
  }
}
