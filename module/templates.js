/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {
    // Path to partial from foundry path. For cyberpunk, is "systems/cyberpunk2020/templates/actor/parts/___.hbs". Is .hbs as they're handlebars files
    return loadTemplates([
        "systems/cyberpunk2020/templates/actor/parts/statsrow.hbs",
        "systems/cyberpunk2020/templates/actor/parts/woundtracker.hbs",
        "systems/cyberpunk2020/templates/actor/parts/skills.hbs",
        "systems/cyberpunk2020/templates/actor/parts/gear.hbs",
        "systems/cyberpunk2020/templates/actor/parts/cyberware.hbs",
        "systems/cyberpunk2020/templates/actor/parts/combat.hbs",
        "systems/cyberpunk2020/templates/actor/parts/armor-display.hbs",
        "systems/cyberpunk2020/templates/actor/parts/skill.hbs",
        "systems/cyberpunk2020/templates/actor/parts/lifepath.hbs",

        // Shared templates
        "systems/cyberpunk2020/templates/fields/string.hbs",
        "systems/cyberpunk2020/templates/fields/number.hbs",
        "systems/cyberpunk2020/templates/fields/boolean.hbs",
        "systems/cyberpunk2020/templates/fields/select.hbs",

        // Roll templates
        "systems/cyberpunk2020/templates/chat/default-roll.hbs",
        "systems/cyberpunk2020/templates/chat/weapon-roll.hbs",
        "systems/cyberpunk2020/templates/chat/multi-hit.hbs",

        // Item sheet
        "systems/cyberpunk2020/templates/item/item-sheet.hbs",

        // Weapon parts
        "systems/cyberpunk2020/templates/item/parts/weapon/summary.hbs",
        "systems/cyberpunk2020/templates/item/parts/weapon/settings.hbs",
        // Armor parts
        "systems/cyberpunk2020/templates/item/parts/armor/summary.hbs",
        "systems/cyberpunk2020/templates/item/parts/armor/settings.hbs",
        // Cyberware
        "systems/cyberpunk2020/templates/item/parts/cyberware/summary.hbs",
        "systems/cyberpunk2020/templates/item/parts/cyberware/settings.hbs",
        // Vehicle
        "systems/cyberpunk2020/templates/item/parts/vehicle/summary.hbs",
        "systems/cyberpunk2020/templates/item/parts/vehicle/settings.hbs",
        // Skill
        "systems/cyberpunk2020/templates/item/parts/skill/summary.hbs",
        "systems/cyberpunk2020/templates/item/parts/skill/settings.hbs",

        // Misc
        "systems/cyberpunk2020/templates/item/parts/misc/summary.hbs",
        "systems/cyberpunk2020/templates/item/parts/misc/settings.hbs",

        // Weapon settings dialog
        "systems/cyberpunk2020/templates/dialog/modifiers.hbs",
        
    ]);
  };
  