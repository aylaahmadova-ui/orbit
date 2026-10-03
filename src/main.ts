import './styles/theme.css';
import { OrbitScene } from './scene/scene';
import { PhysicsLayout } from './lib/layout';
import { NodeManager } from './scene/nodes';
import { EdgeManager } from './scene/edges';
import { AtmosphereManager } from './scene/atmosphere';
import { InteractionManager } from './scene/interaction';
import { store } from './state/store';
import { DetailPanel } from './ui/panel';
import { AddPersonModal } from './ui/addPerson';
import { SearchModal } from './ui/search';
import { CategoryFilterUI } from './ui/filters';
import { SettingsModal } from './ui/settings';

class OrbitApp {
  private sceneObj: OrbitScene;
  private layout: PhysicsLayout;
  private nodeManager: NodeManager;
  private edgeManager: EdgeManager;
  private atmosphere: AtmosphereManager;
  private interaction: InteractionManager;

  private detailPanel: DetailPanel;
  private addPersonModal: AddPersonModal;
  private searchModal: SearchModal;
  private categoryFilters: CategoryFilterUI;
  private settingsModal: SettingsModal;

  constructor() {
    const canvasContainer = document.getElementById('canvas-container')!;

    // 1. Initialize 3D Engine & Scene
    this.sceneObj = new OrbitScene(canvasContainer);

    // 2. Physics & Managers
    this.layout = new PhysicsLayout();
    this.nodeManager = new NodeManager(this.sceneObj.scene);
    this.edgeManager = new EdgeManager(this.sceneObj.scene);
    this.atmosphere = new AtmosphereManager(this.sceneObj.scene);

    // 3. Interaction Engine
    this.interaction = new InteractionManager(
      this.sceneObj,
      this.nodeManager,
      this.edgeManager,
      this.layout
    );

    // 4. UI Components
    this.detailPanel = new DetailPanel(document.getElementById('detail-panel-container')!);
    this.addPersonModal = new AddPersonModal(document.getElementById('add-person-container')!);
    this.searchModal = new SearchModal(document.getElementById('search-container')!);
    this.categoryFilters = new CategoryFilterUI(document.getElementById('category-filters-container')!);
    this.settingsModal = new SettingsModal(document.getElementById('settings-container')!);

    this.setupInteractions();
    this.setupPhysicsTick();
    this.setupStoreSubscription();
    this.setupToolbarEvents();

    // Trigger initial render & layout
    this.onStoreStateChange(store.getState());

    // Start animation render loop
    requestAnimationFrame(this.animate.bind(this));
  }

  private setupInteractions() {
    // Select node handler
    this.interaction.setOnSelectNode((personId) => {
      if (personId) {
        this.detailPanel.open(personId);
      } else {
        this.detailPanel.close();
      }
    });

    // Detail panel target person click callback
    this.detailPanel.setOnSelectPerson((id) => {
      this.interaction.selectNode(id);
    });

    // Search modal selection callback
    this.searchModal.setOnSelectPerson((id) => {
      this.interaction.selectNode(id);
    });

    // Category filter callback
    this.categoryFilters.setOnChange((hiddenCategories) => {
      this.nodeManager.setCategoryFilter(hiddenCategories);
    });
  }

  private setupPhysicsTick() {
    this.layout.setOnTick(() => {
      const state = store.getState();
      const nodesMap = this.layout.getNodesMap();

      this.nodeManager.updateNodes(nodesMap, state.me.name);
      this.edgeManager.updateEdges(nodesMap, state.links);
    });
  }

  private setupStoreSubscription() {
    store.subscribe((state) => {
      this.onStoreStateChange(state);
    });
  }

  private onStoreStateChange(state: any) {
    // 1. Update Physics layout simulation
    this.layout.setPhysicsEnabled(state.settings.physics);
    this.layout.updateData(state.people, state.links);

    // 2. Synchronize visual nodes and edges
    const nodesMap = this.layout.getNodesMap();
    this.nodeManager.updateNodes(nodesMap, state.me.name);
    this.edgeManager.updateEdges(nodesMap, state.links);

    // 3. Settings updates
    this.sceneObj.setBloomStrength(state.settings.bloom);
    this.sceneObj.labelRenderer.domElement.style.display = state.settings.showLabels ? 'block' : 'none';
    this.interaction.setAutoRotateEnabled(state.settings.autoRotate);

    // 4. Update UI readouts
    const countEl = document.getElementById('people-count-readout');
    if (countEl) {
      countEl.textContent = `${state.people.length} Connections`;
    }

    // Update active detail panel if open
    this.detailPanel.update();
  }

  private setupToolbarEvents() {
    document.getElementById('btn-add-person')?.addEventListener('click', () => {
      this.addPersonModal.open();
    });

    document.getElementById('btn-search')?.addEventListener('click', () => {
      this.searchModal.open();
    });

    document.getElementById('btn-reset-cam')?.addEventListener('click', () => {
      this.interaction.clearSelection();
      this.interaction.resetCameraOverview();
    });

    document.getElementById('btn-settings')?.addEventListener('click', () => {
      this.settingsModal.open();
    });
  }

  private animate(time: number) {
    requestAnimationFrame(this.animate.bind(this));

    this.atmosphere.animate(time);
    this.edgeManager.animatePulses(time);
    this.interaction.update(time);
    this.sceneObj.render(time);
  }
}

// Initialize application on DOM load
window.addEventListener('DOMContentLoaded', () => {
  new OrbitApp();
});
