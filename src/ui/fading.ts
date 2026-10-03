import { store } from '../state/store';

export class FadingListUI {
  private container: HTMLElement;
  private onSelectPersonCallback?: (id: string) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  public setOnSelectPerson(cb: (id: string) => void) {
    this.onSelectPersonCallback = cb;
  }

  public update() {
    const fadingPeople = store.getFadingPeople(5);
    const listEl = this.container.querySelector('#fading-list') as HTMLElement;
    if (!listEl) return;

    if (fadingPeople.length === 0) {
      listEl.innerHTML = `
        <div style="font-size: 11px; color: #a8636e; font-style: italic;">
          All Core & Close connections recently contacted.
        </div>
      `;
      return;
    }

    listEl.innerHTML = fadingPeople
      .map(
        (p) => `
        <div class="fading-item" data-id="${p.id}">
          <div style="font-weight: 700; color: #ffd9dd;">${p.name}</div>
          <div style="font-size: 10px; color: #ff7686; text-transform: uppercase;">
            ${p.circle.toUpperCase()} • ${this.getDaysAgo(p.lastContact)}
          </div>
        </div>
      `
      )
      .join('');

    listEl.querySelectorAll('.fading-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-id');
        if (id && this.onSelectPersonCallback) {
          this.onSelectPersonCallback(id);
        }
      });
    });
  }

  private getDaysAgo(lastContact?: string): string {
    if (!lastContact) return 'No date logged';
    const diffMs = Date.now() - new Date(lastContact).getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return `${days}d ago`;
  }

  private render() {
    this.container.innerHTML = `
      <div style="margin-top: 14px;">
        <div class="hud-label" style="margin-bottom: 6px; color: #ff7686;">⚡ FADING CONNECTIONS</div>
        <div id="fading-list" style="display: flex; flex-direction: column; gap: 6px;"></div>
      </div>
    `;

    this.update();
  }
}
