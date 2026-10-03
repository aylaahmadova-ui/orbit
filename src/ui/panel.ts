import { Person, Circle } from '../types';
import { CIRCLE_DESCRIPTIONS } from '../types';
import { store } from '../state/store';
import { getRecencyStage } from '../lib/recency';
import { sound } from '../lib/sound';

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

    const body = this.container.querySelector('#detail-panel-body') as HTMLElement;
    const title = this.container.querySelector('#detail-panel-title') as HTMLElement;

    if (title) title.textContent = person.name.toUpperCase();
    if (!body) return;

    const recencyStage = getRecencyStage(person.lastContact);
    const otherPeople = state.people.filter((p) => p.id !== person.id);
    const existingLinks = state.links.filter((l) => l.a === person.id || l.b === person.id);

    body.innerHTML = `
      <!-- Primary Habit Action: SPOKE TODAY -->
      <div style="margin-bottom: 20px;">
        <button type="button" class="btn-rect btn-primary" id="spoke-today-btn" style="width: 100%; padding: 12px; font-size: 12px; font-weight: 700;">
          ⚡ SPOKE TODAY
        </button>
        <div style="font-size: 10px; color: #e4a2aa; text-transform: uppercase; margin-top: 6px; text-align: center;">
          LAST CONTACT: ${this.formatLastContact(person.lastContact)} [${recencyStage.replace('_', ' ').toUpperCase()}]
        </div>
      </div>

      <!-- Quick Fields Edit Form -->
      <form id="edit-person-form">
        <div class="form-group">
          <label class="form-label">FULL NAME</label>
          <input type="text" class="form-input" id="edit-name" value="${person.name}" required />
        </div>

        <!-- Circle Selector -->
        <div class="form-group">
          <label class="form-label">INTIMACY CIRCLE</label>
          <div style="display: flex; flex-direction: column; gap: 6px;" id="edit-circle-picker">
            ${(['core', 'close', 'regular', 'distant'] as Circle[])
              .map(
                (c) => `
              <div class="circle-choice-option ${person.circle === c ? 'active' : ''}" data-circle="${c}">
                <div style="font-weight: 700;">${c.toUpperCase()} ${person.circle === c ? '[■]' : ''}</div>
                <div style="font-size: 10px; opacity: 0.7;">${CIRCLE_DESCRIPTIONS[c]}</div>
              </div>
            `
              )
              .join('')}
          </div>
        </div>

        <!-- Category Label -->
        <div class="form-group">
          <label class="form-label">CATEGORY TAG</label>
          <select class="form-select" id="edit-category">
            ${['family', 'partner', 'friend', 'colleague', 'acquaintance']
              .map(
                (cat) => `
              <option value="${cat}" ${person.category === cat ? 'selected' : ''}>
                ${cat.toUpperCase()}
              </option>
            `
              )
              .join('')}
          </select>
        </div>

        <!-- Last Contact Date Override -->
        <div class="form-group">
          <label class="form-label">LAST CONTACT DATE</label>
          <input type="date" class="form-input" id="edit-last-contact" value="${
            person.lastContact ? person.lastContact.substring(0, 10) : ''
          }" />
        </div>

        <!-- Notes -->
        <div class="form-group">
          <label class="form-label">NOTES & MEMORY LOG</label>
          <textarea class="form-textarea" id="edit-notes" rows="3" placeholder="Add notes...">${
            person.notes || ''
          }</textarea>
        </div>

        ${
          person.pinned
            ? `<div class="form-group" style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid rgba(255,61,85,0.3); padding: 8px 0;">
                <span style="font-size: 10px; color: #ff7686; font-weight: 700;">📌 POSITION PINNED</span>
                <button type="button" class="btn-text" id="unpin-btn">UNPIN</button>
              </div>`
            : ''
        }
      </form>

      <!-- Connections -->
      <div style="margin-top: 24px; border-top: 1px solid rgba(255, 61, 85, 0.2); padding-top: 18px;">
        <label class="form-label">DIRECT CONNECTIONS [${existingLinks.length}]</label>

        <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;">
          ${
            existingLinks.length === 0
              ? '<span style="font-size: 10px; color: #a8636e; font-style: italic;">No direct connections to others</span>'
              : existingLinks
                  .map((link) => {
                    const otherId = link.a === person.id ? link.b : link.a;
                    const other = state.people.find((p) => p.id === otherId);
                    if (!other) return '';
                    return `
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,61,85,0.15); padding: 4px 0;">
                      <span class="link-target-name" data-id="${other.id}" style="font-size: 11px; cursor: pointer; color: #ffd9dd; text-decoration: underline;">
                        ${other.name.toUpperCase()} [${other.circle.toUpperCase()}]
                      </span>
                      <button type="button" class="btn-text remove-link-btn" data-linkid="${link.id}">[REMOVE]</button>
                    </div>
                  `;
                  })
                  .join('')
          }
        </div>

        <div style="display: flex; gap: 8px;">
          <select class="form-select" id="add-link-target" style="flex: 1;">
            <option value="">CONNECT TO PERSON...</option>
            ${otherPeople
              .map((p) => `<option value="${p.id}">${p.name.toUpperCase()}</option>`)
              .join('')}
          </select>
          <button type="button" class="btn-rect" id="add-link-btn">CONNECT</button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div style="display: flex; justify-content: space-between; gap: 12px; margin-top: 28px;">
        <button type="button" class="btn-text" id="delete-person-btn" style="color: #ff7686;">
          DELETE PERSON
        </button>
        <button type="button" class="btn-rect btn-primary" id="save-person-btn">
          SAVE CHANGES
        </button>
      </div>
    `;

    this.attachEvents(person);
  }

  private formatLastContact(lastContact?: string): string {
    if (!lastContact) return 'NO DATE LOGGED';
    const diffMs = Date.now() - new Date(lastContact).getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days === 0) return 'TODAY';
    if (days === 1) return 'YESTERDAY';
    return `${days} DAYS AGO`;
  }

  private attachEvents(person: Person) {
    const body = this.container.querySelector('#detail-panel-body') as HTMLElement;
    if (!body) return;

    // Spoke Today Button
    body.querySelector('#spoke-today-btn')?.addEventListener('click', () => {
      sound.playSpokeToday();
      store.spokeToday(person.id);
      this.update();
    });

    // Circle picker option
    body.querySelectorAll('#edit-circle-picker .circle-choice-option').forEach((opt) => {
      opt.addEventListener('click', (e) => {
        const circle = (e.currentTarget as HTMLElement).getAttribute('data-circle') as Circle;
        store.updateCircle(person.id, circle);
        this.update();
      });
    });

    // Category select
    body.querySelector('#edit-category')?.addEventListener('change', (e) => {
      const cat = (e.target as HTMLSelectElement).value;
      store.updatePerson(person.id, { category: cat });
    });

    // Last contact date select
    body.querySelector('#edit-last-contact')?.addEventListener('change', (e) => {
      const val = (e.target as HTMLInputElement).value;
      store.updatePerson(person.id, { lastContact: val ? new Date(val).toISOString() : undefined });
      this.update();
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
      if (confirm(`Delete ${person.name}?`)) {
        store.deletePerson(person.id);
        this.close();
      }
    });
  }

  private render() {
    this.container.innerHTML = `
      <div class="side-panel">
        <div class="panel-header">
          <span class="panel-title" id="detail-panel-title">PERSON DETAILS</span>
          <button type="button" class="btn-text" id="close-detail-btn">[✕ CLOSE]</button>
        </div>
        <div class="panel-body" id="detail-panel-body"></div>
      </div>
    `;

    this.container.querySelector('#close-detail-btn')?.addEventListener('click', () => {
      this.close();
    });
  }
}
