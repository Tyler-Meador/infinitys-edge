import InfinitysEdgeItemBase from "./base-item.mjs";

export default class InfinitysEdgeSkill extends InfinitysEdgeItemBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.skillType = new fields.StringField({ initial: "" });
    schema.cost = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });
    schema.description = new fields.StringField({ initial: ""});
    schema.formula = new fields.StringField({ initial: ""});
    schema.level = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0});

    schema.skillProgress = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });
    schema.skillLevelUp = new fields.NumberField({ ...requiredInteger, initial: 5, min: 0});

    return schema;
  }
}