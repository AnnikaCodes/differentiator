// Info about orders

type OrderStatus = 'active' | 'inactive';
type OrderType = 'ExpiringLimitOrder';

import * as fs from 'fs';
import { PublicFacingError } from './api';
import {Manifold} from 'manifold-sdk';

import sqlite from 'better-sqlite3';

abstract class Order {
    id: string;
    type: OrderType;
    apiKey: string;
    status: OrderStatus;
    createdAt: number;

    state: {[k: string]: any};

    constructor(type: OrderType, state: {[k: string]: any}, apiKey: string, status: OrderStatus, createdAt?: number, id?: string) {
        this.state = state;
        this.type = type;
        this.apiKey = apiKey;
        this.status = status;

        this.createdAt = createdAt || Date.now(); // default to now
        this.id = id || (Math.floor(Math.random() * 36**11)).toString(36);
    }

    // loop
    // return false to destroy the order
    abstract loop(): Promise<void | false>;
}


export interface ExpiringLimitOrderState {
    amount: number; // max amount to buy
    marketID: string; // market to bet in
    outcome: 'YES' | 'NO'; // outcome to bet on
    limitProb: number; // 0.001 - 0.999, probability to bet over/under
    expiresAt: number; // UNIX timestamp
    betID: string | null; // bet ID
    type: 'ExpiringLimitOrder'; // type of order
}

export class ExpiringLimitOrder extends Order {
    state: ExpiringLimitOrderState;
    constructor(
        state: ExpiringLimitOrderState,
        apiKey: string,
        status: OrderStatus,
        createdAt?: number,
        id?: string
    ) {
        super('ExpiringLimitOrder', state, apiKey, status, createdAt, id);
        if (state.outcome !== 'YES' && state.outcome !== 'NO') {
            throw new PublicFacingError(`Invalid outcome: '${state.outcome}'`);
        }
        if (state.limitProb < 0.001 || state.limitProb > 0.999) {
            throw new PublicFacingError(`Invalid limitProb: '${state.limitProb}'`);
        }
    }

    async placeBet() {
        const manifold = new Manifold(this.apiKey);
        const bet = (await manifold.createBet({
            amount: this.state.amount,
            contractId: this.state.marketID,
            outcome: this.state.outcome,
            // @ts-ignore upstream library is dumbdumb
            limitProb: this.state.limitProb,
        }) as any).betId;
        log(
            this.apiKey,
            `placed a limit order for M$${this.state.amount} of ${this.state.outcome} ` +
            `${this.state.outcome === 'YES' ? 'below' : 'above'} ${this.state.limitProb * 100}% ` +
            `on market '${this.state.marketID}' - bet ID '${bet}' - should expire at ${new Date(this.state.expiresAt).toLocaleString()}`
        );
        this.state.betID = bet;
        saveOrder(this);
    }

    async loop(): Promise<void | false> {
        if (this.state.betID && Date.now() > this.state.expiresAt) {
            // expire the order
            try {
                await cancelLimitOrder(this.state.betID, this.apiKey); // TODO implement
                return false;
            } catch (e) {
                log(this.apiKey, `error cancelling bet ${this.state.betID}: ${e}`);
                this.state.expiresAt += 60 * 1000; // try again in a minute
                saveOrder(this);
            }
        }

    }
}

export async function cancelLimitOrder(id: string, apiKey: string) {
    const result = await fetch(`https://manifold.markets/api/v0/bet/cancel/${id}`, {
        method: 'POST',
        headers: {
            Authorization: `Key ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({betId: id}),
    });
    const json = await result.json();
    if (!json.isCancelled) throw new PublicFacingError(`failed to cancel bet ${id}`);
    log(apiKey, `cancelled limit order ${id}`); // TODO check result
}

const ORDERS_DATABASE = 'orders.db';
const LOG_FILE = 'trades.log';

export const sql = sqlite(ORDERS_DATABASE);
sql.exec(`PRAGMA journal_mode=WAL;`);
const SELECT_ALL_ORDERS = sql.prepare('SELECT * FROM orders');
const SELECT_ORDER_BY_ID = sql.prepare<[string]>('SELECT * FROM orders WHERE id = ?');
const SELECT_ORDERS_BY_API_KEY = sql.prepare<[string]>('SELECT * FROM orders WHERE api_key = ?');
const SAVE_ORDER = sql.prepare<[string, OrderType, OrderStatus, number, string, string]>(
    'INSERT OR REPLACE INTO orders (id, type, status, created_at, api_key, state_json) VALUES (?, ?, ?, ?, ?, ?)'
);
const DELETE_ORDER = sql.prepare<[string]>('DELETE FROM orders WHERE id = ?'); // delete order from database


export function log(key: string, msg: string) {
    const toLog = `${new Date().toLocaleString()}: ${key}: ${msg}`;
    console.log(toLog); // log to console
    fs.appendFileSync(LOG_FILE, toLog + '\n');
}


function sqlToOrder(row: any) {
    const {id, type, status, created_at, api_key, state_json} = row;
    const state = JSON.parse(state_json); // parse state JSON
    switch (type) {
        case 'ExpiringLimitOrder':
            return new ExpiringLimitOrder(state, api_key, status, created_at, id);
        default:
            throw new Error(`unknown order type: ${type}`);
    }
}

function getAllOrders() {
    return SELECT_ALL_ORDERS.all().map(sqlToOrder);
}

export function saveOrder(order: Order) {
    // save orders to file
    SAVE_ORDER.run(
        order.id,
        order.type,
        order.status,
        order.createdAt,
        order.apiKey,
        JSON.stringify(order.state),
    );
}

export function deleteOrder(id: string) {
    DELETE_ORDER.run(id);
}

export function getOrderByID(id: string) {
    return sqlToOrder(SELECT_ORDER_BY_ID.get(id)); // get order from database
}

export function getOrdersByAPIKey(key: string) {
    return SELECT_ORDERS_BY_API_KEY.all(key).map(sqlToOrder); // get orders from database
}


export async function executeOrders() {
    // execute orders
    for (const order of getAllOrders()) {
        const result = await order.loop();
        if (result === false) {
            deleteOrder(order.id);
        }
    }
}


async function getGroupMarkets(id: string) {
	return await (await fetch(`https://manifold.markets/api/v0/group/by-id/${id}/markets`)).json();
}

