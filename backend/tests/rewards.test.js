// Unit test suite verifying Phase 5 Glow Points rewards engine calculation and level thresholds.
// Asserts level progression thresholds (Seed to Nutrition Guru) and points awarding.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { calculateLevel, awardPoints, getUserRewards } from '../src/services/rewardsEngine.js';
import { prisma } from '../src/config/prisma.js';

describe('Phase 5 Glow Points Rewards Engine', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await prisma.user.create({
      data: {
        deviceToken: `reward-test-${Math.random().toString(36).substring(2, 9)}`,
      },
    });
  });

  afterEach(async () => {
    if (testUser) {
      await prisma.rewardPoints.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    }
  });

  it('Part E1 — calculateLevel maps points to 7 level titles correctly', () => {
    expect(calculateLevel(0).title).toBe('Seed 💡');
    expect(calculateLevel(0).level).toBe(1);

    expect(calculateLevel(25).title).toBe('Sprout 🌱');
    expect(calculateLevel(25).level).toBe(2);

    expect(calculateLevel(60).title).toBe('Leaf 🍃');
    expect(calculateLevel(60).level).toBe(3);

    expect(calculateLevel(150).title).toBe('Bloom 🌸');
    expect(calculateLevel(150).level).toBe(4);

    expect(calculateLevel(300).title).toBe('Harvest 🌾');
    expect(calculateLevel(300).level).toBe(5);

    expect(calculateLevel(500).title).toBe('Master Thali 🍱');
    expect(calculateLevel(500).level).toBe(6);

    expect(calculateLevel(750).title).toBe('Nutrition Guru 👑');
    expect(calculateLevel(750).level).toBe(7);
  });

  it('Part E2 — awardPoints increments Glow Points and updates level info', async () => {
    const res1 = await awardPoints(testUser.id, { patience: 3, balance: 5, completion: 2 });
    expect(res1.totalPoints).toBe(10);
    expect(res1.level).toBe(1);

    const res2 = await awardPoints(testUser.id, { patience: 10, balance: 10, completion: 5 });
    expect(res2.totalPoints).toBe(35);
    expect(res2.level).toBe(2);
    expect(res2.title).toBe('Sprout 🌱');

    const rewards = await getUserRewards(testUser.id);
    expect(rewards.totalPoints).toBe(35);
    expect(rewards.patiencePoints).toBe(13);
    expect(rewards.balancePoints).toBe(15);
    expect(rewards.completionPoints).toBe(7);
  });
});
