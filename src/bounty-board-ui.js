export function renderBountyBoardPanel(state) {
  const bb = state.bountyBoard || { bounties: [], completed: 0, lastRefreshTime: 0 };
  
  let html = `<div class="bounty-board-panel card">`;
  html += `<h2>Tavern Bounty Board</h2>`;
  html += `<p class="tavern-message">Looking for work? Complete these bounties for gold.</p>`;
  html += `<p>Bounties Completed: <strong>${bb.completed}</strong></p>`;
  
  if (!bb.bounties || bb.bounties.length === 0) {
      html += `<p>No bounties available right now.</p>`;
      html += `<button data-action="REFRESH_BOUNTIES">Check Board</button>`;
      return html + `</div>`;
  }

  html += `<div class="bounties-list" style="margin-top: 15px; display: grid; gap: 10px;">`;
  
  let hasActive = false;
  
  bb.bounties.forEach(bounty => {
      let statusText = bounty.status;
      let buttonHtml = '';
      let style = 'border: 1px solid #ccc; padding: 10px; border-radius: 4px;';
      
      if (bounty.status === 'AVAILABLE') {
          buttonHtml = `<button data-action="ACCEPT_BOUNTY" data-id="${bounty.id}">Accept Bounty</button>`;
      } else if (bounty.status === 'ACTIVE') {
          hasActive = true;
          style = 'border: 2px solid #ffaa00; padding: 10px; border-radius: 4px; background: rgba(255, 170, 0, 0.1);';
          statusText = `ACTIVE (${bounty.currentAmount} / ${bounty.targetAmount})`;
      } else if (bounty.status === 'COMPLETED') {
          style = 'border: 1px solid #00cc00; padding: 10px; border-radius: 4px; opacity: 0.7;';
      }

      html += `<div class="bounty-card" style="${style}">`;
      html += `<h3>${bounty.description}</h3>`;
      html += `<p>Reward: <strong>${bounty.reward}g</strong></p>`;
      html += `<p>Status: <strong>${statusText}</strong></p>`;
      
      if (buttonHtml && !hasActive) {
          html += `<div style="margin-top: 10px;">${buttonHtml}</div>`;
      }
      html += `</div>`;
  });
  
  html += `</div>`;
  
  html += `<div class="buttons" style="margin-top: 20px;">`;
  html += `<button data-action="REFRESH_BOUNTIES">Refresh Bounties</button>`;
  html += `</div>`;
  
  html += `</div>`;
  return html;
}
