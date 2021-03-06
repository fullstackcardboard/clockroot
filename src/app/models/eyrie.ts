import { Bot, BotName } from './bot';

export class EyrieBot extends Bot {

  public name: BotName = 'Eyrie';

  public setupPosition = 'B';
  public setupRules = [
    `Form a supply of 20 warriors near you.`,

    `Place 1 roost and 6 warriors in the corner clearing diagonally opposite from the clearing with the keep token.
    If the Marquise is not playing, place those pieces in a random corner clearing.`,

    `Tuck your 2 Loyal Vizier cards, showing their suit, into the rightmost Decree column.`,

    `Collect your 7 roost buildings and place them near you.`
  ];

  public difficultyDescriptions = {
    Easy: `
During setup, add only one Loyal Vizier to the Decree.
    `,
    Normal: 'Nothing is changed.',
    Challenging: `
During setup, take one bird Ambush from the deck and add it to the bird column of the Decree.
    `,
    Nightmare: `
During setup, take one bird Ambush from the deck and add it to the bird column of the Decree.

At the end of Evening, score one victory point.
    `
  };

  public rules = [
    {
      name: 'Poor Manual Dexterity',
      text: `You have no hand of cards. You cannot discard cards.
      If a human would take a card from you, they draw a card instead.
      If a human would give a card to you, they discard it, and you score **vp:1**.`,
      isActive: true
    },
    {
      name: 'Hates Surprises',
      text: 'Ambush cards cannot be played against you.',
      isActive: true
    },
    {
      name: 'Lords of the Forest',
      text: 'You rule any clearings where you are tied in presence.',
      isActive: true
    },
    {
      name: 'Nobility',
      text: `
You now fall into turmoil if you cannot place a roost or a warrior.

Whenever you fall into turmoil, you do not lose victory points. Instead, you score one victory point per bird card in the Decree.
      `,
      canToggle: true
    },
    {
      name: 'Relentless',
      text: `
After resolving the Decree, remove all defenseless buildings and tokens in any clearing with Eyrie warriors.
      `,
      canToggle: true
    },
    {
      name: 'Swoop',
      text: `
At the end of Daylight, place two warriors in the clearing of highest priority with no Eyrie pieces.
      `,
      canToggle: true
    },
    {
      name: 'War Tax',
      text: `
Whenever you remove an enemy building or token, its owner loses one victory point.
      `,
      canToggle: true
    },
  ];

  public customData = {
    decree: {
      fox: 0,
      mouse: 0,
      bunny: 0,
      bird: 0
    },

    buildings: []
  };

  public birdsong() {
    return [
      `Reveal an order card.`,
      `Craft order card for **vp:1** if it shows an available item.`,
      `Add the order card to the matching Decree column.`
    ];
  }

  public daylight() {
    const actions = [];

    let mostVal = 0;
    let mostSuit = '';
    let mostSuits = [];
    ['fox', 'mouse', 'bunny', 'bird'].forEach(suit => {
      if (this.customData.decree[suit] < mostVal) { return; }

      // hold onto info if there is ever a tie
      if (this.customData.decree[suit] === mostVal) {
        mostSuits.push(suit);
        return;
      }

      mostVal = this.customData.decree[suit];
      mostSuit = suit;

      // reset if we get here
      mostSuits = [suit];
    });

    // if we have a tie for the most, we don't have a most
    if (mostSuits.length > 1) {
      mostSuit = '';
      mostVal = 0;
    }

    ['recruit', 'move', 'battle'].forEach(curAction => {
      ['fox', 'mouse', 'bunny', 'bird'].forEach(suit => {
        const totalForSuit = this.customData.decree[suit];
        if (totalForSuit === 0) { return; }

        const suitText = suit === 'bird' ? 'any' : `**card:${suit}**`;

        switch (curAction) {
          case 'recruit': {

            actions.push(`
Recruit ${totalForSuit} warrior(s) in a ${suitText} clearing with a roost.

_(**Ties**: Recruit in such a clearing with the most enemy pieces, then fewest Eyrie warriors, then lowest priority.)_
            `);
            break;
          }

          case 'move': {

            actions.push(`
Move from the ${suitText} clearing you rule with the most of your warriors to an adjacent clearing.
Leave enough warriors to exactly rule the origin clearing or ${totalForSuit}, whichever is higher.

_(**Destination Ties**: Move to such a clearing with no roost, then fewest enemy pieces, then lowest priority.)_
            `);
            break;
          }

          case 'battle': {

            actions.push(`
Battle in a ${suitText} clearing against the player with the most buildings there.
${suit === mostSuit ? '**Deal an extra hit.**' : '' }

_(**Clearing Ties**: Battle in such a clearing with no roost, then most defenseless buildings, then lowest priority.)_

_(**Defender Ties**: Battle such a player with the most pieces there, then the player with the most victory points.)_
            `);
            break;
          }
        }
      });
    });

    if (actions.length === 0) {
      return [
        `You should have added at least 2 bird cards to the decree.`
      ];
    }

    if (this.hasTrait('Relentless')) {
      actions.push(`Remove all defenseless tokens and buildings in any clearing with Eyrie warriors.`);
    }

    actions.push(`Place a roost in the clearing you rule of highest priority with no roost.
    If you cannot place a roost, you fall into turmoil.`);

    if (this.hasTrait('Swoop')) {
      actions.push(`Place two warriors in the clearing of highest priority with no Eyrie pieces.`);
    }

    return actions;
  }

  public evening() {

    const score = Math.max(0, this.customData.buildings.reduce((prev, cur) => prev + (cur ? 1 : 0), 0) - 1);

    const base = [
      `Score ${score} VP.`
    ];

    if (this.difficulty === 'Nightmare') {
      base.push(`Score **vp:1**.`);
    }

    return base;
  }

  public turmoil() {
    const base = [
      'Purge Decree, except Viziers.',
      'Go to Evening.'
    ];

    if (this.hasTrait('Nobility')) {
      base.unshift('Score one victory point per bird card in the Decree.');
    } else {
      base.unshift('Lose one victory point per bird card in the Decree.');
    }

    return base;
  }
}
