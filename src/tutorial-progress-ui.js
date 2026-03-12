import { TUTORIAL_STEPS, getTutorialProgress } from './tutorial.js';

export function getTutorialProgressStyles() {
  return `
.tutorial-progress-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1002;
  pointer-events: auto;
}

.tutorial-progress-modal {
  background: #1a1a2e;
  border: 2px solid #4a4a8e;
  border-radius: 12px;
  padding: 24px 28px;
  max-width: 700px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  color: #eee;
  font-family: monospace;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6);
  animation: tutorialProgressFadeIn 0.3s ease-out;
}

.tutorial-progress-modal h2 {
  margin-top: 0;
  border-bottom: 2px solid #4a4a8e;
  padding-bottom: 12px;
  color: #aaf;
  display: flex;
  align-items: center;
  gap: 10px;
}

.tutorial-progress-modal h2::before {
  content: "📚";
}

.tutorial-progress-summary {
  background: #2a2a3e;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tutorial-progress-bar-container {
  flex: 1;
  margin-right: 20px;
}

.tutorial-progress-bar-bg {
  height: 12px;
  background: #33334a;
  border-radius: 6px;
  overflow: hidden;
}

.tutorial-progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a4a8e, #6a6aff);
  border-radius: 6px;
  transition: width 0.5s ease;
}

.tutorial-progress-stats {
  text-align: right;
  min-width: 120px;
}

.tutorial-progress-percentage {
  font-size: 1.5em;
  font-weight: bold;
  color: #6a6aff;
}

.tutorial-progress-count {
  font-size: 0.9em;
  color: #aaa;
}

.tutorial-step-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.tutorial-step-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #2a2a3e;
  border-radius: 8px;
  border-left: 4px solid #444;
  transition: background 0.2s;
}

.tutorial-step-item.completed {
  border-left-color: #4a8e4a;
  background: rgba(74, 142, 74, 0.1);
}

.tutorial-step-item.current {
  border-left-color: #6a6aff;
  background: rgba(106, 106, 255, 0.1);
}

.tutorial-step-icon {
  width: 24px;
  height: 24px;
  margin-right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1em;
}

.tutorial-step-content {
  flex: 1;
}

.tutorial-step-title {
  font-weight: bold;
  color: #ddd;
  margin-bottom: 4px;
}

.tutorial-step-desc {
  font-size: 0.9em;
  color: #aaa;
  line-height: 1.4;
}

.tutorial-step-trigger {
  font-size: 0.8em;
  color: #888;
  margin-top: 4px;
  font-style: italic;
}

.tutorial-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid #33334a;
  padding-top: 20px;
}

.tutorial-progress-btn {
  padding: 10px 20px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-family: monospace;
  font-size: 0.95em;
  font-weight: bold;
  transition: all 0.2s;
}

.tutorial-progress-btn-primary {
  background: #4a4a8e;
  color: white;
}

.tutorial-progress-btn-primary:hover {
  background: #6a6aff;
}

.tutorial-progress-btn-secondary {
  background: transparent;
  border: 1px solid #555;
  color: #aaa;
}

.tutorial-progress-btn-secondary:hover {
  border-color: #888;
  color: #ddd;
}

.tutorial-progress-btn-warning {
  background: transparent;
  border: 1px solid #8e4a4a;
  color: #e94560;
}

.tutorial-progress-btn-warning:hover {
  background: rgba(233, 69, 96, 0.1);
  border-color: #e94560;
}

.tutorial-hints-status {
  font-size: 0.9em;
  color: #888;
  margin-top: 8px;
  text-align: center;
}

@keyframes tutorialProgressFadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
}

export function renderTutorialProgressPanel(tutorialState) {
  const progress = getTutorialProgress(tutorialState);
  const totalSteps = TUTORIAL_STEPS.length;
  const completedSteps = tutorialState.completedSteps.length;
  const hintsEnabled = tutorialState.hintsEnabled;
  
  // Determine which steps are completed
  const stepItems = TUTORIAL_STEPS.map(step => {
    const isCompleted = tutorialState.completedSteps.includes(step.id);
    const isCurrent = tutorialState.currentHint?.id === step.id;
    let statusClass = '';
    if (isCompleted) statusClass = 'completed';
    else if (isCurrent) statusClass = 'current';
    
    return `
      <div class="tutorial-step-item ${statusClass}">
        <div class="tutorial-step-icon">
          ${isCompleted ? '✅' : isCurrent ? '💡' : '○'}
        </div>
        <div class="tutorial-step-content">
          <div class="tutorial-step-title">${step.title}</div>
          <div class="tutorial-step-desc">${step.message}</div>
          <div class="tutorial-step-trigger">Trigger: ${step.trigger}</div>
        </div>
      </div>
    `;
  }).join('');
  
  return `
    <div class="tutorial-progress-overlay" id="tutorialProgressOverlay">
      <div class="tutorial-progress-modal">
        <h2>Tutorial Progress</h2>
        
        <div class="tutorial-progress-summary">
          <div class="tutorial-progress-bar-container">
            <div class="tutorial-progress-bar-bg">
              <div class="tutorial-progress-bar-fill" style="width: ${progress.percentage}%"></div>
            </div>
          </div>
          <div class="tutorial-progress-stats">
            <div class="tutorial-progress-percentage">${progress.percentage}%</div>
            <div class="tutorial-progress-count">${completedSteps}/${totalSteps} steps</div>
          </div>
        </div>
        
        <div class="tutorial-step-list">
          ${stepItems}
        </div>
        
        <div class="tutorial-actions">
          <div>
            <button class="tutorial-progress-btn tutorial-progress-btn-warning" id="btnTutorialReenableHints" ${hintsEnabled ? 'disabled style="opacity:0.5; cursor:default;"' : ''}>
              ${hintsEnabled ? 'Hints Enabled' : 'Re‑enable Hints'}
            </button>
          </div>
          <div>
            <button class="tutorial-progress-btn tutorial-progress-btn-secondary" id="btnTutorialProgressClose">Close</button>
            <button class="tutorial-progress-btn tutorial-progress-btn-primary" id="btnTutorialReset">Reset Tutorial</button>
          </div>
        </div>
        
        <div class="tutorial-hints-status">
          ${hintsEnabled ? '💡 Tutorial hints are currently enabled.' : '⚠️ Tutorial hints are disabled.'}
        </div>
      </div>
    </div>
  `;
}

export function attachTutorialProgressHandlers(dispatch) {
  // Close button
  const closeBtn = document.getElementById('btnTutorialProgressClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      dispatch({ type: 'CLOSE_TUTORIAL_PROGRESS' });
    });
  }
  
  // Re-enable hints button
  const reenableBtn = document.getElementById('btnTutorialReenableHints');
  if (reenableBtn && !reenableBtn.disabled) {
    reenableBtn.addEventListener('click', () => {
      dispatch({ type: 'TUTORIAL_REENABLE_HINTS' });
    });
  }
  
  // Reset tutorial button
  const resetBtn = document.getElementById('btnTutorialReset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset all tutorial progress? This will clear your completed steps and re-enable hints. This action cannot be undone.')) {
        dispatch({ type: 'TUTORIAL_RESET' });
      }
    });
  }
  
  // Close on overlay click
  const overlay = document.getElementById('tutorialProgressOverlay');
  if (overlay) {
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        dispatch({ type: 'CLOSE_TUTORIAL_PROGRESS' });
      }
    });
  }
}
