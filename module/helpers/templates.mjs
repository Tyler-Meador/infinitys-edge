/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  return loadTemplates([
    // Actor partials.
    'systems/infinitys-edge/templates/actor/parts/actor-features.hbs',
    'systems/infinitys-edge/templates/actor/parts/actor-items.hbs',
    'systems/infinitys-edge/templates/actor/parts/actor-spells.hbs',
    'systems/infinitys-edge/templates/actor/parts/actor-effects.hbs',
    'systems/infinitys-edge/templates/actor/parts/actor-weapons.hbs',
    'systems/infinitys-edge/templates/actor/parts/actor-armor.hbs',
    'systems/infinitys-edge/templates/actor/parts/actor-skills.hbs',
    // Item partials
    'systems/infinitys-edge/templates/item/parts/item-effects.hbs',
  ]);
};
