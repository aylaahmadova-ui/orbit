import { forceSimulation, forceRadial, forceManyBody, forceCollide, forceLink } from 'd3-force-3d';
import { Person, Link, Circle } from '../types';
import { getTargetRadius, getCircleFromRadius } from './circles';
import { store } from '../state/store';

export interface LayoutNode {
  id: string;
  isMe: boolean;
  circle?: Circle;
  drift?: number;
  targetRadius: number;
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  fx?: number | null;
  fy?: number | null;
  fz?: number | null;
  person?: Person;
}

export interface LayoutLink {
  source: string | LayoutNode;
  target: string | LayoutNode;
}

export class PhysicsLayout {
  private simulation: any;
  private nodesMap: Map<string, LayoutNode> = new Map();
  private links: LayoutLink[] = [];
  private onTickCallback?: () => void;
  private isPhysicsEnabled: boolean = true;

  constructor() {
    this.simulation = forceSimulation([])
      .numDimensions(3)
      .alphaDecay(0.02)
      .velocityDecay(0.3);

    this.simulation.on('tick', () => {
      this.constrainShell();
      if (this.onTickCallback) {
        this.onTickCallback();
      }
    });
  }

  public setOnTick(callback: () => void) {
    this.onTickCallback = callback;
  }

  public setPhysicsEnabled(enabled: boolean) {
    this.isPhysicsEnabled = enabled;
    if (enabled) {
      this.reheat();
    } else {
      this.simulation.stop();
    }
  }

  public updateData(people: Person[], links: Link[]) {
    const existingNodes = this.nodesMap;
    const newNodesMap = new Map<string, LayoutNode>();

    // 1. Central node YOU
    const meNode: LayoutNode = existingNodes.get('me') || {
      id: 'me',
      isMe: true,
      targetRadius: 0,
      x: 0,
      y: 0,
      z: 0,
      fx: 0,
      fy: 0,
      fz: 0
    };
    meNode.fx = 0;
    meNode.fy = 0;
    meNode.fz = 0;
    meNode.x = 0;
    meNode.y = 0;
    meNode.z = 0;
    newNodesMap.set('me', meNode);

    // 2. People nodes mapped to Dunbar circles
    for (const p of people) {
      const targetRadius = getTargetRadius(p.circle, p.drift);
      const existing = existingNodes.get(p.id);

      let node: LayoutNode;
      if (existing) {
        node = existing;
        node.circle = p.circle;
        node.drift = p.drift;
        node.targetRadius = targetRadius;
        node.person = p;
      } else {
        const angle = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI * 0.4;
        const r = targetRadius;

        node = {
          id: p.id,
          isMe: false,
          circle: p.circle,
          drift: p.drift,
          targetRadius,
          person: p,
          x: r * Math.cos(angle) * Math.cos(phi),
          y: r * Math.sin(phi),
          z: r * Math.sin(angle) * Math.cos(phi)
        };
      }

      if (p.pinned) {
        node.fx = p.pinned.x;
        node.fy = p.pinned.y;
        node.fz = p.pinned.z;
      } else {
        node.fx = null;
        node.fy = null;
        node.fz = null;
      }

      newNodesMap.set(p.id, node);
    }

    this.nodesMap = newNodesMap;
    const nodesArray = Array.from(this.nodesMap.values());

    // 3. Person-to-person links
    const layoutLinks: LayoutLink[] = [];
    for (const l of links) {
      if (this.nodesMap.has(l.a) && this.nodesMap.has(l.b)) {
        layoutLinks.push({
          source: l.a,
          target: l.b
        });
      }
    }
    this.links = layoutLinks;

    // 4. Update d3-force-3d forces
    this.simulation.nodes(nodesArray);

    const radialForce = forceRadial((d: any) => d.targetRadius, 0, 0, 0).strength((d: any) =>
      d.isMe ? 0 : 0.8
    );

    const collideForce = forceCollide((d: any) => (d.isMe ? 40 : 25)).strength(0.7);
    const chargeForce = forceManyBody().strength((d: any) => (d.isMe ? -300 : -100));

    const linkForce = forceLink(layoutLinks)
      .id((d: any) => d.id)
      .distance(150)
      .strength(0.2);

    this.simulation
      .force('radial', radialForce)
      .force('collide', collideForce)
      .force('charge', chargeForce)
      .force('link', linkForce);

    if (this.isPhysicsEnabled) {
      this.reheat();
    }
  }

  public handleNodeDragPosition(id: string, x: number, y: number, z: number): Circle | null {
    const layoutNode = this.nodesMap.get(id);
    if (!layoutNode || layoutNode.isMe || !layoutNode.person) return null;

    const radialDist = Math.sqrt(x * x + y * y + z * z);
    const { circle, drift } = getCircleFromRadius(radialDist);

    const previousCircle = layoutNode.person.circle;
    layoutNode.targetRadius = getTargetRadius(circle, drift);

    if (previousCircle !== circle) {
      store.updateCircle(id, circle, drift);
      return circle;
    } else {
      layoutNode.person.drift = drift;
    }
    return null;
  }

  public reheat() {
    if (!this.isPhysicsEnabled) return;
    this.simulation.alpha(0.3).restart();
  }

  private constrainShell() {
    this.nodesMap.forEach((node) => {
      if (node.isMe) return;
      if (node.fx !== null && node.fx !== undefined) return;

      const xyDist = Math.sqrt((node.x || 0) ** 2 + (node.y || 0) ** 2);
      const maxZ = Math.max(30, (xyDist || node.targetRadius) * 0.35);

      if (node.z !== undefined) {
        if (node.z > maxZ) {
          node.z = maxZ;
          if (node.vz) node.vz *= -0.5;
        } else if (node.z < -maxZ) {
          node.z = -maxZ;
          if (node.vz) node.vz *= -0.5;
        }
      }
    });
  }

  public getNodesMap(): Map<string, LayoutNode> {
    return this.nodesMap;
  }

  public getNode(id: string): LayoutNode | undefined {
    return this.nodesMap.get(id);
  }
}
