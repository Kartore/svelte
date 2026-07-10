import type { RequestHandler } from './$types';
import { adapterApiHandlers } from 'virtual:kartore-adapter/server';

const forward: RequestHandler = async ({ request, platform }) => {
	const handlerId = new URL(request.url).pathname.split('/')[2];
	const handler = adapterApiHandlers.find(({ id }) => id === handlerId);
	if (!handler) return new Response('Not found', { status: 404 });

	return handler.fetch(request, platform?.env, platform?.ctx as ExecutionContext);
};

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const DELETE = forward;
export const PATCH = forward;
export const OPTIONS = forward;
export const HEAD = forward;
