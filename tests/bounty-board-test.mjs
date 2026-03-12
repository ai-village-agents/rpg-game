import test from 'node:test';
import assert from 'node:assert';
import { createBountyBoardState, generateBounties, acceptBounty, updateBountyProgress } from '../src/bounty-board.js';

test('Bounty Board System', async (t) => {
    
    await t.test('createBountyBoardState returns expected structure', () => {
        const state = createBountyBoardState();
        assert.deepStrictEqual(state.bounties, []);
        assert.strictEqual(state.completed, 0);
        assert.strictEqual(state.lastRefreshTime, 0);
    });

    await t.test('generateBounties creates 3 available bounties', () => {
        const state = generateBounties({});
        assert.ok(state.bountyBoard);
        assert.strictEqual(state.bountyBoard.bounties.length, 3);
        assert.ok(state.bountyBoard.lastRefreshTime > 0);
        
        for (const bounty of state.bountyBoard.bounties) {
            assert.strictEqual(bounty.status, 'AVAILABLE');
            assert.ok(bounty.type === 'SLAY' || bounty.type === 'COLLECT');
            assert.ok(bounty.reward > 0);
        }
    });

    await t.test('generateBounties does not refresh if recently refreshed and bounties exist', () => {
        const state1 = generateBounties({});
        const state2 = generateBounties(state1);
        
        assert.strictEqual(state1.bountyBoard.bounties, state2.bountyBoard.bounties);
        assert.strictEqual(state1.bountyBoard.lastRefreshTime, state2.bountyBoard.lastRefreshTime);
    });

    await t.test('acceptBounty changes status to ACTIVE', () => {
        const state = generateBounties({});
        const bountyId = state.bountyBoard.bounties[0].id;
        
        const newState = acceptBounty(state, bountyId);
        
        const updatedBounty = newState.bountyBoard.bounties.find(b => b.id === bountyId);
        assert.strictEqual(updatedBounty.status, 'ACTIVE');
    });

    await t.test('acceptBounty does not allow multiple active bounties', () => {
        let state = generateBounties({});
        const id1 = state.bountyBoard.bounties[0].id;
        const id2 = state.bountyBoard.bounties[1].id;
        
        state = acceptBounty(state, id1);
        const newState = acceptBounty(state, id2);
        
        assert.strictEqual(newState.bountyBoard.bounties.find(b => b.id === id2).status, 'AVAILABLE');
    });

    await t.test('updateBountyProgress increments active bounty currentAmount', () => {
        let state = generateBounties({});
        
        // Force a specific bounty for testing
        state.bountyBoard.bounties[0] = {
            id: 'test_bounty',
            type: 'SLAY',
            description: 'Defeat 3 Goblin',
            target: 'Goblin',
            targetAmount: 3,
            currentAmount: 0,
            reward: 100,
            status: 'ACTIVE'
        };

        const newState = updateBountyProgress(state, 'ENEMY_DEFEATED', 'Goblin', 1);
        
        assert.strictEqual(newState.bountyBoard.bounties[0].currentAmount, 1);
        assert.strictEqual(newState.bountyBoard.bounties[0].status, 'ACTIVE');
    });

    await t.test('updateBountyProgress completes bounty and rewards gold', () => {
        let state = generateBounties({});
        state.player = { gold: 0 };
        
        state.bountyBoard.bounties[0] = {
            id: 'test_bounty',
            type: 'COLLECT',
            description: 'Gather 2 Herbs',
            target: 'Herbs',
            targetAmount: 2,
            currentAmount: 1,
            reward: 50,
            status: 'ACTIVE'
        };

        const newState = updateBountyProgress(state, 'ITEM_COLLECTED', 'Herbs', 1);
        
        assert.strictEqual(newState.bountyBoard.bounties[0].currentAmount, 2);
        assert.strictEqual(newState.bountyBoard.bounties[0].status, 'COMPLETED');
        assert.strictEqual(newState.bountyBoard.completed, 1);
        assert.strictEqual(newState.player.gold, 50);
    });
    
    await t.test('updateBountyProgress ignores wrong action type', () => {
        let state = generateBounties({});
        
        state.bountyBoard.bounties[0] = {
            id: 'test_bounty',
            type: 'SLAY',
            target: 'Goblin',
            targetAmount: 3,
            currentAmount: 0,
            status: 'ACTIVE'
        };

        // Collecting instead of slaying
        const newState = updateBountyProgress(state, 'ITEM_COLLECTED', 'Goblin', 1);
        
        assert.strictEqual(newState.bountyBoard.bounties[0].currentAmount, 0);
    });
});
