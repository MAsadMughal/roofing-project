import fs from 'fs';
import path from 'path';

const dir = 'migrations';
const files = fs.readdirSync(dir);
for (const file of files) {
	if (!file.endsWith('.sql')) continue;
	const filePath = path.join(dir, file);
	const buffer = fs.readFileSync(filePath);
	// Check if buffer starts with UTF-16LE BOM (0xFF, 0xFE) or contains null bytes indicating UTF-16
	const isUtf16 = (buffer[0] === 0xff && buffer[1] === 0xfe) || buffer.includes(0x00);
	if (isUtf16) {
		console.log(`${file} is UTF-16LE, converting...`);
		const content = buffer.toString('utf16le');
		// Write back as UTF-8
		fs.writeFileSync(filePath, content, 'utf8');
		console.log(`${file} converted to UTF-8.`);
	} else {
		console.log(`${file} is already UTF-8 or ASCII.`);
	}
}
