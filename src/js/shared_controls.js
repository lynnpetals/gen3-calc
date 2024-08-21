if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function (searchElement, fromIndex) {
		// eslint-disable-line no-extend-native
		var k;
		if (this == null) {
			throw new TypeError('"this" equals null or n is undefined');
		}
		var O = Object(this);
		var len = O.length >>> 0;
		if (len === 0) {
			return -1;
		}
		var n = +fromIndex || 0;
		if (Math.abs(n) === Infinity) {
			n = 0;
		}
		if (n >= len) {
			return -1;
		}
		k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
		while (k < len) {
			if (k in O && O[k] === searchElement) {
				return k;
			}
			k++;
		}
		return -1;
	};
}

function startsWith(string, target) {
	return (string || "").slice(0, target.length) === target;
}

function endsWith(string, target) {
	return (string || "").slice(-target.length) === target;
}

var LEGACY_STATS_RBY = ["hp", "at", "df", "sl", "sp"];
var LEGACY_STATS_GSC = ["hp", "at", "df", "sa", "sd", "sp"];
var LEGACY_STATS = [
	[],
	LEGACY_STATS_RBY,
	LEGACY_STATS_GSC,
	LEGACY_STATS_GSC,
	LEGACY_STATS_GSC,
	LEGACY_STATS_GSC,
	LEGACY_STATS_GSC,
	LEGACY_STATS_GSC,
	LEGACY_STATS_GSC,
	LEGACY_STATS_GSC,
];
var HIDDEN_POWER_REGEX = /Hidden Power (\w*)/;

var CALC_STATUS = {
	Healthy: "",
	Paralyzed: "par",
	Poisoned: "psn",
	"Badly Poisoned": "tox",
	Burned: "brn",
	Asleep: "slp",
	Frozen: "frz",
};

function legacyStatToStat(st) {
	switch (st) {
		case "hp":
			return "hp";
		case "at":
			return "atk";
		case "df":
			return "def";
		case "sa":
			return "spa";
		case "sd":
			return "spd";
		case "sp":
			return "spe";
		case "sl":
			return "spc";
	}
}

// input field validation
var bounds = {
	level: [0, 100],
	base: [1, 255],
	evs: [0, 252],
	ivs: [0, 31],
	dvs: [0, 15],
	"move-bp": [0, 65535],
};
for (var bounded in bounds) {
	attachValidation(bounded, bounds[bounded][0], bounds[bounded][1]);
}
function attachValidation(clazz, min, max) {
	$("." + clazz).keyup(function () {
		validate($(this), min, max);
	});
}
function validate(obj, min, max) {
	obj.val(Math.max(min, Math.min(max, ~~obj.val())));
}

$("input:radio[name='format']").change(function () {
	var gameType = $("input:radio[name='format']:checked").val();
	if (gameType === "Singles") {
		$("input:checkbox[name='ruin']:checked").prop("checked", false);
	}
	$(".format-specific." + gameType.toLowerCase()).each(function () {
		if ($(this).hasClass("gen-specific") && !$(this).hasClass("g" + gen)) {
			return;
		}
		$(this).show();
	});
	$(".format-specific")
		.not("." + gameType.toLowerCase())
		.hide();
});

var defaultLevel = 100;
$("input:radio[name='defaultLevel']").change(function () {
	defaultLevel = $("input:radio[name='defaultLevel']:checked").val();
	$("#levelL1").val(defaultLevel);
	$("#levelR1").val(defaultLevel);
	$("#levelL1").trigger("change");
	$("#levelR1").trigger("change");
});

// auto-calc stats and current HP on change
$(".level").bind("keyup change", function () {
	var poke = $(this).closest(".poke-info");
	calcHP(poke);
	calcStats(poke);
});
$(".nature").bind("keyup change", function () {
	calcStats($(this).closest(".poke-info"));
});
$(".hp .base, .hp .evs, .hp .ivs").bind("keyup change", function () {
	calcHP($(this).closest(".poke-info"));
});
$(".at .base, .at .evs, .at .ivs").bind("keyup change", function () {
	calcStat($(this).closest(".poke-info"), "at");
});
$(".df .base, .df .evs, .df .ivs").bind("keyup change", function () {
	calcStat($(this).closest(".poke-info"), "df");
});
$(".sa .base, .sa .evs, .sa .ivs").bind("keyup change", function () {
	calcStat($(this).closest(".poke-info"), "sa");
});
$(".sd .base, .sd .evs, .sd .ivs").bind("keyup change", function () {
	calcStat($(this).closest(".poke-info"), "sd");
});
$(".sp .base, .sp .evs, .sp .ivs").bind("keyup change", function () {
	calcStat($(this).closest(".poke-info"), "sp");
});
$(".sl .base").keyup(function () {
	calcStat($(this).closest(".poke-info"), "sl");
});
$(".at .dvs").keyup(function () {
	var poke = $(this).closest(".poke-info");
	calcStat(poke, "at");
	poke.find(".hp .dvs").val(getHPDVs(poke));
	calcHP(poke);
});
$(".df .dvs").keyup(function () {
	var poke = $(this).closest(".poke-info");
	calcStat(poke, "df");
	poke.find(".hp .dvs").val(getHPDVs(poke));
	calcHP(poke);
});
$(".sa .dvs").keyup(function () {
	var poke = $(this).closest(".poke-info");
	calcStat(poke, "sa");
	poke.find(".sd .dvs").val($(this).val());
	calcStat(poke, "sd");
	poke.find(".hp .dvs").val(getHPDVs(poke));
	calcHP(poke);
});
$(".sp .dvs").keyup(function () {
	var poke = $(this).closest(".poke-info");
	calcStat(poke, "sp");
	poke.find(".hp .dvs").val(getHPDVs(poke));
	calcHP(poke);
});
$(".sl .dvs").keyup(function () {
	var poke = $(this).closest(".poke-info");
	calcStat(poke, "sl");
	poke.find(".hp .dvs").val(getHPDVs(poke));
	calcHP(poke);
});

function getForcedTeraType(pokemonName) {
	if (startsWith(pokemonName, "Ogerpon-Cornerstone")) {
		return "Rock";
	} else if (startsWith(pokemonName, "Ogerpon-Hearthflame")) {
		return "Fire";
	} else if (
		pokemonName === "Ogerpon" ||
		startsWith(pokemonName, "Ogerpon-Teal")
	) {
		return "Grass";
	} else if (startsWith(pokemonName, "Ogerpon-Wellspring")) {
		return "Water";
	} else if (startsWith(pokemonName, "Terapagos")) {
		return "Stellar";
	}
	return null;
}

function getHPDVs(poke) {
	return (
		(~~poke.find(".at .dvs").val() % 2) * 8 +
		(~~poke.find(".df .dvs").val() % 2) * 4 +
		(~~poke.find(".sp .dvs").val() % 2) * 2 +
		(~~poke.find(gen === 1 ? ".sl .dvs" : ".sa .dvs").val() % 2)
	);
}

function calcStats(poke) {
	for (var i = 0; i < LEGACY_STATS[gen].length; i++) {
		calcStat(poke, LEGACY_STATS[gen][i]);
	}
}

function calcCurrentHP(poke, max, percent, skipDraw) {
	var current = Math.round((Number(percent) * Number(max)) / 100);
	poke.find(".current-hp").val(current);
	if (!skipDraw) drawHealthBar(poke, max, current);
	return current;
}
function calcPercentHP(poke, max, current, skipDraw) {
	var percent = Math.round((100 * Number(current)) / Number(max));
	if (percent === 0 && current > 0) {
		percent = 1;
	} else if ((percent === 100) & (current < max)) {
		percent = 99;
	}

	poke.find(".percent-hp").val(percent);
	if (!skipDraw) drawHealthBar(poke, max, current);
	return percent;
}
function drawHealthBar(poke, max, current) {
	var fillPercent = (100 * current) / max;
	var fillColor =
		fillPercent > 50 ? "green" : fillPercent > 20 ? "yellow" : "red";

	var healthbar = poke.find(".hpbar");
	healthbar.addClass("hp-" + fillColor);
	var unwantedColors = ["green", "yellow", "red"];
	unwantedColors.splice(unwantedColors.indexOf(fillColor), 1);
	for (var i = 0; i < unwantedColors.length; i++) {
		healthbar.removeClass("hp-" + unwantedColors[i]);
	}
	healthbar.css(
		"background",
		"linear-gradient(to right, " +
			fillColor +
			" " +
			fillPercent +
			"%, white 0%"
	);
}
// TODO: these HP inputs should really be input type=number with min=0, step=1, constrained by max=maxHP or 100
$(".current-hp").keyup(function () {
	var max = $(this).parent().children(".max-hp").text();
	validate($(this), 0, max);
	var current = $(this).val();
	calcPercentHP($(this).parent(), max, current);
});
$(".percent-hp").keyup(function () {
	var max = $(this).parent().children(".max-hp").text();
	validate($(this), 0, 100);
	var percent = $(this).val();
	calcCurrentHP($(this).parent(), max, percent);
});

$(".ability").bind("keyup change", function () {
	var moveHits =
		$(this).val() === "Skill Link"
			? 5
			: $(this).closest(".poke-info").find(".item").val() === "Loaded Dice"
			? 4
			: 3;
	$(this).closest(".poke-info").find(".move-hits").val(moveHits);

	var ability = $(this).closest(".poke-info").find(".ability").val();

	var TOGGLE_ABILITIES = [
		"Flash Fire",
		"Intimidate",
		"Minus",
		"Plus",
		"Slow Start",
		"Unburden",
		"Stakeout",
		"Teraform Zero",
	];

	if (TOGGLE_ABILITIES.indexOf(ability) >= 0) {
		$(this).closest(".poke-info").find(".abilityToggle").show();
	} else {
		$(this).closest(".poke-info").find(".abilityToggle").hide();
	}
	var boostedStat = $(this).closest(".poke-info").find(".boostedStat");

	if (ability === "Protosynthesis" || ability === "Quark Drive") {
		boostedStat.show();
		autosetQP($(this).closest(".poke-info"));
	} else {
		boostedStat.hide();
	}

	if (ability === "Supreme Overlord") {
		$(this).closest(".poke-info").find(".alliesFainted").show();
	} else {
		$(this).closest(".poke-info").find(".alliesFainted").val("0");
		$(this).closest(".poke-info").find(".alliesFainted").hide();
	}

	if (ability === "Imposter") {
		$(this).siblings(".transform").show();
	} else {
		$(this).siblings(".transform").hide();
	}
});

function autosetQP(pokemon) {
	var currentWeather = $("input:radio[name='weather']:checked").val();
	var currentTerrain =
		$("input:checkbox[name='terrain']:checked").val() || "No terrain";

	var item = pokemon.find(".item").val();
	var ability = pokemon.find(".ability").val();
	var boostedStat = pokemon.find(".boostedStat").val();

	if (!boostedStat || boostedStat === "auto") {
		if (
			item === "Booster Energy" ||
			(ability === "Protosynthesis" && currentWeather === "Sun") ||
			(ability === "Quark Drive" && currentTerrain === "Electric")
		) {
			pokemon.find(".boostedStat").val("auto");
		} else {
			pokemon.find(".boostedStat").val("");
		}
	}
}

$("#p1 .ability").bind("keyup change", function () {
	autosetWeather($(this).val(), 0);
	autosetTerrain($(this).val(), 0);
	autosetQP($(this).closest(".poke-info"));
});

$("input[name='weather']").change(function () {
	var allPokemon = $(".poke-info");
	var xyz = $(".forme")
	xyz.each((i, val) => {
		if ($(val).children('option').length > 0 && $(val).val().includes('Castform')){
			switch ($(this).val()) {
				case "Rain":
					$(val).val("Castform-Rainy").change()
					break;
				case "Sun":
					$(val).val("Castform-Sunny").change()
					break;
				case "Hail":
					$(val).val("Castform-Snowy").change()
					break;
				default:
					$(val).val("Castform").change()
					break;
			}
		}
	})
	allPokemon.each(function () {
		autosetQP($(this));
	});
});

var lastManualWeather = "";
var lastAutoWeather = ["", ""];
function autosetWeather(ability, i) {
	if (game != "None") return;
	var currentWeather = $("input:radio[name='weather']:checked").val();
	if (lastAutoWeather.indexOf(currentWeather) === -1) {
		lastManualWeather = currentWeather;
		lastAutoWeather[1 - i] = "";
	}
	switch (ability) {
		case "Drought":
		case "Orichalcum Pulse":
			lastAutoWeather[i] = "Sun";
			$("#sun").prop("checked", true);
			break;
		case "Drizzle":
			lastAutoWeather[i] = "Rain";
			$("#rain").prop("checked", true);
			break;
		case "Sand Stream":
			lastAutoWeather[i] = "Sand";
			$("#sand").prop("checked", true);
			break;
		case "Snow Warning":
			if (gen >= 9) {
				lastAutoWeather[i] = "Snow";
				$("#snow").prop("checked", true);
			} else {
				lastAutoWeather[i] = "Hail";
				$("#hail").prop("checked", true);
			}
			break;
		case "Desolate Land":
			lastAutoWeather[i] = "Harsh Sunshine";
			$("#harsh-sunshine").prop("checked", true);
			break;
		case "Primordial Sea":
			lastAutoWeather[i] = "Heavy Rain";
			$("#heavy-rain").prop("checked", true);
			break;
		case "Delta Stream":
			lastAutoWeather[i] = "Strong Winds";
			$("#strong-winds").prop("checked", true);
			break;
		default:
			lastAutoWeather[i] = "";
			var newWeather =
				lastAutoWeather[1 - i] !== "" ? lastAutoWeather[1 - i] : "";
			$("input:radio[name='weather'][value='" + newWeather + "']").prop(
				"checked",
				true
			);
			break;
	}
}

$("input[name='terrain']").change(function () {
	var allPokemon = $(".poke-info");
	allPokemon.each(function () {
		autosetQP($(this));
	});
});

var lastManualTerrain = "";
var lastAutoTerrain = ["", ""];
function autosetTerrain(ability, i) {
	var currentTerrain =
		$("input:checkbox[name='terrain']:checked").val() || "No terrain";
	if (lastAutoTerrain.indexOf(currentTerrain) === -1) {
		lastManualTerrain = currentTerrain;
		lastAutoTerrain[1 - i] = "";
	}
	// terrain input uses checkbox instead of radio, need to uncheck all first
	$("input:checkbox[name='terrain']:checked").prop("checked", false);
	switch (ability) {
		case "Electric Surge":
		case "Hadron Engine":
			lastAutoTerrain[i] = "Electric";
			$("#electric").prop("checked", true);
			break;
		case "Grassy Surge":
			lastAutoTerrain[i] = "Grassy";
			$("#grassy").prop("checked", true);
			break;
		case "Misty Surge":
			lastAutoTerrain[i] = "Misty";
			$("#misty").prop("checked", true);
			break;
		case "Psychic Surge":
			lastAutoTerrain[i] = "Psychic";
			$("#psychic").prop("checked", true);
			break;
		default:
			lastAutoTerrain[i] = "";
			var newTerrain =
				lastAutoTerrain[1 - i] !== ""
					? lastAutoTerrain[1 - i]
					: lastManualTerrain;
			if ("No terrain" !== newTerrain) {
				$(
					"input:checkbox[name='terrain'][value='" + newTerrain + "']"
				).prop("checked", true);
			}
			break;
	}
}

var prevMon = "";

$("#p1 .item").bind("keyup change", function () {
	autosetStatus("#p1", $(this).val());
});

function autosetStatus(p, item) {
	if (item === "Flame Orb") {
		$(p + " .status").val("Burned");
		$(p + " .status").change();
	} else if (item === "Toxic Orb") {
		$(p + " .status").val("Badly Poisoned");
		$(p + " .status").change();
	}
}

$(".status").bind("keyup change", function () {
	if ($(this).val() === "Badly Poisoned") {
		$(this).parent().children(".toxic-counter").show();
	} else {
		$(this).parent().children(".toxic-counter").hide();
	}
});

$(".teraType").change(function () {
	var pokeObj = $(this).closest(".poke-info");
	var checked = pokeObj.find(".teraToggle").prop("checked");
	stellarButtonsVisibility(pokeObj, $(this).val() === "Stellar" && checked);
});

var lockerMove = "";
// auto-update move details on select
$(".move-selector").change(function () {
	var moveName = $(this).val();
	var move = moves[moveName] || moves["(No Move)"];
	var moveGroupObj = $(this).parent();
	moveGroupObj.children(".move-bp").val(moveName === "Present" ? 40 : move.bp);
	var m = moveName.match(HIDDEN_POWER_REGEX);
	if (m) {
		var pokeObj = $(this).closest(".poke-info");
		var pokemon = createPokemon(pokeObj);
		var actual = calc.Stats.getHiddenPower(GENERATION, pokemon.ivs);
		if (actual.type !== m[1] && !["Emerald Kaizo", "Emerald Kaizo Kaizo"].includes(game)) {
			var hpIVs = calc.Stats.getHiddenPowerIVs(GENERATION, m[1]);
			if (hpIVs && gen < 7) {
				for (var i = 0; i < LEGACY_STATS[gen].length; i++) {
					var legacyStat = LEGACY_STATS[gen][i];
					var stat = legacyStatToStat(legacyStat);
					pokeObj
						.find("." + legacyStat + " .ivs")
						.val(hpIVs[stat] !== undefined ? hpIVs[stat] : 31);
					pokeObj
						.find("." + legacyStat + " .dvs")
						.val(
							hpIVs[stat] !== undefined
								? calc.Stats.IVToDV(hpIVs[stat])
								: 15
						);
				}
				if (gen < 3) {
					var hpDV = calc.Stats.getHPDV({
						atk: pokeObj.find(".at .ivs").val(),
						def: pokeObj.find(".df .ivs").val(),
						spe: pokeObj.find(".sp .ivs").val(),
						spc: pokeObj.find(".sa .ivs").val(),
					});
					pokeObj.find(".hp .ivs").val(calc.Stats.DVToIV(hpDV));
					pokeObj.find(".hp .dvs").val(hpDV);
				}
				pokeObj.change();
				moveGroupObj.children(".move-bp").val(gen >= 6 ? 60 : 70);
			}
		} else {
			moveGroupObj.children(".move-bp").val(actual.power);
		}
	} else if (
		gen >= 2 &&
		gen <= 6 &&
		HIDDEN_POWER_REGEX.test($(this).attr("data-prev")) &&
		game == "None"
	) {
		// If this selector was previously Hidden Power but now isn't, reset all IVs/DVs to max.
		var pokeObj = $(this).closest(".poke-info");
		for (var i = 0; i < LEGACY_STATS[gen].length; i++) {
			var legacyStat = LEGACY_STATS[gen][i];
			pokeObj.find("." + legacyStat + " .ivs").val(31);
			pokeObj.find("." + legacyStat + " .dvs").val(15);
		}
	}
	$(this).attr("data-prev", moveName);
	moveGroupObj.children(".move-type").val(move.type);
	moveGroupObj.children(".move-cat").val(move.category);

	var stat = move.category === "Special" ? "spa" : "atk";
	var dropsStats =
		move.self &&
		move.self.boosts &&
		move.self.boosts[stat] &&
		move.self.boosts[stat] < 0;
	if (
		Array.isArray(move.multihit) ||
		(!isNaN(move.multihit) && move.multiaccuracy)
	) {
		moveGroupObj.children(".stat-drops").hide();
		moveGroupObj.children(".move-hits").empty();
		if (!isNaN(move.multihit)) {
			for (var i = 1; i <= move.multihit; i++) {
				moveGroupObj
					.children(".move-hits")
					.append("<option value=" + i + ">" + i + " hits</option>");
			}
		} else {
			for (var i = move.multihit[0]; i <= move.multihit[1]; i++) {
				moveGroupObj
					.children(".move-hits")
					.append("<option value=" + i + ">" + i + " hits</option>");
			}
		}
		moveGroupObj.children(".move-hits").show();
		var pokemon = $(this).closest(".poke-info");
		var moveHits =
			pokemon.find(".ability").val() === "Skill Link"
				? 5
				: pokemon.find(".item").val() === "Loaded Dice"
				? 4
				: 3;
		moveGroupObj.children(".move-hits").val(moveHits);
	} else if (dropsStats) {
		moveGroupObj.children(".move-hits").hide();
		moveGroupObj.children(".stat-drops").show();
	} else {
		moveGroupObj.children(".move-hits").hide();
		moveGroupObj.children(".stat-drops").hide();
	}
	moveGroupObj.children(".move-z").prop("checked", false);

	//Transform is currently incorrectly implemented, TODO

	// if (moveName === "Transform") {
	// 	moveGroupObj.children(".transform").show();
	// } else {
	// 	moveGroupObj.children(".transform").hide();
	// }
});

$(".item").change(function () {
	var itemName = $(this).val();
	var $metronomeControl = $(this).closest(".poke-info").find(".metronome");
	if (itemName === "Metronome") {
		$metronomeControl.show();
	} else {
		$metronomeControl.hide();
	}
	var moveHits =
		$(this).closest(".poke-info").find(".ability").val() === "Skill Link"
			? 5
			: itemName === "Loaded Dice"
			? 4
			: 3;
	$(this).closest(".poke-info").find(".move-hits").val(moveHits);
	autosetQP($(this).closest(".poke-info"));
});

function smogonAnalysis(pokemonName) {
	var generation = ["rb", "gs", "rs", "dp", "bw", "xy", "sm", "ss", "sv"][
		gen - 1
	];
	return (
		"https://smogon.com/dex/" +
		generation +
		"/pokemon/" +
		pokemonName.toLowerCase() +
		"/"
	);
}
$(".set-selector").change(function () {
	window.NO_CALC = true;
	var fullSetName = $(this).val();

	if ($(this).hasClass("opposing") && game != "None") {
		topPokemonIcon(fullSetName, $("#p2mon")[0]);
		// topPokemonIcon1(fullSetName, $("#p2mon")[0])
		var oldTrainer = window.CURRENT_TRAINER;
		var nextPokemon = get_trainer_poks(fullSetName);
		var frag = new DocumentFragment();
		for (var i in nextPokemon) {
			if (nextPokemon[i][0].includes($("input.opposing").val())) {
				continue;
			}

			var pokemonName = nextPokemon[i].split(" (")[0];

			var span = document.createElement("span");
			span.style = "width:100%;";
			var img = document.createElement("img");
			img.className = "trainer-poke-switch right-side";
			img.src = getBabySprite(pokemonName);
			img.dataset.id = nextPokemon[i];
			img.title = `${nextPokemon[i]}`;
			span.append(img);

			var label = document.createElement("label");
			label.style = "width:60%;";
			label.className = "trainer-poke-switch-explain";
			label.dataset.id = nextPokemon[i];
			span.append(label);

			var label2 = document.createElement("label");
			label2.className = "trainer-poke-switch-xp";
			label2.dataset.id = nextPokemon[i];
			span.append(label2);

			frag.append(span);

			// switchHTML += `<span style="width: 100%;"><img class="trainer-poke-switch right-side" src="https://raw.githubusercontent.com/May8th1995/sprites/master/${pokemonName}.png" data-id="${nextPokemon[i]}" title="${nextPokemon[i]}">
			// <label style="width: 60%;" class="trainer-poke-switch-explain" data-id="${nextPokemon[i]}"></label><label class="trainer-poke-switch-xp" data-id="${nextPokemon[i]}"></label></span>`;
			if (parseInt(i) + 1 < nextPokemon.length)
				frag.append(document.createElement("br"));
		}

		if (flags) {
			var weather = "clear";
			var oldWeather = $("input[name='weather']:checked").val()
			for (var i in flags["weather"]) {
				if (flags["weather"][i].includes(window.CURRENT_TRAINER)) {
					weather = i;
					break;
				}
			}
			if (weather !== "any") $(`#${weather}`).prop("checked", true);
			if (oldWeather != $("input[name='weather']:checked").val()){
				$("input[name='weather']:checked").change()
			}

			var badge = "";
			for (var i in flags["badge"]) {
				if (flags["badge"][i].includes(window.CURRENT_TRAINER)) {
					badge = i;
					break;
				}
			}
			if (gen == 3) {
				if (badge == "none") {
					$("#stoneBadge").prop("checked", false);
					$("#dynamoBadge").prop("checked", false);
					$("#balanceBadge").prop("checked", false);
					$("#mindBadge").prop("checked", false);
				} else if (badge == "stoneBadge") {
					$("#stoneBadge").prop("checked", true);
					$("#dynamoBadge").prop("checked", false);
					$("#balanceBadge").prop("checked", false);
					$("#mindBadge").prop("checked", false);
				} else if (badge == "dynamoBadge") {
					$("#stoneBadge").prop("checked", true);
					$("#dynamoBadge").prop("checked", true);
					$("#balanceBadge").prop("checked", false);
					$("#mindBadge").prop("checked", false);
				} else if (badge == "balanceBadge") {
					$("#stoneBadge").prop("checked", true);
					$("#dynamoBadge").prop("checked", true);
					$("#balanceBadge").prop("checked", true);
					$("#mindBadge").prop("checked", false);
				} else if (badge == "mindBadge") {
					$("#stoneBadge").prop("checked", true);
					$("#dynamoBadge").prop("checked", true);
					$("#balanceBadge").prop("checked", true);
					$("#mindBadge").prop("checked", true);
				}
			}
			if (flags["doubles"].includes(window.CURRENT_TRAINER)) {
				$("#doubles-format").prop("checked", true);
			} else {
				$("#singles-format").prop("checked", true);
			}
		}
		if (oldTrainer !== window.CURRENT_TRAINER) {
			$(".trainer-poke-switch-list").html("");
			$(".trainer-poke-switch-list").append(frag);
		}
	}

	for (mon of document.getElementsByClassName("trainer-poke-switch-list")[0]
		.children) {
		mon.addEventListener("dragstart", dragstart_handler);
		mon.addEventListener("contextmenu", noMenuClick);
	}
	if ($(this).hasClass("player")) {
		topPokemonIcon(fullSetName, $("#p1mon")[0]);
	}

	$("label.opposing")[0].textContent = window.CURRENT_TRAINER;

	var pokemonName = fullSetName.substring(0, fullSetName.indexOf(" ("));
	var setName = fullSetName.substring(
		fullSetName.indexOf("(") + 1,
		fullSetName.lastIndexOf(")")
	);
	var pokemon = pokedex[pokemonName];
	if (pokemon) {
		var pokeObj = $(this).closest(".poke-info");
		if (stickyMoves.getSelectedSide() === pokeObj.prop("id")) {
			stickyMoves.clearStickyMove();
		}
		pokeObj.find(".teraToggle").prop("checked", false);
		pokeObj.find(".analysis").attr("href", smogonAnalysis(pokemonName));
		pokeObj.find(".type1").val(pokemon.types[0]);
		pokeObj.find(".type2").val(pokemon.types[1]);
		pokeObj.find(".hp .base").val(pokemon.bs.hp);
		var i;
		for (i = 0; i < LEGACY_STATS[gen].length; i++) {
			pokeObj
				.find("." + LEGACY_STATS[gen][i] + " .base")
				.val(pokemon.bs[LEGACY_STATS[gen][i]]);
		}
		pokeObj.find(".boost").val(0);
		pokeObj.find(".percent-hp").val(100);
		pokeObj.find(".status").val("Healthy");
		$(".status").change();
		var moveObj;
		var abilityObj = pokeObj.find(".ability");
		var itemObj = pokeObj.find(".item");
		var randset = $("#randoms").prop("checked")
			? randdex[pokemonName]
			: undefined;
		var regSets = pokemonName in setdex && setName in setdex[pokemonName];
		if (randset) {
			var listItems = randdex[pokemonName].items
				? randdex[pokemonName].items
				: [];
			var listAbilities = randdex[pokemonName].abilities
				? randdex[pokemonName].abilities
				: [];
			if (gen >= 3)
				$(this).closest(".poke-info").find(".ability-pool").show();
			$(this)
				.closest(".poke-info")
				.find(".extraSetAbilities")
				.text(listAbilities.join(", "));
			if (gen >= 2) $(this).closest(".poke-info").find(".item-pool").show();
			$(this)
				.closest(".poke-info")
				.find(".extraSetItems")
				.text(listItems.join(", "));
			if (gen >= 9) {
				$(this).closest(".poke-info").find(".role-pool").show();
				$(this).closest(".poke-info").find(".tera-type-pool").show();
			}
			var listRoles = randdex[pokemonName].roles
				? Object.keys(randdex[pokemonName].roles)
				: [];
			$(this)
				.closest(".poke-info")
				.find(".extraSetRoles")
				.text(listRoles.join(", "));
			var listTeraTypes = [];
			if (randdex[pokemonName].roles) {
				for (var roleName in randdex[pokemonName].roles) {
					var role = randdex[pokemonName].roles[roleName];
					for (var q = 0; q < role.teraTypes.length; q++) {
						if (listTeraTypes.indexOf(role.teraTypes[q]) === -1) {
							listTeraTypes.push(role.teraTypes[q]);
						}
					}
				}
			}
			pokeObj.find(".teraType").val(listTeraTypes[0] || pokemon.types[0]);
			$(this)
				.closest(".poke-info")
				.find(".extraSetTeraTypes")
				.text(listTeraTypes.join(", "));
		} else {
			$(this).closest(".poke-info").find(".ability-pool").hide();
			$(this).closest(".poke-info").find(".item-pool").hide();
			$(this).closest(".poke-info").find(".role-pool").hide();
			$(this).closest(".poke-info").find(".tera-type-pool").hide();
		}
		if (regSets || randset) {
			var set = regSets
				? correctHiddenPower(setdex[pokemonName][setName])
				: randset;
			if (regSets) {
				pokeObj.find(".teraType").val(set.teraType || pokemon.types[0]);
			}
			pokeObj.find(".level").val(set.level);
			pokeObj
				.find(".hp .evs")
				.val(set.evs && set.evs.hp !== undefined ? set.evs.hp : 0);
			pokeObj
				.find(".hp .ivs")
				.val(set.ivs && set.ivs.hp !== undefined ? set.ivs.hp : 31);
			pokeObj
				.find(".hp .dvs")
				.val(set.dvs && set.dvs.hp !== undefined ? set.dvs.hp : 15);
			for (i = 0; i < LEGACY_STATS[gen].length; i++) {
				pokeObj
					.find("." + LEGACY_STATS[gen][i] + " .evs")
					.val(
						set.evs && set.evs[LEGACY_STATS[gen][i]] !== undefined
							? set.evs[LEGACY_STATS[gen][i]]
							: $("#randoms").prop("checked")
							? 84
							: 0
					);
				pokeObj
					.find("." + LEGACY_STATS[gen][i] + " .ivs")
					.val(
						set.ivs && set.ivs[LEGACY_STATS[gen][i]] !== undefined
							? set.ivs[LEGACY_STATS[gen][i]]
							: 31
					);
				pokeObj
					.find("." + LEGACY_STATS[gen][i] + " .dvs")
					.val(
						set.dvs && set.dvs[LEGACY_STATS[gen][i]] !== undefined
							? set.dvs[LEGACY_STATS[gen][i]]
							: 15
					);
			}
			setSelectValueIfValid(pokeObj.find(".nature"), set.nature, "Hardy");
			var abilityFallback =
				typeof pokemon.abilities !== "undefined"
					? pokemon.abilities[0]
					: "";
			if ($("#randoms").prop("checked")) {
				setSelectValueIfValid(
					abilityObj,
					randset.abilities && randset.abilities[0],
					abilityFallback
				);
				setSelectValueIfValid(
					itemObj,
					randset.items && randset.items[0],
					""
				);
			} else {
				setSelectValueIfValid(abilityObj, set.ability, abilityFallback);
				setSelectValueIfValid(itemObj, set.item, "");
			}
			var setMoves = set.moves;
			if (randset) {
				if (gen < 9) {
					setMoves = randset.moves;
				} else {
					setMoves = [];
					for (var role in randset.roles) {
						for (var q = 0; q < randset.roles[role].moves.length; q++) {
							var moveName = randset.roles[role].moves[q];
							if (setMoves.indexOf(moveName) === -1)
								setMoves.push(moveName);
						}
					}
				}
			}
			var moves = selectMovesFromRandomOptions(setMoves);
			for (i = 0; i < 4; i++) {
				moveObj = pokeObj.find(".move" + (i + 1) + " select.move-selector");
				moveObj.attr("data-prev", moveObj.val());
				setSelectValueIfValid(moveObj, moves[i], "(No Move)");
				moveObj.change();
			}
			if (randset) {
				$(this).closest(".poke-info").find(".move-pool").show();
				$(this)
					.closest(".poke-info")
					.find(".extraSetMoves")
					.html(formatMovePool(setMoves));
			}
		} else {
			pokeObj.find(".teraType").val(pokemon.types[0]);
			pokeObj.find(".level").val(100);
			pokeObj.find(".hp .evs").val(0);
			pokeObj.find(".hp .ivs").val(31);
			pokeObj.find(".hp .dvs").val(15);
			for (i = 0; i < LEGACY_STATS[gen].length; i++) {
				pokeObj.find("." + LEGACY_STATS[gen][i] + " .evs").val(0);
				pokeObj.find("." + LEGACY_STATS[gen][i] + " .ivs").val(31);
				pokeObj.find("." + LEGACY_STATS[gen][i] + " .dvs").val(15);
			}
			pokeObj.find(".nature").val("Hardy");
			setSelectValueIfValid(abilityObj, pokemon.ab, "");
			itemObj.val("");
			for (i = 0; i < 4; i++) {
				moveObj = pokeObj.find(".move" + (i + 1) + " select.move-selector");
				moveObj.attr("data-prev", moveObj.val());
				moveObj.val("(No Move)");
				moveObj.change();
			}
			if ($("#randoms").prop("checked")) {
				$(this).closest(".poke-info").find(".move-pool").hide();
			}
		}
		if (typeof getSelectedTiers === "function") {
			// doesn't exist when in 1vs1 mode
			var format = getSelectedTiers()[0];
			var is50lvl =
				startsWith(format, "VGC") || startsWith(format, "Battle Spot");
			//var isDoubles = format === 'Doubles' || has50lvl; *TODO*
			if (format === "LC") pokeObj.find(".level").val(5);
			if (is50lvl) pokeObj.find(".level").val(50);
			//if (isDoubles) field.gameType = 'Doubles'; *TODO*
		}
		// var formeObj = $(this).siblings().find(".forme").parent();
		var formeObj = $(this).parent().siblings().find(".formeLabel")
		itemObj.prop("disabled", false);
		var baseForme;
		if (pokemon.baseSpecies && pokemon.baseSpecies !== pokemon.name) {
			baseForme = pokedex[pokemon.baseSpecies];
		}
		if (pokemon.otherFormes) {
			showFormes(formeObj, pokemonName, pokemon, pokemonName);
		} else if (baseForme && baseForme.otherFormes) {
			showFormes(formeObj, pokemonName, baseForme, pokemon.baseSpecies);
		} else {
			formeObj.hide();
		}
		calcHP(pokeObj);
		calcStats(pokeObj);
		abilityObj.change();
		itemObj.change();
		if (pokemon.gender === "N") {
			pokeObj.find(".gender").parent().hide();
			pokeObj.find(".gender").val("");
		} else {
			// pokeObj.find(".gender").parent().show();
			if (regSets && setdex[pokemonName][setName].gender === "M")
				pokeObj.find(".gender").val("Male");
			if (regSets && setdex[pokemonName][setName].gender === "F")
				pokeObj.find(".gender").val("Female");
		}
		window.NO_CALC = false;
	}

	if ($(this).hasClass("opposing") && game != "None" && flags) {
		var ai = 7;
		for (var i in flags["ai"]) {
			if (flags["ai"][i].includes(window.CURRENT_TRAINER)) {
				ai = i;
				break;
			}
		}
		if (["Emerald Kaizo", "Emerald Kaizo Kaizo"].includes(game)){
			$("#ai-help").html(`🚩: [${ai}]`);
			$("#ai-help").attr("flag", ai);

			if (ai == 23) {
				var pokemon = createPokemon($("#p2"));
				riskyMoves = [
					"Attract",
					"Counter",
					"Destiny Bond",
					"Focus Punch",
					"Mirror Coat",
					"Sleep Powder",
					"Hypnosis",
					"Lovely Kiss",
					"Spore",
					"Self-Destruct",
					"Explosion",
					"Drill Run",
					"X-Scissors",
					"Cross Chop",
					"Dragon Claw",
					"Confuse Ray",
					"Teeter Dance",
					"Ancient Power",
					"Silver Wind",
				];
				for (var j in pokemon.moves) {
					var move = pokemon.moves[j].name;
					if (riskyMoves.includes(move))
						$(resultLocations[1][j].move + " + label").addClass(
							"risky-ai-move"
						);
					else
						$(resultLocations[1][j].move + " + label").removeClass(
							"risky-ai-move"
						);
				}
			} else {
				for (var j in resultLocations[1])
					$(resultLocations[1][j].move + " + label").removeClass(
						"risky-ai-move"
					);
			}

			if ($(".risky-ai-move").length) trySendRiskyAlert();
		}
	}
});

function updateTickedHP() {
	playtotal = $(".poke-info").find(".hp .total")[0].textContent;
	optotal = $(".poke-info").find(".hp .total")[1].textContent;

	$("#opposing-fourth")[0].textContent = Math.max(1, Math.trunc(optotal / 4));
	$("#opposing-sixth")[0].textContent = Math.max(1, Math.trunc(optotal / 6));
	$("#opposing-eighth")[0].textContent = Math.max(1, Math.trunc(optotal / 8));
	$("#opposing-sixteenth")[0].textContent = Math.max(1, Math.trunc(optotal / 16));
	$("#player-fourth")[0].textContent = Math.max(1, Math.trunc(playtotal / 4));
	$("#player-sixth")[0].textContent = Math.max(1, Math.trunc(playtotal / 6));
	$("#player-eighth")[0].textContent = Math.max(1, Math.trunc(playtotal / 8));
	$("#player-sixteenth")[0].textContent = Math.max(1, Math.trunc(playtotal / 16));
}

function trySendRiskyAlert() {
	if (!localStorage.sentRiskyAlert) {
		localStorage.sentRiskyAlert = "true";
		alert(
			"This trainer has Risky AI and at least one risky move (marked by italics), and it has a chance to use it instead of the move it would normally use. This alert will only be shown once."
		);
	}
}

function trySendSwitchAlert() {
	if (!localStorage.sentSwitchAlert) {
		localStorage.sentSwitchAlert = "true";
		alert(
			"This Pokémon is faster than yours, and another Pokémon in the party resists at least one move (both the move and the target Pokémon are marked in red). If you use it, there's a chance the enemy trainer switches to that Pokémon. This alert will only be shown once."
		);
	}
}

function formatMovePool(moves) {
	var formatted = [];
	for (var i = 0; i < moves.length; i++) {
		formatted.push(
			isKnownDamagingMove(moves[i]) ? moves[i] : "<i>" + moves[i] + "</i>"
		);
	}
	return formatted.join(", ");
}

function isKnownDamagingMove(move) {
	var m = GENERATION.moves.get(calc.toID(move));
	return m && m.basePower;
}

function selectMovesFromRandomOptions(moves) {
	var selected = [];

	var nonDamaging = [];
	for (var i = 0; i < moves.length; i++) {
		if (isKnownDamagingMove(moves[i])) {
			selected.push(moves[i]);
			if (selected.length >= 4) break;
		} else {
			nonDamaging.push(moves[i]);
		}
	}

	while (selected.length < 4 && nonDamaging.length) {
		selected.push(nonDamaging.pop());
	}

	return selected;
}

function showFormes(formeObj, pokemonName, pokemon, baseFormeName) {
	var formes = pokemon.otherFormes.slice();
	formes.unshift(baseFormeName);

	var defaultForme = formes.indexOf(pokemonName);
	if (defaultForme < 0) defaultForme = 0;

	var formeOptions = getSelectOptions(formes, false, defaultForme);
	formeObj
		.children("select")
		.find("option")
		.remove()
		.end()
		.append(formeOptions)
		.change();
	formeObj.show();
}

function stellarButtonsVisibility(pokeObj, vis) {
	var fullSetName = pokeObj.find("input.set-selector").val();
	var pokemonName = fullSetName.substring(0, fullSetName.indexOf(" ("));
	var moveObjs = [
		pokeObj.find(".move1"),
		pokeObj.find(".move2"),
		pokeObj.find(".move3"),
		pokeObj.find(".move4"),
	];
	if (vis && !startsWith(pokemonName, "Terapagos")) {
		for (var i = 0; i < moveObjs.length; i++) {
			var moveObj = moveObjs[i];
			moveObj.find(".move-stellar").prop("checked", true);
			moveObj.find(".stellar-btn").show();
		}
		return;
	}
	for (var i = 0; i < moveObjs.length; i++) {
		var moveObj = moveObjs[i];
		moveObj.find(".move-stellar").prop("checked", false);
		moveObj.find(".stellar-btn").hide();
	}
}

function setSelectValueIfValid(select, value, fallback) {
	select.val(
		!value
			? fallback
			: select.children("option[value='" + value + "']").length
			? value
			: fallback
	);
}

$(".teraToggle").change(function () {
	var pokeObj = $(this).closest(".poke-info");
	stellarButtonsVisibility(
		pokeObj,
		pokeObj.find(".teraType").val() === "Stellar" && this.checked
	);
	var forme = $(this).parent().siblings().find(".forme");
	var curForme = forme.val();
	if (forme.is(":hidden")) return;
	var container = $(this).closest(".info-group").siblings();
	// Ogerpon mechs
	if (!startsWith(curForme, "Ogerpon")) return;
	if (
		curForme !== "Ogerpon" &&
		!endsWith(curForme, "Tera") &&
		container.find(".item").val() !== curForme.split("-")[1] + " Mask"
	)
		return;
	if (this.checked) {
		var newForme =
			curForme === "Ogerpon" ? "Ogerpon-Teal-Tera" : curForme + "-Tera";
		forme.val(newForme);
		container
			.find(".ability")
			.val("Embody Aspect (" + newForme.split("-")[1] + ")");
		return;
	}
	if (!endsWith(curForme, "Tera")) return;
	var newForme =
		curForme === "Ogerpon-Teal-Tera" ? "Ogerpon" : curForme.slice(0, -5);
	forme.val(newForme);
	container.find(".ability").val(pokedex[newForme].abilities[0]);
});

$(".forme").change(function () {
	var altForme = pokedex[$(this).val()],
		container = $(this).closest(".info-group").siblings(),
		fullSetName = container.find(".select2-chosen").first().text(),
		pokemonName = fullSetName.substring(0, fullSetName.indexOf(" (")),
		setName = fullSetName.substring(
			fullSetName.indexOf("(") + 1,
			fullSetName.lastIndexOf(")")
		);
	var xy = $(this).parent().parent().parent().find('.display-sprites').find('img')[0]
	// topPokemonIcon($(this).val(), xy)
	xy.src = getGenSprite($(this).val());
	$(this).parent().siblings().find(".type1").val(altForme.types[0]);
	$(this)
		.parent()
		.siblings()
		.find(".type2")
		.val(altForme.types[1] ? altForme.types[1] : "");
	for (var i = 0; i < LEGACY_STATS[9].length; i++) {
		var baseStat = container.find("." + LEGACY_STATS[9][i]).find(".base");
		baseStat.val(altForme.bs[LEGACY_STATS[9][i]]);
		baseStat.keyup();
	}
	if (
		(startsWith($(this).val(), "Ogerpon") &&
			endsWith($(this).val(), "Tera")) ||
		$(this).val() === "Terapagos-Stellar"
	) {
		$(this).parent().siblings().find(".teraToggle").prop("checked", true);
	}
	var isRandoms = $("#randoms").prop("checked");
	var pokemonSets = isRandoms ? randdex[pokemonName] : setdex[pokemonName];
	var chosenSet = pokemonSets && pokemonSets[setName];
	var greninjaSet = $(this).val().indexOf("Greninja") !== -1;
	var isAltForme = $(this).val() !== pokemonName;
	if (
		isAltForme &&
		abilities.indexOf(altForme.abilities[0]) !== -1 &&
		!greninjaSet
	) {
		container.find(".ability").val(altForme.abilities[0]);
	} else if (greninjaSet) {
		$(this).parent().find(".ability");
	} else if (chosenSet) {
		if (!isRandoms) {
			container.find(".abilities").val(chosenSet.ability);
		} else {
			container.find(".ability").val(chosenSet.abilities[0]);
		}
	}
	var forcedTeraType = getForcedTeraType($(this).val());
	if (forcedTeraType) {
		$(this).parent().siblings().find(".teraType").val(forcedTeraType);
	}
	container.find(".ability").keyup();
	if (
		startsWith($(this).val(), "Ogerpon-") &&
		!startsWith($(this).val(), "Ogerpon-Teal")
	) {
		container
			.find(".item")
			.val($(this).val().split("-")[1] + " Mask")
			.keyup();
	} else {
		container.find(".item").prop("disabled", false);
	}
});

function correctHiddenPower(pokemon) {
	if (["Emerald Kaizo", "Emerald Kaizo Kaizo"].includes(game)) return pokemon;
	// After Gen 7 bottlecaps means you can have a HP without perfect IVs
	// Level 100 is elided from sets so if its undefined its level 100
	if (gen >= 7 && (!pokemon.level || pokemon.level >= 100)) return pokemon;

	// Convert the legacy stats table to a useful one, and also figure out if all are maxed
	var ivs = {};
	var maxed = true;
	for (var i = 0; i <= LEGACY_STATS[9].length; i++) {
		var s = LEGACY_STATS[9][i];
		var iv = (ivs[legacyStatToStat(s)] =
			(pokemon.ivs && pokemon.ivs[s]) || 31);
		if (iv !== 31) maxed = false;
	}

	var expected = calc.Stats.getHiddenPower(GENERATION, ivs);
	for (var i = 0; i < pokemon.moves.length; i++) {
		var m = pokemon.moves[i].match(HIDDEN_POWER_REGEX);
		if (!m) continue;
		if (game != "None") {
			pokemon.moves[i] = "Hidden Power " + expected.type;
			continue;
		}
		// The Pokemon has Hidden Power and is not maxed but the types don't match we don't
		// want to attempt to reconcile the user's IVs so instead just correct the HP type
		if (!maxed && expected.type !== m[1]) {
			pokemon.moves[i] = "Hidden Power " + expected.type;
		} else {
			// Otherwise, use the default preset hidden power IVs that PS would use
			var hpIVs = calc.Stats.getHiddenPowerIVs(GENERATION, m[1]);
			if (!hpIVs) continue; // some impossible type was specified, ignore
			pokemon.ivs = pokemon.ivs || {
				hp: 31,
				at: 31,
				df: 31,
				sa: 31,
				sd: 31,
				sp: 31,
			};
			pokemon.dvs = pokemon.dvs || {
				hp: 15,
				at: 15,
				df: 15,
				sa: 15,
				sd: 15,
				sp: 15,
			};
			for (var stat in hpIVs) {
				pokemon.ivs[calc.Stats.shortForm(stat)] = hpIVs[stat];
				pokemon.dvs[calc.Stats.shortForm(stat)] = calc.Stats.IVToDV(
					hpIVs[stat]
				);
			}
			if (gen < 3) {
				pokemon.dvs.hp = calc.Stats.getHPDV({
					atk: pokemon.ivs.at || 31,
					def: pokemon.ivs.df || 31,
					spe: pokemon.ivs.sp || 31,
					spc: pokemon.ivs.sa || 31,
				});
				pokemon.ivs.hp = calc.Stats.DVToIV(pokemon.dvs.hp);
			}
		}
	}
	return pokemon;
}

function createPokemon(pokeInfo) {
	if (typeof pokeInfo === "string") {
		// in this case, pokeInfo is the id of an individual setOptions value whose moveset's tier matches the selected tier(s)
		var name = pokeInfo.substring(0, pokeInfo.indexOf(" ("));
		var setName = pokeInfo.substring(
			pokeInfo.indexOf("(") + 1,
			pokeInfo.lastIndexOf(")")
		);
		var isRandoms = $("#randoms").prop("checked");
		var set = isRandoms ? randdex[name] : setdex[name][setName];

		var ivs = {};
		var evs = {};
		for (var i = 0; i < LEGACY_STATS[gen].length; i++) {
			var legacyStat = LEGACY_STATS[gen][i];
			var stat = legacyStatToStat(legacyStat);

			ivs[stat] =
				gen >= 3 && set.ivs && typeof set.ivs[legacyStat] !== "undefined"
					? set.ivs[legacyStat]
					: 31;
			evs[stat] =
				set.evs && typeof set.evs[legacyStat] !== "undefined"
					? set.evs[legacyStat]
					: 0;
		}
		var moveNames = set.moves;
		if (
			isRandoms &&
			(gen >= 9 ||
				gen === 7 ||
				gen === 6 ||
				gen === 5 ||
				gen === 4 ||
				gen === 3)
		) {
			moveNames = [];
			for (var role in set.roles) {
				for (var q = 0; q < set.roles[role].moves.length; q++) {
					var moveName = set.roles[role].moves[q];
					if (moveNames.indexOf(moveName) === -1) moveNames.push(moveName);
				}
			}
		}

		var pokemonMoves = [];
		for (var i = 0; i < 4; i++) {
			var moveName = moveNames[i];
			var isCrit = $(".move-crit")[i].checked;
			pokemonMoves.push(
				new calc.Move(gen, moves[moveName] ? moveName : "(No Move)", {
					ability: ability,
					item: item,
					isCrit: isCrit,
				})
			);
		}

		if (isRandoms) {
			pokemonMoves = pokemonMoves.filter(function (move) {
				return move.category !== "Status";
			});
		}

		var overrides = {};
		if (pokedex[name]) {
			var dexPokemon = pokedex[name];
			overrides = {
				baseStats: {
					hp: dexPokemon.bs.hp,
					atk: dexPokemon.bs.at,
					def: dexPokemon.bs.df,
					spa: dexPokemon.bs.sa,
					spd: dexPokemon.bs.sd,
					spe: dexPokemon.bs.sp,
				},
			};
		}
		return new calc.Pokemon(gen, name, {
			level: set.level,
			ability: set.ability,
			abilityOn: true,
			item:
				set.item &&
				typeof set.item !== "undefined" &&
				(set.item === "Eviolite" || set.item.indexOf("ite") < 0)
					? set.item
					: "",
			nature: set.nature,
			ivs: ivs,
			evs: evs,
			moves: pokemonMoves,
			overrides: overrides,
		});
	} else {
		var setName = pokeInfo.find("input.set-selector").val();
		var name;
		if (setName.indexOf("(") === -1) {
			name = setName;
		} else {
			var pokemonName = setName.substring(0, setName.indexOf(" ("));
			var species = pokedex[pokemonName];
			name =
				species.otherFormes ||
				(species.baseSpecies && species.baseSpecies !== pokemonName)
					? pokeInfo.find(".forme").val()
					: pokemonName;
		}

		var baseStats = {};
		var ivs = {};
		var evs = {};
		var boosts = {};
		for (var i = 0; i < LEGACY_STATS[gen].length; i++) {
			var stat = legacyStatToStat(LEGACY_STATS[gen][i]);
			baseStats[stat === "spc" ? "spa" : stat] = ~~pokeInfo
				.find("." + LEGACY_STATS[gen][i] + " .base")
				.val();
			ivs[stat] =
				gen > 2
					? ~~pokeInfo.find("." + LEGACY_STATS[gen][i] + " .ivs").val()
					: ~~pokeInfo.find("." + LEGACY_STATS[gen][i] + " .dvs").val() *
							2 +
					  1;
			evs[stat] = ~~pokeInfo
				.find("." + LEGACY_STATS[gen][i] + " .evs")
				.val();
			boosts[stat] = ~~pokeInfo
				.find("." + LEGACY_STATS[gen][i] + " .boost")
				.val();
		}
		if (gen === 1) baseStats.spd = baseStats.spa;

		var ability = pokeInfo.find(".ability").val();
		var item = pokeInfo.find(".item").val();
		var isDynamaxed = pokeInfo.find(".max").prop("checked");
		var teraType = pokeInfo.find(".teraToggle").is(":checked")
			? pokeInfo.find(".teraType").val()
			: undefined;
		pokeInfo.isDynamaxed = isDynamaxed;
		calcHP(pokeInfo);
		var curHP = ~~pokeInfo.find(".current-hp").val();
		// FIXME the Pokemon constructor expects non-dynamaxed HP
		if (isDynamaxed) curHP = Math.floor(curHP / 2);
		var types = [
			pokeInfo.find(".type1").val(),
			pokeInfo.find(".type2").val(),
		];
		return new calc.Pokemon(gen, name, {
			level: ~~pokeInfo.find(".level").val(),
			ability: ability,
			abilityOn: pokeInfo.find(".abilityToggle").is(":checked"),
			item: item,
			gender: pokeInfo.find(".gender").is(":visible")
				? getGender(pokeInfo.find(".gender").val())
				: "N",
			nature: pokeInfo.find(".nature").val(),
			ivs: ivs,
			evs: evs,
			isDynamaxed: isDynamaxed,
			isSaltCure: pokeInfo.find(".saltcure").is(":checked"),
			alliesFainted: parseInt(pokeInfo.find(".alliesFainted").val()),
			boostedStat: pokeInfo.find(".boostedStat").val() || undefined,
			teraType: teraType,
			boosts: boosts,
			curHP: curHP,
			status: CALC_STATUS[pokeInfo.find(".status").val()],
			toxicCounter:
				status === "Badly Poisoned"
					? ~~pokeInfo.find(".toxic-counter").val()
					: 0,
			moves: [
				getMoveDetails(
					pokeInfo.find(".move1"),
					name,
					ability,
					item,
					isDynamaxed
				),
				getMoveDetails(
					pokeInfo.find(".move2"),
					name,
					ability,
					item,
					isDynamaxed
				),
				getMoveDetails(
					pokeInfo.find(".move3"),
					name,
					ability,
					item,
					isDynamaxed
				),
				getMoveDetails(
					pokeInfo.find(".move4"),
					name,
					ability,
					item,
					isDynamaxed
				),
			],
			overrides: {
				baseStats: baseStats,
				types: types,
			},
		});
	}
}

function getGender(gender) {
	if (!gender || gender === "genderless" || gender === "N") return "N";
	if (gender.toLowerCase() === "male" || gender === "M") return "M";
	return "F";
}

function getMoveDetails(moveInfo, species, ability, item, useMax) {
	var moveName = moveInfo.find("select.move-selector").val();
	var isZMove = gen > 6 && moveInfo.find("input.move-z").prop("checked");
	let pwhich = moveInfo.parents()[1].id
	if(pwhich == 'p1'){
		var isCrit = $("#critL").prop("checked");
		$("#critL").closest('.move-result-subgroup').toggleClass("critPanel", isCrit)
	}
	else if(pwhich == 'p2'){
		var isCrit = $("#critR").prop("checked");
		$("#critR").closest('.move-result-subgroup').toggleClass("critPanel", isCrit)
	}
	var isStellarFirstUse = moveInfo.find(".move-stellar").prop("checked");
	var hits = +moveInfo.find(".move-hits").val();
	var timesUsed = +moveInfo.find(".stat-drops").val();
	var timesUsedWithMetronome = moveInfo.find(".metronome").is(":visible")
		? +moveInfo.find(".metronome").val()
		: 1;
	var overrides = {
		basePower: +moveInfo.find(".move-bp").val(),
		type: moveInfo.find(".move-type").val(),
	};
	if (gen >= 4) overrides.category = moveInfo.find(".move-cat").val();
	return new calc.Move(gen, moveName, {
		ability: ability,
		item: item,
		useZ: isZMove,
		species: species,
		isCrit: isCrit,
		hits: hits,
		isStellarFirstUse: isStellarFirstUse,
		timesUsed: timesUsed,
		timesUsedWithMetronome: timesUsedWithMetronome,
		overrides: overrides,
		useMax: useMax,
	});
}

function createField() {
	var gameType = $("input:radio[name='format']:checked").val();
	// FROG
	var doc = document.getElementById("gameSelection")
	game = (doc).options[doc.selectedIndex].text
	var isBeadsOfRuin = $("#beads").prop("checked");
	var isTabletsOfRuin = $("#tablets").prop("checked");
	var isSwordOfRuin = $("#sword").prop("checked");
	var isVesselOfRuin = $("#vessel").prop("checked");
	var isMagicRoom = $("#magicroom").prop("checked");
	var isWonderRoom = $("#wonderroom").prop("checked");
	var isGravity = $("#gravity").prop("checked");
	var isSR = [$("#srL").prop("checked"), $("#srR").prop("checked")];
	var weather;
	var spikes;
	if (gen === 2) {
		spikes = [
			$("#gscSpikesL").prop("checked") ? 1 : 0,
			$("#gscSpikesR").prop("checked") ? 1 : 0,
		];
		weather = $("input:radio[name='gscWeather']:checked").val();
	} else {
		weather = $("input:radio[name='weather']:checked").val();
		spikes = [
			~~$("input:radio[name='spikesL']:checked").val(),
			~~$("input:radio[name='spikesR']:checked").val(),
		];
	}
	var steelsurge = [
		$("#steelsurgeL").prop("checked"),
		$("#steelsurgeR").prop("checked"),
	];
	var vinelash = [
		$("#vinelashL").prop("checked"),
		$("#vinelashR").prop("checked"),
	];
	var wildfire = [
		$("#wildfireL").prop("checked"),
		$("#wildfireR").prop("checked"),
	];
	var cannonade = [
		$("#cannonadeL").prop("checked"),
		$("#cannonadeR").prop("checked"),
	];
	var volcalith = [
		$("#volcalithL").prop("checked"),
		$("#volcalithR").prop("checked"),
	];
	var terrain = $("input:checkbox[name='terrain']:checked").val()
		? $("input:checkbox[name='terrain']:checked").val()
		: "";
	var isReflect = [
		$("#reflectL").prop("checked"),
		$("#reflectR").prop("checked"),
	];
	var isLightScreen = [
		$("#lightScreenL").prop("checked"),
		$("#lightScreenR").prop("checked"),
	];
	var isProtected = [
		$("#protectL").prop("checked"),
		$("#protectR").prop("checked"),
	];
	var isSeeded = [
		$("#leechSeedL").prop("checked"),
		$("#leechSeedR").prop("checked"),
	];
	var isForesight = [
		$("#foresightL").prop("checked"),
		$("#foresightR").prop("checked"),
	];
	var isHelpingHand = [
		$("#helpingHandL").prop("checked"),
		$("#helpingHandR").prop("checked"),
	];
	var isBoulderBadge = [$("#boulderBadge").prop("checked"), false];
	var isThunderBadge = [$("#thunderBadge").prop("checked"), false];
	var isSoulBadge = [$("#soulBadge").prop("checked"), false];
	var isVolcanoBadge = [$("#volcanoBadge").prop("checked"), false];
	var isStoneBadge = [$("#stoneBadge").prop("checked"), false];
	var isDynamoBadge = [$("#dynamoBadge").prop("checked"), false];
	var isBalanceBadge = [$("#balanceBadge").prop("checked"), false];
	var isMindBadge = [$("#mindBadge").prop("checked"), false];
	var isTailwind = [
		$("#tailwindL").prop("checked"),
		$("#tailwindR").prop("checked"),
	];
	var isFlowerGift = [
		$("#flowerGiftL").prop("checked"),
		$("#flowerGiftR").prop("checked"),
	];
	var isFriendGuard = [
		$("#friendGuardL").prop("checked"),
		$("#friendGuardR").prop("checked"),
	];
	var isAuroraVeil = [
		$("#auroraVeilL").prop("checked"),
		$("#auroraVeilR").prop("checked"),
	];
	var isBattery = [
		$("#batteryL").prop("checked"),
		$("#batteryR").prop("checked"),
	];
	var isPowerSpot = [
		$("#powerSpotL").prop("checked"),
		$("#powerSpotR").prop("checked"),
	];
	// TODO: support switching in as well!
	var isSwitchingOut = [
		$("#switchingL").prop("checked"),
		$("#switchingR").prop("checked"),
	];

	var createSide = function (i) {
		return new calc.Side({
			spikes: spikes[i],
			isSR: isSR[i],
			steelsurge: steelsurge[i],
			vinelash: vinelash[i],
			wildfire: wildfire[i],
			cannonade: cannonade[i],
			volcalith: volcalith[i],
			isReflect: isReflect[i],
			isLightScreen: isLightScreen[i],
			isProtected: isProtected[i],
			isSeeded: isSeeded[i],
			isForesight: isForesight[i],
			isTailwind: isTailwind[i],
			isHelpingHand: isHelpingHand[i],
			isBoulderBadge: isBoulderBadge[i],
			isThunderBadge: isThunderBadge[i],
			isSoulBadge: isSoulBadge[i],
			isVolcanoBadge: isVolcanoBadge[i],
			isStoneBadge: isStoneBadge[i],
			isDynamoBadge: isDynamoBadge[i],
			isBalanceBadge: isBalanceBadge[i],
			isMindBadge: isMindBadge[i],
			isFlowerGift: isFlowerGift[i],
			isFriendGuard: isFriendGuard[i],
			isAuroraVeil: isAuroraVeil[i],
			isBattery: isBattery[i],
			isPowerSpot: isPowerSpot[i],
			isSwitching: isSwitchingOut[i] ? "out" : undefined,
		});
	};
	return new calc.Field({
		gameType: gameType,
		weather: weather,
		terrain: terrain,
		isMagicRoom: isMagicRoom,
		isWonderRoom: isWonderRoom,
		isGravity: isGravity,
		isBeadsOfRuin: isBeadsOfRuin,
		isTabletsOfRuin: isTabletsOfRuin,
		isSwordOfRuin: isSwordOfRuin,
		isVesselOfRuin: isVesselOfRuin,
		attackerSide: createSide(0),
		defenderSide: createSide(1),
		game: game,
	});
}

function calcHP(poke) {
	var total = calcStat(poke, "hp");
	var $maxHP = poke.find(".max-hp");

	var prevMaxHP = Number($maxHP.attr("data-prev")) || total;
	var $currentHP = poke.find(".current-hp");
	var prevCurrentHP = $currentHP.attr("data-set")
		? Math.min(Number($currentHP.val()), prevMaxHP)
		: prevMaxHP;
	// NOTE: poke.find(".percent-hp").val() is a rounded value!
	var prevPercentHP = (100 * prevCurrentHP) / prevMaxHP;

	$maxHP.text(total);
	$maxHP.attr("data-prev", total);

	var newCurrentHP = calcCurrentHP(poke, total, prevPercentHP);
	calcPercentHP(poke, total, newCurrentHP);

	$currentHP.attr("data-set", true);
}

function calcStat(poke, StatID) {
	var stat = poke.find("." + StatID);
	var base = ~~stat.find(".base").val();
	var level = ~~poke.find(".level").val();
	var nature, ivs, evs;
	if (gen < 3) {
		ivs = ~~stat.find(".dvs").val() * 2;
		evs = 252;
	} else {
		ivs = ~~stat.find(".ivs").val();
		evs = ~~stat.find(".evs").val();
		if (StatID !== "hp") nature = poke.find(".nature").val();
	}
	// Shedinja still has 1 max HP during the effect even if its Dynamax Level is maxed (DaWoblefet)
	var total = calc.calcStat(
		gen,
		legacyStatToStat(StatID),
		base,
		ivs,
		evs,
		level,
		nature
	);
	if (gen > 7 && StatID === "hp" && poke.isDynamaxed && total !== 1) {
		total *= 2;
	}
	stat.find(".total").text(total);
	return total;
}

var GENERATION = {
	1: 1,
	rb: 1,
	rby: 1,
	2: 2,
	gs: 2,
	gsc: 2,
	3: 3,
	rs: 3,
	rse: 3,
	frlg: 3,
	adv: 3,
	4: 4,
	dp: 4,
	dpp: 4,
	hgss: 4,
	5: 5,
	bw: 5,
	bw2: 5,
	b2w2: 5,
	6: 6,
	xy: 6,
	oras: 6,
	7: 7,
	sm: 7,
	usm: 7,
	usum: 7,
	8: 8,
	ss: 8,
	9: 9,
	sv: 9,
};

var SETDEX = [
	{},
	typeof SETDEX_RBY === "undefined" ? {} : SETDEX_RBY,
	typeof SETDEX_GSC === "undefined" ? {} : SETDEX_GSC,
	typeof SETDEX_ADV === "undefined" ? {} : SETDEX_ADV,
	typeof SETDEX_DPP === "undefined" ? {} : SETDEX_DPP,
	typeof SETDEX_BW === "undefined" ? {} : SETDEX_BW,
	typeof SETDEX_XY === "undefined" ? {} : SETDEX_XY,
	typeof SETDEX_SM === "undefined" ? {} : SETDEX_SM,
	typeof SETDEX_SS === "undefined" ? {} : SETDEX_SS,
	typeof SETDEX_SV === "undefined" ? {} : SETDEX_SV,
];
var RANDDEX = [
	{},
	typeof GEN1RANDOMBATTLE === "undefined" ? {} : GEN1RANDOMBATTLE,
	typeof GEN2RANDOMBATTLE === "undefined" ? {} : GEN2RANDOMBATTLE,
	typeof GEN3RANDOMBATTLE === "undefined" ? {} : GEN3RANDOMBATTLE,
	typeof GEN4RANDOMBATTLE === "undefined" ? {} : GEN4RANDOMBATTLE,
	typeof GEN5RANDOMBATTLE === "undefined" ? {} : GEN5RANDOMBATTLE,
	typeof GEN6RANDOMBATTLE === "undefined" ? {} : GEN6RANDOMBATTLE,
	typeof GEN7RANDOMBATTLE === "undefined" ? {} : GEN7RANDOMBATTLE,
	typeof GEN8RANDOMBATTLE === "undefined" ? {} : GEN8RANDOMBATTLE,
	typeof GEN9RANDOMBATTLE === "undefined" ? {} : GEN9RANDOMBATTLE,
];
var gen,
	genWasChanged,
	notation,
	pokedex,
	setdex,
	partyOrder,
	trainerNames,
	trainerSprites,
	flags,
	randdex,
	typeChart,
	moves,
	abilities,
	items,
	calcHP,
	calcStat,
	GENERATION, spriteGeneration;
var DEFAULTGEN = 9;
$(".gen").change(function () {
	/*eslint-disable */
	gen = ~~$(this).val() || DEFAULTGEN;
	GENERATION = calc.Generations.get(gen);
	var params = new URLSearchParams(window.location.search);
	if (gen === DEFAULTGEN) {
		params.delete("gen");
		params = "" + params;
		if (window.history && window.history.replaceState) {
			window.history.replaceState(
				{},
				document.title,
				window.location.pathname + (params.length ? "?" + params : "")
			);
		}
	} else {
		params.set("gen", gen);
		if (window.history && window.history.pushState) {
			params.sort();
			var path = window.location.pathname + "?" + params;
			window.history.pushState({}, document.title, path);
		}
	}
	genWasChanged = true;
	/* eslint-enable */
	// declaring these variables with var here makes z moves not work; TODO
	pokedex = calc.SPECIES[gen];
	setdex = SETDEX[9];
	randdex = RANDDEX[gen];
	typeChart = calc.TYPE_CHART[gen];
	moves = calc.MOVES[gen];
	items = calc.ITEMS[gen];
	abilities = calc.ABILITIES[gen];
	clearField();
	$("#importedSets").prop("checked", false);
	loadDefaultLists();
	$(".gen-specific.g" + gen).show();
	$(".gen-specific")
		.not(".g" + gen)
		.hide();
	$(".game-specific").hide();
	$(".hide-from-games").show();
	var typeOptions = getSelectOptions(Object.keys(typeChart));
	$("select.type1, select.move-type")
		.find("option")
		.remove()
		.end()
		.append(typeOptions);
	$("select.teraType")
		.find("option")
		.remove()
		.end()
		.append(getSelectOptions(Object.keys(typeChart).slice(1)));
	$("select.type2")
		.find("option")
		.remove()
		.end()
		.append('<option value="">(none)</option>' + typeOptions);
	var moveOptions = getSelectOptions(Object.keys(moves), true);
	$("select.move-selector").find("option").remove().end().append(moveOptions);
	var abilityOptions = getSelectOptions(abilities, true);
	$("select.ability")
		.find("option")
		.remove()
		.end()
		.append('<option value="">(other)</option>' + abilityOptions);
	var itemOptions = getSelectOptions(items, true);
	$("select.item")
		.find("option")
		.remove()
		.end()
		.append('<option value="">(none)</option>' + itemOptions);

	updateGameOptions();

	$(".set-selector").val(getFirstValidSetOption().id);
	$(".set-selector").change();
});

function getFirstValidSetOption() {
	var sets = getSetOptions();
	// NB: The first set is never valid, so we start searching after it.
	for (var i = 1; i < sets.length; i++) {
		if (sets[i].id && sets[i].id.indexOf("(Blank Set)") === -1) {
			return sets[i];
		}
	}
	return undefined;
}

$(".notation").change(function () {
	notation = $(this).val();
});

function clearField() {
	$("#singles-format").prop("checked", true);
	$("#clear").prop("checked", true);
	$("#gscClear").prop("checked", true);
	$("#gravity").prop("checked", false);
	$("#srL").prop("checked", false);
	$("#srR").prop("checked", false);
	$("#spikesL0").prop("checked", true);
	$("#spikesR0").prop("checked", true);
	$("#gscSpikesL").prop("checked", false);
	$("#gscSpikesR").prop("checked", false);
	$("#steelsurgeL").prop("checked", false);
	$("#steelsurgeR").prop("checked", false);
	$("#vinelashL").prop("checked", false);
	$("#vinelashR").prop("checked", false);
	$("#wildfireL").prop("checked", false);
	$("#wildfireR").prop("checked", false);
	$("#cannonadeL").prop("checked", false);
	$("#cannonadeR").prop("checked", false);
	$("#volcalithL").prop("checked", false);
	$("#volcalithR").prop("checked", false);
	$("#reflectL").prop("checked", false);
	$("#reflectR").prop("checked", false);
	$("#lightScreenL").prop("checked", false);
	$("#lightScreenR").prop("checked", false);
	$("#protectL").prop("checked", false);
	$("#protectR").prop("checked", false);
	$("#leechSeedL").prop("checked", false);
	$("#leechSeedR").prop("checked", false);
	$("#foresightL").prop("checked", false);
	$("#foresightR").prop("checked", false);
	$("#helpingHandL").prop("checked", false);
	$("#helpingHandR").prop("checked", false);
	$("#tailwindL").prop("checked", false);
	$("#tailwindR").prop("checked", false);
	$("#friendGuardL").prop("checked", false);
	$("#friendGuardR").prop("checked", false);
	$("#auroraVeilL").prop("checked", false);
	$("#auroraVeilR").prop("checked", false);
	$("#batteryL").prop("checked", false);
	$("#batteryR").prop("checked", false);
	$("#switchingL").prop("checked", false);
	$("#switchingR").prop("checked", false);
	$("input:checkbox[name='terrain']").prop("checked", false);
}

function getSetOptions(sets) {
	var setsHolder = sets;
	if (setsHolder === undefined) {
		setsHolder = pokedex;
	}
	var pokeNames = Object.keys(setsHolder);
	pokeNames.sort();
	var setOptions = [];
	for (var i = 0; i < pokeNames.length; i++) {
		var pokeName = pokeNames[i];
		setOptions.push({
			pokemon: pokeName,
			text: pokeName
		});
		if ($("#randoms").prop("checked")) {
			if (pokeName in randdex) {
				setOptions.push({
					pokemon: pokeName,
					set: 'Randoms Set',
					text: pokeName + " (Randoms)",
					id: pokeName + " (Randoms)"
				});
			}
		} else {
			if (pokeName in setdex) {
				var setNames = partyOrder ? Object.keys(setdex[pokeName]).sort((a, b) => {
					return Object.keys(partyOrder).includes(b.split(" (")[0]) ? Object.keys(partyOrder).indexOf(a.split(" (")[0]) - Object.keys(partyOrder).indexOf(b.split(" (")[0]) : -1;
				}) : Object.keys(setdex[pokeName]);
				for (var j = 0; j < setNames.length; j++) {
					var setName = setNames[j];
					setOptions.push({
						pokemon: pokeName,
						set: setName,
						text: pokeName + " (" + setName + ")",
						id: pokeName + " (" + setName + ")",
						isCustom: setdex[pokeName][setName].isCustomSet,
						nickname: setdex[pokeName][setName].nickname || ""
					});
				}
			}
			setOptions.push({
				pokemon: pokeName,
				set: "Blank Set",
				text: pokeName + " (Blank Set)",
				id: pokeName + " (Blank Set)"
			});
		}
	}
	return setOptions;
}

function getSelectOptions(arr, sort, defaultOption) {
	if (sort) {
		arr.sort();
	}
	var r = "";
	for (var i = 0; i < arr.length; i++) {
		r +=
			'<option value="' +
			arr[i] +
			'" ' +
			(defaultOption === i ? "selected" : "") +
			">" +
			arr[i] +
			"</option>";
	}
	return r;
}
var stickyMoves = (function () {
	var lastClicked = "resultMoveL1";
	$(".result-move").click(function () {
		if (this.id === lastClicked) {
			$(this).toggleClass("locked-move");
		} else {
			$(".locked-move").removeClass("locked-move");
		}
		lastClicked = this.id;
	});

	return {
		clearStickyMove: function () {
			lastClicked = null;
			$(".locked-move").removeClass("locked-move");
		},
		setSelectedMove: function (slot) {
			lastClicked = slot;
		},
		getSelectedSide: function () {
			if (lastClicked) {
				if (lastClicked.indexOf("resultMoveL") !== -1) {
					return "p1";
				} else if (lastClicked.indexOf("resultMoveR") !== -1) {
					return "p2";
				}
			}
			return null;
		},
	};
})();

function isPokeInfoGrounded(pokeInfo) {
	var teraType = pokeInfo.find(".teraToggle").is(":checked")
		? pokeInfo.find(".teraType").val()
		: undefined;
	return (
		$("#gravity").prop("checked") ||
		(teraType
			? teraType !== "Flying"
			: pokeInfo.find(".type1").val() !== "Flying" && teraType
			? teraType !== "Flying"
			: pokeInfo.find(".type2").val() !== "Flying" &&
			  pokeInfo.find(".ability").val() !== "Levitate" &&
			  pokeInfo.find(".item").val() !== "Air Balloon")
	);
}

function getTerrainEffects() {
	var className = $(this).prop("className");
	className = className.substring(0, className.indexOf(" "));
	switch (className) {
		case "type1":
		case "type2":
		case "teraType":
		case "teraToggle":
		case "item":
			var id = $(this).closest(".poke-info").prop("id");
			var terrainValue = $("input:checkbox[name='terrain']:checked").val();
			if (terrainValue === "Electric") {
				$("#" + id)
					.find("[value='Asleep']")
					.prop("disabled", isPokeInfoGrounded($("#" + id)));
			} else if (terrainValue === "Misty") {
				$("#" + id)
					.find(".status")
					.prop("disabled", isPokeInfoGrounded($("#" + id)));
			}
			break;
		case "ability":
			// with autoset, ability change may cause terrain change, need to consider both sides
			var terrainValue = $("input:checkbox[name='terrain']:checked").val();
			if (terrainValue === "Electric") {
				$("#p1").find(".status").prop("disabled", false);
				$("#p2").find(".status").prop("disabled", false);
				$("#p1")
					.find("[value='Asleep']")
					.prop("disabled", isPokeInfoGrounded($("#p1")));
				$("#p2")
					.find("[value='Asleep']")
					.prop("disabled", isPokeInfoGrounded($("#p2")));
			} else if (terrainValue === "Misty") {
				$("#p1")
					.find(".status")
					.prop("disabled", isPokeInfoGrounded($("#p1")));
				$("#p2")
					.find(".status")
					.prop("disabled", isPokeInfoGrounded($("#p2")));
			} else {
				$("#p1").find("[value='Asleep']").prop("disabled", false);
				$("#p1").find(".status").prop("disabled", false);
				$("#p2").find("[value='Asleep']").prop("disabled", false);
				$("#p2").find(".status").prop("disabled", false);
			}
			break;
		default:
			$("input:checkbox[name='terrain']").not(this).prop("checked", false);
			if ($(this).prop("checked") && $(this).val() === "Electric") {
				// need to enable status because it may be disabled by Misty Terrain before.
				$("#p1").find(".status").prop("disabled", false);
				$("#p2").find(".status").prop("disabled", false);
				$("#p1")
					.find("[value='Asleep']")
					.prop("disabled", isPokeInfoGrounded($("#p1")));
				$("#p2")
					.find("[value='Asleep']")
					.prop("disabled", isPokeInfoGrounded($("#p2")));
			} else if ($(this).prop("checked") && $(this).val() === "Misty") {
				$("#p1")
					.find(".status")
					.prop("disabled", isPokeInfoGrounded($("#p1")));
				$("#p2")
					.find(".status")
					.prop("disabled", isPokeInfoGrounded($("#p2")));
			} else {
				$("#p1").find("[value='Asleep']").prop("disabled", false);
				$("#p1").find(".status").prop("disabled", false);
				$("#p2").find("[value='Asleep']").prop("disabled", false);
				$("#p2").find(".status").prop("disabled", false);
			}
			break;
	}
}

function loadDefaultLists() {
	$(".set-selector").select2({
		formatResult: function (object) {
			if ($("#randoms").prop("checked")) {
				return object.pokemon;
			} else {
				// return object.text;
				return object.set
					? "&nbsp;&nbsp;&nbsp;" + object.text
					: "<b>" + object.text + "</b>";
			}
		},
		query: function (query) {
			var pageSize = 30;
			var results = [];
			var options = getSetOptions();
			for (var i = 0; i < options.length; i++) {
				var option = options[i];
				// var pokeName = option.pokemon.toUpperCase();
				var fullName = option.text.toUpperCase();
				if (
					!query.term ||
					query.term
						.toUpperCase()
						.split(" ")
						.every(function (term) {
							// return pokeName.indexOf(term) === 0 || pokeName.indexOf("-" + term) >= 0;
							return (
								fullName.indexOf(term) === 0 ||
								fullName.indexOf("-" + term) >= 0 ||
								fullName.indexOf(" " + term) >= 0 ||
								fullName.indexOf("(" + term) >= 0
							);
							// return fullName.indexOf(term) === 0 || fullName.indexOf("-" + term) >= 0 || fullName.indexOf("(" + term) >= 0;
						})
				) {
					if ($("#randoms").prop("checked")) {
						if (option.id) results.push(option);
					} else {
						results.push(option);
					}
				}
			}
			query.callback({
				results: results.slice(
					(query.page - 1) * pageSize,
					query.page * pageSize
				),
				more: results.length >= query.page * pageSize,
			});
		},
		initSelection: function (element, callback) {
			callback(getFirstValidSetOption());
		},
	});
}

function allPokemon(selector) {
	var allSelector = "";
	for (var i = 0; i < $(".poke-info").length; i++) {
		if (i > 0) {
			allSelector += ", ";
		}
		allSelector += "#p" + (i + 1) + " " + selector;
	}
	return allSelector;
}

function loadCustomList(id) {
	$("#" + id + " .set-selector").select2({
		formatResult: function (set) {
			return set.nickname ? set.pokemon + " (" + set.nickname + ")" : set.id;
		},
		query: function (query) {
			var pageSize = 30;
			var results = [];
			var options = getSetOptions();
			for (var i = 0; i < options.length; i++) {
				var option = options[i];
				var pokeName = option.pokemon.toUpperCase();
				var setName = option.set ? option.set.toUpperCase() : option.set;
				if (
					option.isCustom &&
					option.set &&
					(!query.term ||
						query.term
							.toUpperCase()
							.split(" ")
							.every(function (term) {
								return (
									pokeName.indexOf(term) === 0 ||
									pokeName.indexOf("-" + term) >= 0 ||
									pokeName.indexOf(" " + term) >= 0 ||
									setName.indexOf(term) === 0 ||
									setName.indexOf("-" + term) >= 0 ||
									setName.indexOf(" " + term) >= 0
								);
							}))
				) {
					results.push(option);
				}
			}
			query.callback({
				results: results.slice(
					(query.page - 1) * pageSize,
					query.page * pageSize
				),
				more: results.length >= query.page * pageSize,
			});
		},
		initSelection: function (element, callback) {
			var data = "";
			callback(data);
		},
	});
}

function getTrainerNames() {
	var allPokemon = [];
	switch (game) {
		case "R/B":
			allPokemon = CUSTOMSETDEX_RB;
			break;
		case "Yellow":
			allPokemon = CUSTOMSETDEX_Y;
			break;
		case "G/S":
			allPokemon = CUSTOMSETDEX_GS;
			break;
		case "Crystal":
			allPokemon = CUSTOMSETDEX_C;
			break;
		case "R/S":
			allPokemon = CUSTOMSETDEX_RS;
			break;
		case "Emerald":
			allPokemon = CUSTOMSETDEX_E;
			break;
		case "FR/LG":
			allPokemon = CUSTOMSETDEX_FRLG;
			break;
		case "D/P":
			allPokemon = CUSTOMSETDEX_DP;
			break;
		case "Platinum":
			allPokemon = CUSTOMSETDEX_Pl;
			break;
		case "HG/SS":
			allPokemon = CUSTOMSETDEX_HGSS;
			break;
		case "B/W":
			allPokemon = CUSTOMSETDEX_BW;
			break;
		case "B2/W2":
			allPokemon = CUSTOMSETDEX_B2W2;
			break;
		case "X/Y":
			allPokemon = CUSTOMSETDEX_XY;
			break;
		case "OR/AS":
			allPokemon = CUSTOMSETDEX_ORAS;
			break;
		case "S/M":
			allPokemon = CUSTOMSETDEX_SM;
			break;
		case "US/UM":
			allPokemon = CUSTOMSETDEX_USUM;
			break;
		case "Sw/Sh":
			allPokemon = CUSTOMSETDEX_SWSH;
			break;
		case "S/V":
			allPokemon = CUSTOMSETDEX_SV;
			break;
		//HACK_GAMES
		case "Emerald Kaizo":
			allPokemon = CUSTOMHACKSETDEX_EK;
			break;
		case "Emerald Kaizo Kaizo":
			allPokemon = CUSTOMHACKSETDEX_EKK;
			break;
	

		default:
			return [];
	}
	var trainerNames = [];

	for (const [pokemonName, sets] of Object.entries(allPokemon)) {
		var setNames = Object.keys(sets);
		for (i in setNames) {
			var setName = setNames[i];
			trainerNames.push(`${pokemonName} (${setName})`);
		}
	}
	return trainerNames;
}

function getBoxMonNames() {
	if (localStorage.customsets) {
		var allPokemon = JSON.parse(localStorage.customsets);
		var boxMonNames = [];

		for (const [pokemonName, sets] of Object.entries(allPokemon)) {
			var setNames = Object.keys(sets);
			for (i in setNames) {
				var setName = setNames[i];
				boxMonNames.push(`${pokemonName} (${setName})`);
			}
		}
		return boxMonNames;
	} else {
		return [];
	}
}

/*function getBox() {
    var names = getBoxMonNames();
    var box = [];
    var boxHTML = "";

    for (i in names) {
        box.push(names[i].split("[")[0]);

        var pokemonName = names[i].split(" (")[0];
        var pokemonHTML = `<img class="trainer-poke left-side" src="https://raw.githubusercontent.com/May8th1995/sprites/master/${pokemonName}.png" data-id="${names[i].split("[")[0]}">`;

        boxHTML += pokemonHTML;
    }

    $('.player-pokes').html(boxHTML);
    return box;
}*/

function addBoxed(poke) {
	if (document.getElementById(`${poke.name}${poke.nameProp}`)) {
		//nothing to do it already exist
		return;
	}
	var newPoke = document.createElement("img");
	newPoke.id = `${poke.name}${poke.nameProp}`;
	newPoke.className = "trainer-poke left-side";
	newPoke.src = getBabySprite(poke.name);
	newPoke.dataset.id = `${poke.name} (${poke.nameProp})`;
	newPoke.addEventListener("dragstart", dragstart_handler);
	$("#box-poke-list")[0].appendChild(newPoke);
}
function getBabySprite(poke) {
	if (!poke) {
		return;
	}
	if (GENERATION.num <= 5) {
		let pokeName = poke
		// if($("#ekkSpriteToggle").prop("checked")){
		// 	switch(pokeName){
		// 		case "Sneasel":
		// 			pokeName = "Weavile";
		// 			break;
		// 		case "Murkrow":
		// 			pokeName = "Honchkrow";
		// 			break;
		// 	}
		// }
		var num = POKEDEX_NUMBER[pokeName].slice(1);
		return `https://raw.githubusercontent.com/AFalsePrayer/pkmn-menu-sprites/master/Ani${num}MS.png`;
	}

	if (poke.name == "Aegislash-Shield") {
		return `https://raw.githubusercontent.com/May8th1995/sprites/master/Aegislash.png`;
	} else {
		return `https://raw.githubusercontent.com/May8th1995/sprites/master/${pokeName}.png`;
	}
}
// function getGenBackSprite(poke) {
// 	if (!poke) {
// 		return;
// 	}
// 	if (poke.name.toLowerCase() == "zygarde-10%") {
// 		return "https://play.pokemonshowdown.com/sprites/gen5-back/zygarde-10.png";
// 	} //this ruined my day
// 	if (poke.name.toLowerCase() == "oricorio-pa'u") {
// 		return "https://play.pokemonshowdown.com/sprites/gen5ani-back/oricorio-pau.gif";
// 	}
// 	if (poke.name.toLowerCase() == "mr. mime") {
// 		return "https://play.pokemonshowdown.com/sprites/gen5ani-back/mrmime.gif";
// 	}
// 	if (poke.name.toLowerCase() == "farfetch’d") {
// 		return "https://play.pokemonshowdown.com/sprites/gen5ani-back/farfetchd.gif";
// 	}
// 	if (poke.name.toLowerCase() == "farfetch’d-galar") {
// 		return "https://play.pokemonshowdown.com/sprites/gen5ani-back/farfetchd-galar.gif";
// 	}

// 	if (poke.name == "Aegislash-Shield") {
// 		return `https://raw.githubusercontent.com/May8th1995/sprites/master/Aegislash.png`;
// 	} else {
// 		if (animons.includes(poke.name.toLowerCase() + ",")) {
// 			return `https://play.pokemonshowdown.com/sprites/gen5ani-back/${poke.name
// 				.toLowerCase()
// 				.replace(" ", "")}.gif`;
// 		} else {
// 			return `https://play.pokemonshowdown.com/sprites/gen5-back/${poke.name
// 				.toLowerCase()
// 				.replace(" ", "")}.png`;
// 		}
// 	}
// }

function getGenSprite(poke) {
	
	if (!poke) {
		return;
	}
	let pokeName = poke.toLowerCase();
	switch(pokeName){
		case "zygarde-10%": 
			pokeName = "zygarde-10";
			break;
		case "oricorio-pa'u":
			pokeName = "oricorio-pau"
			break;
		case "mr. mime":
			pokeName = "mrmime"
			break;
		case "farfetch’d":
			pokeName = "farfetchd"
			break;
		case "farfetch’d-galar":
			pokeName = "farfetchd-galar"
			break;
		case "nidoran-m":
			pokeName = "nidoranm"
			break;
		case "nidoran-f":
			pokeName = "nidoranf"
			break;
		case "ho-oh":
			pokeName = "hooh"
			break;
		case "aegislash-shield":
			pokeName = "aegislash"
			break;
	}
	if($("#ekkSpriteToggle").prop("checked")){
		switch(pokeName){
			case "sneasel":
				pokeName = "weavile";
				break;
			case "murkrow":
				pokeName = "honchkrow";
				break;
		}
	}

	switch($("#spriteGenSelection").val()){
		case "3":
			return `https://play.pokemonshowdown.com/sprites/gen3/${pokeName}.png`;
		case "4":
			return `https://play.pokemonshowdown.com/sprites/gen4/${pokeName}.png`;
		case "5":
			return `https://play.pokemonshowdown.com/sprites/gen5/${pokeName}.png`;
		case "5.5":
			if (animons.includes(pokeName)) {
				return `https://play.pokemonshowdown.com/sprites/gen5ani/${pokeName}.gif`;
			} else {
				return `https://play.pokemonshowdown.com/sprites/gen5/${pokeName}.png`;
			}
	}
}

function get_trainer_poks(trainerName) {
	var trueName = trainerName
		.split("(")[1]
		.replaceAll("*", "")
		.split(")")[0]
		.trim();
	window.CURRENT_TRAINER = trueName;
	if (
		!partyOrder ||
		!Object.keys(partyOrder).length ||
		!partyOrder[trueName]
	) {
		TR_NAMES = getTrainerNames();
		var matches = [];
		for (i in TR_NAMES) {
			if (TR_NAMES[i].replaceAll("*", "").trim().includes(`(${trueName})`)) {
				matches.push(TR_NAMES[i]);
			} else if (
				TR_NAMES[i].replaceAll("*", "").trim().includes(`(${trueName} (`)
			) {
				matches.push(TR_NAMES[i]);
			}
		}
		return matches;
	} else {
		var party = partyOrder[trueName];
		var dupes = party.filter((item, index) => party.indexOf(item) != index);
		for (var i in dupes) {
			mon = dupes[i];
			var count = party.filter((x) => x == mon).length;
			for (var i = 0; i < count; i++) {
				var index = party.indexOf(mon);
				party[index] += ` (${i + 1})`;
			}
		}
		var matches = [];
		for (i in party) {
			if (party[i].includes("(")) {
				var index = party[i].split("(")[1].split(")")[0];
				party[i] = party[i].split("(")[0].trim();
				matches.push(`${party[i]} (${trueName} (${index}))`);
			} else {
				matches.push(`${party[i]} (${trueName})`);
			}
		}
		return matches;
	}
}

function topPokemonIcon(fullname, node) {
	var mon = fullname.split(" (")[0];
	var src = getGenSprite(mon);
	node.setAttribute("data-id", fullname)
	node.src = src;
}

$(document).on("click", ".left-side", function () {
	var set = $(this).attr("data-id");
	$("#save-change").attr("hidden", true);
	$(".player").val(set);
	$(".player").change();
	$(".player .select2-chosen").text(set);
});

$(document).on("click", ".trainer-poke-switch.right-side", function () {
	var set = $(this).attr("data-id");
	$(".opposing").val(set);

	$(".opposing").change();
	$(".opposing .select2-chosen").text(set);
});

$(document).on("contextmenu", ".trainer-poke-switch.right-side", function () {
	var dead = $(this).is(".dead");
	if (dead) $(this).removeClass("dead");
	else $(this).addClass("dead");

	predictSwitchOrder();
});

function selectFirstMon() {
	var pMons = document.getElementsByClassName("trainer-poke left-side");
	let set = pMons[0].getAttribute("data-id");
	$(".player").val(set);
	$(".player").change();
	$(".player .select2-chosen").text(set);
}

function hideShowCCSettings() {
	$("#show-cc")[0].toggleAttribute("hidden");
	$("#hide-cc")[0].toggleAttribute("hidden");
	$("#refr-cc")[0].toggleAttribute("hidden");
	$("#info-cc")[0].toggleAttribute("hidden");
	$("#cc-sets")[0].toggleAttribute("hidden");
}

function colorCodeUpdate() {
	var speCheck = document.getElementById("cc-spe-border").checked;
	var ohkoCheck = document.getElementById("cc-ohko-color").checked;
	var advancedCC = document.getElementById("cc-advanced").checked;
	if (!speCheck && !ohkoCheck) {
		return;
	}
	var pMons = document.getElementsByClassName("trainer-poke left-side");
	// i calc here to alleviate some calculation
	var p2info = $("#p2");
	var p2 = createPokemon(p2info);
	for (let i = 0; i < pMons.length; i++) {
		let set = pMons[i].getAttribute("data-id");
		let idColor = calculationsColors(set, p2, advancedCC);
		if (speCheck && ohkoCheck) {
			pMons[
				i
			].className = `trainer-poke left-side mon-speed-${idColor.speed} mon-dmg-${idColor.code}`;
		} else if (speCheck) {
			pMons[
				i
			].className = `trainer-poke left-side mon-speed-${idColor.speed}`;
		} else if (ohkoCheck) {
			pMons[i].className = `trainer-poke left-side mon-dmg-${idColor.code}`;
		}
	}
}

function showColorCodes() {
	colorCodeUpdate();
	hideShowCCSettings();
}

function refreshColorCode() {
	colorCodeUpdate();
}

function hideColorCodes() {
	var pMons = document.getElementsByClassName("trainer-poke left-side");
	for (let i = 0; i < pMons.length; i++) {
		pMons[i].className = "trainer-poke left-side";
	}
	hideShowCCSettings();
}

function toggleInfoColorCode() {
	document.getElementById("info-cc-field").toggleAttribute("hidden");
}

function trashPokemon() {
	var maybeMultiple = document
		.getElementById("trash-box")
		.getElementsByClassName("trainer-poke");
	if (maybeMultiple.length == 0) {
		return; //nothing to delete
	}
	var numberPKM =
		maybeMultiple.length > 1
			? `${maybeMultiple.length} Pokémon`
			: "this Pokémon";
	var yes = confirm(`Do you really want to remove ${numberPKM}?`);
	if (!yes) {
		return;
	}
	var customSets = JSON.parse(localStorage.customsets);
	var length = maybeMultiple.length;
	for (let i = 0; i < length; i++) {
		var pokeTrashed = maybeMultiple[i];
		var name = pokeTrashed.getAttribute("data-id").split(" (")[0];
		delete customSets[name];
	}
	document.getElementById("trash-box").innerHTML = "";
	localStorage.setItem("customsets", JSON.stringify(customSets));
	$("#box-poke-list")[0].click();
}

// function topTrainerIcon(fullname, node) {
// 	var trainer = fullname;

// 	spriteSRC = trainerSprites[trainer];

// 	node.src = spriteSRC;
// 	// 	trainerSprites
// }

function nextTrainer() {
	if (trainerNames.includes(window.CURRENT_TRAINER)) {
		var index = trainerNames.indexOf(window.CURRENT_TRAINER);
		if (index + 1 !== trainerNames.length) {
			var nextTrainerName = trainerNames[index + 1];
			var party = partyOrder[nextTrainerName];
			var pokemon = party[0];
			var dupes = party.filter(
				(item, index) => party.indexOf(item) != index
			);
			if (dupes.includes(pokemon)) {
				nextTrainerName += " (1)";
			}
			var setName = `${pokemon} (${nextTrainerName})`;
			$(".opposing").val(setName);
			$(".opposing").change();
			$(".opposing .select2-chosen").text(setName);
			// topTrainerIcon(nextTrainerName, $("#p2sprite")[0]);
		}
	}
}

function previousTrainer() {
	if (trainerNames.includes(window.CURRENT_TRAINER)) {
		var index = trainerNames.indexOf(window.CURRENT_TRAINER);
		if (index !== 0) {
			var previousTrainerName = trainerNames[index - 1];
			var party = partyOrder[previousTrainerName];
			var pokemon = party[0];
			var dupes = party.filter(
				(item, index) => party.indexOf(item) != index
			);
			if (dupes.includes(pokemon)) {
				previousTrainerName += " (1)";
			}
			var setName = `${pokemon} (${previousTrainerName})`;
			$(".opposing").val(setName);
			$(".opposing").change();
			$(".opposing .select2-chosen").text(setName);
			// topTrainerIcon(previousTrainerName, $("#p2sprite")[0]);
		}
	}
}

function resetTrainer() {
	var firstTrainerName = trainerNames[0];
	topTrainerIcon(firstTrainerName, $("#p2sprite")[0]);
	var party = partyOrder[firstTrainerName];
	var pokemon = party[0];
	var dupes = party.filter((item, index) => party.indexOf(item) != index);
	if (dupes.includes(pokemon)) {
		firstTrainerName += " (1)";
	}
	var setName = `${pokemon} (${firstTrainerName})`;
	$(".opposing").val(setName);
	$(".opposing").change();
	$(".opposing .select2-chosen").text(setName);
}

function allowDrop(ev) {
	ev.preventDefault();
}

var pokeDragged = null;
function dragstart_handler(ev) {
	pokeDragged = ev.target;
}

function noMenuClick(e) {
	e.preventDefault();
}

function drop(ev) {
	ev.preventDefault();
	if (ev.target.classList.contains("dropzone")) {
		pokeDragged.parentNode.removeChild(pokeDragged);
		if (ev.target.tagName == "LEGEND") {
			ev.target.parentNode.children[1].appendChild(pokeDragged);
		} else {
			ev.target.appendChild(pokeDragged);
		}
	}
	// if it's a pokemon
	else if (
		ev.target.classList.contains("left-side") ||
		ev.target.classList.contains("right-side")
	) {
		if (!cntrlIsPressed) {
			let prev1 = pokeDragged.previousElementSibling;
			if (!prev1) {
				ev.target.after(pokeDragged);
			} else {
				ev.target.before(pokeDragged);
				prev1.after(ev.target);
			}
			//swaps
		} else {
			//appends before
			ev.target.before(pokeDragged);
		}
	}
	ev.target.classList.remove("over");
}

function handleDragEnter(ev) {
	ev.target.classList.add("over");
}

function handleDragLeave(ev) {
	ev.target.classList.remove("over");
}

/* dragging for the item box, note box*/
// target elements with the "box-frame-header" class
interact(".box-frame-header").draggable({
	inertia: true,
	modifiers: [
		interact.modifiers.restrictRect({
			restriction: document.body,
			endOnly: true,
		}),
	],
	autoScroll: true,

	listeners: {
		// call this function on every dragmove event
		move: dragMoveListener,
	},
});

function dragMoveListener(event) {
	var target = event.target;
	var parent = target.parentNode;
	// special case for the screen box frame
	if (target.classList.contains("screen-box-frame")) {
		parent = target;
	}
	var x = (parseFloat(target.getAttribute("data-x")) || 0) + event.dx;
	var y = (parseFloat(target.getAttribute("data-y")) || 0) + event.dy;
	parent.style.left = x + "px";
	parent.style.top = y + "px";
	target.setAttribute("data-x", x);
	target.setAttribute("data-y", y);
}

window.dragMoveListener = dragMoveListener;

function speedBorderSetsChange(ev) {
	var monImgs = document.getElementsByClassName("left-side");
	if (ev.target.checked) {
		for (let monImg of monImgs) {
			monImg.classList.remove("mon-speed-none");
		}
	} else {
		for (let monImg of monImgs) {
			monImg.classList.add("mon-speed-none");
		}
	}
}

function colorCodeSetsChange(ev) {
	var monImgs = document.getElementsByClassName("left-side");
	if (ev.target.checked) {
		for (let monImg of monImgs) {
			monImg.classList.remove("mon-dmg-none");
		}
	} else {
		for (let monImg of monImgs) {
			monImg.classList.add("mon-dmg-none");
		}
	}
}

$(".stat-changer").click((e) => {
	var select = $(e.target).parent().siblings("td").has("select").children();
	var increment = e.target.innerText === "+" ? 1 : -1;
	var curValue = Number(select.val());
	var futureValue = curValue + increment;
	if (Math.abs(futureValue) !== 7) {
		select.val(futureValue);
		select.change();
	}
});

window.isInDoubles = false;
function switchIconSingle() {
	// document.getElementById("monDouble").removeAttribute("hidden");
	window.isInDoubles = true;
	return;
}

function switchIconDouble() {
	// document.getElementById("monDouble").setAttribute("hidden", true);
	window.isInDoubles = false;
	return;
}

function openCloseItemBox() {
	document.getElementById("item-box-frame").toggleAttribute("hidden");
}

function openCloseNoteBox() {
	document.getElementById("note-box-frame").toggleAttribute("hidden");
}

$(".totalMod").click((e) => {
	if($(e.target)[0].className){
		$(".speedText").toggle()
		$(".speedIcon").toggle()
	}
})

function selectItem(ev) {
	var newItem = ev.target.getAttribute("data-id");
	document.getElementById("itemL1").value = newItem;
}

$(".chip-div").mouseenter((e)=>{
	$("#chip-damage-display-panel").attr("hidden", false)
})
$(".chip-div").mouseleave((e)=>{
	if(!($("#chipDamageToggle").checked)){
		$("#chip-damage-display-panel").attr("hidden", true)
	}
})


var READY;
$(document).ready(function () {
	var params = new URLSearchParams(window.location.search);
	var g = GENERATION[params.get("gen")] || DEFAULTGEN;
	var gm = params.get("game") || 1;
	spriteGeneration = "Gen 3";
	$("#gen" + g).prop("checked", true);
	$("#gen" + g).change();
	//TODO: need to change this
	$(".gameSelection").val(gm).change();
	$("#percentage").prop("checked", true);
	$("#percentage").change();
	$("#singles-format").prop("checked", true);
	$("#singles-format").change();
	$("#singles-format").click(switchIconDouble);
	$("#doubles-format").click(switchIconSingle);
	$("#default-level-100").prop("checked", true);
	$("#default-level-100").change();
	loadDefaultLists();
	$(".move-selector").select2({
		dropdownAutoWidth: true,
		matcher: function (term, text) {
			// 2nd condition is for Hidden Power
			return (
				text.toUpperCase().indexOf(term.toUpperCase()) === 0 ||
				text.toUpperCase().indexOf(" " + term.toUpperCase()) >= 0
			);
		},
	});

	$("#saveSettingsButton").click(function() {
		//Players
		$(".playerSettings input").each((e)=>{
			$("#p1 ." + $(".playerSettings input")[e].name).attr("hidden", !$(".playerSettings input")[e].checked)		
			
		})
		//Opposing
		$(".opposingSettings input").each((e)=>{
			$("#p2 ." + $(".opposingSettings input")[e].name).attr("hidden", !$(".opposingSettings input")[e].checked)
		})

		$("#panel-3").attr("hidden", !$("#settingsFieldButton").prop("checked"))
		
		$(".field-info div[name=chip-damage]").attr("hidden", !$("#chip-damage-label").prop("checked"));
		$(".badge-info").attr("hidden", !$("#badge-label").prop("checked"));
		$(".poke-import").attr("hidden", !$("#import-label").prop("checked"));

		$(".fieldSettings input").each((e)=>{
			$(".field tr[name=" + $(".fieldSettings input")[e].name + "]").attr("hidden", !$(".fieldSettings input")[e].checked)
		})

		topPokemonIcon($("#p1mon")[0].getAttribute("data-id"), $("#p1mon")[0])
		topPokemonIcon($("#p2mon")[0].getAttribute("data-id"), $("#p2mon")[0])
		$(".settingsOverlay").attr("hidden", true)
	});
	$("#cancelSettingsButton").click(function(){
		$(".settingsOverlay").attr("hidden", true)
	})

	$("#players-stats").change((e)=>{
		$(".players-sub-stats").attr("hidden", !$("#players-stats").prop("checked"))
	})
	$("#opposing-stats").change((e)=>{
		$(".opposing-sub-stats").attr("hidden", !$("#opposing-stats").prop("checked"))
	})
	$("#players-info-selectors").change((e)=>{
		$(".players-sub-info-selectors").attr("hidden", !$("#players-info-selectors").prop("checked"))
	})
	$("#opposing-info-selectors").change((e)=>{
		$(".opposing-sub-info-selectors").attr("hidden", !$("#opposing-info-selectors").prop("checked"))
	})

	$("#ekPreset").click((e)=>{
		$("#players-type").prop("checked", true);
		$("#players-level").prop("checked", true);
		$("#players-stats").prop("checked", true);
		$("#players-base").prop("checked", false);
		$("#players-ivs").prop("checked", false);
		$("#players-evs").prop("checked", false);
		$("#players-dvs").prop("checked", false);
		$("#players-info-selectors").prop("checked", true);
		$("#players-nature").prop("checked", false);
		$("#players-ability").prop("checked", true);
		$("#players-item").prop("checked", true);
		$("#players-status").prop("checked", true);
		$("#players-health").prop("checked", true);
		$("#players-moves").prop("checked", false);
		$("#opposing-type").prop("checked", true);
		$("#opposing-level").prop("checked", true);
		$("#opposing-stats").prop("checked", true);
		$("#opposing-base").prop("checked", false);
		$("#opposing-ivs").prop("checked", false);
		$("#opposing-evs").prop("checked", false);
		$("#opposing-dvs").prop("checked", false);
		$("#opposing-info-selectors").prop("checked", true);
		$("#opposing-nature").prop("checked", false);
		$("#opposing-ability").prop("checked", true);
		$("#opposing-item").prop("checked", true);
		$("#opposing-status").prop("checked", true);
		$("#opposing-health").prop("checked", true);
		$("#opposing-moves").prop("checked", false);
		$("#chip-damage-label").prop("checked", true);
		$("#spikesLabel").prop("checked", false);
		$("#reflectLabel").prop("checked", false);
		$("#lightScreenLabel").prop("checked", false);
		$("#protectLabel").prop("checked", false);
		$("#leechSeedLabel").prop("checked", false);
		$("#foresightLabel").prop("checked", false);
		$("#helpingHandLabel").prop("checked", false);
		$("#switchingLabel").prop("checked", false);
		$("#spriteGenSelection").val("3").change();
		$("label[for=ekkSpriteToggle]").attr("hidden", true)
		$("#ekkSpriteToggle").prop("checked", false)
		// $("#saveSettingsButton").trigger("click");
	})

	$("#spriteGenSelection").change(()=>{
		$("label[for=ekkSpriteToggle]").attr("hidden", false);
		if($("#spriteGenSelection").val() <= 3 || !['Emerald Kaizo Kaizo'].includes(game)){
			$("#ekkSpriteToggle").prop("checked", false)
			$("label[for=ekkSpriteToggle]").attr("hidden", true);
		}
	})
	$("#spriteGenSelection").change()

	$(".set-selector").val(getFirstValidSetOption().id);
	$(".set-selector").change();
	$(".terrain-trigger").bind("change keyup", getTerrainEffects);

	$("#show-cc").click(showColorCodes);
	$("#hide-cc").click(hideColorCodes);
	$("#refr-cc").click(refreshColorCode);
	$("#info-cc").click(toggleInfoColorCode);
	$("#trash-poke").click(trashPokemon);
	$("#next-trainer").click(nextTrainer);
	$("#previous-trainer").click(previousTrainer);
	$("#reset-trainer").click(resetTrainer);
	$("#cc-spe-border").change(speedBorderSetsChange);
	$("#cc-ohko-color").change(refreshColorCode);
	$("#cc-advanced").change(colorCodeUpdate);
	$("#cc-spe-border")[0].checked = true;
	$("#cc-ohko-color")[0].checked = true;
	$("#save-change").click(saveTrainerPokemon);

	//Transform is currently bugged

	// $('.transform').on("click", function() {
	// 	var transformer = $(this).closest(".poke-info");
	// 	var target = $(transformer.attr("id") === "p1" ? "#p2" : "#p1");

	// 	transformer.siblings().find(".forme").parent().replaceWith(target.siblings().find(".forme").parent());
	// 	transformer.find(".type1").val(target.find(".type1").val());
	// 	transformer.find(".type2").val(target.find(".type2").val());
	// 	for (i = 0; i < LEGACY_STATS[gen].length; i++) {
	// 		var stat = LEGACY_STATS[gen][i];
	// 		if (stat === "hp") continue;
	// 		transformer.find("." + stat + " .total").val(target.find("." + stat + " .total").val());
	// 	}
	// 	transformer.find(".nature").val(target.find(".nature").val());
	// 	calcStats(transformer);
	// 	for (i = 0; i < 4; i++) {
	// 		var move = target.find(".move" + (i + 1) + " select.move-selector").val();
	// 		if (move.startsWith("Hidden Power")) {
	// 			var pokemon = createPokemon(transformer);
	// 			var ivs = {};
	// 			for (var j = 0; j <= LEGACY_STATS[9].length; j++) {
	// 				var s = LEGACY_STATS[9][j];
	// 				ivs[legacyStatToStat(s)] = (pokemon.ivs && pokemon.ivs[s]) || 31;
	// 			}

	// 			var expectedType = calc.Stats.getHiddenPower(GENERATION, ivs).type;
	// 			move = "Hidden Power " + expectedType;
	// 		}
	// 		setSelectValueIfValid(transformer.find(".move" + (i + 1) + " select.move-selector"), move, "(No Move)");
	// 		transformer.find(".move" + (i + 1) + " select.move-selector").change();
	// 	}
	// 	transformer.find(".ability").val(target.find(".ability").val());
	// 	transformer.find(".ability").change();
	// 	if (gen > 4) transformer.siblings().find(".gender").replaceWith(target.siblings().find(".gender"));
	// });

	$("#trainer-nav-help").click(() => {
		alert(
			"This section displays the enemy party in the correct in-game order, from top to bottom. Each Pokémon will list the next Pokémon that comes out after it faints. To mark dead Pokémon, right-click the Pokémon, and it will move onto calculating with the remaining mons. Left-click will load the Pokémon and select the set.\n\n" +
				"If a Pokémon is marked with a red outline, there is a chance that the enemy will make a switch to that Pokémon the turn after you use a move that is also be marked with a red background. In case of multiple outlined Pokémon, the switch will only happen to a Pokémon that resists that move."
		);
	});
	$("#bait-help").click(() => {
		alert(
			"This section predicts what will Pokémon will be sent out after your Pokémon defeats each member of the enemy party.\n\n" +
				"Click a Pokémon sprite to mark it as dead, excluding it from the list of possible next Pokémon.\n\n" +
				'In very rare cases such as damage overflow, you can use the slower but more accurate "Advanced Bait" option.\n\n' +
				"In case of an incorrect result, please DM me on Discord at @anastarawneh, or open a GitHub issue."
		);
	});
	$("#ai-help").click(() => {
		var ai = parseInt($("#ai-help").attr("flag"));
		switch (ai) {
			case 1:
				alert("AI Flag [1]: Check Bad Move");
				return;
			case 5:
				alert("AI Flag [5]: Check Bad Move, Check Viability");
				return;
			case 7:
				alert("AI Flag [7]: Check Bad Move, Try To Faint, Check Viability");
				return;
			case 11:
				alert(
					"AI Flag [11]: Check Bad Move, Try To Faint, Setup First Turn"
				);
				return;
			case 15:
				alert(
					"AI Flag [15]: Check Bad Move, Try To Faint, Check Viability, Setup First Turn"
				);
				return;
			case 23:
				alert(
					"AI Flag [23]: Check Bad Move, Try To Faint, Check Viability, Risky\n\n" +
						"The enemy trainer has a chance to randomly use a risky move it wouldn't normally use instead of the usual move. Those moves will be marked in italics."
				);
				return;
			default:
				alert("Error! AI flag is set to " + ai);
				return;
		}
	});

	$(".last-move-used > select.move-selector").val("(No Move)");
	$(".last-move-used > select.move-selector").change();
	$("#advanced-bait").prop("checked", false);
	$("#advanced-bait").change(() => {
		if ($("#advanced-bait").is(":checked")) $(".last-move-used").show();
		else $(".last-move-used").hide();
		predictSwitchOrder();
	});


	$("#settingsGearIcon").click(()=>{
		$(".settingsOverlay").attr("hidden", false)
	});
	for (let dropzone of document.getElementsByClassName("dropzone")) {
		dropzone.ondragenter = handleDragEnter;
		dropzone.ondragleave = handleDragLeave;
		dropzone.ondrop = drop;
		dropzone.ondragover = allowDrop;
	}

	$(".wrapper").attr("hidden", false)
	$(".credits").attr("hidden", false)
	$(".settingsGearIconDiv").attr("hidden", false)
	
	$("#players-stats").change()
	$("#opposing-stats").change()
	$("#players-info-selectors").change()
	$("#opposing-info-selectors").change()

	$("#saveSettingsButton").trigger("click");
	$(".loadingScreen")[0].style.visibility = "hidden";
	READY = true;
});

/* Click-to-copy function */
$("#mainResult").click(function () {
	navigator.clipboard.writeText($("#mainResult").text()).then(function () {
		document.getElementById("tooltipText").style.visibility = "visible";
		setTimeout(function () {
			document.getElementById("tooltipText").style.visibility = "hidden";
		}, 1500);
	});
});

function updateGameOptions() {
	if (!READY) return;
	var params = new URLSearchParams(window.location.search);
	// $("#game0").prop("checked", true);
	$(".gameSelection").val(1).change()
	game = "Emerald Kaizo";
	gameId = 1;
	params.delete("game");
	params = "" + params;
	if (window.history && window.history.replaceState) {
		window.history.replaceState(
			{},
			document.title,
			window.location.pathname + (params.length ? "?" + params : "")
		);
	}
}