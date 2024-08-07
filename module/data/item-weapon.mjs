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

  prepareDerivedData() {

    var attr;
    var mod;

    switch (this.attribute.toLowerCase()) {
      case "strength":
        attr = "@str.mod";
        mod = this.parent.parent.system.abilities.str.value
        break;

      case "dexterity":
        attr = "@dex.mod";
        mod = this.parent.parent.system.abilities.dex.value
        break;

      case "vitality":
        attr = "@vit.mod";
        mod = this.parent.parent.system.abilities.vit.value
        break;

      case "intelligence":
        attr = "@int.mod";
        mod = this.parent.parent.system.abilities.int.value
        break;

      case "wisdom":
        attr = "@wis.mod";
        mod = this.parent.parent.system.abilities.wis.value
        break;

      case "willpower":
        attr = "@wil.mod";
        mod = this.parent.parent.system.abilities.wil.value
        break;

      case "charisma":
        attr = "@cha.mod";
        mod = this.parent.parent.system.abilities.cha.value
        break;

      default:
        attr = null
    }

    if (attr !== null) {
      this.formula = `${this.damage}+${attr}+${this.dice}`;
    }

    this.hitChance = 60 + this.level + (mod / 10);
    
    if (this.level === 0) {
      this.skillLevelUp = 3;
    } else {
      this.skillLevelUp = this.level * 5;
    }


    this.selectAttributeData = {
      str: {key: "str", label: "Strength"},
      dex: {key: "dex", label: "Dexterity"},
      vit: {key: "vit", label: "Vitality"},
      int: {key: "int", label: "Intelligence"},
      wis: {key: "wis", label: "Wisdom"},
      wil: {key: "wil", label: "Willpower"},
      cha: {key: "cha", label: "Charisma"},
    }
  }

}