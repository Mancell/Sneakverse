console.log("Basic node script works.");
const fs = require('fs');
try {
  fs.mkdirSync('test-dir');
  fs.writeFileSync('test-dir/test-file.txt', 'hello');
  console.log("File system operations work.");
  fs.unlinkSync('test-dir/test-file.txt');
  fs.rmdirSync('test-dir');
  console.log("Cleanup works.");
} catch (e) {
  console.error("FS Error:", e);
}

