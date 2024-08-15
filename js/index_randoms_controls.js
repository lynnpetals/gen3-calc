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
	p1info.find(".speedText").text(p1.stats.spe);
	p2info.find(".speedText").text(p2.stats.spe);

	var fastestSide =
		p1.stats.spe > p2.stats.spe
			? 0
			: p1.stats.spe === p2.stats.spe
			? "tie"
			: 1;

	var result, maxDamage;
	var bestResult;
	var zProtectAlerted = false;
	var minn = new Array();
	var maxx = new Array();
	var moveNames = new Array();
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


		//TODO:
		minn.push(result.range()[0])
		maxx.push(result.range()[1])
		moveNames.push(p2.moves[i].name)
		
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

		// $(resultLocations[1][i].move + " + label").removeClass("highest-roll")

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
			bestResult = $(resultLocations[1][bestMove].move);
		} else {
			bestMove = battling[fastestSide].maxDamages[0].moveOrder;
			bestResult = $(resultLocations[fastestSide][bestMove].move);
		}
	}
	if ($("input:radio[name='format']:checked").val()) {
		$(".speedIcon").html('');
		if (fastestSide === "tie") {
			var img = document.createElement("img");
			img.src = "./img/speed-tie.png";
			img.className = "speed-img";
			$(".speedIcon").append(img);
		} else {
			//TODO: Add better icons
			var imgFaster = document.createElement("img");
			var imgSlower = document.createElement("img");
			imgFaster.src = "./img/speed-faster.png";
			imgSlower.src = "./img/speed-slower.png";
			imgFaster.className = "speed-img";
			imgSlower.className = "speed-img";
			$(".speedIcon")[fastestSide].append(imgFaster);
			$(".speedIcon")[1 - fastestSide].append(imgSlower);
		}
	}


	//For each move name, check that move name (moveNames[i]) is not in list of power 1 and discouraged moves, otherwise mark flags
	//0 - normal move, 1 - discouraged move, 2 - power 1 move
	var moveFlags = []
	moveNames.forEach((i)=>{
		let power1moves = ["Fissure", "Horn Drill", "Guillotine", "Sheer Cold", "Flail", "Low Kick", "Magnitude", "Present", "Reversal", "Counter", "Mirror Coat", "Dragon Rage",  "Endeavor", "Night Shade", "Psywave", "Seismic Toss", "Sonic Boom", "Super Fang"]
		let discouragedMoves = ["Explosion","Self-Destruct","Razor Wind","Solar Beam","Blast Burn","Hydro Cannon","Frenzy Plant","Hyper Beam","Dream Eater","Focus Punch"]
		if(power1moves.includes(i)){
			moveFlags.push(2)
		}
		else if(discouragedMoves.includes(i)){
			moveFlags.push(1)
		}
		else{
			moveFlags.push(0)
		}
	})

	var maxRoll = 1;
	var maxIndex = -1;
	var alwaysKOPlayer = false;
	//take the look at the max roll in these four
	//TODO: This actually needs to be a loop to skip power 1 and discouraged moves
	for (i of [...Array(4).keys()]){
		if(maxx[i] >= maxRoll){
			if(moveFlags[i] != 2){
				alwaysKOPlayer = minn[i] >= $("#currentHpL1")[0].valueAsNumber || alwaysKOPlayer;
			}
			if(moveFlags[i] == 0){
				maxRoll = maxx[i]
				maxIndex = i;
			}
		}
	}

	//check the corresponding minimum roll
	let minRoll = minn[maxIndex];
	for (i of [...Array(4).keys()]){
		$(resultLocations[1][i].move + " + label").removeClass("highest-roll")
		$(resultLocations[1][i].move + " + label").removeClass("ohko")
		$(resultLocations[1][i].move + " + label").removeClass("can-ohko")

		//Check that move name (moveNames[i]) is not in list of power 1 and discouraged moves, otherwise mark flags
		if(maxx[i] >= $("#currentHpL1")[0].valueAsNumber && moveFlags[i] != 2){
			//This move kills!
			//guaranteed kill vs not sure
			var isDefKill = minn[i] >= $("#currentHpL1")[0].valueAsNumber
			var ohkoClassName = isDefKill ? "ohko" : "can-ohko"
			$(resultLocations[1][i].move + " + label").addClass(ohkoClassName)
			var emoji = isDefKill ? "💀 " : "😱 " ;
			$(resultLocations[1][i].move + " + label").text(emoji + $(resultLocations[1][i].move + " + label").text())
			continue;
		}
		if(maxx[i]>=minRoll && moveFlags[i] == 0 && !alwaysKOPlayer){
			//This move can max roll!
			$(resultLocations[1][i].move + " + label").addClass("highest-roll")
			$(resultLocations[1][i].move + " + label").text("‼️ " + $(resultLocations[1][i].move + " + label").text())
		}
	}
	if(alwaysKOPlayer){
		for (i of [...Array(4).keys()]){
			$(resultLocations[1][i].move + " + label").removeClass("highest-roll")
		}
	}

	//check which max rolls are greater than this minimum roll

	//all these rolls are highlighted

	if ($(".locked-move").length) {
		bestResult = $(".locked-move");
	} else {
		stickyMoves.setSelectedMove(bestResult.prop("id"));
	}
	var doc = document.getElementById("gameSelection")
	var game = (doc).options[doc.selectedIndex].text
	// FROG
	if (["Emerald Kaizo", "Emerald Kaizo Kaizo"].includes(game)){
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
			var drainValue = 0;
			if(result.move.drain){
				drainValue = result.move.drain
			}
			var recoilValue = 0;
			if(result.move.recoil){
				recoilValue = result.move.recoil
			}
			displayDamageHits(result.damage, drainValue, recoilValue)
		}
	}
});

function aggregateRolls(rolls){
		var resultString = "";
	var prevDamage = rolls[0];
		var rollCount = 1;
	resultString += rolls[0];
	for (var i = 1; i < rolls.length; i++) {
		if (rolls[i] == prevDamage) {
				rollCount++;
			} else {
				resultString +=
					rollCount > 1
					? " [x" + rollCount + "], " + rolls[i]
					: ", " + rolls[i];
				rollCount = 1;
			prevDamage = rolls[i];
			}
		}
		if (rollCount > 1) {
			resultString += " [x" + rollCount + "])";
		}
	return resultString;
}

function displayDamageHits(damage, drain, recoil) {
	
	// Fixed Damage
	if (typeof damage === "number") rollText = damage;
	// Standard Damage
	else if (damage.length > 2) {
		rollText = aggregateRolls(damage);
	}
	// Fixed Parental Bond Damage
	else if (typeof damage[0] === "number" && typeof damage[1] === "number") {
		rollText = "1st Hit: " + damage[0] + "; 2nd Hit: " + damage[1];
	}
	// Parental Bond Damage
	// TODO IN THE DISTANT FUTURE: Apply agg to this
	else {rollText = "1st Hit: " + damage[0].join(", ") + "; 2nd Hit: " + damage[1].join(", ")}
	$("#damageValues").text("Rolls: (" + rollText + ")");

	if(drain){
		$("#drainValues").attr("hidden", false)
		drainRolls = damage.map((e) => (e / drain[1])).map((e) => (e * drain[0])).map((e)=>(Math.trunc(e)))
		var drainText = aggregateRolls(drainRolls)
		$("#drainValues").text("Recovered: (" + drainText + ")");
	}else 
	{$("#drainValues").attr("hidden", true)};

	if(recoil){
		$("#recoilValues").attr("hidden", false)
		recoilRolls = damage.map((e) => (e / recoil[1])).map((e) => (e * recoil[0])).map((e)=>(Math.trunc(e)))
		var recoilText = aggregateRolls(recoilRolls)
		$("#recoilValues").text("Recoil: (" + recoilText + ")");
	}else 
	{$("#recoilValues").attr("hidden", true)};

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
