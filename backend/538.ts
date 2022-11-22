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

	return {
		teams: json.forecasts[0].teams,
		matches: json.matches,
		fetchedAt: new Date(),
		updatedAt: json.updated_at
	};
}

// record key is team code
const teamBasedPredictions: Record<string, {stat: keyof Team538Data, marketID: string}[]> = {
	'GER': [
		{stat: 'make_round_of_16', marketID: 'YFm9Va8cYKzB3gYy5OCJ'},
		{stat: 'make_quarters', marketID: 'oU9BbZHBRs7UwREZJdOO'}
	],
	'BEL': [{stat: 'make_round_of_16', marketID: 'WJnsKI1GPChi5JYK5up5'}],
	'USA': [
		{stat: 'make_round_of_16', marketID: '8v2GLnq8gl7oaRLLxFS8'},
		{stat: 'make_round_of_16', marketID: 'UcqgVRxmPIcRmukmvtLf'},
		{stat: 'make_quarters', marketID: 'c3Rx5dl8or1DW9jZQlPD'},
	],
	'CRO': [{stat: 'make_round_of_16', marketID: 'IUawuWAQhqyzU7jcdqOI'}],
	'ARG': [
		{stat: 'make_round_of_16', marketID: 'CcR4ni6oUXhWp8usYMtb'},
		{stat: 'win_league', marketID: 'ZvniYi4y5VFgrl22Ge0V'},
		{stat: 'win_league', marketID: 'XCq9yD0FHY0oYAGpBKro'},
	],
	'ECU': [{stat: 'make_round_of_16', marketID: 'V6g3VM27Z4S3HjzcJasy'}],
	'ENG': [
		{stat: 'make_round_of_16', marketID: 'GZAbSkvyC3DtUr6fLefp'},
		{stat: 'make_semis', marketID: 'k0Bqx1e8QqC2WQ9PQvKa'},
	],
	'ESP': [{stat: 'make_round_of_16', marketID: 'ZAcvJZFcyPXmqK0xckkn'}],
	'BRA': [
		{stat: 'make_round_of_16', marketID: 'aKf7U3BCWP2kjKO5xCkC'},
		{stat: 'win_league', marketID: '5qfGZ4RNEbQvLDBzRHsr'},
		{stat: 'win_league', marketID: 'pnDqs1bzLDIFSkIxYhwS'},
	],
	'WAL': [{stat: 'make_round_of_16', marketID: 'R5K7dVvC5aWc51BTdO6e'}],
	'QAT': [{stat: 'make_round_of_16', marketID: 'Nw97oCX565OU29NTf5hj'}],
	'URU': [{stat: 'make_round_of_16', marketID: 'IgQQLLHf3ZMwNBiSvQMu'}],
	'FRA': [{stat: 'make_round_of_16', marketID: 'TmBYTQRmK4WmB9ccdBlF'}],
	'SEN': [{stat: 'make_round_of_16', marketID: 'o6Dlx0cAOnobwPESo1rk'}],
	'SRB': [
		{stat: 'make_round_of_16', marketID: 'YS3gaRISdsrtwcFp1Igm'},
		{stat: 'win_league', marketID: 'HC5niEB2nm2HD7uPn2JW'},
	],
	'MEX': [{stat: 'make_round_of_16', marketID: 'iDmbPRsO6AQMYWRXPTHy'}],
	'TUN': [{stat: 'make_round_of_16', marketID: 'WB4ZTEpE2SOzLc8KHg76'}],
	'DEN': [{stat: 'make_round_of_16', marketID: 'Xx5s9aNT3SXPEgmeZoat'}],
	'NET': [{stat: 'make_round_of_16', marketID: '2HsbLKFbPnJD09FLEqa7'}],
	'IRN': [{stat: 'make_round_of_16', marketID: 'UZ70VpzMUIxXl5KU26pL'}],
	'SUI': [{stat: 'make_round_of_16', marketID: '1Lg5QvnL6xjXJ4RuBlCv'}],
	'CAN': [{stat: 'make_round_of_16', marketID: 'f0EJn03cDRjsWXNjGkbR'}],
	'KSA': [{stat: 'make_round_of_16', marketID: 'x3fMvB7LYIsSPBBqOSej'}],
	'JPN': [{stat: 'make_round_of_16', marketID: 'r4eAq9AF78YpX68THN3k'}],
	'GHA': [{stat: 'make_round_of_16', marketID: 'VUSSNV58T90MraUTAxR6'}],
	'POR': [{stat: 'make_round_of_16', marketID: 'NEEwrIxHvoT8TI7IZaaj'}],
	'POL': [{stat: 'make_round_of_16', marketID: 'rAsugkOqtp1dB0OHSvqt'}],
	'MAR': [{stat: 'make_round_of_16', marketID: 'I8QE9iTGSsNfvRa0JyT5'}],
	'CRC': [{stat: 'make_round_of_16', marketID: 'uZqmbYkJA23CmkHPVXRH'}],
	'KOR': [{stat: 'make_round_of_16', marketID: 'RPaQMScP4iXlvv8mN5z1'}],
	'AUS': [{stat: 'make_round_of_16', marketID: 't4r0WYOcgKzY9ff68Ea2'}],
	'CAM': [{stat: 'make_round_of_16', marketID: 'LACCw92jOggBORiQbNNo'}],

};


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