import InfinitysEdgeActorBase from "./base-actor.mjs";

export default class InfinitysEdgeCharacter extends InfinitysEdgeActorBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.xp = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });
    schema.credits = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });

    schema.pointsAvailable = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0});
    
    return schema;
  }

  prepareDerivedData() {
    // Loop through ability scores, and add their modifiers to our sheet output.
    for (const key in this.abilities) {
      // Calculate the modifier
      this.abilities[key].mod = Math.floor(this.abilities[key].value / 10);
      // Handle ability label localization.
      this.abilities[key].label = game.i18n.localize(CONFIG.INFINITYS_EDGE.abilities[key]) ?? key;
    }
  }

  getRollData() {
    const data = {};

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (this.abilities) {
      for (let [k, v] of Object.entries(this.abilities)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }

    data.lvl = this.attributes.level.value;

    return data
  }
}