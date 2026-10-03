import { store } from '../state/store';

export class SettingsModal {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  public open() {
    this.update();
    const modal = this.container.querySelector('#settings-modal') as HTMLElement;
    if (modal) modal.classList.add('open');
  }

  public close() {
    const modal = this.container.querySelector('#settings-modal') as HTMLElement;
    if (modal) modal.classList.remove('open');
  }

  public update() {
    const state = store.getState();
    const body = this.container.querySelector('#settings-body') as HTMLElement;
    if (!body) return;

    body.innerHTML = `
      <div class="form-group">
        <label class="form-label">Central Node ("YOU") Name</label>
        <div style="display: flex; gap: 8px;">
          <input type="text" class="form-input" id="me-name-input" value="${state.me.name}" />
          <button type="button" class="btn-icon" id="save-me-name-btn">Save</button>
        </div>
      </div>

      <div class="form-group" style="display: flex; justify-content: space-between; align-items: center;">
        <label class="form-label" style="margin-bottom:0;">Physics Layout Engine</label>
        <input type="checkbox" id="setting-physics" ${state.settings.physics ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #ff3d55;" />
      </div>

      <div class="form-group" style="display: flex; justify-content: space-between; align-items: center;">
        <label class="form-label" style="margin-bottom:0;">Idle Auto-Rotate Drift</label>
        <input type="checkbox" id="setting-autorotate" ${state.settings.autoRotate ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #ff3d55;" />
      </div>

      <div class="form-group" style="display: flex; justify-content: space-between; align-items: center;">
        <label class="form-label" style="margin-bottom:0;">Display Node CSS Labels</label>
        <input type="checkbox" id="setting-labels" ${state.settings.showLabels ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: #ff3d55;" />
      </div>

      <div class="form-group">
        <div style="display: flex; justify-content: space-between;">
          <label class="form-label">Bloom Intensity</label>
          <span style="font-size: 11px; color: #ff7686;" id="bloom-val">${state.settings.bloom.toFixed(1)}</span>
        </div>
        <input type="range" min="0" max="3" step="0.1" id="setting-bloom" value="${state.settings.bloom}" style="width: 100%; accent-color: #ff3d55;" />
      </div>

      <div style="border-top: 1px solid rgba(255, 61, 85, 0.2); margin-top: 20px; padding-top: 16px;">
        <label class="form-label">Data Management & JSON Portability</label>
        
        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
          <button type="button" class="btn-icon" id="export-json-btn" style="flex: 1;">📥 Export JSON</button>
          <label class="btn-icon" style="flex: 1; text-align: center; cursor: pointer;">
            📤 Import JSON
            <input type="file" id="import-json-file" accept=".json" style="display: none;" />
          </label>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 16px;">
          <button type="button" class="btn-icon" id="reset-pins-btn">📍 Reset All Pinned Positions</button>
          <button type="button" class="btn-icon" id="restore-sample-btn">🔄 Restore Sample Network</button>
          <button type="button" class="btn-icon" id="clear-sample-btn" style="background: rgba(168, 30, 52, 0.25); border-color: rgba(168, 30, 52, 0.5); color: #ff7686;">
            🗑️ Clear All Network Data
          </button>
        </div>
      </div>
    `;

    this.attachEvents(body);
  }

  private attachEvents(body: HTMLElement) {
    // Save ME Name
    body.querySelector('#save-me-name-btn')?.addEventListener('click', () => {
      const input = body.querySelector('#me-name-input') as HTMLInputElement;
      if (input && input.value.trim()) {
        store.updateMe(input.value.trim());
      }
    });

    // Checkboxes
    body.querySelector('#setting-physics')?.addEventListener('change', (e) => {
      store.updateSettings({ physics: (e.target as HTMLInputElement).checked });
    });

    body.querySelector('#setting-autorotate')?.addEventListener('change', (e) => {
      store.updateSettings({ autoRotate: (e.target as HTMLInputElement).checked });
    });

    body.querySelector('#setting-labels')?.addEventListener('change', (e) => {
      store.updateSettings({ showLabels: (e.target as HTMLInputElement).checked });
    });

    // Bloom range slider
    body.querySelector('#setting-bloom')?.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      const valEl = body.querySelector('#bloom-val');
      if (valEl) valEl.textContent = val.toFixed(1);
      store.updateSettings({ bloom: val });
    });

    // Export JSON
    body.querySelector('#export-json-btn')?.addEventListener('click', () => {
      const json = store.exportJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orbit-relationship-web-${new Date().toISOString().substring(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Import JSON with validation & friendly error handling
    body.querySelector('#import-json-file')?.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        const jsonStr = evt.target?.result as string;
        const res = store.importJSON(jsonStr);
        if (res.success) {
          alert('Relationship network successfully imported!');
          this.close();
        } else {
          alert(`Failed to import JSON file:\n${res.error}`);
        }
      };
      reader.readAsText(file);
    });

    // Reset pins
    body.querySelector('#reset-pins-btn')?.addEventListener('click', () => {
      store.resetPins();
      alert('All pinned node positions have been cleared.');
    });

    // Restore sample dataset
    body.querySelector('#restore-sample-btn')?.addEventListener('click', () => {
      if (confirm('Restore the default 20-person sample relationship network?')) {
        store.restoreSampleData();
        this.close();
      }
    });

    // Clear sample dataset
    body.querySelector('#clear-sample-btn')?.addEventListener('click', () => {
      if (confirm('Clear all network data? You will be left with an empty canvas.')) {
        store.clearSampleData();
        this.close();
      }
    });
  }

  private render() {
    this.container.innerHTML = `
      <div class="side-panel glass-panel" id="settings-modal">
        <div class="panel-header">
          <span class="panel-title">Settings & Preferences</span>
          <button type="button" class="close-btn" id="close-settings-btn">✕</button>
        </div>
        <div class="panel-body" id="settings-body"></div>
      </div>
    `;

    this.container.querySelector('#close-settings-btn')?.addEventListener('click', () => this.close());
  }
}
