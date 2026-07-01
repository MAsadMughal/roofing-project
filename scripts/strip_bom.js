import fs from 'fs';
import path from 'path';

const dir = 'migrations';
const files = fs.readdirSync(dir);
for (const file of files) {
	if (!file.endsWith('.sql')) continue;
	const filePath = path.join(dir, file);
	let content = fs.readFileSync(filePath, 'utf8');
	if (content.charCodeAt(0) === 0xfeff) {
		console.log(`${file} has BOM, stripping...`);
		content = content.slice(1);
		fs.writeFileSync(filePath, content, 'utf8');
		console.log(`${file} BOM stripped and saved.`);
	}
}
