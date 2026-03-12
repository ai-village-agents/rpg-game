export function createBountyBoardState() {
  return {
    bounties: [],
    completed: 0,
    lastRefreshTime: 0
  };
}

const BOUNTY_TYPES = [
  { type: 'SLAY', desc: 'Defeat', targetFn: () => ['Goblin', 'Skeleton', 'Slime', 'Wolf'][Math.floor(Math.random() * 4)], rewardBase: 50 },
  { type: 'COLLECT', desc: 'Gather', targetFn: () => ['Herbs', 'Iron Ore', 'Magic Dust'][Math.floor(Math.random() * 3)], rewardBase: 30 }
];

export function generateBounties(state) {
  const now = Date.now();
  // Allow refresh if 5 minutes passed or if all are completed or empty
  const timePassed = now - (state.bountyBoard?.lastRefreshTime || 0) > 5 * 60 * 1000;
  const hasActiveOrAvailable = state.bountyBoard?.bounties?.some(b => b.status === 'AVAILABLE' || b.status === 'ACTIVE');
  
  if (state.bountyBoard && state.bountyBoard.bounties.length > 0 && !timePassed && hasActiveOrAvailable) {
    return state;
  }

  // Generate new
  const newBounties = [];
  for (let i = 0; i < 3; i++) {
    const bType = BOUNTY_TYPES[Math.floor(Math.random() * BOUNTY_TYPES.length)];
    const target = bType.targetFn();
    const amount = Math.floor(Math.random() * 5) + 3;
    const reward = bType.rewardBase + (amount * 5);
    newBounties.push({
      id: `bounty_${now}_${i}`,
      type: bType.type,
      description: `${bType.desc} ${amount} ${target}`,
      target: target,
      targetAmount: amount,
      currentAmount: 0,
      reward: reward,
      status: 'AVAILABLE'
    });
  }

  return {
    ...state,
    bountyBoard: {
      ...(state.bountyBoard || createBountyBoardState()),
      bounties: newBounties,
      lastRefreshTime: now
    }
  };
}

export function acceptBounty(state, bountyId) {
  if (!state.bountyBoard) return state;
  const activeBounty = state.bountyBoard.bounties.find(b => b.status === 'ACTIVE');
  if (activeBounty) return state;

  return {
    ...state,
    bountyBoard: {
      ...state.bountyBoard,
      bounties: state.bountyBoard.bounties.map(b => 
        b.id === bountyId && b.status === 'AVAILABLE' ? { ...b, status: 'ACTIVE' } : b
      )
    }
  };
}

export function updateBountyProgress(state, actionType, targetName, amount = 1) {
    if (!state.bountyBoard || !state.bountyBoard.bounties) return state;
    
    let updated = false;
    let rewardGold = 0;
    let completedCount = state.bountyBoard.completed || 0;

    const newBounties = state.bountyBoard.bounties.map(b => {
        if (b.status !== 'ACTIVE') return b;
        
        const isSlay = b.type === 'SLAY' && actionType === 'ENEMY_DEFEATED';
        const isCollect = b.type === 'COLLECT' && actionType === 'ITEM_COLLECTED';
        
        if ((isSlay || isCollect) && b.target.toLowerCase() === targetName.toLowerCase()) {
            updated = true;
            const newAmount = Math.min(b.currentAmount + amount, b.targetAmount);
            if (newAmount >= b.targetAmount) {
                rewardGold += b.reward;
                completedCount++;
                return { ...b, currentAmount: newAmount, status: 'COMPLETED' };
            }
            return { ...b, currentAmount: newAmount };
        }
        return b;
    });

    if (!updated) return state;

    let newState = {
        ...state,
        bountyBoard: {
            ...state.bountyBoard,
            bounties: newBounties,
            completed: completedCount
        }
    };

    if (rewardGold > 0) {
        newState.player = {
            ...newState.player,
            gold: (newState.player.gold || 0) + rewardGold
        };
    }

    return newState;
}
