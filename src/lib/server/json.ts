function bigIntReplacer(_key: string, value: unknown): unknown {
	return typeof value === 'bigint' ? Number(value) : value;
}

export function json(data: unknown, init: ResponseInit = {}): Response {
	const body = JSON.stringify(data, bigIntReplacer);
	const headers = new Headers(init.headers);
	if (!headers.has('content-type')) headers.set('content-type', 'application/json');
	return new Response(body, { ...init, headers });
}


