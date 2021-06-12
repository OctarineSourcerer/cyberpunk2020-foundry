import { defaultAreaLookup, defaultHitLocations } from "./lookups.js"
// Utility methods that don't really belong anywhere else

export function properCase(str) {
    return str.replace(
        /\w\S*/g,
        function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
};

export function replaceIn(replaceIn, replaceWith) {
    return replaceIn.replace("[VAR]", replaceWith);
}

export function localize(str) {
    return game.i18n.localize("CYBERPUNK." + str);
}
export function tryLocalize(str, defaultResult=str) {
    let key = "CYBERPUNK." + str;
    if(!game.i18n.has(key))
        return defaultResult;
    else
        return game.i18n.localize(key);
}
export function localizeParam(str, params) {
    return game.i18n.format("CYBERPUNK."+ str, params);
}

export function shortLocalize(str) {
    let makeShort = !!game.i18n.has("CYBERPUNK." + str + "Short");
    return tryLocalize(makeShort ? str + "Short" : str);
}
/**
 * 
 * @param {CyberpunkActor} The actor you're targeting a location on
 * @param {*} targetArea If you're aiming at a specific area, this is the NAME of that area - eg "Head"
 * @returns {*} {roll: The rolled diceroll when aiming, areaHit: where actually hit}
 */
export function rollLocation(targetActor, targetArea) {
    if(targetArea) {
        // Area name to number lookup
        const hitLocs = (!!targetActor) ? targetActor.hitLocations : defaultHitLocations();
        const targetNum = hitLocs[targetArea].location[0];
        return {
            roll: new Roll(`${targetNum}`).roll(),
            areaHit: targetArea
        };
    }
    // Number to area name lookup
    let hitAreaLookup = (!!targetActor && !!targetActor.hitLocLookup) ? targetActor.hitLocLookup : defaultAreaLookup;

    let roll = new Roll("1d10").roll();
    return {
        roll: roll,
        areaHit: hitAreaLookup[roll.total]
    };
}

export function deepLookup(startObject, path) {
    let current = startObject;
    path.split(".").forEach(segment => {
        current = current[segment];
    });
    return current;
}

// Like deep-lookup, but... setting instead
export function deepSet(startObject, path, value, overwrite=true) {
    let current = startObject;
    let pathArray = path.split(".");
    let lastPath = pathArray.pop();
    pathArray.forEach(segment => {
        let alreadyThere = current[segment];
        if(alreadyThere === undefined) {
            current[segment] = {};
        }
        current = current[segment];
    });
    let alreadyThere = current[lastPath];
    if(alreadyThere === undefined || overwrite) {
        current[lastPath] = value;
    }

    return startObject;
}

// Clamp x to be between min and max inclusive
export function clamp(x, min, max) {
    return Math.min(Math.max(x, min), max);
}

export async function getDefaultSkills() {
    const pack = game.packs.get("cyberpunk2020.default-skills");
    // put into basickSkills array
    const content = await pack.getDocuments();
    return content;
}

// Yet to be fully tested, but should let editing of compendiums go pretty easily
async function changePackItems(packName, dataDeltaF, dryRun = false) {
    let pack = game.packs.get(packName);
    let ids = pack.index.map(e => e._id);
    ids.forEach(async id => {
        let entity = await pack.getEntity(id);
        let oldData = entity.data;
        let dataChange = dataDeltaF(oldData);
        dataChange._id = id;
        console.log(`update data:`);
        console.log(dataChange);
        if(!dryRun)
            await pack.updateEntity(dataChange); 
    });
}

async function exampleCompendiumData(packName) {
    let pack = game.packs.get(packName);
    return await pack.getEntity(pack.index[0].data);
}