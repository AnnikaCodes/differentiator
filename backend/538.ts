import {config} from 'dotenv';
config();
import {Manifold} from 'manifold-sdk';
import {cancelLimitOrder, log} from './orders';

interface WorldCupData {
	teams: Team538Data[];
	matches: Match538Data[];
	fetchedAt: Date;
	updatedAt: string;
}


const teamBasedPredictions: Record<string, {stat: keyof Team538Data, marketID: string}[]> = {
	GER: [
		{stat: "make_round_of_16", marketID: "YFm9Va8cYKzB3gYy5OCJ"},
		{stat: "make_quarters", marketID: "oU9BbZHBRs7UwREZJdOO"},
		{stat: "make_semis", marketID: "0EWJqIFbAlrPsFaPAiMP"},
	],
	BEL: [
		{stat: "make_round_of_16", marketID: "WJnsKI1GPChi5JYK5up5"},
		{stat: "make_quarters", marketID: "QbdOSJusvpCMI3k7P2MC"},
	],
	USA: [
		{stat: "make_round_of_16", marketID: "8v2GLnq8gl7oaRLLxFS8"},
		{stat: "make_round_of_16", marketID: "UcqgVRxmPIcRmukmvtLf"},
		{stat: "make_quarters", marketID: "c3Rx5dl8or1DW9jZQlPD"},
	],
	CRO: [
		{stat: "make_round_of_16", marketID: "IUawuWAQhqyzU7jcdqOI"},
		{stat: "make_quarters", marketID: "sSQnZ51A7PQK2KJKxgdX"},
	],
	ARG: [
		{stat: "make_round_of_16", marketID: "CcR4ni6oUXhWp8usYMtb"},
		{stat: "win_league", marketID: "ZvniYi4y5VFgrl22Ge0V"},
		{stat: "win_league", marketID: "XCq9yD0FHY0oYAGpBKro"},
		{stat: "make_quarters", marketID: "K2oEBrjrVxVRYwbpy3OO"},
	],
	ECU: [
		{stat: "make_round_of_16", marketID: "V6g3VM27Z4S3HjzcJasy"},
		{stat: "make_quarters", marketID: "38IGk0J2dDUPGm6Hot8N"},
	],
	ENG: [
		{stat: "make_round_of_16", marketID: "GZAbSkvyC3DtUr6fLefp"},
		{stat: "make_semis", marketID: "k0Bqx1e8QqC2WQ9PQvKa"},
		{stat: "make_quarters", marketID: "I6rfSyjSGLmAsyWm0Ugn"},
	],
	ESP: [
		{stat: "make_round_of_16", marketID: "ZAcvJZFcyPXmqK0xckkn"},
		{stat: "make_quarters", marketID: "urZjXCa2rLnM1SCt4h2S"},
		{stat: "make_semis", marketID: "qiRDzQUlQc1YvYM5w6i9"},
	],
	BRA: [
		{stat: "make_round_of_16", marketID: "aKf7U3BCWP2kjKO5xCkC"},
		{stat: "win_league", marketID: "5qfGZ4RNEbQvLDBzRHsr"},
		{stat: "win_league", marketID: "pnDqs1bzLDIFSkIxYhwS"},
		{stat: "make_final", marketID: "V14zWAVeHkEx2X1MgyN0"},
		{stat: "make_quarters", marketID: "3W1fkKHJHS5kqgWp2p70"},
		{stat: "make_semis", marketID: "utBcCQjS0PMptnhgTkrs"},
	],
	WAL: [{stat: "make_round_of_16", marketID: "R5K7dVvC5aWc51BTdO6e"}],
	QAT: [{stat: "make_round_of_16", marketID: "Nw97oCX565OU29NTf5hj"}],
	URU: [
		{stat: "make_round_of_16", marketID: "IgQQLLHf3ZMwNBiSvQMu"},
		{stat: "make_quarters", marketID: "u2Gzw2B317llef1Zip8Y"},
	],
	FRA: [
		{stat: "make_round_of_16", marketID: "TmBYTQRmK4WmB9ccdBlF"},
		{stat: "make_final", marketID: "o5QYrLL1HG3m2upivu8R"},
		{stat: "make_quarters", marketID: "JLY3HZkXqGRdU4tsnRR3"},
		{stat: "make_semis", marketID: "0BQsGtMo1p8rYozUnPxU"},
	],
	SEN: [{stat: "make_round_of_16", marketID: "o6Dlx0cAOnobwPESo1rk"}],
	SRB: [
		{stat: "make_round_of_16", marketID: "YS3gaRISdsrtwcFp1Igm"},
		{stat: "win_league", marketID: "HC5niEB2nm2HD7uPn2JW"},
	],
	MEX: [{stat: "make_round_of_16", marketID: "iDmbPRsO6AQMYWRXPTHy"}],
	TUN: [{stat: "make_round_of_16", marketID: "WB4ZTEpE2SOzLc8KHg76"}],
	DEN: [
		{stat: "make_round_of_16", marketID: "Xx5s9aNT3SXPEgmeZoat"},
		{stat: "make_quarters", marketID: "AC10irlxbuoSF3VP7XBB"},
	],
	NET: [
		{stat: "make_round_of_16", marketID: "2HsbLKFbPnJD09FLEqa7"},
		{stat: "make_quarters", marketID: "seCDX4eQ2BTq0WHuhPo6"},
		{stat: "make_semis", marketID: "WnL6xEXh2ewR8lhUjC8i"},
	],
	IRN: [{stat: "make_round_of_16", marketID: "UZ70VpzMUIxXl5KU26pL"}],
	SUI: [
		{stat: "make_round_of_16", marketID: "1Lg5QvnL6xjXJ4RuBlCv"},
		{stat: "make_quarters", marketID: "PislhQDbrnREHMNun5Dv"},
	],
	CAN: [{stat: "make_round_of_16", marketID: "f0EJn03cDRjsWXNjGkbR"}],
	KSA: [{stat: "make_round_of_16", marketID: "x3fMvB7LYIsSPBBqOSej"}],
	JPN: [{stat: "make_round_of_16", marketID: "r4eAq9AF78YpX68THN3k"}],
	GHA: [{stat: "make_round_of_16", marketID: "VUSSNV58T90MraUTAxR6"}],
	POR: [
		{stat: "make_round_of_16", marketID: "NEEwrIxHvoT8TI7IZaaj"},
		{stat: "make_quarters", marketID: "Bes54Hucc6Yvr8KwieLu"},
		{stat: "make_semis", marketID: "Ioz4DYuvWejPxlbQj02R"},
	],
	POL: [{stat: "make_round_of_16", marketID: "rAsugkOqtp1dB0OHSvqt"}],
	MAR: [{stat: "make_round_of_16", marketID: "I8QE9iTGSsNfvRa0JyT5"}],
	CRC: [{stat: "make_round_of_16", marketID: "uZqmbYkJA23CmkHPVXRH"}],
	KOR: [{stat: "make_round_of_16", marketID: "RPaQMScP4iXlvv8mN5z1"}],
	AUS: [{stat: "make_round_of_16", marketID: "t4r0WYOcgKzY9ff68Ea2"}],
	CAM: [{stat: "make_round_of_16", marketID: "LACCw92jOggBORiQbNNo"}],
};

interface Team538Data {
	code: string,
	name: string,
	group: string,

	// Soccer Power Index
	global_rating: number,
	// chance of being #1 in group
	group_1: number,
	// chance of being #2 in group
	group_2: number,
	// chance of being #3 in group
	group_3: number,
	// chance of being #4 in group
	group_4: number,

	make_final: number,
	make_quarters: number,
	make_round_of_16: number,
	make_semis: number,
	make_third: number,
	win_league: number,
	win_third: number,

	current_points: number,

	global_d: number,
	global_o: number,
	group_1_d: number,
	group_1_o: number,
	group_2_d: number,
	group_2_o: number,

	[other: string]: any,
}

interface Match538Data {
	id: 401413770,
	datetime: string,
	status: 'pre' | 'post' | 'live',
	team1: string,
	team2: string,
	team1_code: string,
	team2_code: string,

	// prob of team 1 winning
	prob1: 0.24,
	// prob of team 2 winning
	prob2: 0.5,
	// prob of draw
	probtie: 0.26,

	live_winprobs?: {
	  status: string,
	  period: string,
	  min: number,
	  score1: number,
	  score2: number,
	  winprobs: Intermediate538MatchPrediction[],
	},
	[other: string]: any,
}

interface Intermediate538MatchPrediction {
	period: number,
	min: number,
	prob1: number,
	prob2: number,
	probtie: number,
}

const manifold = new Manifold(process.env.FTE_BOT_KEY);
let worldCupData: WorldCupData = (await getWorldCupData())!;

// returns null if no change or error
async function getWorldCupData(ifModifiedSince?: Date): Promise<WorldCupData | null> {
	let json;
	try {
		const result = await fetch("https://projects.fivethirtyeight.com/soccer-api/international/2022/world-cup/summary.json", {
			"credentials": "include",
			"headers": {
				"User-Agent": "FiveThirtyEight Trading Bot/1.0",
				"If-Modified-Since": ifModifiedSince?.toUTCString() || 'Mon, 21 Nov 2022 01:01:01 GMT',
			},
			"method": "GET",
		});
		if (result.status === 304) return null;
		json = await result.json();
	} catch (e) {
		log('538', `Error fetching 538 data: ${e}`);
		return null;
	}

	const wcData: WorldCupData = {
		teams: json.forecasts[0].teams,
		matches: json.matches,
		fetchedAt: new Date(),
		updatedAt: json.updated_at
	};
	/*
	for (const team of wcData.teams) {
		for (const [stat, stage, closeTime] of [
			['make_final', 'Finals', (new Date('December 14, 2022 23:59:59')).valueOf()],
			['make_quarters', 'Quarterfinals', (new Date('December 9, 2022 23:59:59')).valueOf()],
			['make_round_of_16', 'Round of 16', (new Date('December 2, 2022 23:59:59')).valueOf()],
			['make_semis', 'Semifinals', (new Date('December 10, 2022 23:59:59')).valueOf()],
			['win_league', 'Win World Cup', (new Date('December 14, 2022 23:59:59')).valueOf()],
		]) {
			if (teamBasedPredictions[team.code]?.some(p => p.stat === stat)) continue;
			if (!teamBasedPredictions[team.code]) teamBasedPredictions[team.code] = [];
			if (team[stat] < 0.20) continue;
			const description = `Resolves YES if ${team.name}'s Men's National Team ${stat === 'win_league' ? `wins` : `reaches the ${stage} of`} the 2022 FIFA World Cup in Qatar.`;
			const {slug} = await arae.createMarket({
				description,
				outcomeType: 'BINARY',
				question: `2022 World Cup: Will ${team.name} ${stat === 'win_league' ? `win` : `reach the ${stage}`}?`,
				//@ts-ignore
				closeTime,
				initialProb: 50,
				groupId: 'ujdSUUHAKLNPFSj2PTNX',
			});
			const market = await arae.getMarket({slug});
			teamBasedPredictions[team.code].push({
				stat,
				marketID: market.id,
			});

			await moveMarketToProb(team[stat], 100, market.id);
			console.log(JSON.stringify(teamBasedPredictions, null, 2));
		}
	}*/
	return wcData;
}



// record key is team code


const BUDGET = 20;
let isFirstTime = true;

export async function fiveThirtyEightLoop() {
	if (!isFirstTime) {
		const newData = await getWorldCupData(worldCupData?.fetchedAt);
		if (!newData || newData.updatedAt === worldCupData?.updatedAt) return;
		worldCupData = newData;
	} else {
		isFirstTime = false;
	}

	for (const team of worldCupData.teams) {
		const predictions = teamBasedPredictions[team.code];
		if (!predictions) continue;

		for (const {stat, marketID} of predictions) {
			const prob = team[stat];
			await moveMarketToProb(prob, BUDGET, marketID);
		}
	}
}

async function moveMarketToProb(prob: number, budget: number, marketID: string) {
	const market = await manifold.getMarket({id: marketID});
	if (!market) {
		log('538', `Error getting market ${marketID}`);
		return;
	}

	if (Math.abs(market.probability - prob) <= 0.01) return;

	// @ts-ignore
	const {betId} = await manifold.createBet({
		amount: budget,
		outcome: market.probability > prob ? 'NO' : 'YES',
		contractId: marketID,
		//@ts-ignore
		limitProb: Number(prob.toFixed(2)),
	});
	if (!betId) {
		log('538', `Potential error creating bet for market ${marketID}`);
	}

	await cancelLimitOrder(betId, manifold.apiKey!);
	log('538', `Moved market ${market.question} towards ${Math.round(prob * 100)}%`);
}