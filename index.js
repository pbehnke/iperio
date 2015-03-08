var express = require('express');
var app = express();
var fs = require('fs');
var parser = require('./lib/log-parser');
var summarize = require('./lib/summarize.js');

//middleware
var logger = require('morgan');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

app.use(logger('combined'));
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(cookieParser());
app.use(express.static(__dirname + '/static'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


var file = "wrt0.log";

var log_data = [];
var failed_lines = [];
//parse whats in the log file.
try {
	process.stdout.write("Reading syslog data...");
	var timer = setInterval(function(){
		process.stdout.write(".");
	}, 2000);
	fs.readFile(file, function(err, log_raw){
		if (err) throw err;
		var log = log_raw.toString('utf8');
		parser.parse(log, function(data, failed){
			//start the log server once we
			clearInterval(timer);
			log_data = data;
			var server = app.listen(3000, function () {
  				var port = server.address().port;
  				console.log();
  				console.log('IPerio listening on port %s.', port);
  				console.log('Ctrl+C to quit.');

  				//set up tailing the file to get live updates
				Tail = require('tail').Tail;
				tail = new Tail(file);
				tail.on("line", function(new_data) {
					//attempt to send the new data to the client(s)
					console.log(new_data);
					parser.parse(new_data, function(update){
						console.log(update);
					});
				});
			});
		});
	});
} catch(e) {
	console.error('Error: %s', e);
	process.exit(1);
}


app.get('/', function(req, res) {
	res.render('index', { title: 'Home', js: 'loadHome'});
});

app.get('/incoming/ports', function(req, res) {
	//res.json(log_data);
	summarize.getIncomingPorts(log_data, function(data){
		var ret = [];
		ret.push(summarize.toNVD3(data, "Incoming TCP Ports"));
		res.json(ret);
	});
	//summarize.getIncoming(log_data, "dpt", function(data){
	//});
});

app.get('/incoming/addrs', function(req, res) {
	//res.json(log_data);
	summarize.getIncomingAddrs(log_data, function(data){
		res.json(data);
	});
	//summarize.getIncoming(log_data, "dpt", function(data){
	//});
});

app.get('/all/:start', function(req, res) {
	//TODO: break pagination into a reusable function?
	var start = parseInt(req.params.start, 10);
	if (start <= 0) {
		start = 1;
	}
	console.log("start: " + start);
	
	ret = [];
	for (var i = start; i < log_data.length - 1; i++) {
		if (log_data[i]['direction'] == "IN") {
			//TODO: make copy obj function?
			obj = {};
			obj['date'] = log_data[i]['date'];
			obj['src'] = log_data[i]['src'];
			obj['dest'] = log_data[i]['dest'];
			obj['proto'] = log_data[i]['proto'];
			obj['dpt'] = log_data[i]['dpt'];
			obj['spt'] = log_data[i]['spt'];
			obj['src_reverse'] = log_data[i]['src_reverse'];
			obj['flags'] = log_data[i]['flags'];
			obj['country'] = log_data[i]['country'];
			ret.push(obj);
		}

		if (ret.length >= 20) {
			break;
		}
	};

	console.log("end: " + (i+1));

	ret = {'total':log_data.length,'end_pos':i+1,'results':ret};
	res.json(ret);
	//summarize.getIncoming(log_data, "dpt", function(data){
	//});
});

app.get('/attack_map', function(req, res) {
	summarize.attackMapData(log_data, function(data){
		var ret = [{key:'Incoming', 'values': data}];
		res.json(ret);
	})
});