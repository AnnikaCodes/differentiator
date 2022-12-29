process.env.NODE_ENV = 'production';
import {config} from 'dotenv';
config();
import {Manifold} from 'manifold-sdk';
import {cancelLimitOrder, log} from './orders';
import * as fs from 'fs';

const manifold = new Manifold(process.env.FTE_BOT_KEY);

/*
 * Old - for the 2022 FIFA World Cup
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
*/

type PremierLeagueData = PremierLeagueMatch[];
interface PremierLeagueMatch {
	id: number,
    league_id: number,
    datetime: string, // '2022-10-18T19:15:00Z',
    status: 'pre' | 'post' | 'live',
    leg: null,
    team1: string,
    team2: string,
    team1_id: number,
    team2_id: number,
    team1_code: string,
    team2_code: string,
    prob1: number,
    prob2: number,
    probtie: number,
    round: null,
    matchday: null,

    score1?: number,
    score2?: number,
    adj_score1?: number,
    adj_score2?: number,
}

let premierLeagueData: PremierLeagueData;
let lastLoopRun = 0;
// record key is match ID
type PremierLeagueMarkets = Record<number, {greater_score: 1 | 2 | 'tie', marketID: string, autoResolve?: boolean}[]>;
const premierLeagueMarketsFile = 'premierLeagueMarkets.json';
function loadPremierLeagueMarkets(): PremierLeagueMarkets | null {
	try {
		const data = fs.readFileSync(premierLeagueMarketsFile);
		return JSON.parse(data.toString());
	} catch (e) {
		return null;
	}
}

function savePremierLeagueMarkets(markets: PremierLeagueMarkets) {
	fs.writeFileSync(premierLeagueMarketsFile, JSON.stringify(markets));
	log('538', `Saved ${Object.keys(premierLeagueMarkets).length} Premier League markets.`);
}

const premierLeagueMarkets: PremierLeagueMarkets = loadPremierLeagueMarkets() || {
	401447467: [{
		greater_score: 1,
		marketID: "eCteZF5PbZ67SBBUG27s",
		autoResolve: true
	}],
	401447469: [{
		greater_score: 1,
		marketID: "cH8A2CYMz6gR6IWqYINW",
		autoResolve: true
	}],
	401447575: [{
		greater_score: 1,
		marketID: "yduTJkjeS4ZTKh06jYWG",
		autoResolve: true
	}],
	401447576: [{
		greater_score: 1,
		marketID: "9xWvx5IcHSvt3SdCjijL",
		autoResolve: true
	}],
	401447577: [{
		greater_score: 1,
		marketID: "4QTb4cANeQzXNQS9lZnn",
		autoResolve: true
	}],
	401447578: [{
		greater_score: 1,
		marketID: "kgUhAPMf4eWrfBmKldcw",
		autoResolve: true
	}],
	401447579: [{
		greater_score: 1,
		marketID: "pfpH8V40tc8GWcB2Uzp7",
		autoResolve: true
	}],
	401447580: [{
		greater_score: 1,
		marketID: "Y0fUlgO3aycScTdNJ5LX",
		autoResolve: true
	}],
	401447581: [{
		greater_score: 1,
		marketID: "MUIRX1bs2XFsGfYhdJ1h",
		autoResolve: true
	}],
	401447582: [{
		greater_score: 1,
		marketID: "umKHSkixFjMCL7EjJBpS",
		autoResolve: true
	}],
	401447583: [{
		greater_score: 1,
		marketID: "KqwfGmuEbAmwJhqphBN9",
		autoResolve: true
	}],
	401447584: [{
		greater_score: 1,
		marketID: "IGYVUbvezJ38UharJQil",
		autoResolve: true
	}],
	401447585: [{
		greater_score: 1,
		marketID: "GTaz6OcJQ4PMtlXghMwp",
		autoResolve: true
	}],
	401447586: [{
		greater_score: 1,
		marketID: "FtmMSEtxkeWVOg4sbZaW",
		autoResolve: true
	}],
	401447587: [{
		greater_score: 1,
		marketID: "lfFyOxZ44rQ71Z3IIJ1M",
		autoResolve: true
	}],
	401447588: [{
		greater_score: 1,
		marketID: "mNBsyigaBbs7vQEamRSD",
		autoResolve: true
	}],
	401447589: [{
		greater_score: 1,
		marketID: "Uo0CJOjBZdxspiqxS08p",
		autoResolve: true
	}],
	401447590: [{
		greater_score: 1,
		marketID: "TYVgrXN0feE3eD5kuz2l",
		autoResolve: true
	}],
	401447591: [{
		greater_score: 1,
		marketID: "Y5IDEwRrID6K89SJ86uq",
		autoResolve: true
	}],
	401447592: [{
		greater_score: 1,
		marketID: "4WxfuSgHdCj8REkCuowo",
		autoResolve: true
	}],
	401447593: [{
		greater_score: 1,
		marketID: "GqZsZElfZTxQJKnmoPlm",
		autoResolve: true
	}],
	401447594: [{
		greater_score: 1,
		marketID: "kWeikomtywTz2AGbFJHX",
		autoResolve: true
	}],
	401447595: [{
		greater_score: 1,
		marketID: "WYHbwTSDZ8CnIrs5PaGi",
		autoResolve: true
	}],
	401447596: [{
		greater_score: 1,
		marketID: "C28A0XGnO0Fnj8NqoozW",
		autoResolve: true
	}],
	401447597: [{
		greater_score: 1,
		marketID: "zgcZC3U0gxqtZLD5rzoz",
		autoResolve: true
	}],
	401447598: [{
		greater_score: 1,
		marketID: "sQRXPzg8PkgzcYmjUcmS",
		autoResolve: true
	}],
	401447599: [{
		greater_score: 1,
		marketID: "L8oC0hYnPwjAjEq17CV9",
		autoResolve: true
	}],
	401447600: [{
		greater_score: 1,
		marketID: "H5yC94akSYMJKZ17XSWQ",
		autoResolve: true
	}],
	401447601: [{
		greater_score: 1,
		marketID: "mqo6GbSKlU2bVruA6sWR",
		autoResolve: true
	}],
	401447602: [{
		greater_score: 1,
		marketID: "toUIKo7vEB1yoj9GXm3q",
		autoResolve: true
	}],
	401447603: [{
		greater_score: 1,
		marketID: "rdQHIWR5CpiUCk3RpCVm",
		autoResolve: true
	}],
	401447604: [{
		greater_score: 1,
		marketID: "iHY6dGjZ5uv2pVmFxAvJ",
		autoResolve: true
	}],
	401447605: [{
		greater_score: 1,
		marketID: "nBAPulwb6O0CCM6Ty6zz",
		autoResolve: true
	}],
	401447606: [{
		greater_score: 1,
		marketID: "FN9xtRSlTiPCQsrBytMg",
		autoResolve: true
	}],
	401447607: [{
		greater_score: 1,
		marketID: "aERQdyIw1aT5qS1U6Plz",
		autoResolve: true
	}],
	401447608: [{
		greater_score: 1,
		marketID: "zXXPJczrZaOGritwN6sG",
		autoResolve: true
	}],
	401447609: [{
		greater_score: 1,
		marketID: "BlAxDjtbQziTo3VdnVqL",
		autoResolve: true
	}],
	401447610: [{
		greater_score: 1,
		marketID: "AS0quhki4dD999qLOpCJ",
		autoResolve: true
	}],
	401447611: [{
		greater_score: 1,
		marketID: "HvwphNDw9K0vFL7Ugu2G",
		autoResolve: true
	}],
	401447612: [{
		greater_score: 1,
		marketID: "eD4gYT5xXM734fsRrw55",
		autoResolve: true
	}],
	401447613: [{
		greater_score: 1,
		marketID: "4ElkfHGElJV4V55d7omr",
		autoResolve: true
	}],
	401447614: [{
		greater_score: 1,
		marketID: "CPkIl4k0tqJhyPmC8Ptv",
		autoResolve: true
	}],
 };

async function getPremierLeagueData(ifModifiedSince?: number): Promise<PremierLeagueData | null> {
	try {
		const result = await fetch("https://projects.fivethirtyeight.com/soccer-predictions/forecasts/2022_premier-league_matches.json", {
			"credentials": "include",
			"headers": {
				"User-Agent": "FiveThirtyEight Trading Bot/1.0",
			},
			"method": "GET",
		});
		if (result.status === 304) return null;
		const lastModified = result.headers.get('last-modified');
		if (lastModified && ifModifiedSince) {
			const lastModifiedTime = (new Date(lastModified)).getTime();
			if (lastModifiedTime < ifModifiedSince) return null;
		}
		let json: PremierLeagueData = await result.json();
		return json;
	} catch (e) {
		log('538', `Error fetching 538 data: ${e}`);
		return null;
	}
}



// record key is team code


let isFirstTime = true;

export async function fiveThirtyEightLoop() {
	const newData = await getPremierLeagueData(lastLoopRun);
	// run every hour or when new data is available
	if (newData === null) {
		if (lastLoopRun > (Date.now() - 1000 * 60 * 60 * 1)) return;
	} else {
		premierLeagueData = newData;
	}

	lastLoopRun = Date.now();

	let marketsCreated = 0;

	let activePremierLeagueMarkets = 0;
	for (const match of premierLeagueData) {
		for (const [index, market] of premierLeagueMarkets[match.id]?.entries() || []) {
			const data = await manifold.getMarket({id: market.marketID});
			// closed markets?
			if (!data.isResolved) {
				activePremierLeagueMarkets++;
			} else {
				premierLeagueMarkets[match.id].splice(index, 1);
			}
		}
	}
	const budget = (await manifold.getMe()).balance / (activePremierLeagueMarkets * 10)
	for (const match of premierLeagueData) {
		const matchDate = new Date(match.datetime);
		if (premierLeagueMarkets[match.id]?.length) continue;
		if (!premierLeagueMarkets[match.id]) premierLeagueMarkets[match.id] = [];

		// only create markets for matches in the next 30 days
		if (matchDate.getTime() < Date.now() || matchDate.getTime() > (Date.now() + 1000 * 60 * 60 * 24 * 30)) continue;

		let description = `Resolves YES if ${match.team1} wins against ${match.team2} on ${matchDate.toLocaleDateString()}.`;
		description += `\nResolves NO if ${match.team2} wins or the match ends in a draw.`;
		description += `\n\nThis market is automatically resolved by a bot based on FiveThirtyEight data.`;
		// 3 hours after the match starts, to allow for penalties, etc.
		const closeTime = matchDate.getTime() + 1000 * 60 * 60 * 3;
		const question = `Premier League Football: Will ${match.team1} win against ${match.team2}?`;
		try {
			const {slug} = await manifold.createMarket({
				description,
				outcomeType: 'BINARY',
				question,
				//@ts-ignore
				closeTime,
				initialProb: 50,
				//@ts-ignore
				groupId: '5gsW3dPR3ySBRZCodrgm',
			});
			const market = await manifold.getMarket({slug});
			premierLeagueMarkets[match.id].push({
				greater_score: 1,
				marketID: market.id,
				autoResolve: true,
			});

			await moveMarketToProb(match.prob1, 100, market.id);
			marketsCreated++;
		} catch (e) {
			log('538', `Error creating market '${question}' with ${process.env.NODE_ENV}: ${e}`);
		}

		for (const market of premierLeagueMarkets[match.id] || []) {
			// market resolution
			if (market.autoResolve && match.status === 'post' && match.score1 !== undefined && match.score2 !== undefined) {
				let isYes: boolean;
				if (market.greater_score === 'tie') {
					isYes = match.score1 === match.score2;
				} else if (market.greater_score === 1) {
					isYes = match.score1 > match.score2;
				} else if (market.greater_score === 2) {
					isYes = match.score1 < match.score2;
				} else {
					throw new Error(`Invalid greater_score value: ${market.greater_score}`)
				}

				const marketName = (await manifold.getMarket({id: market.marketID})).question;
				await manifold.resolveMarket({marketId: market.marketID, outcome: isYes ? 'YES' : 'NO'});
				log('538', `Resolved market '${marketName}' to ${isYes ? 'YES' : 'NO'}.`);
			} else {
				// bet
				const matchTime = (new Date(match.datetime)).getTime();
				// only bet if match is in the future
				if (matchTime > Date.now()) {
					const targetProb = match['prob' + market.greater_score];
					const marketProb = (await manifold.getMarket({id: market.marketID})).probability;
					if (Math.abs(targetProb - marketProb) > 0.02) await moveMarketToProb(targetProb, budget, market.marketID);
				}
			}
		}
	}

	if (marketsCreated) {
		log('538', `Created ${marketsCreated} Premier League markets.`);
		log('538', JSON.stringify(premierLeagueMarkets, null, 2));
		savePremierLeagueMarkets(premierLeagueMarkets);
	}
}
savePremierLeagueMarkets(premierLeagueMarkets);
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