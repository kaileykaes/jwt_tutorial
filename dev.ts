#!/usr/bin/env -S deno run -A --watch=static/,routes/ --unstable

import dev from '$fresh/dev.ts';
import config from './fresh.config.ts';
import '$std/dotenv/load.ts';
import { Invalid } from './controllers/invalid.ts';

await dev(import.meta.url, './main.ts', config);

// Cleanup the dangling timer.
Invalid.instance.stop();
