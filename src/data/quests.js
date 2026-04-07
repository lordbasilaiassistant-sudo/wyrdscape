// Wyrdscape quests — original questlines with stages, goals, and rewards
// Stage goals are checked by the quest system; complete=true marks them done.

export const QUESTS = {
  // ─────────────── Tutorial / introductory quest ───────────────
  the_lost_locket: {
    id: 'the_lost_locket',
    name: 'The Lost Locket',
    description: "Reeve Edda Marrowhite has hired you to deal with the goblin raids on the Eastmarch road — and to recover a personal heirloom stolen from her by a bandit last winter. Five goblins. One locket. Simple work, if you live through it.",
    giverId: 'edda_marrowhite',
    region: 'hearthmoor',
    difficulty: 'novice',
    stages: [
      {
        id: 'stage_1',
        description: "Speak with Reeve Edda Marrowhite in Hearthmoor.",
        goal: { type: 'talk_to', npc: 'edda_marrowhite', node: 'quest_start' },
        complete: false
      },
      {
        id: 'stage_2',
        description: "Slay 5 Marsh Goblins along the Eastmarch road.",
        goal: { type: 'kill', monster: 'goblin', count: 5 },
        complete: false
      },
      {
        id: 'stage_3',
        description: "Recover the tarnished locket from an Eastmarch Bandit.",
        goal: { type: 'collect', item: 'edda_locket', count: 1 },
        complete: false
      },
      {
        id: 'stage_4',
        description: "Return the locket to Reeve Edda Marrowhite in Hearthmoor.",
        goal: { type: 'talk_to', npc: 'edda_marrowhite', node: 'greet' },
        complete: false
      }
    ],
    reward: {
      coins: 250,
      items: [
        { item: 'iron_cutlass', quantity: 1 },
        { item: 'bread',        quantity: 5 }
      ],
      xp: { attack: 200, defence: 200, hitpoints: 100 },
      questPoints: 1
    }
  },

  // ─────────────── Optional side quest from the worried farmer ───────────────
  thinning_the_herd: {
    id: 'thinning_the_herd',
    name: 'Thinning the Herd',
    description: "Calden Brookside, a cattle farmer south of Hearthmoor, claims his herd has gone wrong. He cannot bring himself to put them down. He has asked you to slaughter five of his pale cows.",
    giverId: 'calden_the_farmer',
    region: 'hearthmoor',
    difficulty: 'beginner',
    stages: [
      {
        id: 'stage_1',
        description: "Speak with Calden Brookside at his farm.",
        goal: { type: 'talk_to', npc: 'calden_the_farmer', node: 'accept' },
        complete: false
      },
      {
        id: 'stage_2',
        description: "Slay 5 Lowland Cows in Calden's south field.",
        goal: { type: 'kill', monster: 'cow', count: 5 },
        complete: false
      },
      {
        id: 'stage_3',
        description: "Return to Calden Brookside.",
        goal: { type: 'talk_to', npc: 'calden_the_farmer', node: 'greet' },
        complete: false
      }
    ],
    reward: {
      coins: 80,
      items: [
        { item: 'cooked_beef', quantity: 5 }
      ],
      xp: { attack: 60, hitpoints: 30 },
      questPoints: 1
    }
  }
};

// Helper: get quest by id
export function getQuest(id) {
  return QUESTS[id] || null;
}

// Helper: get all quests for a region
export function getQuestsForRegion(region) {
  return Object.values(QUESTS).filter(q => q.region === region);
}

// Helper: clone a quest for a player save (so stages.complete is per-player)
export function instantiateQuest(id) {
  const q = QUESTS[id];
  if (!q) return null;
  return {
    id: q.id,
    started: true,
    completed: false,
    currentStage: 0,
    stages: q.stages.map(s => ({ ...s, complete: false }))
  };
}

export default QUESTS;
