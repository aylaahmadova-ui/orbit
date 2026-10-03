import { Person, Category, ContactFrequency, Link } from '../types';
import { calculateStrength } from '../lib/strength';
import { store } from '../state/store';
import { SVG_ICONS } from '../scene/nodes';

export class DetailPanel {
  private container: HTMLElement;
  private currentPersonId: string | null = null;
  private onSelectPersonCallback?: (id: string) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  public setOnSelectPerson(cb: (id: string) => void) {
    this.onSelectPersonCallback = cb;
  }

  public open(personId: string) {
    this.currentPersonId = personId;
    this.update();
    const panel = this.container.querySelector('.side-panel') as HTMLElement;
    if (panel) panel.classList.add('open');
  }

  public close() {
    this.currentPersonId = null;
    const panel = this.container.querySelector('.side-panel') as HTMLElement;
    if (panel) panel.classList.remove('open');
  }

  public update() {
    if (!this.currentPersonId) {
      this.close();
      return;
    }

    const state = store.getState();
    const person = state.people.find((p) => p.id === this.currentPersonId);
    if (!person) {
      this.close();
      return;
    }

    const breakdown = calculateStrength(person);
    const body = this.container.querySelector('#detail-panel-body') as HTMLElement;
    const title = this.container.querySelector('#detail-panel-title') as HTMLElement;

    if (title) title.textContent = person.name;

    if (!body) return;

    // Filter available people for "Connect to..." picker
    const otherPeople = state.people.filter((p) => p.id !== person.id);
    const existingLinks = state.links.filter((l) => l.a === person.id || l.b === person.id);

    body.innerHTML = `
      <!-- Strength Breakdown Card -->
      <div class="strength-card">
        <div class="strength-header">
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #e4a2aa;">Relationship Strength</span>
          <span class="strength-score">${(breakdown.finalStrength * 100).toFixed(0)}%</span>
        </div>
        <div class="factor-row">
          <span>Target Distance</span>
          <span style="color: #ffffff; font-weight: 700;">${breakdown.targetRadius.toFixed(0)} units</span>
        </div>
        <div class="factor-row">
          <span>Closeness Rating (${person.closeness}/5)</span>
          <span>+${(breakdown.base * 60).toFixed(1)}%</span>
        </div>
        <div class="factor-row">
          <span>Contact Frequency (${person.contactFrequency || 'monthly'})</span>
          <span>+${(breakdown.frequency * 25).toFixed(1)}%</span>
        </div>
        <div class="factor-row">
          <span>Recency Score</span>
          <span>+${(breakdown.recency * 15).toFixed(1)}%</span>
        </div>
        ${
          breakdown.categoryFloor > 0
            ? `<div class="factor-row" style="color: #ff7686; font-weight: 700;">
                <span>${person.category} Floor Enforced</span>
                <span>min ${(breakdown.categoryFloor * 100).toFixed(0)}%</span>
              </div>`
            : ''
        }
      </div>

      <!-- Quick Fields Edit Form -->
      <form id="edit-person-form">
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input type="text" class="form-input" id="edit-name" value="${person.name}" required />
        </div>

        <div class="form-group">
          <label class="form-label">Category</label>
          <div class="segmented-control">
            ${['partner', 'family', 'close_friend', 'friend', 'colleague', 'acquaintance']
              .map(
                (cat) => `
              <button type="button" class="segment-btn ${person.category === cat ? 'active' : ''}" data-cat="${cat}">
                ${cat.replace('_', ' ')}
              </button>
            `
              )
              .join('')}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Closeness Level</label>
          <div class="dots-slider" id="edit-closeness-slider">
            ${[1, 2, 3, 4, 5]
              .map(
                (val) => `
              <div class="dot-step ${person.closeness === val ? 'active' : ''}" data-val="${val}">${val}</div>
            `
              )
              .join('')}
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Contact Frequency</label>
          <select class="form-select" id="edit-frequency">
            ${['daily', 'weekly', 'monthly', 'yearly', 'rarely']
              .map(
                (freq) => `
              <option value="${freq}" ${person.contactFrequency === freq ? 'selected' : ''}>
                ${freq.charAt(0).toUpperCase() + freq.slice(1)}
              </option>
            `
              )
              .join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Last Contact Date</label>
          <input type="date" class="form-input" id="edit-last-contact" value="${
            person.lastContact ? person.lastContact.substring(0, 10) : ''
          }" />
        </div>

        <div class="form-group">
          <label class="form-label">Notes & Memory Log</label>
          <textarea class="form-textarea" id="edit-notes" rows="3" placeholder="Add notes...">${
            person.notes || ''
          }</textarea>
        </div>

        ${
          person.pinned
            ? `<div class="form-group" style="display:flex; justify-between; align-items:center; background: rgba(255,61,85,0.1); padding: 8px 12px; border-radius: 8px;">
                <span style="font-size: 11px; color: #ff7686; font-weight: 700;">📌 Position Pinned</span>
                <button type="button" class="btn-icon" id="unpin-btn" style="padding: 4px 10px; font-size: 11px;">Unpin</button>
              </div>`
            : ''
        }
      </form>

      <!-- Connections (Person to Person links) -->
      <div style="margin-top: 24px; border-top: 1px solid rgba(255, 61, 85, 0.2); padding-top: 18px;">
        <label class="form-label">Connections (${existingLinks.length})</label>

        <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;">
          ${
            existingLinks.length === 0
              ? '<span style="font-size: 11px; color: #a8636e; italic;">No direct connections to others yet</span>'
              : existingLinks
                  .map((link) => {
                    const otherId = link.a === person.id ? link.b : link.a;
                    const other = state.people.find((p) => p.id === otherId);
                    if (!other) return '';
                    return `
                    <div style="display: flex; justify-between; align-items: center; background: rgba(12,2,6,0.6); padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(255,61,85,0.15);">
                      <span class="link-target-name" data-id="${other.id}" style="font-size: 12px; cursor: pointer; color: #ffd9dd; text-decoration: underline;">
                        ${other.name}
                      </span>
                      <button type="button" class="close-btn remove-link-btn" data-linkid="${link.id}" style="font-size: 14px;">✕</button>
                    </div>
                  `;
                  })
                  .join('')
          }
        </div>

        <div style="display: flex; gap: 8px;">
          <select class="form-select" id="add-link-target" style="flex: 1;">
            <option value="">Connect to person...</option>
            ${otherPeople
              .map((p) => `<option value="${p.id}">${p.name} (${p.category})</option>`)
              .join('')}
          </select>
          <button type="button" class="btn-icon btn-primary" id="add-link-btn">Connect</button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; justify-content: space-between; gap: 12px; margin-top: 28px;">
        <button type="button" class="btn-icon" id="delete-person-btn" style="background: rgba(168, 30, 52, 0.25); border-color: rgba(168, 30, 52, 0.5); color: #ff7686;">
          Delete Person
        </button>
        <button type="button" class="btn-icon btn-primary" id="save-person-btn">
          Save Changes
        </button>
      </div>
    `;

    this.attachEvents(person);
  }

  private attachEvents(person: Person) {
    const body = this.container.querySelector('#detail-panel-body') as HTMLElement;
    if (!body) return;

    // Segmented category picker
    body.querySelectorAll('.segment-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const cat = (e.currentTarget as HTMLElement).getAttribute('data-cat') as Category;
        store.updatePerson(person.id, { category: cat });
      });
    });

    // Closeness dot slider
    body.querySelectorAll('#edit-closeness-slider .dot-step').forEach((dot) => {
      dot.addEventListener('click', (e) => {
        const val = parseInt((e.currentTarget as HTMLElement).getAttribute('data-val') || '3') as any;
        store.updatePerson(person.id, { closeness: val });
      });
    });

    // Frequency & date change
    body.querySelector('#edit-frequency')?.addEventListener('change', (e) => {
      const freq = (e.target as HTMLSelectElement).value as ContactFrequency;
      store.updatePerson(person.id, { contactFrequency: freq });
    });

    body.querySelector('#edit-last-contact')?.addEventListener('change', (e) => {
      const val = (e.target as HTMLInputElement).value;
      store.updatePerson(person.id, { lastContact: val ? new Date(val).toISOString() : undefined });
    });

    body.querySelector('#unpin-btn')?.addEventListener('click', () => {
      store.unpinPerson(person.id);
    });

    // Remove link
    body.querySelectorAll('.remove-link-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const linkId = (e.currentTarget as HTMLElement).getAttribute('data-linkid');
        if (linkId) store.deleteLink(linkId);
      });
    });

    // Target name click
    body.querySelectorAll('.link-target-name').forEach((el) => {
      el.addEventListener('click', (e) => {
        const targetId = (e.currentTarget as HTMLElement).getAttribute('data-id');
        if (targetId && this.onSelectPersonCallback) {
          this.onSelectPersonCallback(targetId);
        }
      });
    });

    // Add link
    body.querySelector('#add-link-btn')?.addEventListener('click', () => {
      const select = body.querySelector('#add-link-target') as HTMLSelectElement;
      if (select && select.value) {
        store.addLink(person.id, select.value);
      }
    });

    // Save changes
    body.querySelector('#save-person-btn')?.addEventListener('click', () => {
      const nameInput = body.querySelector('#edit-name') as HTMLInputElement;
      const notesInput = body.querySelector('#edit-notes') as HTMLTextAreaElement;

      store.updatePerson(person.id, {
        name: nameInput.value.trim() || person.name,
        notes: notesInput.value.trim()
      });
      this.close();
    });

    // Delete person
    body.querySelector('#delete-person-btn')?.addEventListener('click', () => {
      if (confirm(`Are you sure you want to delete ${person.name}?`)) {
        store.deletePerson(person.id);
        this.showSnackbar(`${person.name} deleted`, true);
        this.close();
      }
    });
  }

  private showSnackbar(msg: string, allowUndo: boolean = true) {
    const snackbar = document.getElementById('snackbar');
    if (!snackbar) return;

    snackbar.innerHTML = `
      <span>${msg}</span>
      ${allowUndo ? '<button type="button" class="undo-btn" id="snackbar-undo">Undo</button>' : ''}
    `;

    snackbar.classList.add('visible');

    const undoBtn = snackbar.querySelector('#snackbar-undo');
    if (undoBtn) {
      undoBtn.addEventListener('click', () => {
        store.undo();
        snackbar.classList.remove('visible');
      });
    }

    setTimeout(() => {
      snackbar.classList.remove('visible');
    }, 4000);
  }

  private render() {
    this.container.innerHTML = `
      <div class="side-panel glass-panel">
        <div class="panel-header">
          <span class="panel-title" id="detail-panel-title">Person Details</span>
          <button type="button" class="close-btn" id="close-detail-btn">✕</button>
        </div>
        <div class="panel-body" id="detail-panel-body"></div>
      </div>
    `;

    this.container.querySelector('#close-detail-btn')?.addEventListener('click', () => {
      this.close();
    });
  }
}
