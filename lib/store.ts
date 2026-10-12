import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = process.env.VERCEL ? "/tmp/trendforge" : path.join(process.cwd(), "data");
const SEED_DIR = path.join(process.cwd(), "seed");

export const isSeedMode = () => process.env.USE_SEED_DATA === "true";

async function readFile<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
}

export const readSeed = <T>(name: string) => readFile<T>(path.join(SEED_DIR, `${name}.json`));

export const readData = <T>(name: string) => readFile<T>(path.join(DATA_DIR, `${name}.json`));

export async function writeData(name: string, value: unknown) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, `${name}.json`), JSON.stringify(value, null, 2));
}

export async function readDataOrSeed<T>(name: string): Promise<T | null> {
  if (isSeedMode()) return readSeed<T>(name);
  return (await readData<T>(name)) ?? readSeed<T>(name);
}
