function placeBsBtn() {
	var importBtn =
		"<button id='import' class='bs-btn bs-btn-default'>Import</button>";
	$("#import-1_wrapper").append(importBtn);

	$("#import.bs-btn").click(function () {
		var pokes = document.getElementsByClassName("import-team-text")[0].value;
		var name = "Custom Set";
		addSets(pokes, name);
		//erase the import text area
		document.getElementsByClassName("import-team-text")[0].value = "";
	});
}

/*
	for now only save the current trainer #p1
*/
function saveTrainerPokemon() {
	$("#save-change").attr("hidden", true);
	ExportPokemon($("#p1"));
	$("#import.bs-btn").click();
}

function ExportPokemon(pokeInfo) {
	var pokemon = createPokemon(pokeInfo);
	var setName = $(".select2-chosen")[0].textContent.split(
		/^([^(@]+)(\((.+)\))? ?(@ (.+))?/
	)[3];
	var EV_counter = 0;
	var finalText = "";
	finalText =
		setName +
		" (" +
		pokemon.name +
		")" +
		(game > 0 && pokemon.gender != "N" ? " (" + pokemon.gender + ") " : "") +
		(pokemon.item ? " @ " + pokemon.item : "") +
		"\n";
	finalText += "Level: " + pokemon.level + "\n";
	finalText +=
		pokemon.nature && gen > 2 ? pokemon.nature + " Nature" + "\n" : "";
	if (gen === 9) {
		var teraType = pokeInfo.find(".teraType").val();
		if (teraType !== undefined && teraType !== pokemon.types[0]) {
			finalText += "Tera Type: " + teraType + "\n";
		}
	}
	finalText += pokemon.ability ? "Ability: " + pokemon.ability + "\n" : "";
	if (gen > 2) {
		var EVs_Array = [];
		for (var stat in pokemon.evs) {
			var ev = pokemon.evs[stat] ? pokemon.evs[stat] : 0;
			if (ev > 0) {
				EVs_Array.push(ev + " " + calc.Stats.displayStat(stat));
			}
			EV_counter += ev;
			if (EV_counter > 510) break;
		}
		if (EVs_Array.length > 0) {
			finalText += "EVs: ";
			finalText += serialize(EVs_Array, " / ");
			finalText += "\n";
		}
	}

	var IVs_Array = [];
	for (var stat in pokemon.ivs) {
		var iv = pokemon.ivs[stat] ? pokemon.ivs[stat] : 0;
		if (iv < 31) {
			IVs_Array.push(iv + " " + calc.Stats.displayStat(stat));
		}
	}
	if (IVs_Array.length > 0) {
		finalText += "IVs: ";
		finalText += serialize(IVs_Array, " / ");
		finalText += "\n";
	}

	for (var i = 0; i < 4; i++) {
		var moveName = pokemon.moves[i].name;
		if (moveName !== "(No Move)") {
			finalText += "- " + moveName + "\n";
		}
	}
	finalText = finalText.trim();
	$("textarea.import-team-text").val(finalText);
}

$("#exportL").click(function () {
	ExportPokemon($("#p1"));
});

$("#exportR").click(function () {
	ExportPokemon($("#p2"));
});

function serialize(array, separator) {
	var text = "";
	for (var i = 0; i < array.length; i++) {
		if (i < array.length - 1) {
			text += array[i] + separator;
		} else {
			text += array[i];
		}
	}
	return text;
}

function statToLegacyStat(stat) {
	switch (stat) {
		case "hp":
			return "hp";
		case "atk":
			return "at";
		case "def":
			return "df";
		case "spa":
			return "sa";
		case "spd":
			return "sd";
		case "spe":
			return "sp";
	}
}

function addToDex(poke) {
	var dexObject = {};
	if ($("#randoms").prop("checked")) {
		if (GEN9RANDOMBATTLE[poke.name] == undefined)
			GEN9RANDOMBATTLE[poke.name] = {};
		if (GEN8RANDOMBATTLE[poke.name] == undefined)
			GEN8RANDOMBATTLE[poke.name] = {};
		if (GEN7RANDOMBATTLE[poke.name] == undefined)
			GEN7RANDOMBATTLE[poke.name] = {};
		if (GEN6RANDOMBATTLE[poke.name] == undefined)
			GEN6RANDOMBATTLE[poke.name] = {};
		if (GEN5RANDOMBATTLE[poke.name] == undefined)
			GEN5RANDOMBATTLE[poke.name] = {};
		if (GEN4RANDOMBATTLE[poke.name] == undefined)
			GEN4RANDOMBATTLE[poke.name] = {};
		if (GEN3RANDOMBATTLE[poke.name] == undefined)
			GEN3RANDOMBATTLE[poke.name] = {};
		if (GEN2RANDOMBATTLE[poke.name] == undefined)
			GEN2RANDOMBATTLE[poke.name] = {};
		if (GEN1RANDOMBATTLE[poke.name] == undefined)
			GEN1RANDOMBATTLE[poke.name] = {};
	} else {
		if (SETDEX_SV[poke.name] == undefined) SETDEX_SV[poke.name] = {};
		if (SETDEX_SS[poke.name] == undefined) SETDEX_SS[poke.name] = {};
		if (SETDEX_SM[poke.name] == undefined) SETDEX_SM[poke.name] = {};
		if (SETDEX_XY[poke.name] == undefined) SETDEX_XY[poke.name] = {};
		if (SETDEX_BW[poke.name] == undefined) SETDEX_BW[poke.name] = {};
		if (SETDEX_DPP[poke.name] == undefined) SETDEX_DPP[poke.name] = {};
		if (SETDEX_ADV[poke.name] == undefined) SETDEX_ADV[poke.name] = {};
		if (SETDEX_GSC[poke.name] == undefined) SETDEX_GSC[poke.name] = {};
		if (SETDEX_RBY[poke.name] == undefined) SETDEX_RBY[poke.name] = {};
	}
	if (poke.ability !== undefined) {
		dexObject.ability = poke.ability;
	}
	if (poke.teraType !== undefined) {
		dexObject.teraType = poke.teraType;
	}
	dexObject.level = poke.level;
	dexObject.evs = poke.evs;
	dexObject.ivs = poke.ivs;
	dexObject.dvs = poke.dvs;
	dexObject.moves = poke.moves;
	dexObject.nature = poke.nature;
	dexObject.item = poke.item;
	dexObject.isCustomSet = poke.isCustomSet;
	var customsets;
	if (localStorage.customsets) {
		customsets = JSON.parse(localStorage.customsets);
	} else {
		customsets = {};
	}
	if (!customsets[poke.name]) {
		customsets[poke.name] = {};
	}
	customsets[poke.name][poke.nameProp] = dexObject;
	if (poke.name === "Aegislash-Blade") {
		if (!customsets["Aegislash-Shield"]) {
			customsets["Aegislash-Shield"] = {};
		}
		customsets["Aegislash-Shield"][poke.nameProp] = dexObject;
	}
	updateDex(customsets);
}

function updateDex(customsets, callback = null) {
	for (var pokemon in customsets) {
		for (var moveset in customsets[pokemon]) {
			if (!SETDEX_SV[pokemon]) SETDEX_SV[pokemon] = {};
			SETDEX_SV[pokemon][moveset] = customsets[pokemon][moveset];
			if (!SETDEX_SS[pokemon]) SETDEX_SS[pokemon] = {};
			SETDEX_SS[pokemon][moveset] = customsets[pokemon][moveset];
			if (!SETDEX_SM[pokemon]) SETDEX_SM[pokemon] = {};
			SETDEX_SM[pokemon][moveset] = customsets[pokemon][moveset];
			if (!SETDEX_XY[pokemon]) SETDEX_XY[pokemon] = {};
			SETDEX_XY[pokemon][moveset] = customsets[pokemon][moveset];
			if (!SETDEX_BW[pokemon]) SETDEX_BW[pokemon] = {};
			SETDEX_BW[pokemon][moveset] = customsets[pokemon][moveset];
			if (!SETDEX_DPP[pokemon]) SETDEX_DPP[pokemon] = {};
			SETDEX_DPP[pokemon][moveset] = customsets[pokemon][moveset];
			if (!SETDEX_ADV[pokemon]) SETDEX_ADV[pokemon] = {};
			SETDEX_ADV[pokemon][moveset] = customsets[pokemon][moveset];
			if (!SETDEX_GSC[pokemon]) SETDEX_GSC[pokemon] = {};
			SETDEX_GSC[pokemon][moveset] = customsets[pokemon][moveset];
			if (!SETDEX_RBY[pokemon]) SETDEX_RBY[pokemon] = {};
			SETDEX_RBY[pokemon][moveset] = customsets[pokemon][moveset];

			var gamemode = $("input[name='gamemode']:checked + label").html();
			//TODO: why does this code exist fr
			if (gamemode == "Vanilla") {
				if (!CUSTOMSETDEX_Y[pokemon]) CUSTOMSETDEX_Y[pokemon] = {};
				CUSTOMSETDEX_Y[pokemon][moveset] = customsets[pokemon][moveset];
				if (!CUSTOMSETDEX_E[pokemon]) CUSTOMSETDEX_E[pokemon] = {};
				CUSTOMSETDEX_E[pokemon][moveset] = customsets[pokemon][moveset];
				if (!CUSTOMSETDEX_Pl[pokemon]) CUSTOMSETDEX_Pl[pokemon] = {};
				CUSTOMSETDEX_Pl[pokemon][moveset] = customsets[pokemon][moveset];
				if (!CUSTOMSETDEX_HGSS[pokemon]) CUSTOMSETDEX_HGSS[pokemon] = {};
				CUSTOMSETDEX_HGSS[pokemon][moveset] = customsets[pokemon][moveset];
				if (!CUSTOMSETDEX_XY[pokemon]) CUSTOMSETDEX_XY[pokemon] = {};
				CUSTOMSETDEX_XY[pokemon][moveset] = customsets[pokemon][moveset];
				if (!CUSTOMSETDEX_SM[pokemon]) CUSTOMSETDEX_SM[pokemon] = {};
				CUSTOMSETDEX_SM[pokemon][moveset] = customsets[pokemon][moveset];
			} else {
				//HACK_GAMES
				if (!CUSTOMHACKSETDEX_EK[pokemon]) CUSTOMHACKSETDEX_EK[pokemon]={};
				CUSTOMHACKSETDEX_EK[pokemon][moveset] = customsets[pokemon][moveset];
				if (!CUSTOMHACKSETDEX_EKK[pokemon]) CUSTOMHACKSETDEX_EKK[pokemon]={};
				CUSTOMHACKSETDEX_EKK[pokemon][moveset] = customsets[pokemon][moveset];
			}				

			var poke = { name: pokemon, nameProp: moveset };
			addBoxed(poke);
		}
	}
	localStorage.customsets = JSON.stringify(customsets);

	if (callback) {
		callback();
	}
}

function addSets(pokes, name) {
	var rows = pokes.split("\n");
	var currentRow;
	var currentPoke;
	var addedpokes = 0;
	for (var i = 0; i < rows.length; i++) {
		currentRow = rows[i].replace(" (M)", "").replace(" (F)", "");
		var split = currentRow.split(/^([^(@]+)(\((.+)\))? ?(@ (.+))?/);
		if (split[3] && calc.SPECIES[9][checkExeptions(split[3].trim())]) {
			if (currentPoke) {
				addToDex(currentPoke);
				addBoxed(currentPoke);
				addedpokes++;
			}

			currentPoke = Object.assign(
				{},
				calc.SPECIES[9][checkExeptions(split[3].trim())]
			);
			currentPoke.name = split[3]
				.trim()
				.replace("Nidoran-f", "Nidoran-F")
				.replace("Nidoran-m", "Nidoran-M")
				.replace("Mr. mime", "Mr. Mime");
			currentPoke.nameProp = split[1].trim();
			currentPoke.moves = [];
			currentPoke.nature = "Hardy";
		} else if (split[1] && calc.SPECIES[9][checkExeptions(split[1].trim())]) {
			if (currentPoke) {
				addToDex(currentPoke);
				addBoxed(currentPoke);
				addedpokes++;
			}

			currentPoke = calc.SPECIES[9][checkExeptions(split[1].trim())];
			currentPoke.name = split[1]
				.trim()
				.replace("-f", "-F")
				.replace("-m", "-M");
			currentPoke.nameProp = name;
			currentPoke.moves = [];
			currentPoke.nature = "Hardy";
		}
		if (!currentPoke) continue;
		if (split[5] && calc.ITEMS[9].includes(split[5].trim()))
			currentPoke.item = split[5].trim();
		currentPoke.isCustomSet = true;
		if (currentRow.includes("Ability: ")) {
			var ability = currentRow.replace("Ability: ", "").trim();
			if (calc.ABILITIES[9].includes(ability)) currentPoke.ability = ability;
		}
		if (currentRow.includes("Level: ")) {
			var level = currentRow.replace("Level: ", "").trim();
			if (parseInt(level)) currentPoke.level = parseInt(level);
			else currentPoke.level = 100;
		}
		if (currentRow.includes("Tera Type: ")) {
			var teraType = currentRow.replace("Tera Type: ", "").trim();
			if (calc.TYPE_CHART[9][teraType]) currentPoke.teraType = teraType;
		}
		if (currentRow.includes(" Nature")) {
			var nature = currentRow.replace(" Nature", "").trim();
			if (calc.NATURES[nature]) currentPoke.nature = nature;
		}
		if (currentRow.includes("DVs: ")) {
			currentPoke.dvs = {};
			var dvs = currentRow.replace("DVs: ", "").trim().split(" / ");
			for (var j in dvs) {
				var dv = dvs[j];
				var stat = statToLegacyStat(dv.split(" ")[1].toLowerCase());
				var value = parseInt(dv.split(" ")[0]);
				currentPoke.dvs[stat] = value;
			}
			if (currentPoke.dvs["sa"] !== undefined)
				currentPoke.dvs["sl"] = currentPoke.dvs["sa"];
		}
		if (currentRow.includes("IVs: ")) {
			if (gen < 3) {
				currentPoke.dvs = {};
				var dvs = currentRow.replace("IVs: ", "").trim().split(" / ");
				for (var j in dvs) {
					var dv = dvs[j];
					var stat = statToLegacyStat(dv.split(" ")[1].toLowerCase());
					var value = parseInt(dv.split(" ")[0]);
					currentPoke.dvs[stat] = value;
				}
				if (currentPoke.dvs["sa"] !== undefined)
					currentPoke.dvs["sl"] = currentPoke.dvs["sa"];
			} else {
				currentPoke.ivs = {};
				var ivs = currentRow.replace("IVs: ", "").trim().split(" / ");
				for (var j in ivs) {
					var iv = ivs[j];
					var stat = statToLegacyStat(iv.split(" ")[1].toLowerCase());
					var value = parseInt(iv.split(" ")[0]);
					currentPoke.ivs[stat] = value;
				}
			}
		}
		if (currentRow.includes("EVs: ")) {
			currentPoke.evs = {};
			var evs = currentRow.replace("EVs: ", "").trim().split(" / ");
			for (var j in evs) {
				var ev = evs[j];
				var stat = statToLegacyStat(ev.split(" ")[1].toLowerCase());
				var value = parseInt(ev.split(" ")[0]);
				currentPoke.evs[stat] = value;
			}
		}
		if (currentRow.startsWith("- ")) {
			var move = currentRow
				.replace("- ", "")
				.replace("[", "")
				.replace("]", "")
				.trim();
			//Rename in-game moves to correspond to modern naming conventions
			move = move.replace("Hi Jump Kick", "High Jump Kick").replace("Sonicboom", "Sonic Boom").replace("Ancientpower", "Ancient Power").replace("Faint Attack", "Feint Attack");
			currentPoke.moves.push(move);
		}
	}
	if (currentPoke) {
		addToDex(currentPoke);
		addBoxed(currentPoke);
		addedpokes++;
	}
	if (addedpokes > 0) {
		// $(allPokemon("#importedSetsOptions")).css("display", "inline");
	} else {
		alert("No sets imported, please check your syntax and try again");
	}
}

function checkExeptions(poke) {
	switch (poke) {
		case "Aegislash":
			poke = "Aegislash-Blade";
			break;
		case "Basculin-Blue-Striped":
			poke = "Basculin";
			break;
		case "Gastrodon-East":
			poke = "Gastrodon";
			break;
		case "Mimikyu-Busted-Totem":
			poke = "Mimikyu-Totem";
			break;
		case "Mimikyu-Busted":
			poke = "Mimikyu";
			break;
		case "Nidoran-f":
			poke = "Nidoran-F";
			break;
		case "Nidoran-m":
			poke = "Nidoran-M";
			break;
		case "Pikachu-Belle":
		case "Pikachu-Cosplay":
		case "Pikachu-Libre":
		case "Pikachu-Original":
		case "Pikachu-Partner":
		case "Pikachu-PhD":
		case "Pikachu-Pop-Star":
		case "Pikachu-Rock-Star":
			poke = "Pikachu";
			break;
		case "Vivillon-Fancy":
		case "Vivillon-Pokeball":
			poke = "Vivillon";
			break;
		case "Florges-White":
		case "Florges-Blue":
		case "Florges-Orange":
		case "Florges-Yellow":
			poke = "Florges";
			break;
		case "Shellos-East":
			poke = "Shellos";
			break;
		case "Deerling-Summer":
		case "Deerling-Autumn":
		case "Deerling-Winter":
			poke = "Deerling";
			break;
	}
	return poke;
}

$("#clearSets").click(function () {
	var yes = confirm("Do you really wish to delete all your Pokémon?");
	if (!yes) {
		return;
	}
	localStorage.removeItem("customsets");
	$(allPokemon("#importedSetsOptions")).hide();
	loadDefaultLists();
	for (let zone of document.getElementsByClassName("dropzone")) {
		zone.innerHTML = "";
	}
});

$(allPokemon("#importedSets")).click(function () {
	var pokeID = $(this).parent().parent().prop("id");
	var showCustomSets = $(this).prop("checked");
	if (showCustomSets) {
		loadCustomList(pokeID);
	} else {
		loadDefaultLists();
	}
});

$(document).ready(function () {
	var customSets;
	placeBsBtn();
	if (localStorage.customsets) {
		customSets = JSON.parse(localStorage.customsets);
		updateDex(customSets, selectFirstMon);
		// $(allPokemon("#importedSetsOptions")).css("display", "inline");
	} else {
		loadDefaultLists();
	}
});
