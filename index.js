const { app, BrowserWindow } = require('electron');


app.on('ready', () => {
	const window = new BrowserWindow({ width: 800, height: 600 });

	console.log(window);

	window.loadFile('index.html');
});
