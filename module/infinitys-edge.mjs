// Import document classes.
import { InfinitysEdgeActor } from './documents/actor.mjs';
import { InfinitysEdgeItem } from './documents/item.mjs';
// Import sheet classes.
import { InfinitysEdgeActorSheet } from './sheets/actor-sheet.mjs';
import { InfinitysEdgeItemSheet } from './sheets/item-sheet.mjs';
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { INFINITYS_EDGE } from './helpers/config.mjs';
// Import DataModel classes
import * as models from './data/_module.mjs';

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', function () {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.infinitysedge = {
    InfinitysEdgeActor,
    InfinitysEdgeItem,
    rollItemMacro,
  };

  // Add custom constants for configuration.
  CONFIG.INFINITYS_EDGE = INFINITYS_EDGE;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: '1d100 + @abilities.dex.mod',
    decimals: 2,
  };

  // Define custom Document and DataModel classes
  CONFIG.Actor.documentClass = InfinitysEdgeActor;

  // Note that you don't need to declare a DataModel
  // for the base actor/item classes - they are included
  // with the Character/NPC as part of super.defineSchema()
  CONFIG.Actor.dataModels = {
    character: models.InfinitysEdgeCharacter,
    npc: models.InfinitysEdgeNPC
  }
  CONFIG.Item.documentClass = InfinitysEdgeItem;
  CONFIG.Item.dataModels = {
    item: models.InfinitysEdgeItem,
    feature: models.InfinitysEdgeFeature,
    spell: models.InfinitysEdgeSpell,
    weapon: models.InfinitysEdgeWeapon,
    armor: models.InfinitysEdgeArmor,
    skill: models.InfinitysEdgeSkill
  }

  // Active Effects are never copied to the Actor,
  // but will still apply to the Actor from within the Item
  // if the transfer property on the Active Effect is true.
  CONFIG.ActiveEffect.legacyTransferral = false;

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('infinitys-edge', InfinitysEdgeActorSheet, {
    makeDefault: true,
    label: 'INFINITYS_EDGE.SheetLabels.Actor',
  });
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('infinitys-edge', InfinitysEdgeItemSheet, {
    makeDefault: true,
    label: 'INFINITYS_EDGE.SheetLabels.Item',
  });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here is a useful example:
Handlebars.registerHelper('toLowerCase', function (str) {
  return str.toLowerCase();
});

Handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) => createItemMacro(data, slot));
});

Hooks.on('renderChatMessage', async (message, html, data) => {
  if (!message.isRoll) return;
  if (Object.keys(message.system).length === 0) return;

  const idDmg = message._id + "-dmg";
  const idProg = message._id + "-prog";
  let crit = false;

  const item = await fromUuid(message.system.itemId);
  const rollTotal = message.rolls[0].total;

  if (rollTotal <= 5) {
    crit = true;
  }

  if (rollTotal <= item.system.hitChance) {
    const dmgBtn = $(`<button class="dice-damage-btn" id=${idDmg}>Roll Damage</i></button>`);
    const progBtn = $(`<button class="dice-prog-btn" id=${idProg}>Increase Progress</i></button>`);

    const btnContainer = $('<div class="infinitys-edge grid grid-2col"></div>');
    btnContainer.append(dmgBtn);
    btnContainer.append(progBtn);

    html.find('.message-content').append(btnContainer);

    if (localStorage.getItem(idDmg)) {
      html.find(`#${idDmg}`).attr("disabled", "")
    }

    if (localStorage.getItem(idProg)) {
      html.find(`#${idProg}`).attr("disabled", "")
    }

    dmgBtn.click(ev => {
      ev.stopPropagation();

      localStorage.setItem(idDmg, true);
      html.find(`#${idDmg}`).attr("disabled", "")

      const dataset = {
        "rollType": "item",
        "isCrit": crit,
      };

      item.roll(dataset);
    });

    progBtn.click(async ev => {
      ev.stopPropagation();
      localStorage.setItem(idProg, true); 
      html.find(`#${idProg}`).attr("disabled", "")
      

      if (item.system.level === 0) {
        await item.update({ "system.level": 1 });

        ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor: item.parent }),
          content: `Level Up! ${item.name} is now level: ${item.system.level}`
        });
      } else {
        await item.update({ "system.skillProgress": item.system.skillProgress + 1 });

        if (item.system.skillProgress === item.system.skillLevelUp) {
          await item.update({ "system.skillProgress": 0 });
          await item.update({ "system.level": item.system.level + 1 });

          ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: item.parent }),
            content: `Level Up! ${item.name} is now level: ${item.system.level}`
          });
        } else {
          ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor: item.parent }),
            content: `Skill Progress: ${item.system.skillProgress}/${item.system.skillLevelUp}`
          })
        }
      }
    });
  }
});


/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== 'Item') return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn(
      'You can only create macro buttons for owned Items'
    );
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.infinitysedge.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(
    (m) => m.name === item.name && m.command === command
  );
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: 'script',
      img: item.img,
      command: command,
      flags: { 'infinitys-edge.itemMacro': true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: 'Item',
    uuid: itemUuid,
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then((item) => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(
        `Could not find item ${itemName}. You may need to delete and recreate this macro.`
      );
    }

    // Trigger the item roll
    item.roll();
  });
}
