import { Circle, Person } from '../types';
import { CIRCLE_DESCRIPTIONS } from '../types';
import { store } from '../state/store';

export class AddPersonModal {
  private container: HTMLElement;
  private currentStep: 1 | 2 | 3 = 1;
  private personName: string = '';
  private selectedCircle: Circle = 'regular';
  private selectedLastSpoke: 'today' | 'this_week' | 'this_month' | 'a_while_ago' | 'not_sure' = 'this_week';
  private selectedCategory: string = 'friend';
  private notes: string = '';
  private showMore: boolean = false;
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
    this.currentStep = 1;
    this.personName = '';
    this.selectedCircle = 'regular';
    this.showMore = false;
    this.render();

    const modal = this.container.querySelector('#add-person-modal') as HTMLElement;
    if (modal) {
      modal.classList.add('open');
      const nameInput = modal.querySelector('#add-step1-name') as HTMLInputElement;
      if (nameInput) {
        nameInput.value = '';
        nameInput.focus();
      }
    }
  }

  public close() {
    const modal = this.container.querySelector('#add-person-modal') as HTMLElement;
    if (modal) modal.classList.remove('open');
  }

  private setupShortcut() {
    window.addEventListener('keydown', (e) => {
      // Key N opens modal when not focused on input
      if (
        (e.key === 'n' || e.key === 'N') &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)
      ) {
        e.preventDefault();
        this.open();
        return;
      }

      // Step 2 shortcuts: 1..4
      const modal = this.container.querySelector('#add-person-modal') as HTMLElement;
      if (modal && modal.classList.contains('open') && this.currentStep === 2) {
        if (e.key === '1') this.selectCircle('core');
        else if (e.key === '2') this.selectCircle('close');
        else if (e.key === '3') this.selectCircle('regular');
        else if (e.key === '4') this.selectCircle('distant');
      }
    });
  }

  private selectCircle(circle: Circle) {
    this.selectedCircle = circle;
    this.currentStep = 3;
    this.render();
  }

  private submitPerson() {
    if (!this.personName.trim()) return;

    let lastContact: string | undefined = undefined;
    const now = new Date();

    if (this.selectedLastSpoke === 'today') {
      lastContact = now.toISOString();
    } else if (this.selectedLastSpoke === 'this_week') {
      lastContact = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    } else if (this.selectedLastSpoke === 'this_month') {
      lastContact = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString();
    } else if (this.selectedLastSpoke === 'a_while_ago') {
      lastContact = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
    }

    const newPerson = store.addPerson({
      name: this.personName.trim(),
      circle: this.selectedCircle,
      drift: 0.5,
      lastContact,
      category: this.selectedCategory,
      notes: this.notes.trim() || undefined
    });

    if (this.onPersonAddedCallback) {
      this.onPersonAddedCallback(newPerson);
    }

    this.close();
  }

  private render() {
    this.container.innerHTML = `
      <div class="side-panel" id="add-person-modal">
        <div class="panel-header">
          <span class="panel-title">ADD PERSON [STEP ${this.currentStep}/3]</span>
          <button type="button" class="btn-text" id="close-add-modal-btn">[✕ ESC]</button>
        </div>
        <div class="panel-body">
          ${this.renderStepContent()}
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private renderStepContent(): string {
    if (this.currentStep === 1) {
      return `
        <form id="step1-form">
          <div class="form-group">
            <label class="form-label">1. NAME</label>
            <input type="text" class="form-input" id="add-step1-name" placeholder="Type person name..." value="${this.personName}" autofocus required />
          </div>
          <div style="display: flex; justify-content: flex-end; margin-top: 24px;">
            <button type="submit" class="btn-rect btn-primary">NEXT: CIRCLE →</button>
          </div>
        </form>
      `;
    }

    if (this.currentStep === 2) {
      return `
        <div>
          <div class="form-label">2. SELECT INTIMACY CIRCLE FOR "${this.personName.toUpperCase()}"</div>
          <div style="font-size: 10px; color: #a8636e; margin-bottom: 14px;">PRESS 1–4 OR CLICK AN OPTION BELOW:</div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div class="circle-choice-option" data-circle="core">
              <div style="font-weight: 700; color: #ffffff;">[1] CORE</div>
              <div style="font-size: 10px; opacity: 0.8;">${CIRCLE_DESCRIPTIONS.core}</div>
            </div>

            <div class="circle-choice-option" data-circle="close">
              <div style="font-weight: 700; color: #ffffff;">[2] CLOSE</div>
              <div style="font-size: 10px; opacity: 0.8;">${CIRCLE_DESCRIPTIONS.close}</div>
            </div>

            <div class="circle-choice-option" data-circle="regular">
              <div style="font-weight: 700; color: #ffffff;">[3] REGULAR</div>
              <div style="font-size: 10px; opacity: 0.8;">${CIRCLE_DESCRIPTIONS.regular}</div>
            </div>

            <div class="circle-choice-option" data-circle="distant">
              <div style="font-weight: 700; color: #ffffff;">[4] DISTANT</div>
              <div style="font-size: 10px; opacity: 0.8;">${CIRCLE_DESCRIPTIONS.distant}</div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; margin-top: 24px;">
            <button type="button" class="btn-text" id="back-step1-btn">← BACK</button>
          </div>
        </div>
      `;
    }

    return `
      <div>
        <div class="form-label">3. LAST SPOKE TO "${this.personName.toUpperCase()}"</div>

        <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px;">
          ${[
            { id: 'today', label: 'TODAY' },
            { id: 'this_week', label: 'THIS WEEK' },
            { id: 'this_month', label: 'THIS MONTH' },
            { id: 'a_while_ago', label: 'A WHILE AGO' },
            { id: 'not_sure', label: 'NOT SURE' }
          ]
            .map(
              (opt) => `
            <div class="spoke-choice-option ${this.selectedLastSpoke === opt.id ? 'active' : ''}" data-spoke="${opt.id}">
              <span>${opt.label}</span>
              ${this.selectedLastSpoke === opt.id ? '<span>[■]</span>' : ''}
            </div>
          `
            )
            .join('')}
        </div>

        <!-- Optional More Toggle -->
        <div>
          <button type="button" class="btn-text" id="toggle-more-btn" style="margin-bottom: 12px;">
            ${this.showMore ? '[-] FEWER OPTIONS' : '[+] MORE OPTIONS (CATEGORY & NOTES)'}
          </button>

          ${
            this.showMore
              ? `
            <div class="form-group">
              <label class="form-label">CATEGORY TAG</label>
              <select class="form-select" id="add-more-category">
                <option value="friend" ${this.selectedCategory === 'friend' ? 'selected' : ''}>FRIEND</option>
                <option value="family" ${this.selectedCategory === 'family' ? 'selected' : ''}>FAMILY</option>
                <option value="partner" ${this.selectedCategory === 'partner' ? 'selected' : ''}>PARTNER</option>
                <option value="colleague" ${this.selectedCategory === 'colleague' ? 'selected' : ''}>COLLEAGUE</option>
                <option value="acquaintance" ${this.selectedCategory === 'acquaintance' ? 'selected' : ''}>ACQUAINTANCE</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">NOTES</label>
              <textarea class="form-textarea" id="add-more-notes" rows="2" placeholder="Optional notes...">${this.notes}</textarea>
            </div>
          `
              : ''
          }
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px;">
          <button type="button" class="btn-text" id="back-step2-btn">← BACK</button>
          <button type="button" class="btn-rect btn-primary" id="finish-add-btn">ADD TO ORBIT</button>
        </div>
      </div>
    `;
  }

  private attachEvents() {
    const modal = this.container.querySelector('#add-person-modal') as HTMLElement;
    if (!modal) return;

    modal.querySelector('#close-add-modal-btn')?.addEventListener('click', () => this.close());

    // Step 1 Form
    const step1Form = modal.querySelector('#step1-form') as HTMLFormElement;
    step1Form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = modal.querySelector('#add-step1-name') as HTMLInputElement;
      if (input && input.value.trim()) {
        this.personName = input.value.trim();
        this.currentStep = 2;
        this.render();
      }
    });

    // Step 2 Circle Options
    modal.querySelectorAll('.circle-choice-option').forEach((opt) => {
      opt.addEventListener('click', (e) => {
        const circle = (e.currentTarget as HTMLElement).getAttribute('data-circle') as Circle;
        this.selectCircle(circle);
      });
    });

    modal.querySelector('#back-step1-btn')?.addEventListener('click', () => {
      this.currentStep = 1;
      this.render();
    });

    // Step 3 Options
    modal.querySelectorAll('.spoke-choice-option').forEach((opt) => {
      opt.addEventListener('click', (e) => {
        this.selectedLastSpoke = (e.currentTarget as HTMLElement).getAttribute('data-spoke') as any;
        this.render();
      });
    });

    modal.querySelector('#toggle-more-btn')?.addEventListener('click', () => {
      this.showMore = !this.showMore;
      this.render();
    });

    modal.querySelector('#back-step2-btn')?.addEventListener('click', () => {
      this.currentStep = 2;
      this.render();
    });

    modal.querySelector('#finish-add-btn')?.addEventListener('click', () => {
      if (this.showMore) {
        const catEl = modal.querySelector('#add-more-category') as HTMLSelectElement;
        const notesEl = modal.querySelector('#add-more-notes') as HTMLTextAreaElement;
        if (catEl) this.selectedCategory = catEl.value;
        if (notesEl) this.notes = notesEl.value;
      }
      this.submitPerson();
    });
  }
}
