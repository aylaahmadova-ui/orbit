import { store } from '../state/store';

export class SearchModal {
  private container: HTMLElement;
  private onSelectPersonCallback?: (id: string) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
    this.setupShortcut();
  }

  public setOnSelectPerson(cb: (id: string) => void) {
    this.onSelectPersonCallback = cb;
  }

  public open() {
    const modal = this.container.querySelector('#search-modal') as HTMLElement;
    if (modal) {
      modal.classList.add('open');
      const input = modal.querySelector('#search-input') as HTMLInputElement;
      if (input) {
        input.value = '';
        input.focus();
      }
    }
    this.performSearch('');
  }

  public close() {
    const modal = this.container.querySelector('#search-modal') as HTMLElement;
    if (modal) modal.classList.remove('open');
  }

  private setupShortcut() {
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        this.open();
      }
    });
  }

  private performSearch(query: string) {
    const list = this.container.querySelector('#search-results-list') as HTMLElement;
    if (!list) return;

    const state = store.getState();
    const q = query.toLowerCase().trim();

    const matches = state.people.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.circle.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        p.notes?.toLowerCase().includes(q)
    );

    if (matches.length === 0) {
      list.innerHTML = '<div style="padding: 16px; text-align: center; font-size: 10px; color: #a8636e;">NO MATCHES FOUND</div>';
      return;
    }

    list.innerHTML = matches
      .map(
        (p) => `
        <div class="search-item" data-id="${p.id}">
          <div>
            <div style="font-weight: 700; color: #ffffff; font-size: 12px;">${p.name.toUpperCase()}</div>
            <div style="font-size: 10px; color: #e4a2aa;">
              CIRCLE [${p.circle.toUpperCase()}] ${p.category ? `• ${p.category.toUpperCase()}` : ''}
            </div>
          </div>
          <span style="font-size: 10px; color: #ff7686; font-weight: 700;">FOCUS →</span>
        </div>
      `
      )
      .join('');

    list.querySelectorAll('.search-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
        if (id && this.onSelectPersonCallback) {
          this.onSelectPersonCallback(id);
        }
        this.close();
      });
    });
  }

  private render() {
    this.container.innerHTML = `
      <div class="search-modal" id="search-modal">
        <div style="padding: 12px 16px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid rgba(255,61,85,0.3);">
          <span style="font-size: 12px; color: #ff7686;">SEARCH [/]</span>
          <input type="text" id="search-input" class="form-input" placeholder="Type name, circle, or category..." style="border: none; background: transparent; padding: 0; font-size: 12px;" />
          <button type="button" class="btn-text" id="close-search-btn">[✕ ESC]</button>
        </div>
        <div class="search-results-list" id="search-results-list"></div>
      </div>
    `;

    const input = this.container.querySelector('#search-input') as HTMLInputElement;
    input?.addEventListener('input', (e) => {
      this.performSearch((e.target as HTMLInputElement).value);
    });

    this.container.querySelector('#close-search-btn')?.addEventListener('click', () => this.close());
  }
}
