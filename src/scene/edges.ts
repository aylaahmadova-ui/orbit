import * as THREE from 'three';
import { Link } from '../types';
import { LayoutNode } from '../lib/layout';

export interface EdgeRenderObject {
  id: string;
  isCrossLink: boolean;
  sourceId: string;
  targetId: string;
  strength: number;
  lineMesh: THREE.Line;
  glowLineMesh: THREE.Line;
  pulseSprite?: THREE.Sprite;
  curve: THREE.CatmullRomCurve3;
}

export class EdgeManager {
  private scene: THREE.Scene;
  private edgesMap: Map<string, EdgeRenderObject> = new Map();
  private pulseTexture: THREE.CanvasTexture;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.pulseTexture = this.createPulseTexture();
  }

  public updateEdges(layoutNodes: Map<string, LayoutNode>, links: Link[]) {
    const activeEdgeIds = new Set<string>();

    const meNode = layoutNodes.get('me');
    if (!meNode) return;

    const originPos = new THREE.Vector3(meNode.x || 0, meNode.y || 0, meNode.z || 0);

    // 1. Primary Edges: YOU -> Each Person
    layoutNodes.forEach((node, id) => {
      if (node.isMe) return;

      const edgeId = `edge-me-${id}`;
      activeEdgeIds.add(edgeId);

      const nodePos = new THREE.Vector3(node.x || 0, node.y || 0, node.z || 0);
      let edgeObj = this.edgesMap.get(edgeId);

      if (!edgeObj) {
        edgeObj = this.createEdge(edgeId, false, 'me', id, node.strength, originPos, nodePos);
        this.edgesMap.set(edgeId, edgeObj);
      } else {
        this.updateEdgeCurve(edgeObj, originPos, nodePos, node.strength);
      }
    });

    // 2. Cross Links: Person -> Person
    for (const link of links) {
      const nodeA = layoutNodes.get(link.a);
      const nodeB = layoutNodes.get(link.b);

      if (nodeA && nodeB) {
        const edgeId = `edge-link-${link.id}`;
        activeEdgeIds.add(edgeId);

        const posA = new THREE.Vector3(nodeA.x || 0, nodeA.y || 0, nodeA.z || 0);
        const posB = new THREE.Vector3(nodeB.x || 0, nodeB.y || 0, nodeB.z || 0);

        const strengthVal = link.strength / 3; // map 1..3 to ~0.33..1.0

        let edgeObj = this.edgesMap.get(edgeId);
        if (!edgeObj) {
          edgeObj = this.createEdge(edgeId, true, link.a, link.b, strengthVal, posA, posB);
          this.edgesMap.set(edgeId, edgeObj);
        } else {
          this.updateEdgeCurve(edgeObj, posA, posB, strengthVal);
        }
      }
    }

    // 3. Cleanup unused edges
    this.edgesMap.forEach((edgeObj, id) => {
      if (!activeEdgeIds.has(id)) {
        this.scene.remove(edgeObj.lineMesh);
        this.scene.remove(edgeObj.glowLineMesh);
        if (edgeObj.pulseSprite) {
          this.scene.remove(edgeObj.pulseSprite);
        }
        this.edgesMap.delete(id);
      }
    });
  }

  public animatePulses(time: number) {
    this.edgesMap.forEach((edgeObj) => {
      if (edgeObj.pulseSprite) {
        const speed = 0.0003 + edgeObj.strength * 0.0004;
        const progress = (time * speed) % 1;
        const point = edgeObj.curve.getPoint(progress);
        edgeObj.pulseSprite.position.copy(point);
      }
    });
  }

  public setHighlightState(hoveredId: string | null, connectedIds: Set<string> | null) {
    this.edgesMap.forEach((edgeObj) => {
      const lineMat = edgeObj.lineMesh.material as THREE.LineBasicMaterial;
      const glowMat = edgeObj.glowLineMesh.material as THREE.LineBasicMaterial;

      if (!hoveredId && !connectedIds) {
        lineMat.opacity = this.getDefaultOpacity(edgeObj.strength, edgeObj.isCrossLink);
        glowMat.opacity = lineMat.opacity * 0.4;
        return;
      }

      const isConnected =
        (edgeObj.sourceId === hoveredId && connectedIds?.has(edgeObj.targetId)) ||
        (edgeObj.targetId === hoveredId && connectedIds?.has(edgeObj.sourceId)) ||
        (edgeObj.sourceId === 'me' && edgeObj.targetId === hoveredId) ||
        (edgeObj.targetId === 'me' && edgeObj.sourceId === hoveredId);

      if (isConnected) {
        lineMat.opacity = 1.0;
        glowMat.opacity = 0.8;
      } else {
        lineMat.opacity = 0.08;
        glowMat.opacity = 0.02;
      }
    });
  }

  private createEdge(
    id: string,
    isCrossLink: boolean,
    sourceId: string,
    targetId: string,
    strength: number,
    start: THREE.Vector3,
    end: THREE.Vector3
  ): EdgeRenderObject {
    const curve = this.computeCurve(start, end);
    const points = curve.getPoints(32);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const color = this.getEdgeColor(strength, isCrossLink);
    const opacity = this.getDefaultOpacity(strength, isCrossLink);

    // Core crisp line
    const lineMat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      linewidth: 1
    });
    const lineMesh = new THREE.Line(geometry, lineMat);

    // Glow under-line
    const glowMat = new THREE.LineBasicMaterial({
      color: 0xff2c4a,
      transparent: true,
      opacity: opacity * 0.4,
      blending: THREE.AdditiveBlending
    });
    const glowLineMesh = new THREE.Line(geometry.clone(), glowMat);

    this.scene.add(glowLineMesh);
    this.scene.add(lineMesh);

    // Pulse sprite for strong connections
    let pulseSprite: THREE.Sprite | undefined;
    if (strength >= 0.55 && !isCrossLink) {
      const spriteMat = new THREE.SpriteMaterial({
        map: this.pulseTexture,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.8
      });
      pulseSprite = new THREE.Sprite(spriteMat);
      pulseSprite.scale.set(16, 16, 1);
      this.scene.add(pulseSprite);
    }

    return {
      id,
      isCrossLink,
      sourceId,
      targetId,
      strength,
      lineMesh,
      glowLineMesh,
      pulseSprite,
      curve
    };
  }

  private updateEdgeCurve(
    edgeObj: EdgeRenderObject,
    start: THREE.Vector3,
    end: THREE.Vector3,
    strength: number
  ) {
    edgeObj.curve = this.computeCurve(start, end);
    edgeObj.strength = strength;
    const points = edgeObj.curve.getPoints(32);

    edgeObj.lineMesh.geometry.setFromPoints(points);
    edgeObj.glowLineMesh.geometry.setFromPoints(points);
  }

  private computeCurve(start: THREE.Vector3, end: THREE.Vector3): THREE.CatmullRomCurve3 {
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    const dist = start.distanceTo(end);

    // Arch middle control point upwards/outwards
    const dir = new THREE.Vector3().subVectors(end, start).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(dir, up).normalize();

    mid.y += dist * 0.12;
    mid.addScaledVector(normal, dist * 0.08);

    return new THREE.CatmullRomCurve3([start, mid, end]);
  }

  private getEdgeColor(strength: number, isCrossLink: boolean): THREE.Color {
    if (isCrossLink) return new THREE.Color(0xd92a44);
    if (strength > 0.75) return new THREE.Color(0xff7686);
    if (strength > 0.5) return new THREE.Color(0xff3d55);
    return new THREE.Color(0xa81e34);
  }

  private getDefaultOpacity(strength: number, isCrossLink: boolean): number {
    if (isCrossLink) return 0.4;
    return 0.35 + strength * 0.55;
  }

  private createPulseTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.3, 'rgba(255, 118, 134, 0.8)');
    grad.addColorStop(1, 'rgba(255, 44, 74, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
}
