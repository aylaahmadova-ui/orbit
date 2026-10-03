import { Category } from '../types';

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

  private toggleCategory(cat: Category) {
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

  private render() {
    const categories: Category[] = ['partner', 'family', 'close_friend', 'friend', 'colleague', 'acquaintance'];

    this.container.innerHTML = `
      <div style="display: flex; flex-wrap: wrap; gap: 6px;">
        ${categories
          .map((cat) => {
            const isHidden = this.hiddenCategories.has(cat);
            return `
            <button type="button" class="btn-icon category-filter-btn" data-cat="${cat}" style="padding: 5px 10px; font-size: 11px; opacity: ${
              isHidden ? 0.35 : 1
            }; border-color: ${isHidden ? 'rgba(255,61,85,0.15)' : 'rgba(255,118,134,0.5)'};">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: ${
                isHidden ? '#a8636e' : '#ff7686'
              }; display: inline-block;"></span>
              ${cat.replace('_', ' ')}
            </button>
          `;
          })
          .join('')}
      </div>
    `;

    this.container.querySelectorAll('.category-filter-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const cat = (e.currentTarget as HTMLElement).getAttribute('data-cat') as Category;
        this.toggleCategory(cat);
      });
    });
  }
}
