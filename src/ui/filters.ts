export type CategoryFilterCallback = (hiddenCategories: Set<string>) => void;

export class CategoryFilterUI {
  private container: HTMLElement;
  private hiddenCategories: Set<string> = new Set();
  private onChangeCallback?: CategoryFilterCallback;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();
  }

  public setOnChange(cb: CategoryFilterCallback) {
    this.onChangeCallback = cb;
  }

  private toggleCategory(cat: string) {
    if (this.hiddenCategories.has(cat)) {
      this.hiddenCategories.delete(cat);
    } else {
      this.hiddenCategories.add(cat);
    }

    this.render();
    if (this.onChangeCallback) {
      this.onChangeCallback(this.hiddenCategories);
    }
  }

  public updateCounts(people: any[]) {
    this.render(people);
  }

  private render(people: any[] = []) {
    const categories = ['partner', 'family', 'friend', 'colleague', 'acquaintance'];

    // Calculate count per category
    const counts: Record<string, number> = {};
    categories.forEach((c) => (counts[c] = 0));
    people.forEach((p) => {
      if (p.category && counts[p.category] !== undefined) {
        counts[p.category]++;
      }
    });

    this.container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 4px;">
        <div class="hud-label" style="margin-bottom: 4px;">CATEGORIES</div>
        ${categories
          .map((cat) => {
            const isHidden = this.hiddenCategories.has(cat);
            const count = counts[cat] || 0;
            return `
            <div class="category-legend-item ${isHidden ? 'is-hidden' : ''}" data-cat="${cat}">
              <span class="legend-dot"></span>
              <span class="legend-name">${cat.toUpperCase()}</span>
              <span class="legend-count">[${count}]</span>
            </div>
          `;
          })
          .join('')}
      </div>
    `;

    this.container.querySelectorAll('.category-legend-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        const cat = (e.currentTarget as HTMLElement).getAttribute('data-cat');
        if (cat) this.toggleCategory(cat);
      });
    });
  }
}
