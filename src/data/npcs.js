// Wyrdscape NPCs — original characters with personality and dialogue trees
// Dialogue is structured as nodes with optional branching options.

export const NPCS = {
  // ─────────────── Edda Marrowhite — the village reeve / quest giver ───────────────
  edda_marrowhite: {
    id: 'edda_marrowhite',
    name: 'Reeve Edda Marrowhite',
    role: 'Village Reeve of Hearthmoor',
    questId: 'the_lost_locket',
    dialogue: [
      {
        id: 'greet',
        text: "You have the look of someone with empty pockets and a heavy sword. Good. Sit, traveler. Hearthmoor is short on both luck and able hands, and I have work for the second of those.",
        options: [
          { text: "What kind of work?", next: 'work' },
          { text: "Tell me about Hearthmoor.", next: 'hearthmoor' },
          { text: "What do you know of the wyrdstones?", next: 'wyrdstones' },
          { text: "Goodbye.", next: null }
        ]
      },
      {
        id: 'work',
        text: "Goblins. From the Eastmarch hills. They have been raiding our caravans and the south chapel bell rings on its own at night, which is not the goblins, but it bothers me all the same. I will pay you in marks and provisions if you put a few of those green-skinned wretches in the dirt — and I have a personal favor besides, if you have the stomach for it.",
        options: [
          { text: "Tell me about the favor.", next: 'favor' },
          { text: "I will deal with the goblins first.", next: 'quest_start' },
          { text: "Maybe later.", next: null }
        ]
      },
      {
        id: 'favor',
        text: "My grandmother's locket. I lost it on the Eastmarch road last winter, when the caravans still ran. A bandit took it from me — a coward in a brown scarf — and I have not had the heart to look since. If you find it, I would be... very grateful. The marks I can spare. The locket I cannot replace.",
        options: [
          { text: "I'll find it. And kill the goblins on the way.", next: 'quest_start' },
          { text: "I'll think about it.", next: null }
        ]
      },
      {
        id: 'quest_start',
        text: "Good. Five goblins. One locket. Come back to me when both are settled. The Eastmarch road runs east out of the village, past the chapel and the wheat field. Go with the wyrd, traveler.",
        options: [
          { text: "Goodbye.", next: null }
        ]
      },
      {
        id: 'hearthmoor',
        text: "A farming village. Two days' walk from Tarnholt, half a day from nothing. We had three hundred souls before the goblin raids. Now we have closer to two hundred and a great deal of empty houses. The chapel was built on a Warden stone — that is the only thing about us worth a song.",
        options: [
          { text: "What is a Warden stone?", next: 'wardens' },
          { text: "Back.", next: 'greet' }
        ]
      },
      {
        id: 'wardens',
        text: "Old. Older than us. The Wardens were here before there were villages, and they vanished before there were kings. Their stones still hum sometimes. The chapel one hummed three nights ago. I do not like that it hummed.",
        options: [
          { text: "Back.", next: 'greet' }
        ]
      },
      {
        id: 'wyrdstones',
        text: "Trouble in pretty packaging. The shards make adventurers strong. Strong adventurers solve problems. So I should like them, by rights. But every gift in this world is a debt, and the wyrdstones glow brighter every year. Ask me again in a hundred years what I think — I will be in the dirt, and the dirt does not lie.",
        options: [
          { text: "Back.", next: 'greet' }
        ]
      }
    ]
  },

  // ─────────────── Old Brann — the shopkeeper, no quests ───────────────
  old_brann: {
    id: 'old_brann',
    name: 'Old Brann the Pedler',
    role: 'General Goods Merchant',
    dialogue: [
      {
        id: 'greet',
        text: "Step in, step in. Brann's wares — the best you'll find in Hearthmoor, and the only you'll find in Hearthmoor. So you can take that as either a compliment or a complaint.",
        options: [
          { text: "What do you sell?", next: 'wares' },
          { text: "Heard any rumors?", next: 'rumors' },
          { text: "Tell me about yourself.", next: 'self' },
          { text: "Just browsing.", next: null }
        ]
      },
      {
        id: 'wares',
        text: "Bread, blades, bandages, and the occasional bit of bronze armor when the caravan from Tarnholt remembers we exist. I take silver marks. I do not take goblin teeth, even though three of you have tried this week.",
        options: [
          { text: "Back.", next: 'greet' }
        ]
      },
      {
        id: 'rumors',
        text: "The chapel bell rings at night. The reeve's hair is going white faster than her years. A man in pale robes was seen on the Eastmarch road last week and no one knows where he came from or where he went. Pick whichever rumor scares you the most and pretend the other two are nothing.",
        options: [
          { text: "Back.", next: 'greet' }
        ]
      },
      {
        id: 'self',
        text: "I came here from Saltgate forty years ago to marry a girl named Mara. She is in the chapel yard now and I am still here, selling bread. That is the whole story. There is no twist. Some lives are short stories, traveler. Most are.",
        options: [
          { text: "Back.", next: 'greet' }
        ]
      }
    ]
  },

  // ─────────────── Calden the Farmer — small worried-farmer side request ───────────────
  calden_the_farmer: {
    id: 'calden_the_farmer',
    name: 'Calden Brookside',
    role: 'Cattle Farmer',
    questId: 'thinning_the_herd',
    dialogue: [
      {
        id: 'greet',
        text: "Oh — oh, hello. You're an adventurer, yes? You have the boots for it. I have a problem. A small problem. Well — five small problems with hooves.",
        options: [
          { text: "Five problems with hooves?", next: 'problem' },
          { text: "I'm in a hurry.", next: null }
        ]
      },
      {
        id: 'problem',
        text: "My herd. Something in the water has soured them — they will not eat, they will not lie down, and they have started looking at me. Not at the grass. At ME. The reeve says I'm imagining things, but I'm not, and I cannot bring myself to do it. Could you... thin the herd? Five of them. The pale ones. I will pay what I can.",
        options: [
          { text: "Five cows. Done.", next: 'accept' },
          { text: "That's grim work. No.", next: 'refuse' }
        ]
      },
      {
        id: 'accept',
        text: "Bless you. Bless you. My field is south of the village, by the bend in the Merrow. The pale ones are the troubled ones — you will know them when you see them. Come back when it's done and I'll give you what marks I have.",
        options: [
          { text: "Goodbye.", next: null }
        ]
      },
      {
        id: 'refuse',
        text: "I... I understand. I would not want to either. If you change your mind, I'll be here. I will always be here.",
        options: [
          { text: "Goodbye.", next: null }
        ]
      }
    ]
  }
};

// Helper: get NPC by id
export function getNPC(id) {
  return NPCS[id] || null;
}

// Helper: get a specific dialogue node from an NPC
export function getDialogueNode(npcId, nodeId) {
  const npc = NPCS[npcId];
  if (!npc) return null;
  return npc.dialogue.find(n => n.id === nodeId) || null;
}

export default NPCS;
