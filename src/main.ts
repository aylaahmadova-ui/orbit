import './styles/theme.css';
import { OrbitScene } from './scene/scene';
import { PhysicsLayout } from './lib/layout';
import { NodeManager } from './scene/nodes';
import { EdgeManager } from './scene/edges';
import { AtmosphereManager } from './scene/atmosphere';
import { OrbitRingsManager } from './scene/rings';
import { InteractionManager } from './scene/interaction';
import { store } from './state/store';
import { auth } from './state/auth';
import { DetailPanel } from './ui/panel';
import { AddPersonModal } from './ui/addPerson';
import { SearchModal } from './ui/search';
import { CategoryFilterUI } from './ui/filters';
import { SettingsModal } from './ui/settings';
import { FadingListUI } from './ui/fading';
import { AuthViewUI } from './ui/authView';
import { Circle } from './types';

class OrbitApp {
  private sceneObj: OrbitScene;
  private layout: PhysicsLayout;
  private nodeManager: NodeManager;
  private edgeManager: EdgeManager;
  private atmosphere: AtmosphereManager;
  private ringsManager: OrbitRingsManager;
  private interaction: InteractionManager;

  private detailPanel: DetailPanel;
  private addPersonModal: AddPersonModal;
  private searchModal: SearchModal;
  private categoryFilters: CategoryFilterUI;
  private settingsModal: SettingsModal;
  private fadingList: FadingListUI;
  private authView: AuthViewUI;

  constructor() {
    const canvasContainer = document.getElementById('canvas-container')!;

    this.sceneObj = new OrbitScene(canvasContainer);
    this.layout = new PhysicsLayout();
    this.nodeManager = new NodeManager(this.sceneObj.scene);
    this.edgeManager = new EdgeManager(this.sceneObj.scene);
    this.atmosphere = new AtmosphereManager(this.sceneObj.scene);
    this.ringsManager = new OrbitRingsManager(this.sceneObj.scene);

    this.interaction = new InteractionManager(
      this.sceneObj,
      this.nodeManager,
      this.edgeManager,
      this.layout
    );

    this.detailPanel = new DetailPanel(document.getElementById('detail-panel-container')!);
    this.addPersonModal = new AddPersonModal(document.getElementById('add-person-container')!);
    this.searchModal = new SearchModal(document.getElementById('search-container')!);
    this.categoryFilters = new CategoryFilterUI(document.getElementById('category-filters-container')!);
    this.settingsModal = new SettingsModal(document.getElementById('settings-container')!);
    this.fadingList = new FadingListUI(document.getElementById('fading-list-container')!);
    this.authView = new AuthViewUI(document.getElementById('auth-container')!);

    this.setupInteractions();
    this.setupPhysicsTick();
    this.setupStoreSubscription();
    this.setupAuthSubscription();
    this.setupToolbarEvents();

    this.onStoreStateChange(store.getState());

    requestAnimationFrame(this.animate.bind(this));
  }

  private setupInteractions() {
    this.interaction.setOnSelectNode((personId) => {
      if (personId) {
        this.detailPanel.open(personId);
      } else {
        this.detailPanel.close();
      }
    });

    this.interaction.setOnToast((msg) => {
      this.showToast(msg);
    });

    this.interaction.setOnCameraReadout((readout) => {
      const readoutEl = document.getElementById('camera-instrument-readout');
      if (readoutEl) {
        readoutEl.textContent = `AZ ${readout.az}° EL ${readout.el}° DIST ${readout.dist}`;
      }
    });

    this.detailPanel.setOnSelectPerson((id) => {
      this.interaction.selectNode(id);
    });

    this.searchModal.setOnSelectPerson((id) => {
      this.interaction.selectNode(id);
    });

    this.fadingList.setOnSelectPerson((id) => {
      this.interaction.selectNode(id);
    });

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

  private setupAuthSubscription() {
    auth.subscribe((user) => {
      const authBtn = document.getElementById('btn-auth-action');
      const userReadout = document.getElementById('user-display-readout');

      if (user) {
        this.authView.close();
        if (authBtn) authBtn.textContent = '[LOGOUT]';
        if (userReadout) userReadout.textContent = `VAULT: ${user.username.toUpperCase()}`;
        store.switchUserSession();
      } else {
        this.authView.open('signin');
        if (authBtn) authBtn.textContent = '[SIGN IN]';
        if (userReadout) userReadout.textContent = 'VAULT: GUEST';
        store.switchUserSession();
      }
    });
  }

  private onStoreStateChange(state: any) {
    this.layout.setPhysicsEnabled(state.settings.physics);
    this.layout.updateData(state.people, state.links);

    const nodesMap = this.layout.getNodesMap();
    this.nodeManager.updateNodes(nodesMap, state.me.name);
    this.edgeManager.updateEdges(nodesMap, state.links);

    const circleCounts: Record<Circle, number> = { core: 0, close: 0, regular: 0, distant: 0 };
    state.people.forEach((p: any) => {
      if (circleCounts[p.circle as Circle] !== undefined) {
        circleCounts[p.circle as Circle]++;
      }
    });
    this.ringsManager.updateCounts(circleCounts);

    this.sceneObj.setBloomStrength(state.settings.bloom);
    this.sceneObj.labelRenderer.domElement.style.display = state.settings.showLabels ? 'block' : 'none';
    this.interaction.setAutoRotateEnabled(state.settings.autoRotate);

    const countEl = document.getElementById('people-count-readout');
    if (countEl) {
      countEl.textContent = `${state.people.length} CONNECTIONS`;
    }

    this.categoryFilters.updateCounts(state.people);
    this.fadingList.update();
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

    document.getElementById('btn-auth-action')?.addEventListener('click', () => {
      const user = auth.getCurrentUser();
      if (user) {
        if (confirm(`Sign out of account "${user.username}"?`)) {
          auth.signOut();
        }
      } else {
        this.authView.open('signin');
      }
    });
  }

  private showToast(msg: string) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg.toUpperCase();
    toast.classList.add('visible');

    setTimeout(() => {
      toast.classList.remove('visible');
    }, 2500);
  }

  private animate(time: number) {
    requestAnimationFrame(this.animate.bind(this));

    this.atmosphere.animate(time);
    this.edgeManager.animatePulses(time);
    this.interaction.update(time);
    this.sceneObj.render(time);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new OrbitApp();
});
