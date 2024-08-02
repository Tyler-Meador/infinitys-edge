import InfinitysEdgeItemBase from "./base-item.mjs";

export default class InfinitysEdgeArmor extends InfinitysEdgeItemBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.armorType = new fields.StringField({ required: true, blank: true });
    schema.rarity = new fields.StringField({ required: true, blank: true });
    schema.level = new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 });
    schema.armorPoints = new fields.NumberField({ ...requiredInteger, initial: 8, min: 0 });
    schema.durability = new fields.NumberField({ ...requiredInteger, initial: 8, min: 0 });
    schema.upgrades = new fields.StringField({ required: true, blank: true });

    return schema;
  }
}