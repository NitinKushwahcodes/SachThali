// One-time batch script generating vector embeddings for all dishes in indian-dishes.json.
// Concatenates name, aliases, and description fields, invokes embeddingClient, and exports JSON.
// Outputs indian-dishes.embeddings.json file consumed by vectorStore during server startup.

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { embedText } from './embeddingClient.js';
import { validateEnv } from '../../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Reads dish dataset, generates vector embeddings sequentially, and saves embeddings file.
export async function buildEmbeddingsDataset() {
  validateEnv();

  const inputPath = path.resolve(__dirname, '../../data/indian-dishes.json');
  const outputPath = path.resolve(__dirname, '../../data/indian-dishes.embeddings.json');

  const rawData = await fs.readFile(inputPath, 'utf-8');
  const dishes = JSON.parse(rawData);

  console.log(`[DATASET BUILDER] Processing ${dishes.length} dishes for vector embedding creation...`);

  const embeddedDishes = [];
  for (let i = 0; i < dishes.length; i++) {
    const dish = dishes[i];
    const familyText = dish.family ? ` Family: ${dish.family}.` : '';
    const textToEmbed = `${dish.name}.${familyText} Aliases: ${dish.aliases ? dish.aliases.join(', ') : ''}. Description: ${dish.oneLineDescription || ''}`;
    
    console.log(`[${i + 1}/${dishes.length}] Embedding dish: ${dish.name}`);
    try {
      const vector = await embedText(textToEmbed);
      embeddedDishes.push({
        ...dish,
        vector,
      });
      // Small pause to prevent hitting API rate limits during bulk generation
      await new Promise((res) => setTimeout(res, 200));
    } catch (err) {
      console.error(`Failed to embed dish ${dish.name}: ${err.message}`);
    }
  }

  await fs.writeFile(outputPath, JSON.stringify(embeddedDishes, null, 2), 'utf-8');
  console.log(`[DATASET BUILDER] Saved ${embeddedDishes.length} embedded dishes to ${outputPath}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildEmbeddingsDataset().catch((err) => {
    console.error('Fatal error during embedding dataset generation:', err);
    process.exit(1);
  });
}
