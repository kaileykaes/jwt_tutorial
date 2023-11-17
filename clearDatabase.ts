#!/usr/bin/env -S deno run --unstable
// WARNING: deletes the entire database

import { Keyed } from './database/keyed.ts';

let count = 0;
for await (const { key } of Keyed.kv.list({ prefix: [] })) {
  await Keyed.kv.delete(key);
  count++;
}
console.log(`Deleted ${count} records`);
