import { store } from '../state/store';
import { sound } from '../lib/sound';

export class SettingsModal {
  private container: HTMLElement;
  private soundEnabled: boolean = true;

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
      <div class="form-group" style="display: flex; justify-content: space-between; align-items: center;">
        <label class="form-label" style="margin-bottom:0;">AUDIO SOUND EFFECTS</label>
        <input type="checkbox" id="setting-sound" ${this.soundEnabled ? 'checked' : ''} style="accent-color: #ff3d55;" />
      </div>

      <div class="form-group" style="display: flex; justify-content: space-between; align-items: center;">
        <label class="form-label" style="margin-bottom:0;">AUTO-ROTATE DRIFT</label>
        <input type="checkbox" id="setting-autorotate" ${state.settings.autoRotate ? 'checked' : ''} style="accent-color: #ff3d55;" />
      </div>

      <div class="form-group">
        <div style="display: flex; justify-content: space-between;">
          <label class="form-label">BLOOM INTENSITY</label>
          <span style="font-size: 10px; color: #ff7686;" id="bloom-val">${state.settings.bloom.toFixed(1)}</span>
        </div>
        <input type="range" min="0" max="3" step="0.1" id="setting-bloom" value="${state.settings.bloom}" style="width: 100%; accent-color: #ff3d55;" />
      </div>

      <div style="border-top: 1px solid rgba(255, 61, 85, 0.2); margin-top: 20px; padding-top: 16px;">
        <label class="form-label">DATA & PORTABILITY</label>

        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
          <button type="button" class="btn-rect" id="export-json-btn" style="flex: 1;">EXPORT JSON</button>
          <label class="btn-rect" style="flex: 1; text-align: center; cursor: pointer;">
            IMPORT JSON
            <input type="file" id="import-json-file" accept=".json" style="display: none;" />
          </label>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 16px;">
          <button type="button" class="btn-text" id="reset-pins-btn">RESET LAYOUT PINS</button>
          <button type="button" class="btn-text" id="restore-sample-btn">RESTORE SAMPLE NETWORK</button>
          <button type="button" class="btn-text" id="clear-sample-btn" style="color: #ff7686;">CLEAR ALL DATA</button>
        </div>
      </div>
    `;

    this.attachEvents(body);
  }

  private attachEvents(body: HTMLElement) {
    body.querySelector('#setting-sound')?.addEventListener('change', (e) => {
      this.soundEnabled = (e.target as HTMLInputElement).checked;
      sound.setMuted(!this.soundEnabled);
    });

    body.querySelector('#setting-autorotate')?.addEventListener('change', (e) => {
      store.updateSettings({ autoRotate: (e.target as HTMLInputElement).checked });
    });

    body.querySelector('#setting-bloom')?.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      const valEl = body.querySelector('#bloom-val');
      if (valEl) valEl.textContent = val.toFixed(1);
      store.updateSettings({ bloom: val });
    });

    body.querySelector('#export-json-btn')?.addEventListener('click', () => {
      const json = store.exportJSON();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orbit-v2-${new Date().toISOString().substring(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    body.querySelector('#import-json-file')?.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        const jsonStr = evt.target?.result as string;
        const res = store.importJSON(jsonStr);
        if (res.success) {
          alert('Network successfully imported!');
          this.close();
        } else {
          alert(`Import failed:\n${res.error}`);
        }
      };
      reader.readAsText(file);
    });

    body.querySelector('#reset-pins-btn')?.addEventListener('click', () => {
      store.resetPins();
      alert('Layout pins cleared.');
    });

    body.querySelector('#restore-sample-btn')?.addEventListener('click', () => {
      if (confirm('Restore sample network?')) {
        store.restoreSampleData();
        this.close();
      }
    });

    body.querySelector('#clear-sample-btn')?.addEventListener('click', () => {
      if (confirm('Clear all network data?')) {
        store.clearSampleData();
        this.close();
      }
    });
  }

  private render() {
    this.container.innerHTML = `
      <div class="side-panel" id="settings-modal">
        <div class="panel-header">
          <span class="panel-title">SETTINGS</span>
          <button type="button" class="btn-text" id="close-settings-btn">[✕ ESC]</button>
        </div>
        <div class="panel-body" id="settings-body"></div>
      </div>
    `;

    this.container.querySelector('#close-settings-btn')?.addEventListener('click', () => this.close());
  }
}
