#!/usr/bin/env -S deno run --unstable
// WARNING: deletes the entire database

import { Keyed } from './database/keyed.ts';
import { parse } from '$std/flags/mod.ts';

const { verbose } = parse(Deno.args, {
  boolean: ['verbose'],
  alias: {
    v: 'verbose',
  },
});

let count = 0;
for await (const { key } of Keyed.kv.list({ prefix: [] })) {
  if (verbose) {
    console.log(key);
  }
  await Keyed.kv.delete(key);
  count++;
}
console.log(`Deleted ${count} records`);

Deno.exit(count ? 1 : 0);
