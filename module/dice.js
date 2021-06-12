export const BaseDie = "1d10x10";
export const DefaultRollTemplate = "systems/cyberpunk2020/templates/chat/default-roll.hbs";

export const formulaHasDice = function (formula) {
    return formula.match(/[0-9)][dD]/) || formula.match(/[dD][0-9(]/);
};

export const makeD10Roll = function(terms, rollData) {
    if(terms) {
        terms = [BaseDie, ...terms]
    }
    else {
        terms = [BaseDie]
    }
    return new Roll(terms.join(" + "), rollData)
}

// This is lifted from foundry.js so that we can apply the same prettiness, just... in a more sensible order in our own template; it'd be nice if rolls themselves contained this info
export function classifyRollDice(roll) {
    const parts = roll.dice.map(d => {
        const cls = d.constructor;
        return {
          formula: d.expression,
          total: d.total,
          faces: d.faces,
          flavor: d.flavor,
          subrolls: d.results.map(r => {
            const hasSuccess = r.success !== undefined;
            const hasFailure = r.failure !== undefined;
            const isMax = r.result === d.faces;
            const isMin = r.result === 1;
            return {
              result: d.getResultLabel(r),
              classes: [
                cls.name.toLowerCase(),
                "d" + d.faces,
                r.success ? "success" : null,
                r.failure ? "failure" : null,
                r.rerolled ? "rerolled" : null,
                r.exploded ? "exploded" : null,
                r.discarded ? "discarded" : null,
                !(hasSuccess || hasFailure) && isMin ? "min" : null,
                !(hasSuccess || hasFailure) && isMax ? "max" : null
              ].filter(c => c).join(" ")
            }
          })
        };
      });
    return parts;
}

/**
 * This class allows for making multiple rolls in a single card. For example, an attack roll and a damage roll.
 * The API is designed to make sure each roll WILL get an equivalent metadata, so users of Multiroll don't have to make sure to balance the number of rolls they add, and the metadata.
 * 
 * Example:
 *    let bigRoll = new Multiroll("Shootin'");
 *    bigRoll.addRoll(new Roll("1d10+3"), name="Attack");
 *    bigRoll.addRoll(new Roll("1d6+2"), name="Damage");
 *    bigRoll.execute();
 * 
 * Methods can be chained, e.g bigRoll.addRoll(...).addRoll(...)
 */
 export class Multiroll {
    //  TODO: Allow for more customisable crit and fumble (eg crits low, fumbles high)
    constructor(title, flavor="") {
        this.title = title;
        this.flavor = flavor;
        this.rolls = [];
        this.rollMetaData = [];
    }

    /**
     * 
     * @param {Roll} roll A FoundryVTT roll 
     * @param {data} metaData Extra data about the roll (such as name, crit thresholds). Crit threshold applies to a roll's first (dice) term, default its max amount
     */
    addRoll(roll, { name=undefined, flavor=undefined, critThreshold = undefined, fumbleThreshold = undefined } = {}, extra={}) {
        this.rolls.push(roll);
        // This should be fine if there are no dice - they'll end up as undefined, and that's dealt with in Multiroll
        if(critThreshold === undefined) {
            let firstDie = roll.terms?.find(term => term instanceof Die);
            if(!!firstDie)
                critThreshold = (firstDie.number * firstDie.faces);
        }
        if(fumbleThreshold === undefined) {
            let firstDie = roll.terms?.find(term => term instanceof Die);
            if(!!firstDie)
                fumbleThreshold = firstDie.number;
        }

        this.rollMetaData.push(mergeObject({
            name: name,
            flavor: flavor, 
            critThreshold: critThreshold,
            fumbleThreshold: fumbleThreshold
        }, extra));
        return this;
    }

    /**
     * 
     * @param {*} speaker The speaker on the card for this multiroll
     * @param {string} templatePath Path to the template. eg systems/cyberpunk2020/templates/chat/weapon-roll.hbs
     * Template provided should be one that loops through rolls.
     * Example data provided to the template:
     * {
     *  user,
     *  title,
     *  flavor,
     *  rolls: [
     *      {roll: Roll, name, flavor, isCrit, isFumble, critThreshold, fumbleThreshold}
     *  ],
     *  ...
     * }
     */
    async execute(speaker, templatePath, extraTemplateData={}) {
        await Promise.all(this.rolls.map(async (r) => {
            if (!r._evaluated) {
                return await r.evaluate({async: true});
            }
        }));
        
        const fullTemplateData = mergeObject({
            user: game.user.id,
            title: this.title,
            flavor: this.flavor,
            rolls: this.rolls.map((roll, i) => {
                let metaData = this.rollMetaData[i];
                let firstDiceTerm = roll.terms.find(term => term instanceof Die) || roll.terms[0];
                // Add name, flavor, critThreshold, fumbleThreshold etc. Also add whether crit or fumble.
                return mergeObject(metaData, { 
                    roll: roll,
                    diceInfo: classifyRollDice(roll),
                    isCrit: metaData.critThreshold && firstDiceTerm.total >= metaData.critThreshold,
                    isFumble: metaData.fumbleThreshold && firstDiceTerm.total <= metaData.fumbleThreshold
                })
            }),
        }, extraTemplateData || {});

        let chatData = {
            user: game.user.id,
            speaker: speaker,
            sound: "sounds/dice.wav",
            content: await renderTemplate(templatePath, fullTemplateData)
        };
        await ChatMessage.create(chatData);
        return this;
    }

    async defaultExecute(extraTemplateData={}) {
        return this.execute(undefined, DefaultRollTemplate, extraTemplateData);
    }
}

/**
 * A standardized helper function for managing core Cyberpunk d10 rolls. Initially taken from Pathfinder1 and 5e, and modified
 *
 * @param {Event} event           The triggering event which initiated the roll
 * @param {Array} terms           The dice roll component parts, excluding the initial d10
 * @param {String} dice           The initial d20
 * @param {Actor} actor           The Actor making the d10 roll
 * @param {Object} rollData           Actor or item data against which to parse the roll. eg can include skillBonus etc? for at skillbonus etc
 * @param {String} title          The dice roll UI window title
 * @param {Object} speaker        The ChatMessage speaker to pass when creating the chat
 * @param {Function} flavor       A callable function for determining the chat message flavor given parts and data
 * @param {Number} critical       The value of d10 result which represents a critical success
 * @param {Number} fumble         The value of d10 result which represents a critical failure
 */
async function d10Roll({
    title,
    speaker,
    initialTerm = BaseDie,
    terms,
    critical = 10,
    fumble = 1,
    flavor,
    rollData,
    chatTemplate,
    chatTemplateData,
    useRollMessage = false
}) {
    // Handle input arguments
    flavor = flavor || title;

    if(terms) {
        terms = [initialTerm, ...terms]
    }
    let roll = new Roll(terms.join(" + "), rollData).roll();

    if(useRollMessage) {
        await roll.toMessage({
            speaker: speaker,
            flavor: flavor
        });
        return roll;
    }

    let executor = new Multiroll(title, flavor);
    executor.addRoll(roll, {
        critThreshold: critical,
        fumbleThreshold: fumble
    });
    return executor.execute(speaker, chatTemplate, chatTemplateData);

}