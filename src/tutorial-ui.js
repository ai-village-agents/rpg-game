import { getTutorialProgress } from './tutorial.js';

export function getTutorialStyles() {
  return `
.tutorial-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 10001;
  display: flex;
  pointer-events: auto;
}

.tutorial-tooltip {
  max-width: 480px;
  background: #1a1a2e;
  border: 2px solid #e94560;
  border-radius: 12px;
  padding: 20px 24px;
  color: #eee;
  font-family: monospace;
  box-shadow: 0 8px 32px rgba(0,0,0,0.6);
  animation: tutorialFadeIn 0.3s ease-out;
}

.tutorial-tooltip.position-top {
  align-self: flex-start;
  margin-top: 80px;
}

.tutorial-tooltip.position-bottom {
  align-self: flex-end;
  margin-bottom: 80px;
}

.tutorial-tooltip.position-center {
  align-self: center;
}

.tutorial-title {
  font-size: 1.2em;
  font-weight: bold;
  color: #e94560;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tutorial-title::before {
  content: "💡";
}

.tutorial-message {
  line-height: 1.6;
  color: #ccc;
  margin-bottom: 16px;
}

.tutorial-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.tutorial-btn {
  padding: 8px 20px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-family: monospace;
  font-size: 0.9em;
  transition: all 0.2s;
}

.tutorial-btn-dismiss {
  background: #e94560;
  color: white;
}

.tutorial-btn-dismiss:hover {
  background: #ff6b81;
}

.tutorial-btn-disable {
  background: transparent;
  border: 1px solid #555;
  color: #888;
}

.tutorial-btn-disable:hover {
  border-color: #888;
  color: #ccc;
}

.tutorial-progress {
  font-size: 0.75em;
  color: #666;
  margin-top: 12px;
  text-align: right;
}

@keyframes tutorialFadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
}

export function renderTutorialHint(tutorialState) {
  if (!tutorialState || !tutorialState.currentHint) {
    return '';
  }

  const { currentHint } = tutorialState;
  const progress = getTutorialProgress(tutorialState);

  return `
<div class="tutorial-overlay" id="tutorialOverlay">
  <div class="tutorial-tooltip position-${currentHint.position}">
    <div class="tutorial-title">${currentHint.title}</div>
    <div class="tutorial-message">${currentHint.message}</div>
    <div class="tutorial-actions">
      <button class="tutorial-btn tutorial-btn-disable" id="btnTutorialDisable">Disable hints</button>
      <button class="tutorial-btn tutorial-btn-dismiss" id="btnTutorialDismiss">Got it!</button>
    </div>
    <div class="tutorial-progress">${progress.completed}/${progress.total} completed</div>
  </div>
</div>
`;
}

export function attachTutorialHandlers(dispatch) {
  const dismissBtn = document.getElementById('btnTutorialDismiss');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      dispatch({ type: 'TUTORIAL_DISMISS' });
    });
  }

  const disableBtn = document.getElementById('btnTutorialDisable');
  if (disableBtn) {
    disableBtn.addEventListener('click', () => {
      dispatch({ type: 'TUTORIAL_DISABLE' });
    });
  }

  const overlay = document.getElementById('tutorialOverlay');
  if (overlay) {
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        dispatch({ type: 'TUTORIAL_DISMISS' });
      }
    });
  }
}
