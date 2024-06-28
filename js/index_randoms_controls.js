$("#p2 .ability").bind("keyup change", function () {
	autosetWeather($(this).val(), 1);
	autosetTerrain($(this).val(), 1);
});

$("#p2 .item").bind("keyup change", function () {
	autosetStatus("#p2", $(this).val());
});

var resultLocations = [[], [], []];
for (var i = 0; i < 4; i++) {
	resultLocations[0].push({
		move: "#resultMoveL" + (i + 1),
		damage: "#resultDamageL" + (i + 1),
		recoil: "#resultRecoilL" + (i + 1),
	});
	resultLocations[1].push({
		move: "#resultMoveR" + (i + 1),
		damage: "#resultDamageR" + (i + 1),
		recoil: "#resultRecoilR" + (i + 1),
	});
}

var damageResults;
function performCalculations() {
	var p1info = $("#p1");
	var p2info = $("#p2");
	var p1 = createPokemon(p1info);
	var p2 = createPokemon(p2info);
	var p1field = createField();
	var p2field = p1field.clone().swap();

	if (localStorage.customsets) {
		var customsets = JSON.parse(localStorage.customsets);
		if (
			customsets[p2.name] !== undefined &&
			customsets[p2.name][window.CURRENT_TRAINER] !== undefined
		) {
			p1field.defenderSide.isBoulderBadge =
				p1field.attackerSide.isBoulderBadge;
			p1field.defenderSide.isThunderBadge =
				p1field.attackerSide.isThunderBadge;
			p1field.defenderSide.isSoulBadge = p1field.attackerSide.isSoulBadge;
			p1field.defenderSide.isVolcanoBadge =
				p1field.attackerSide.isVolcanoBadge;
			p1field.defenderSide.isStoneBadge = p1field.attackerSide.isStoneBadge;
			p1field.defenderSide.isDynamoBadge =
				p1field.attackerSide.isDynamoBadge;
			p1field.defenderSide.isBalanceBadge =
				p1field.attackerSide.isBalanceBadge;
			p1field.defenderSide.isMindBadge = p1field.attackerSide.isMindBadge;
			p2field.attackerSide.isBoulderBadge =
				p2field.defenderSide.isBoulderBadge;
			p2field.attackerSide.isThunderBadge =
				p2field.defenderSide.isThunderBadge;
			p2field.attackerSide.isSoulBadge = p2field.defenderSide.isSoulBadge;
			p2field.attackerSide.isVolcanoBadge =
				p2field.defenderSide.isVolcanoBadge;
			p2field.attackerSide.isStoneBadge = p2field.defenderSide.isStoneBadge;
			p2field.attackerSide.isDynamoBadge =
				p2field.defenderSide.isDynamoBadge;
			p2field.attackerSide.isBalanceBadge =
				p2field.defenderSide.isBalanceBadge;
			p2field.attackerSide.isMindBadge = p2field.defenderSide.isMindBadge;
		}
	}

	damageResults = calculateAllMoves(gen, p1, p1field, p2, p2field);
	p1 = damageResults[0][0].attacker;
	p2 = damageResults[1][0].attacker;
	var battling = [p1, p2];
	p1.maxDamages = [];
	p2.maxDamages = [];
	p1info.find(".sp .totalMod").text(p1.stats.spe);
	p2info.find(".sp .totalMod").text(p2.stats.spe);

	var fastestSide =
		p1.stats.spe > p2.stats.spe
			? 0
			: p1.stats.spe === p2.stats.spe
			? "tie"
			: 1;

	var result, maxDamage;
	var bestResult;
	var zProtectAlerted = false;
	for (var i = 0; i < 4; i++) {
		// P1
		result = damageResults[0][i];
		maxDamage = result.range()[1] * p1.moves[i].hits;
		if (
			!zProtectAlerted &&
			maxDamage > 0 &&
			p1.item.indexOf(" Z") === -1 &&
			p1field.defenderSide.isProtected &&
			p1.moves[i].isZ
		) {
			alert(
				"Although only possible while hacking, Z-Moves fully damage through protect without a Z-Crystal"
			);
			zProtectAlerted = true;
		}
		p1.maxDamages.push({ moveOrder: i, maxDamage: maxDamage });
		p1.maxDamages.sort(function (firstMove, secondMove) {
			return secondMove.maxDamage - firstMove.maxDamage;
		});
		$(resultLocations[0][i].move + " + label").text(
			p1.moves[i].name.replace("Hidden Power", "HP")
		);

		$(resultLocations[0][i].damage).text(
			result.moveDesc(notation).split("(")[0]
		);
		if (result.moveDesc(notation).includes("(")) {
			$(resultLocations[0][i].recoil).attr("hidden", false);
			$(resultLocations[0][i].recoil).text(
				"(" + result.moveDesc(notation).split("(")[1]
			);
		} else {
			$(resultLocations[0][i].recoil).attr("hidden", true);
			$(resultLocations[0][i].recoil).text("");
		}

		// P2
		result = damageResults[1][i];
		maxDamage = result.range()[1] * p2.moves[i].hits;
		if (
			!zProtectAlerted &&
			maxDamage > 0 &&
			p2.item.indexOf(" Z") === -1 &&
			p2field.defenderSide.isProtected &&
			p2.moves[i].isZ
		) {
			alert(
				"Although only possible while hacking, Z-Moves fully damage through protect without a Z-Crystal"
			);
			zProtectAlerted = true;
		}
		p2.maxDamages.push({ moveOrder: i, maxDamage: maxDamage });
		p2.maxDamages.sort(function (firstMove, secondMove) {
			return secondMove.maxDamage - firstMove.maxDamage;
		});

		$(resultLocations[1][i].move + " + label").text(
			p2.moves[i].name.replace("Hidden Power", "HP")
		);
		$(resultLocations[1][i].damage).text(
			result.moveDesc(notation).split("(")[0]
		);
		if (result.moveDesc(notation).includes("(")) {
			$(resultLocations[1][i].recoil).attr("hidden", false);
			$(resultLocations[1][i].recoil).text(
				"(" + result.moveDesc(notation).split("(")[1]
			);
		} else {
			$(resultLocations[1][i].recoil).attr("hidden", true);
			$(resultLocations[1][i].recoil).text("");
		}
		// $(resultLocations[0][i].recoil).text

		// BOTH
		var bestMove;
		if (fastestSide === "tie") {
			// Technically the order should be random in a speed tie, but this non-determinism makes manual testing more difficult.
			// battling.sort(function () { return 0.5 - Math.random(); });
			bestMove = battling[1].maxDamages[0].moveOrder;
			var chosenPokemon = battling[1] === p1 ? "0" : "1";
			bestResult = $(resultLocations[chosenPokemon][bestMove].move);
		} else {
			bestMove = battling[fastestSide].maxDamages[0].moveOrder;
			bestResult = $(resultLocations[fastestSide][bestMove].move);
		}
	}
	console.log($("#singles-format"));
	if ($("input:radio[name='format']:checked").val() === "Singles") {
		if (fastestSide === "tie") {
			$(".sp .totalMod")[0].className = "totalMod speed-tie";
			$(".sp .totalMod")[1].className = "totalMod speed-tie";
			var img = document.createElement("img");
			img.src = "./img/speed-tie.png";
			img.className = "speed-img";
			$(".sp .totalMod").html("");
			$(".sp .totalMod").append(img);
		} else {
			console.log($(".sp .totalMod"));
			//TODO: Add better icons
			var imgFaster = document.createElement("img");
			var imgSlower = document.createElement("img");
			imgFaster.src = "./img/speed-faster.png";
			imgSlower.src = "./img/speed-slower.png";
			imgFaster.className = "speed-img";
			imgSlower.className = "speed-img";
			$(".sp .totalMod").html("");
			$(".sp .totalMod")[fastestSide].append(imgFaster);
			$(".sp .totalMod")[1 - fastestSide].append(imgSlower);
		}
	}
	if ($(".locked-move").length) {
		bestResult = $(".locked-move");
	} else {
		stickyMoves.setSelectedMove(bestResult.prop("id"));
	}
	var game = $("input[name='game']:checked + label").html();
	if (["Emerald Kaizo"].includes(game)) {
		predictMidTurnSwitch(p1, p2);
		predictSwitchOrder();
	}
	bestResult.prop("checked", true);
	bestResult.change();
	$("#resultHeaderL").text(p1.name);
	$("#resultHeaderR").text(p2.name);
	updateTickedHP();
}

function calculationsColors(p1info, p2, advanced) {
	if (!p2) {
		var p2info = $("#p2");
		var p2 = createPokemon(p2info);
	}
	var p2info = $("#p2");
	var p1 = createPokemon(p1info);
	var p1field = createField();
	var p2field = p1field.clone().swap();

	damageResults = calculateAllMoves(gen, p1, p1field, p2, p2field);
	p1 = damageResults[0][0].attacker;
	p2 = damageResults[1][0].attacker;
	p1.maxDamages = [];
	p2.maxDamages = [];
	var p1s = p1.stats.spe;
	var p2s = p2.stats.spe;
	var fastest =
		p1s > p2s ? "F" : p1s < p2s ? "S" : p1s === p2s ? "T" : undefined;
	var result,
		highestRoll,
		lowestRoll,
		damage = 0;
	//goes from the most optimist to the least optimist
	var p1KO = 0,
		p2KO = 0;
	//Highest damage
	var p1HD = 0,
		p2HD = 0;
	for (var i = 0; i < 4; i++) {
		// P1
		result = damageResults[0][i];
		//lowest rolls in %
		damage = result.damage[0] ? result.damage[0] : result.damage;
		lowestRoll = (damage / p2.stats.hp) * 100;
		damage = result.damage[15] ? result.damage[15] : result.damage;
		highestRoll = (damage / p2.stats.hp) * 100;
		if (highestRoll > p1HD) {
			p1HD = highestRoll;
		}
		if (lowestRoll >= 100) {
			p1KO = 1;
		} else {
			//if lowest kill obviously highest will
			//highest rolls in %
			if (highestRoll >= 100) {
				if (p1KO == 0) {
					p1KO = 2;
				}
			}
		}

		// P2
		result = damageResults[1][i];
		//some damage like sonic boom acts a bit weird.
		damage = result.damage[0] ? result.damage[0] : result.damage;
		lowestRoll = (damage / p1.stats.hp) * 100;
		damage = result.damage[15] ? result.damage[15] : result.damage;
		highestRoll = (damage / p1.stats.hp) * 100;
		if (highestRoll > p2HD) {
			p2HD = highestRoll;
		}
		if (lowestRoll >= 100) {
			p2KO = 4;
		} else {
			if (highestRoll >= 100) {
				if (p2KO < 3) {
					p2KO = 3;
				}
			}
		}
	}
	// Checks if the pokemon walls it
	// i wouldn't mind change this algo for a smarter one.

	// if the adversary don't three shots our pokemon
	if (advanced && Math.round(p2HD * 3) < 100) {
		// And if our pokemon does more damage
		if (p1HD > p2HD) {
			if (p1HD > 100) {
				// Then i consider it a wall that may OHKO
				return { speed: fastest, code: "WMO" };
			}
			// if not Then i consider it a good wall
			return { speed: fastest, code: "W" };
		}
	}
	p1KO = p1KO > 0 ? p1KO.toString() : "";
	p2KO = p2KO > 0 ? p2KO.toString() : "";
	return { speed: fastest, code: p1KO + p2KO };
}

$(".result-move").change(function () {
	if (damageResults) {
		var result = findDamageResult($(this));
		if (result) {
			var desc = result.fullDesc(notation, false);
			if (desc.indexOf("--") === -1)
				desc += " -- possibly the worst move ever";
			$("#mainResult").text(desc);
			$("#damageValues").text(
				"Rolls: (" + displayDamageHits(result.damage) + ")"
			);
		}
	}
});

function displayDamageHits(damage) {
	// Fixed Damage
	if (typeof damage === "number") return damage;
	// Standard Damage
	if (damage.length > 2) {
		var resultString = "";
		var prevDamage = damage[0];
		var rollCount = 1;
		resultString += damage[0];
		for (var i = 1; i < damage.length; i++) {
			if (damage[i] == prevDamage) {
				rollCount++;
			} else {
				resultString +=
					rollCount > 1
						? " [x" + rollCount + "], " + damage[i]
						: ", " + damage[i];
				rollCount = 1;
				prevDamage = damage[i];
			}
		}
		if (rollCount > 1) {
			resultString += " [x" + rollCount + "])";
		} else {
			resultString += ")";
		}

		return resultString;
	}
	// Fixed Parental Bond Damage
	if (typeof damage[0] === "number" && typeof damage[1] === "number") {
		return "1st Hit: " + damage[0] + "; 2nd Hit: " + damage[1];
	}
	// Parental Bond Damage
	return (
		"1st Hit: " + damage[0].join(", ") + "; 2nd Hit: " + damage[1].join(", ")
	);
}

function findDamageResult(resultMoveObj) {
	var selector = "#" + resultMoveObj.attr("id");
	for (var i = 0; i < resultLocations.length; i++) {
		for (var j = 0; j < resultLocations[i].length; j++) {
			if (resultLocations[i][j].move === selector) {
				return damageResults[i][j];
			}
		}
	}
}

function checkStatBoost(p1, p2) {
	if ($("#StatBoostL").prop("checked")) {
		for (var stat in p1.boosts) {
			if (stat === "hp") continue;
			p1.boosts[stat] = Math.min(6, p1.boosts[stat] + 1);
		}
	}
	if ($("#StatBoostR").prop("checked")) {
		for (var stat in p2.boosts) {
			if (stat === "hp") continue;
			p2.boosts[stat] = Math.min(6, p2.boosts[stat] + 1);
		}
	}
}

function calculateAllMoves(gen, p1, p1field, p2, p2field) {
	checkStatBoost(p1, p2);
	var results = [[], []];
	for (var i = 0; i < 4; i++) {
		results[0][i] = calc.calculate(gen, p1, p2, p1.moves[i], p1field);
		results[1][i] = calc.calculate(gen, p2, p1, p2.moves[i], p2field);
	}
	return results;
}

function saveTrigger(ev) {
	var isUser = ev.originalEvent ? ev.originalEvent.isTrusted : false;
	if (isUser || ev.added) {
		//ev.added is for the moves buttons
		$("#save-change").attr("hidden", false);
	}
}

$(".mode").change(function () {
	var params = new URLSearchParams(window.location.search);
	params.set("mode", $(this).attr("id"));
	var mode = params.get("mode");
	if (mode === "randoms") {
		window.location.replace("randoms" + linkExtension + "?" + params);
	} else if (mode === "one-vs-one") {
		window.location.replace("index" + linkExtension + "?" + params);
	} else {
		window.location.replace("honkalculate" + linkExtension + "?" + params);
	}
});

$(".gamemode").change(function () {
	var gamemode = $(this).attr("id");
	if (gamemode === "vanilla") {
		window.location.replace(
			location.hostname == "calc.anastarawneh.com"
				? "/"
				: "index" + linkExtension
		);
	} else {
		window.location.replace(
			"hacks" +
				(location.hostname == "calc.anastarawneh.com" ? "" : linkExtension)
		);
	}
});

$(".notation").change(function () {
	performCalculations();
});

$(document).ready(function () {
	var params = new URLSearchParams(window.location.search);
	var m = params.get("mode");
	if (m) {
		if (m !== "one-vs-one" && m !== "randoms") {
			window.location.replace("honkalculate" + linkExtension + "?" + params);
		} else {
			if ($("#randoms").prop("checked")) {
				if (m === "one-vs-one") {
					window.location.replace("index" + linkExtension + "?" + params);
				}
			} else {
				if (m === "randoms") {
					window.location.replace(
						"randoms" + linkExtension + "?" + params
					);
				}
			}
		}
	}
	$(".calc-trigger").bind("change keyup", function (ev) {
		/*
			This prevents like 8 performCalculations out of 8 that were useless
			without causing bugs (so far)
		*/
		if (window.NO_CALC) {
			return;
		}
		if (
			document.getElementById("cc-auto-refr").checked &&
			$("#show-cc").is(":hidden")
		) {
			window.refreshColorCode();
		}
		performCalculations();
	});

	$(".save-trigger").bind("change keyup", saveTrigger);

	$(".bait-trigger").bind("change keyup", function (ev) {
		if (window.NO_CALC) {
			return;
		}
		predictSwitchOrder();
	});
	performCalculations();
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
