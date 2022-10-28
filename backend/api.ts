// API stuff
import fastify, {
    FastifyInstance, FastifyPluginOptions, FastifyReply,
    FastifyRequest, HookHandlerDoneFunction, FastifyError,
} from 'fastify';
import type {FromSchema} from 'json-schema-to-ts';
import { deleteOrder, ExpiringLimitOrder, ExpiringLimitOrderState, getOrderByID, getOrdersByAPIKey, saveOrder } from './orders';

export class PublicFacingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PublicFacingError';
    }
}

export async function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
    if (error.name === 'PublicFacingError') {
        await reply.status(500).send({error: error.message});
    } else {
        console.error(`ERROR: ${error.stack as string}`);
        await reply.status(500).send({error: ':('});
    }
}

function getKey(auth: string) {
    const [type, key] = auth.split(' ');
    if (type !== 'Key') {
        throw new PublicFacingError(`Invalid authentication type: '${type}' in '${auth}'`);
    }
    return key.trim();
}


const expiringLimitOrderSchema = {
    type: 'object',
    properties: {
        // comma separated
        amount: {type: 'number'},
        marketID: {type: 'string'}, // market to bet in
        outcome: {type: 'string'}, // outcome to bet on
        limitProb: {type: 'number'},
        expiresAt: {type: 'number'}, // UNIX timestamp
    },
    required: ['amount', 'marketID', 'outcome', 'limitProb', 'expiresAt'], // comma separated
} as const;

const deleteOrderSchema = {
    type: 'object',
    properties: {
        id: {type: 'string'},
    },
    required: ['id'],
} as const;

export function addRoutes(server: FastifyInstance, options: FastifyPluginOptions, done: HookHandlerDoneFunction) {
    // gets the orders for a user
    server.get<{Headers: {authorization: string}}>(
        '/orders',
        {schema: {headers: {type: 'object', required: ['authorization']}}},
        async request => {
            const key = getKey(request.headers.authorization);
            return {orders: getOrdersByAPIKey(key)};
        },
    );

    // creates a new custom limit order
    server.post<{Headers: {authorization: string}, Querystring: FromSchema<typeof expiringLimitOrderSchema>}>(
        '/orders/expiringLimit',
        {schema: {headers: {type: 'object', required: ['authorization']}, querystring: expiringLimitOrderSchema}},
        async request => {
            const key = getKey(request.headers.authorization); // TODO fix this
            if (request.query.outcome !== 'YES' && request.query.outcome !== 'NO') {
                throw new PublicFacingError(`Invalid outcome: '${request.query.outcome}'`);
            }
            if (request.query.expiresAt < Date.now()) {
                throw new PublicFacingError("order expires in the past");
            }

            const state: ExpiringLimitOrderState = {
                amount: request.query.amount,
                marketID: request.query.marketID,
                outcome: request.query.outcome,
                limitProb: request.query.limitProb,
                expiresAt: request.query.expiresAt,
                betID: null,
                type: 'ExpiringLimitOrder',
            };
            const order = new ExpiringLimitOrder(state, key, 'active');
            await order.placeBet(); // place the bet immediately
            saveOrder(order);
            return {id: order.id};
        },
    );

    // deletes an order
    server.delete<{Headers: {authorization: string}, Querystring: FromSchema<typeof deleteOrderSchema>}>(
        '/orders',
        {schema: {headers: {type: 'object', required: ['authorization']}, querystring: deleteOrderSchema}},
        async request => {
            const key = getKey(request.headers.authorization);
            const order = getOrderByID(request.query.id);
            if (order.apiKey !== key) {
                throw new PublicFacingError('Wrong API key');
            }
            deleteOrder(request.query.id);
            return {success: true}; // return success
        },
    );

    server.get('/', async (request, reply) => {
        return reply
            .type('text/html')
            .send('Differentiator API. Use the interface at <a href="https://dx.soupy.me">https://dx.soupy.me</a>.');
    });

    server.get('/ping', async request => ({up: true}));

    done();
}
