// Index file for backend of Differentiator

process.env.NODE_ENV = 'production';

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { addRoutes, errorHandler } from './api';
import { executeOrders, log } from './orders';
import { fiveThirtyEightLoop} from './538';

async function start() {
    const server = Fastify();
    server.setErrorHandler(errorHandler); // set error handler
    await server.register(addRoutes); // add routes
    await server.register(cors);


    const address = await server.listen({ port: 3000, host: '::1' });
    log('server', `server listening at ${address}`);
}

let numloops = 0;
async function loop() {
    const start = Date.now(); // start time
    await executeOrders();
    const delta = Date.now() - start; // end time

    numloops++;
    if (numloops % 1000 === 0) log('server', `loop #${numloops} took ${delta} ms`); // log time taken
    if (numloops === Number.MAX_SAFE_INTEGER) {
        numloops = 0;
        log('server', 'reset loop count');
    }

    if (numloops % 10 === 0) {
        try {
		    await fiveThirtyEightLoop();
	    } catch (e) {
		   log('538', e);
	    }
    }
    setTimeout(loop, 1000 + delta); // loop again in 1s
}

loop();
start();
