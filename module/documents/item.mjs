/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class InfinitysEdgeItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
  }

  /**
   * Prepare a data object which defines the data schema used by dice roll commands against this Item
   * @override
   */
  getRollData() {
    // Starts off by populating the roll data with a shallow copy of `this.system`
    const rollData = { ...this.system };

    // Quit early if there's no parent actor
    if (!this.actor) return rollData;

    // If present, add the actor's roll data
    rollData.actor = this.actor.getRollData();

    return rollData;
  }

  /**
   * Convert the actor document to a plain object.
   *
   * The built in `toObject()` method will ignore derived data when using Data Models.
   * This additional method will instead use the spread operator to return a simplified
   * version of the data.
   *
   * @returns {object} Plain object either via deepClone or the spread operator.
   */
  toPlainObject() {
    const result = { ...this };

    // Simplify system data.
    result.system = this.system.toPlainObject();

    // Add effects.
    result.effects = this.effects?.size > 0 ? this.effects.contents : [];

    return result;
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll(dataset) {
    const item = this;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `[${item.type}] ${item.name}`;

    // If there's no roll data, send a chat message.
    if (!this.system.formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.system.description ?? '',
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();

      // Invoke the roll and submit it to chat.
      
      // If you need to store the value first, uncomment the next line.
      // const result = await roll.evaluate();
      if (item.type === 'weapon' && dataset.roll) {
        const roll = new Roll(dataset.roll, rollData.actor);
        roll.toMessage({
          speaker: speaker,
          rollMode: rollMode,
          flavor: label,
          system: {"itemId": this.uuid}
        })
        return roll;
      } else {
        if(dataset.isCrit) {
          const formDecon = rollData.formula.split("+");

          const base = Number(formDecon[0]) * 2;
          
          const dice = Number(formDecon[2].substring(0, formDecon[2].indexOf("d"))) * 2;

          rollData.formula = base + "+" + formDecon[1] + "+" + dice + formDecon[2].substring(formDecon[2].indexOf("d"));
        }


        const roll = new Roll(rollData.formula, rollData.actor);
        roll.toMessage({
          speaker: speaker,
          rollMode: rollMode,
          flavor: label,
        });
        return roll;
      }
    }
  }
}
