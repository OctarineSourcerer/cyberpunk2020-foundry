# cyberpunk2020 (for FoundryVTT)
*A note about Foundry 0.8.x. Migration's in process, and mostly done, but there are some evasive bugs with migration and using items-as-skills that are making it take longer than usual*

R. Talsorian Games' [Cyberpunk 2020](https://talsorianstore.com/products/cyberpunk-2020) system, but for FoundryVTT. Time to get chromed, and frag some slags.

![image](https://user-images.githubusercontent.com/6842867/115111007-0f80f900-9f76-11eb-8b42-7f6b6682a6a3.png) ![image](https://user-images.githubusercontent.com/6842867/115111021-26bfe680-9f76-11eb-93ee-7cf42d44190f.png)

I believe this is now ready to reasonably run games in without anything particularly fundamental missing (minus, at the moment, custom skills).
Here's the gist of what's there so far:

* A character sheet with stats, damage tracking, gear, combat tab, searchable skills, and cyberware.
  * Cyberware does not currently affect stats - it will probably involve working with Active Effects, but no promises, as I have no idea how to implement that framework yet.
* Consistent design reminiscent of the Core Rulebook, with UI design and user experience taken into heavy consideration.
* Skills sortable by either name or stat. You can swap between chipped and not, with both being stored independently (so you can chip/unchip). Rollable.
* Stopping power and encumbrance tracked for armor.
  * SP is currently just added together for each equipped piece of armor. Proportional armor will possibly come later.
* Ranged attacks for single shots, as well as three-round burst and autofire for automatic weapons.
* Easy modifier selection when making ranged attacks.
* A start of cyberpunk's melee system

Yet to come:
* Ammo expenditure and reloads easily doable from chat messages.
* Attack hit roll automatically translating to the name of the hit location.
* Target selection for attacks.
* Martial arts key moves
* Non-0-point skills to be shown first.
* In progress: Improvement points for skills, custom skills. 
  * The biggest thing here is figuring out a non-cluttered UI for these.
* Template area selection for area attacks
* Netrunning: Please dear gods, I've not used it in a campaign so it's a little far down my list
* Mech sheet: Yes this will come Ste, likely after Okay Weapon Rolls and the combat tab.

All rights to Cyberpunk 2020 lie with R. Talsorian games. Under their [homebrew content policy](https://rtalsoriangames.com/homebrew-content-policy/), any compendium produced with this will likely only be the statistical summaries of items, equivalent to the rows in the weapon table, without R. Talsorian's descriptive text. There will not be any stat blocks for monsters, NPCs, or hazards.

Happy to take any feedback; feel free to add issues or to make a PR :)

## Development notes
Please feel free to contribute! Whether by raising issues you find during play, requesting features, or contributing yourself, all is appreciated :) 
This project uses Sass - please edit the .scss files instead of the .css files.

### How to build
At the moment, this project only requires running `sass --watch scss/cyberpunk2020.scss css/cyberpunk2020.css` in the project's folder as you develop - this will auto-compile the scss as you make edits.

### Recent repo url change
It used to be this repo was called `cyberpunk2020-foundry`, and you'd have to change the folder name after cloning. Not anymore! But due to the rename, if you had the repo, you'll likely want to run `git remote set-url origin git@github.com:OctarineSourcerer/cyberpunk2020.git` to make sure your repo points to the rename (I don't know how long old versions will link to it).

### Time I have
The amount I can do for this repo goes up and down sometimes, so don't be particularly worried if some couple-week gaps happen. Just means I'm a little busy :)
