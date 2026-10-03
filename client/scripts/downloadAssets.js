import fs from 'fs';
import https from 'https';
import path from 'path';

const downloadImage = (url, filepath) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        res.pipe(fs.createWriteStream(filepath))
           .on('error', reject)
           .once('close', () => resolve(filepath));
      } else if (res.statusCode === 301 || res.statusCode === 302) {
        downloadImage(res.headers.location, filepath).then(resolve).catch(reject);
      } else {
        res.resume();
        reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));
      }
    });
  });
};

const imagesDirectory = path.join(process.cwd(), 'public', 'images', 'products');

// Ensure directory exists
if (!fs.existsSync(imagesDirectory)) {
  fs.mkdirSync(imagesDirectory, { recursive: true });
}

// Map of image types to known high-quality Unsplash menswear IDs
const photoMap = {
  tops: 'https://images.unsplash.com/photo-1596755095609-ed286d0151f1?auto=format&fit=crop&w=800&q=80',
  tops_model: 'https://images.unsplash.com/photo-1516257984-b1b21706059e?auto=format&fit=crop&w=800&q=80',
  bottoms: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?auto=format&fit=crop&w=800&q=80',
  bottoms_model: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80',
  sets: 'https://images.unsplash.com/photo-1620799140408-3533be6c25b3?auto=format&fit=crop&w=800&q=80',
  sets_model: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=800&q=80'
};

const filesToGenerate = [
  // Sets
  { name: 'linen-set-1.jpg', type: 'sets' }, { name: 'linen-set-2.jpg', type: 'sets_model' }, { name: 'linen-set-3.jpg', type: 'sets_model' },
  { name: 'lounge-set-1.jpg', type: 'sets' }, { name: 'lounge-set-2.jpg', type: 'sets_model' },
  // Tops
  { name: 'essential-tee-1.jpg', type: 'tops' }, { name: 'essential-tee-2.jpg', type: 'tops_model' },
  { name: 'henley-1.jpg', type: 'tops' }, { name: 'henley-2.jpg', type: 'tops_model' },
  { name: 'polo-1.jpg', type: 'tops' }, { name: 'polo-2.jpg', type: 'tops_model' },
  { name: 'longsleeve-1.jpg', type: 'tops' }, { name: 'longsleeve-2.jpg', type: 'tops_model' },
  { name: 'hoodie-1.jpg', type: 'tops' }, { name: 'hoodie-2.jpg', type: 'tops_model' },
  { name: 'sweatshirt-1.jpg', type: 'tops' }, { name: 'sweatshirt-2.jpg', type: 'tops_model' },
  { name: 'quarterzip-1.jpg', type: 'tops' }, { name: 'quarterzip-2.jpg', type: 'tops_model' },
  { name: 'sweater-1.jpg', type: 'tops' }, { name: 'sweater-2.jpg', type: 'tops_model' },
  { name: 'overshirt-1.jpg', type: 'tops' }, { name: 'overshirt-2.jpg', type: 'tops_model' },
  { name: 'pocket-tee-1.jpg', type: 'tops' }, { name: 'pocket-tee-2.jpg', type: 'tops_model' },
  { name: 'chunky-sweater-1.jpg', type: 'tops' }, { name: 'chunky-sweater-2.jpg', type: 'tops_model' },
  // Bottoms
  { name: 'trousers-1.jpg', type: 'bottoms' }, { name: 'trousers-2.jpg', type: 'bottoms_model' },
  { name: 'chinos-1.jpg', type: 'bottoms' }, { name: 'chinos-2.jpg', type: 'bottoms_model' },
  { name: 'jeans-1.jpg', type: 'bottoms' }, { name: 'jeans-2.jpg', type: 'bottoms_model' },
  { name: 'jeans-black-1.jpg', type: 'bottoms' }, { name: 'jeans-black-2.jpg', type: 'bottoms_model' },
  { name: 'shorts-1.jpg', type: 'bottoms' }, { name: 'shorts-2.jpg', type: 'bottoms_model' },
  { name: 'joggers-1.jpg', type: 'bottoms' }, { name: 'joggers-2.jpg', type: 'bottoms_model' },
  { name: 'cargo-1.jpg', type: 'bottoms' }, { name: 'cargo-2.jpg', type: 'bottoms_model' }
];

async function run() {
  console.log('Downloading mock product images...');
  for (const file of filesToGenerate) {
    const dest = path.join(imagesDirectory, file.name);
    try {
      await downloadImage(photoMap[file.type], dest);
      console.log(`Downloaded ${file.name}`);
    } catch (err) {
      console.error(`Failed to download ${file.name}:`, err.message);
    }
  }
  console.log('Image download complete!');
}

run();

