import { sortSkills, SortOrders } from "./actor/skill-sort.js";
import { getDefaultSkills, localize, tryLocalize } from "./utils.js";

const updateFuncs = {
    "Actor": migrateActorData,
    "Item": migrateItemData
}
// I know there's a lot of await in here, and I think it might be possible to not wait for the results of updating entities. But I also don't know if it would blow foundry up to get so many update requests so far.

let migrationSuccess = true;
// Handle migration of things. The shape of it nabbed from 5e
export async function migrateWorld() {
    if (!game.user.isGM) {
        ui.notifications.error("Only the GM can migrate the world");
        return;
    }

    for(let actor of game.actors.contents) {
        migrateDocument(actor);
        actor.items.forEach(item => migrateDocument(item));
    }
    for(let item of game.items.contents) {
        migrateDocument(item);
    }
    for(let compendium of game.packs.contents) {
        migrateCompendium(compendium);
    }
    if(migrationSuccess) {
        game.settings.set("cyberpunk2020", "systemMigrationVersion", game.system.data.version);
        ui.notifications.info(`Cyberpunk2020 System Migration to version ${game.system.data.version} completed!`, {permanent: true});
    }
    else {
        ui.notifications.error(`Cyberpunk2020 System Migration failed :( Please see console log for details`);
    }
}

const defaultDataUse = async (document, updateData) => {
    if (!isObjectEmpty(updateData)) {
        console.log(`Total update data for document ${document.name}:`);
        console.log(updateData);
        await document.update(updateData);
    }
}
async function migrateDocument(document, withUpdataData = defaultDataUse) {
    try {
        let migrateDataFunc = updateFuncs[document.documentName];
        if(migrateDataFunc === undefined) {
            console.log(`No migrate function for entity with documentName field "${document.documentName}"`);
        }
        const updateData = await migrateDataFunc(document.data);
        withUpdataData(document, updateData);
    } catch(err) {
        migrationSuccess = false;
        err.message = `Failed cyberpunk system migration for ${document.data.type} ${document.name}: ${err.message}`;
        console.error(err);
        return;
    }
}

// For now, actors. We can do migrate world as a total of them all. Nabbed framework of code from 5e
/**
 * Migrate a single Actor entity to incorporate latest data model changes
 * Return an Object of updateData to be applied
 * @param {object} actorData    The actor data object to update
 * @return {Object}         The updateData to apply
 */
export async function migrateActorData(actorData) {
    console.log(`Migrating data of ${actorData.name}`);

    // No need to migrate items currently
    let updateData = {}
    let data = actorData.data;

    if(typeof(data.damage) == "string") {
        console.log("Making damage a number");
        updateData[`data.damage`] = 0;
    }
    if(actorData.type == "character") {
        if(!actorData.token.actorLink) {
            console.log(`Making ${actorData.name}'s default token be linked to the actor, and be friendly`);
            updateData[`token.actorLink`] = true;
            updateData[`token.disposition`] = 1;
        }
        if(!actorData.token.vision) {
            console.log(`Making ${actorData.name}'s default token actually have vision`);
            updateData[`token.vision`] = true;
            updateData[`token.dimSight`] = 30;
        }
        if(actorData.lifepath) { 
            let lpnotes = '';
            // TODO: Switch hard coded string with language json variable.
            if(actorData.lifepath.events) {
                lpnotes += `LIFE EVENTS: ${lifepath.events};\n\n`;
            }
            if(actorData.lifepath.family) {
                lpnotes += `FAMILY: ${lifepath.family};\n\n`;
            }
            if(actorData.lifepath.style) {
                lpnotes += `STYLE: ${lifepath.style};\n\n`;
            }
            if(actorData.lifepath.motivations) {
                lpnotes += `MOTIVATIONS: ${lifepath.motivations};\n\n`;
            }
            update[`notes`] = `${actorData.notes} -- ${lpnotes}`;
            // stop using lifepath
            update[`lifepath`] = undefined;
        }
    }
    
    // Traied skills that we keep
    let trainedSkills = [];
    if(data.skills) {
        console.log(`${actorData.name} still uses non-item skills. Removing.`);
        updateData["data.skills"] = undefined;

        let trained = (skillData) => skillData.value > 0 || skillData.chipValue > 0;
        // Catalogue skills with points in them to keep
        trainedSkills = Object.entries(data.skills)
            .reduce((acc, [name, skill]) => {
                if(trained(skill)) {
                    acc.push([name, skill]);
                }
                // Grouped skills and the pain that comes with them
                else if(skill.group) {
                    let parentName = name;
                    acc.push(...Object.entries(skill)
                        .filter(([name, subskill]) => name !== "group" && trained(subskill))
                        .map(([name, subskill]) => {
                            // Groups with subskills don't exist anymore - they introduced a lot of complexity and heck.
                            // We're including in the new name the 
                            let prefix = parentName === "MartialArts" ? "Martial Arts" : parentName;
                            // We'll be having a different name than before, so localize here
                            return [`${prefix}: ${localize("Skill"+name)}`, subskill]
                        }));
                }
                return acc;
            }, []);

        trainedSkills = trainedSkills.map(([name, skillData]) => convertOldSkill(name, skillData))
    }
    console.log("Trained skills:");
    console.log(trainedSkills);
    let skills = actorData.items.filter(item => item.type === "skill");

    // Migrate from pre-item times
    if(skills.length === 0) {
        console.log(`${actorData.name} does not have item skills. Adding aaaall 78 core ones`);
        console.log(`Keeping any skills you had points in: ${trainedSkills.join(", ") || "None"}`);

        // Key core skills by name so they may be overridden
        let skillsToAdd = (await getDefaultSkills()).reduce((acc, item) => {
            acc[item.name] = item.toObject();
            return acc;
        }, {});
        // Override core skills with any trained skill by the same name
        for(const trainedSkill of trainedSkills) {
            // Old skills had localization keys as names, so we'll translate these
            // Subskills have already been translated though, as we can only tell they're subskills while we were looping through them
            // This is what happens when you migrate legacy, kids, it hurts
            let localizedName = tryLocalize("Skill"+trainedSkill.name, trainedSkill.name);
            skillsToAdd[localizedName] = trainedSkill;
        }
        console.log(skillsToAdd);
        skillsToAdd = sortSkills(Object.values(skillsToAdd), SortOrders.Name);
        updateData["data.skillsSortedBy"] = "Name";

        // Keep current items
        const currentItems = Array.from(actorData.items).map(item => item.toObject());
        // TODO: This is repeated in a few places - centralise/refactor
        updateData.items = currentItems.concat(currentItems, skillsToAdd);
    }

    return updateData;
} 

export function migrateItemData(itemData) {
    console.log(`Migrating data of ${itemData.name}`);

    // No need to migrate items currently
    let updateData = {}
    let data = itemData.data;
    let itemTemplates = game.system.template.Item[itemData.type].templates;

    if(itemTemplates?.includes("common") && data.source === undefined) {
        console.log(`${itemData.name} has no source field. Giving it one.`)
        updateData["data.source"] = "";
    }
    if(itemData.type == "weapon") {
        if(!data.rangeDamages) {
            console.log(`${itemData.name} has no place to put damages per range. Instantiating those.`);
            updateData["data.rangeDamages"] = game.system.template.Item.weapon.rangeDamages;
        }
    }
    return updateData;
}

export function migrateCompendium(compendium) {
    if(compendium.locked) {
        console.log(`Not migrating compendium ${compendium.metadata.label}, as it is locked`);
        return
    }
    console.log(`Updating entities in compendium ${compendium.metadata.label}`);
    let entityIds = compendium.index.map(e => e.id);
    entityIds.forEach(async (id) => {
        let entity = await compendium.getEntity(id);
        migrateDocument(entity, async (entity, updateData) => {
            updateData.id = id;
            await compendium.updateEntity(updateData);
        });
    });
}

// Take an old hardcoded skill and translate it into data for a skill item
export function convertOldSkill(name, skillData) {
    return {name: tryLocalize("Skill"+name, name), type: "skill", data: {
        flavor: "",
        notes: "",
        level: skillData.value || 0,
        chipLevel: skillData.chipValue || 0,
        isChipped: skillData.chipped,
        ip: skillData.ip,
        diffMod: 1, // No skills have those currently.
        isRoleSkill: skillData.isSpecial || false,
        stat: skillData.stat
    }};
}
