// One simulation job for matrix.ts: prints the variant summary as JSON.
import { runVariant, type Variant } from './core';

const [variantJson, games, firstSeed] = process.argv.slice(2);
process.stdout.write(JSON.stringify(runVariant(JSON.parse(variantJson) as Variant, Number(games), Number(firstSeed ?? 1))));
