import { deepLookup, localize, properCase, replaceIn, shortLocalize } from "./utils.js"

const templatePath = "systems/cyberpunk2020/templates/";
export function registerHandlebarsHelpers() {
    Handlebars.registerHelper('properCase', properCase);
    // Short for cyberpunk localize
    Handlebars.registerHelper('CPLocal', function(str, options) {
        let localizeKey = "CYBERPUNK." + str;
        if(!game.i18n.has(localizeKey)) 
            return str;
        if(!options || Object.keys(options.hash).length === 0) {
            return game.i18n.localize(localizeKey);
        }
        else {
            return game.i18n.format(localizeKey, options.hash);
        };
    });
    Handlebars.registerHelper("CPLocalParam", function(str, options) {
        let localizeKey = "CYBERPUNK." + str;
        return game.i18n.format(localizeKey, options);
    });
    Handlebars.registerHelper("shortCPLocal", shortLocalize);

    Handlebars.registerHelper('localizeStat', function(str) {
        return "CYBERPUNK." + properCase(str);
    });
    Handlebars.registerHelper('and', function(x,y) {
        return x && y;
    });
    Handlebars.registerHelper('equals', function(x, y) {
        return x === y;
    });
    Handlebars.registerHelper('compare', function(x, operator, y) {
        switch (operator) {
            case "===":
                return x === y;
            case "==":
                return x == y;
            case "!=":
                return x != y;
            case "!==":
                return x !== y;
            case ">":
                return x > y;
            case ">=":
                return x >= y;
            case "<":
                return x < y;
            case "<=":
                return x <= y;
            case "&&":
                return x && y;
            case "||":
                return x || y;
            default:
                break;
        }
    });
    Handlebars.registerHelper('math', function(x, operator, y) {
        switch (operator) {
            case "*":
                return x * y;
            case "/":
                return x / y;
            case "-": 
                return x - y;
            case "+":
                return x + y;
            default:
                break;
        }
    });
    Handlebars.registerHelper('hasProperty', function(x, prop) {
        return x[prop] !== undefined;
    })

    // Repeat what's inside it X times. i starts at 1, ends at amount.
    // Useful for testing the damage track. Use as, for example, {{#repeat 4}}whatyouwanttorepeat{{/repeat}}
    Handlebars.registerHelper("repeat", function(amount, options) {
        var result = "";
        for (var i = 1; i <= amount; i++) {
            result = result + options.fn({i: i});
        }
        return result;
    });
    Handlebars.registerHelper("concat", function() {
        let result = "";
        //Skip the last argument.
        for(var i = 0; i < arguments.length - 1; ++i) {
            result += arguments[i];
        }
        return result;
    });
    Handlebars.registerHelper("skillRef", function(skill) {
        return "CYBERPUNK.Skill" + skill.split(".").pop();
    });

    // Allows you to use simple ["one", "two"] options for a select, or something like
    // [{value:"close", localKey:"RangeClose", localData: {range: 50}}, ...]
    // Translates the simple into the more complex one, really
    // Both extremes of ease-of-use and granularity :)
    Handlebars.registerHelper("selectOption", function(choice, options) {
        let context = {};
        // We're using the more complex layout of choices. Almost no real translation needed (except for choosing local key)
        if(choice.value !== undefined) {
            context = {
                value: choice.value,
                localKey: choice.localKey || choice.value,
                localData: choice.localData
            }
        }
        // Just ["one", "two"] etc
        else {
            context = {
                value: choice,
                localKey: choice,
                localData: undefined
            }
        }

        return options.fn(context);
    });
    // Woundstate: 0 for light, 1 for serious, etc
    // It's a little unintuitive, but handlebars loops start at 0, and that's our first would state
    // Damage: How much damage the character has taken. Actor.data.data.damage.
    // Provides within its context classes, and the current wound
    Handlebars.registerHelper("damageBoxes", function(woundState, damage, options) {
        const woundsPerState = 4;
        const previousBoxes = woundState * woundsPerState;
        let ret = [];
        // Per box in wound
        for(let boxNo = 1; boxNo <= woundsPerState; boxNo++) {
            let thisWound = previousBoxes + boxNo;
            let isChecked = thisWound == damage;
            let classes = "";
            if(boxNo === 1) {
                classes += " leftmost"
            }
            else if (boxNo === woundsPerState) {
                classes += " rightmost"
            }
    
            if(damage >= thisWound) {
                classes += " filled"
            }
            else { classes += " unfilled" }
            // When the wound box is filled, make clicking it again essentially "deselect" that wound
            if(damage == thisWound && damage > 0) {
                thisWound -= 1;
            }
            ret += options.fn({
                classes: classes, 
                woundNo: thisWound, 
                isChecked: isChecked
            });
        }
        return ret;
    });

    Handlebars.registerHelper("isObject", function(foo) {
        return foo instanceof Object;
    });

    Handlebars.registerHelper("template", function(templateName) {
        return templatePath + templateName + ".hbs";
    });

    // eg. {{> (replaceIn "systems/cyberpunk2020/templates/path/to/a-partial-[VAR]" foo)}}
    Handlebars.registerHelper("replaceIn", replaceIn);
    // eg. {{> (CPTemplate "path/to/static-partial.hbs")}}
    Handlebars.registerHelper("CPTemplate", function(path) {
        return templatePath + path;
    });
    // eg. {{> (varTemplate "path/to/[VAR]-partial.hbs" foo)}}
    Handlebars.registerHelper("varTemplate", function(path, replaceWith) {
        return templatePath + replaceIn(path, replaceWith);
    });

    Handlebars.registerHelper("deepLookup", function(context, path) {
        return deepLookup(context, path);
    });

    /** Display array of localizable strings, in short if possible
     * For each string, will look it up as a localization, with "Short" appended if possible, then join with "|"
    **/
    Handlebars.registerHelper("armorSummary", function(armorCoverage) {
        return Object.keys(armorCoverage)
            .filter(key => armorCoverage[key].stoppingPower > 0)
            .map(shortLocalize)
            .join("|");
    });

    /**
     * Range array is either [a] or [a,b] usually - used in actors' hit locations
     */
    Handlebars.registerHelper("displayRange", function(rangeArray) {
        if(rangeArray.length >= 2) {
            return rangeArray[0] + "-" + rangeArray[1];
        }
        else if (rangeArray.length == 1) {
            return String(rangeArray[0]);
        }
        return "";
    });
}