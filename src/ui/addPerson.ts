import { Category, ContactFrequency, Person } from '../types';
import { calculateStrength } from '../lib/strength';
import { store } from '../state/store';
import { SVG_ICONS } from '../scene/nodes';

export class AddPersonModal {
  private container: HTMLElement;
  private selectedCategory: Category = 'friend';
  private selectedCloseness: 1 | 2 | 3 | 4 | 5 = 3;
  private selectedIcon: string = 'user';
  private onPersonAddedCallback?: (person: Person) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.setupShortcut();
  }

  public setOnPersonAdded(cb: (person: Person) => void) {
    this.onPersonAddedCallback = cb;
  }

  public open() {
    const modal = this.container.querySelector('#add-person-modal') as HTMLElement;
    if (modal) {
      modal.classList.add('open');
      const nameInput = modal.querySelector('#add-name') as HTMLInputElement;
      if (nameInput) nameInput.focus();
    }
    this.updatePreview();
  }

  public close() {
    const modal = this.container.querySelector('#add-person-modal') as HTMLElement;
    if (modal) modal.classList.remove('open');
  }

  private setupShortcut() {
    window.addEventListener('keydown', (e) => {
      // Shortcut N (when not focused on input)
      if (
        (e.key === 'n' || e.key === 'N') &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        this.open();
      }
    });
  }

  private updatePreview() {
    const freqEl = this.container.querySelector('#add-frequency') as HTMLSelectElement;
    const dateEl = this.container.querySelector('#add-last-contact') as HTMLInputElement;

    const dummyPerson: Person = {
      id: 'preview',
      name: 'Preview',
      category: this.selectedCategory,
      closeness: this.selectedCloseness,
      contactFrequency: (freqEl?.value as ContactFrequency) || 'monthly',
      lastContact: dateEl?.value ? new Date(dateEl.value).toISOString() : undefined
    };

    const breakdown = calculateStrength(dummyPerson);

    const scoreEl = this.container.querySelector('#preview-score') as HTMLElement;
    const distEl = this.container.querySelector('#preview-distance') as HTMLElement;

    if (scoreEl) scoreEl.textContent = `${(breakdown.finalStrength * 100).toFixed(0)}%`;
    if (distEl) distEl.textContent = `${breakdown.targetRadius.toFixed(0)} units`;
  }

  private render() {
    this.container.innerHTML = `
      <div class="side-panel glass-panel" id="add-person-modal">
        <div class="panel-header">
          <span class="panel-title">Add New Person</span>
          <button type="button" class="close-btn" id="close-add-modal-btn">✕</button>
        </div>
        <div class="panel-body">
          <!-- Live Preview Card -->
          <div class="strength-card" style="background: rgba(255, 61, 85, 0.12); border-color: rgba(255, 118, 134, 0.4);">
            <div class="strength-header">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #ff7686;">⚡ Projected Strength</span>
              <span class="strength-score" id="preview-score">58%</span>
            </div>
            <div class="factor-row">
              <span>Target Radius</span>
              <span style="color: #ffffff; font-weight: 700;" id="preview-distance">366 units</span>
            </div>
          </div>

          <form id="add-person-form">
            <!-- Name Input (Supports Quick-Add on Enter) -->
            <div class="form-group">
              <label class="form-label">Name (Press Enter to Quick-Add)</label>
              <input type="text" class="form-input" id="add-name" placeholder="e.g. Alex Rivera" required />
            </div>

            <!-- Category -->
            <div class="form-group">
              <label class="form-label">Category</label>
              <div class="segmented-control" id="add-category-picker">
                ${['partner', 'family', 'close_friend', 'friend', 'colleague', 'acquaintance']
                  .map(
                    (cat) => `
                  <button type="button" class="segment-btn ${this.selectedCategory === cat ? 'active' : ''}" data-cat="${cat}">
                    ${cat.replace('_', ' ')}
                  </button>
                `
                  )
                  .join('')}
              </div>
            </div>

            <!-- Closeness Dot Rating Slider -->
            <div class="form-group">
              <label class="form-label">Closeness Rating</label>
              <div class="dots-slider" id="add-closeness-slider">
                ${[1, 2, 3, 4, 5]
                  .map(
                    (val) => `
                  <div class="dot-step ${this.selectedCloseness === val ? 'active' : ''}" data-val="${val}">${val}</div>
                `
                  )
                  .join('')}
              </div>
            </div>

            <!-- Contact Frequency -->
            <div class="form-group">
              <label class="form-label">Contact Frequency</label>
              <select class="form-select" id="add-frequency">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly" selected>Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="rarely">Rarely</option>
              </select>
            </div>

            <!-- Last Contact Date -->
            <div class="form-group">
              <label class="form-label">Last Contact Date (Optional)</label>
              <input type="date" class="form-input" id="add-last-contact" />
            </div>

            <!-- Icon Picker -->
            <div class="form-group">
              <label class="form-label">Icon</label>
              <div class="icon-picker-grid" id="add-icon-picker">
                ${Object.keys(SVG_ICONS)
                  .slice(0, 12)
                  .map(
                    (iconKey) => `
                  <div class="icon-choice ${this.selectedIcon === iconKey ? 'active' : ''}" data-icon="${iconKey}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="${SVG_ICONS[iconKey]}"></path>
                    </svg>
                  </div>
                `
                  )
                  .join('')}
              </div>
            </div>

            <!-- Notes & Tags -->
            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea class="form-textarea" id="add-notes" rows="2" placeholder="Optional notes..."></textarea>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
              <button type="button" class="btn-icon" id="cancel-add-btn">Cancel</button>
              <button type="submit" class="btn-icon btn-primary" id="save-add-btn">Add to Orbit</button>
            </div>
          </form>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private attachEvents() {
    const modal = this.container.querySelector('#add-person-modal') as HTMLElement;
    if (!modal) return;

    modal.querySelector('#close-add-modal-btn')?.addEventListener('click', () => this.close());
    modal.querySelector('#cancel-add-btn')?.addEventListener('click', () => this.close());

    // Category selection
    modal.querySelectorAll('#add-category-picker .segment-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        modal.querySelectorAll('#add-category-picker .segment-btn').forEach((b) => b.classList.remove('active'));
        const el = e.currentTarget as HTMLElement;
        el.classList.add('active');
        this.selectedCategory = el.getAttribute('data-cat') as Category;
        this.updatePreview();
      });
    });

    // Closeness selection
    modal.querySelectorAll('#add-closeness-slider .dot-step').forEach((dot) => {
      dot.addEventListener('click', (e) => {
        modal.querySelectorAll('#add-closeness-slider .dot-step').forEach((d) => d.classList.remove('active'));
        const el = e.currentTarget as HTMLElement;
        el.classList.add('active');
        this.selectedCloseness = parseInt(el.getAttribute('data-val') || '3') as any;
        this.updatePreview();
      });
    });

    // Frequency and date live preview
    modal.querySelector('#add-frequency')?.addEventListener('change', () => this.updatePreview());
    modal.querySelector('#add-last-contact')?.addEventListener('change', () => this.updatePreview());

    // Icon selection
    modal.querySelectorAll('#add-icon-picker .icon-choice').forEach((icon) => {
      icon.addEventListener('click', (e) => {
        modal.querySelectorAll('#add-icon-picker .icon-choice').forEach((i) => i.classList.remove('active'));
        const el = e.currentTarget as HTMLElement;
        el.classList.add('active');
        this.selectedIcon = el.getAttribute('data-icon') || 'user';
      });
    });

    // Form submit / Quick Add
    const form = modal.querySelector('#add-person-form') as HTMLFormElement;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = modal.querySelector('#add-name') as HTMLInputElement;
      const freqInput = modal.querySelector('#add-frequency') as HTMLSelectElement;
      const dateInput = modal.querySelector('#add-last-contact') as HTMLInputElement;
      const notesInput = modal.querySelector('#add-notes') as HTMLTextAreaElement;

      const name = nameInput.value.trim();
      if (!name) return;

      const newPerson = store.addPerson({
        name,
        category: this.selectedCategory,
        closeness: this.selectedCloseness,
        contactFrequency: freqInput.value as ContactFrequency,
        lastContact: dateInput.value ? new Date(dateInput.value).toISOString() : undefined,
        icon: this.selectedIcon,
        notes: notesInput.value.trim() || undefined
      });

      if (this.onPersonAddedCallback) {
        this.onPersonAddedCallback(newPerson);
      }

      // Reset form
      nameInput.value = '';
      notesInput.value = '';
      this.close();
    });
  }
}
