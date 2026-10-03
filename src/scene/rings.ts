import * as THREE from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { Circle } from '../types';
import { CIRCLE_BANDS } from '../lib/circles';

export interface RingRenderGroup {
  circle: Circle;
  line: THREE.Line;
  labelObject: CSS2DObject;
  labelDiv: HTMLDivElement;
}

export class OrbitRingsManager {
  private scene: THREE.Scene;
  private ringGroups: RingRenderGroup[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.createRings();
  }

  private createRings() {
    const circles: Circle[] = ['core', 'close', 'regular', 'distant'];

    circles.forEach((circle) => {
      const radius = CIRCLE_BANDS[circle].center;

      // 1. Thin ring line geometry
      const points: THREE.Vector3[] = [];
      const segments = 128;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(radius * Math.cos(theta), 0, radius * Math.sin(theta)));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0xff2c4a,
        transparent: true,
        opacity: 0.14,
        linewidth: 1
      });

      const line = new THREE.Line(geometry, material);
      this.scene.add(line);

      // 2. CSS2D Tick label element
      const labelDiv = document.createElement('div');
      labelDiv.className = 'orbit-ring-label';
      labelDiv.textContent = `${circle.toUpperCase()}`;

      const labelObject = new CSS2DObject(labelDiv);
      // Place label on X axis at ring radius
      labelObject.position.set(radius, 0, 0);
      this.scene.add(labelObject);

      this.ringGroups.push({
        circle,
        line,
        labelObject,
        labelDiv
      });
    });
  }

  public updateCounts(counts: Record<Circle, number>) {
    this.ringGroups.forEach((rg) => {
      const count = counts[rg.circle] || 0;
      rg.labelDiv.textContent = `${rg.circle.toUpperCase()} [${count}]`;
    });
  }

  public highlightRing(circle: Circle | null) {
    this.ringGroups.forEach((rg) => {
      const mat = rg.line.material as THREE.LineBasicMaterial;
      if (!circle) {
        mat.opacity = 0.14;
        rg.labelDiv.classList.remove('is-active');
      } else if (rg.circle === circle) {
        mat.opacity = 0.6;
        rg.labelDiv.classList.add('is-active');
      } else {
        mat.opacity = 0.05;
        rg.labelDiv.classList.remove('is-active');
      }
    });
  }
}
