import {
  onManageActiveEffect,
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class InfinitysEdgeActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['infinitys-edge', 'sheet', 'actor'],
      width: 1350,
      height: 600,
      resizable: true,
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'features',
        },
      ],
    });
  }

  /** @override */
  get template() {
    return `systems/infinitys-edge/templates/actor/actor-${this.actor.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.document.toPlainObject();

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Adding a pointer to CONFIG.INFINITYS_EDGE
    context.config = CONFIG.INFINITYS_EDGE;

    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
    }

    // Enrich biography info for display
    // Enrichment turns text like `[[/r 1d20]]` into buttons
    context.enrichedBiography = await TextEditor.enrichHTML(
      this.actor.system.biography,
      {
        // Whether to show secret blocks in the finished html
        secrets: this.document.isOwner,
        // Necessary in v11, can be removed in v12
        async: true,
        // Data to fill in for inline rolls
        rollData: this.actor.getRollData(),
        // Relative UUID resolution
        relativeTo: this.actor,
      }
    );

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(
      // A generator that returns all effects stored on the actor
      // as well as any items
      this.actor.allApplicableEffects()
    );

    return context;
  }

  /**
   * Character-specific context modifications
   *
   * @param {object} context The context object to mutate
   */
  _prepareCharacterData(context) {
    // This is where you can enrich character-specific editor fields
    // or setup anything else that's specific to this type
  }

  /**
   * Organize and classify Items for Actor sheets.
   *
   * @param {object} context The context object to mutate
   */
  _prepareItems(context) {
    // Initialize containers.
    const gear = [];
    const skills = [];
    const weapons = [];
    const features = [];
    const spells = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
      9: [],
    };
    const armor = {
      "head": {},
      "torso": {},
      "armL": {},
      "armR": {},
      "legL": {},
      "legR": {}
    };

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || Item.DEFAULT_ICON;
      // Append to gear.
      if (i.type === 'item') {
        gear.push(i);
      }
      // Append to features.
      else if (i.type === 'feature') {
        features.push(i);
      }
      // Append to spells.
      else if (i.type === 'spell') {
        if (i.system.spellLevel != undefined) {
          spells[i.system.spellLevel].push(i);
        }
      }
      else if (i.type === 'weapon') {
        if (i.system.level <= this.actor.system.level) {
          i.system.skillLevelUp = i.system.level * 5
        }
        weapons.push(i);
      } else if (i.type === 'armor') {
        var armorType = i.system.armorType

        if (i.system.armorType != undefined) {
          armor[armorType] = i;
        }
      } else if (i.type === 'skill') {
        skills.push(i);
      }
    }

    // Assign and return
    context.gear = gear;
    context.features = features;
    context.spells = spells;
    context.weapons = weapons;
    context.armor = armor;
    context.skills = skills;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.on('click', '.item-edit', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.on('click', '.item-create', this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.on('click', '.item-delete', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html.on('click', '.effect-control', (ev) => {
      const row = ev.currentTarget.closest('li');
      const document =
        row.dataset.parentId === this.actor.id
          ? this.actor
          : this.actor.items.get(row.dataset.parentId);
      onManageActiveEffect(ev, document);
    });

    html.on('click', '.describe', (ev) => {
      ev.preventDefault();
      const element = ev.currentTarget;
      const itemId = element.closest('.item').dataset.itemId;
      const item = this.actor.items.get(itemId);

      const label = `[${item.type}] ${item.name}`;
      const speaker = ChatMessage.getSpeaker({ actor: this.actor });


      console.log(item)
      if (item.system.description) {
        ChatMessage.create({
          speaker: speaker,
          flavor: label,
          content: item.system.description,
        });
      }
    });

    var content;

    html.on('click', '.item-progress', async (ev) => {
      ev.preventDefault();
      const element = ev.currentTarget;
      const itemId = element.closest('.item').dataset.itemId;
      const item = this.actor.items.get(itemId);

      const label = `[${item.type}] ${item.name}`;
      const speaker = ChatMessage.getSpeaker({ actor: this.actor });

      if (item.system.level === 0) {
        await item.update({ "system.level": 1 });


        content = `Level Up! ${item.name} is now level: ${item.system.level}`
      } else if (item.system.skillProgress + 1 === item.system.skillLevelUp) {
        await item.update({ "system.skillProgress": 0 });
        await item.update({ "system.level": item.system.level + 1 });

        content = `Level Up! ${item.name} is now level: ${item.system.level}`
      } else {
        await item.update({ "system.skillProgress": item.system.skillProgress + 1 });

        content = `Skill Progress: ${item.system.skillProgress}/${item.system.skillLevelUp}`
      }

      ChatMessage.create({
        speaker: speaker,
        flavor: label,
        content: content,
      });

    });


    // Rollable abilities.
    html.on('click', '.rollable', this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = (ev) => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains('inventory-header')) return;
        li.setAttribute('draggable', true);
        li.addEventListener('dragstart', handler, false);
      });
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const type = header.dataset.type;
    const data = duplicate(header.dataset);
    const name = `New ${type.capitalize()}`;

    if (type === 'skill') {
      const dialogOptions = {
        height: "100%",
      }

      const content = await renderTemplate("systems/infinitys-edge/templates/item/parts/item-skill-dialog.hbs")

      let result = await Dialog.wait({
        content: content,
        buttons: {
          submit: {
            label: "Submit",
            callback: (html) => {
              const formElement = html[0].querySelector('form');
              const formData = new FormDataExtended(formElement);
              const formDataObject = formData.object;
              return formDataObject;
            }
          },
        },
      }, dialogOptions);

      const itemData = {
        name: result.name,
        type: "skill",
        system: {
          "cost": result.cost,
          "skillType": result.type,
        },
      };

      return await Item.create(itemData, { parent: this.actor });

    } else {
      const itemData = {
        name: name,
        type: type,
        system: data,
      };

      // Remove the type from the dataset since it's in the itemData.type prop.
      delete itemData.system['type'];

      // Finally, create the item!
      return await Item.create(itemData, { parent: this.actor });
    }

  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll(dataset);
      }
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[ability] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }
}
