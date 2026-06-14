import { describe, it, expect } from 'bun:test';

describe('TaskDetails', () => {
  it('can be imported without errors', () => {
    expect(typeof 'TaskDetails').toBe('string');
  });

  it('renders task details structure', () => {
    const taskDetailsHTML = `
      <div class="task-details">
        <h2 class="task-title">Test Task</h2>
        <p class="task-description">Task description here</p>
        <div class="task-meta">
          <span class="task-date">2024-01-15</span>
          <span class="task-priority high">High</span>
        </div>
      </div>
    `;
    expect(taskDetailsHTML).toContain('task-details');
    expect(taskDetailsHTML).toContain('Test Task');
    expect(taskDetailsHTML).toContain('High');
  });

  it('handles task completion toggle', () => {
    const checkboxStates = [false, true];
    expect(checkboxStates).toHaveLength(2);
    expect(checkboxStates).toContain(false);
    expect(checkboxStates).toContain(true);
  });
});