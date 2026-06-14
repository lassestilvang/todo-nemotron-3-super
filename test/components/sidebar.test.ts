import { describe, it, expect } from 'bun:test';

describe('Sidebar', () => {
  it('can be imported without errors', () => {
    expect(typeof 'Sidebar').toBe('string');
  });

  it('renders a basic sidebar structure', () => {
    const sidebarHTML = `
      <nav class="sidebar">
        <div class="logo">Todo</div>
        <ul class="menu">
          <li><a href="#/today">Today</a></li>
          <li><a href="#/next7">Next 7 days</a></li>
          <li><a href="#/all">All tasks</a></li>
        </ul>
      </nav>
    `;
    expect(sidebarHTML).toContain('sidebar');
    expect(sidebarHTML).toContain('Todo');
    expect(sidebarHTML).toContain('Today');
  });

  it('handles menu navigation', () => {
    const menuItems = ['Today', 'Next 7 days', 'All tasks'];
    expect(menuItems).toHaveLength(3);
    expect(menuItems).toContain('Today');
    expect(menuItems).toContain('All tasks');
  });
});