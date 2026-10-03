import { forceSimulation, forceRadial, forceManyBody, forceCollide, forceLink } from 'd3-force-3d';
import { Person, Link } from '../types';
import { calculateStrength } from './strength';

export interface LayoutNode {
  id: string;
  isMe: boolean;
  targetRadius: number;
  strength: number;
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
  strengthValue: number;
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
      strength: 1.0,
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

    // 2. People nodes
    for (const p of people) {
      const breakdown = calculateStrength(p);
      const existing = existingNodes.get(p.id);

      let node: LayoutNode;
      if (existing) {
        node = existing;
        node.targetRadius = breakdown.targetRadius;
        node.strength = breakdown.finalStrength;
        node.person = p;
      } else {
        // Spawn initial position near origin or at random angle on target radius
        const angle = Math.random() * Math.PI * 2;
        const phi = (Math.random() - 0.5) * Math.PI * 0.4;
        const r = breakdown.targetRadius;

        node = {
          id: p.id,
          isMe: false,
          targetRadius: breakdown.targetRadius,
          strength: breakdown.finalStrength,
          person: p,
          x: r * Math.cos(angle) * Math.cos(phi),
          y: r * Math.sin(phi),
          z: r * Math.sin(angle) * Math.cos(phi)
        };
      }

      // Handle pinning
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

    // 3. Links data (person to person, plus radial connection to ME for physics hint)
    const layoutLinks: LayoutLink[] = [];

    // Add optional person-to-person links
    for (const l of links) {
      if (this.nodesMap.has(l.a) && this.nodesMap.has(l.b)) {
        layoutLinks.push({
          source: l.a,
          target: l.b,
          strengthValue: l.strength
        });
      }
    }

    this.links = layoutLinks;

    // 4. Update forces
    this.simulation.nodes(nodesArray);

    // Radial force to hold nodes at target radius from (0,0,0)
    const radialForce = forceRadial((d: any) => d.targetRadius, 0, 0, 0).strength((d: any) =>
      d.isMe ? 0 : 0.8
    );

    // Collision force to prevent overlap
    const collideForce = forceCollide((d: any) => (d.isMe ? 40 : 25 + d.strength * 15)).strength(0.7);

    // Many body repulsion force
    const chargeForce = forceManyBody().strength((d: any) => (d.isMe ? -300 : -120));

    // Link force between connected nodes
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

  public reheat() {
    if (!this.isPhysicsEnabled) return;
    this.simulation.alpha(0.4).restart();
  }

  private constrainShell() {
    // Flatten Z-axis to ±35% of radial distance for a sleek 3D web shell
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
