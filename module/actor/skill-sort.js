import { CyberpunkActor } from "./actor.js";

export { SortOrders, sortSkills }

// For now, these are arranged as they are in the book and on other sheets. But it seems a slightly arbitrary order, may change to match topstats, and have those in a sane order too.
// Order to consider stats in for skills. Lower values come first.
const statOrder = {
    // Don't have one of these be 0, that's falsy
    "role": 1,
    "int": 3,
    "ref": 4,
    "tech": 5,
    "cool": 6,
    "attr": 7,
    "luck": 8,
    "ma": 9,
    "bt": 10,
    "emp": 11,
}

const SortOrders = {
    Name: [byName],
    Stat: [byStat, byName]
}

// To sort hierarchically, break ties (0) with the return of another comparison function
export function byName(skillA, skillB) {
    if(skillA.name > skillB.name) {
        return 1;
    }
    else if(skillA.name === skillB.name) {
        return 0;
    }
    return -1;
}

export function hasPoints(skillA, skillB) {
    let aVal = CyberpunkActor.realSkillValue(skillA);
    let bVal = CyberpunkActor.realSkillValue(skillB);
    if(aVal > 0 && bVal === 0) {
        return -1;
    }
    else if(bVal > 0 && aVal === 0) {
        return 1;
    }
    else return 0;
}

function byStat(skillA, skillB) {
    let searchRank = (skill) => {
        if(skill.data.data.isRoleSkill)
            return statOrder["role"];
        return statOrder[skill.data.data.stat];
    };
    let order_a = searchRank(skillA) || -1;
    let order_b = searchRank(skillB) || -1;
    if(order_a > order_b) {
        return 1;
    }
    else if(order_a === order_b) {
        return 0;
    }
    return -1;
}

function hierarchical(functions) {
    return (skillA, skillB) => {
        for(const f of functions) {
            let sort = f(skillA, skillB);
            if(sort === 0)
                continue;
            else
                return sort;
        };
        return 0;
    }
}

/* This would usually be in actor-sheet.js; sorting stats is mostly for UX purposes. But that'd mean creating a sorted version of stats EVERY time the sheet opens. And CP2020 has 89 stats by default; enough for me to not want to do that. So we sort in the actor itself */
/**
 * 
 * @param {*} skills 
 * @param {*} compareFs Compare functions - sort by the first, then the second for any ties, third for any ties there etc. Some pre-made ones in SortOrders
 * @returns 
 */
function sortSkills(skills, compareFs) {
    if(!compareFs) {
        console.warn("No sort order given. Returning original skill list");
        return skills;
    }
    let unsorted = skills.slice();
    let firstFilter = game.settings.get("cyberpunk2020", "trainedSkillsFirst") ? [hasPoints] : [];

    return unsorted.sort(hierarchical(firstFilter.concat(compareFs)));
}