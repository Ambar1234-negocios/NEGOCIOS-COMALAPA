import { createHandler } from './handler.mjs';

// Gateway JWT verification is disabled because publishable keys are not JWTs.
// The handler validates the user's token with Auth and checks admin membership.
Deno.serve(createHandler({ env: (name: string) => Deno.env.get(name) }));
