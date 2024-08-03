import InfinitysEdgeItemBase from "./base-item.mjs";

export default class InfinitysEdgeWeapon extends InfinitysEdgeItemBase {

  static defineSchema() {
    const fields = foundry.data.fields;
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.weaponType = new fields.StringField({ required: true, blank: true });
    schema.rarity = new fields.StringField({ required: true, blank: true });
    schema.level = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });
    schema.damage = new fields.NumberField({ ...requiredInteger, initial: 8, min: 0 });
    schema.attribute = new fields.StringField({ required: true, blank: true });
    schema.dice = new fields.StringField({ required: true, blank: true });
    schema.enhancements = new fields.StringField({ required: true, blank: true });

    schema.formula = new fields.StringField({ blank: true });
    schema.hitChance = new fields.NumberField({ ...requiredInteger, initial: 60, min: 0 });

    schema.skillProgress = new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 });
    schema.skillLevelUp = new fields.NumberField({ ...requiredInteger, initial: 5, min: 0});

    return schema;
  }

  successfulHit() {
    //todo: move to item class, won't persist here.
    this.parent.system.skillProgress += 1;
    console.log(this.parent)

    if (this.parent.system.skillProgress === this.parent.system.skillLevelUp) {
      this.parent.system.skillProgress = 0;
      this.parent.system.level += 1;
      this.parent.system.skillLevelUp = this.parent.system.level * 5;
    }

    ChatMessage.create({
      content: `Skill Progress: ${this.parent.system.skillProgress}/${this.parent.system.skillLevelUp}`
    })
  }

  prepareDerivedData() {

    var attr;

    switch (this.attribute.toLowerCase()) {
      case "strength":
      case "str":
        attr = "@str.mod";
        break;

      case "dexterity":
      case "dex":
        attr = "@dex.mod";
        break;

      case "vitality":
      case "vit":
        attr = "@vit.mod";
        break;

      case "intelligence":
      case "int":
        attr = "@int.mod";
        break;

      case "wisdom":
      case "wis":
        attr = "@wis.mod";
        break;

      case "willpower":
      case "wil":
        attr = "@wil.mod";
        break;

      case "charisma":
      case "cha":
        attr = "@cha.mod";
        break;

      default:
        attr = null
    }

    if (attr !== null) {
      this.formula = `${this.damage}+${attr}+${this.dice}`;
    }

    this.hitChance = 60 + this.level;
  }

}