var ip = require('ip');

exports.getIncoming = getIncoming;
function getIncoming(data, key, callback) {
	var ret = {};
	for (var i = data.length - 1; i >= 0; i--) {
		if (!data[i]['iface_out']){
			if (!ret.hasOwnProperty(data[i][key])) {
				ret[data[i][key]] = 0;
			}
			ret[data[i][key]]++;
		}
	};	
	callback(ret);
};

exports.getIncomingPorts = function(data, callback) {
	getIncoming(data, 'dpt', function(blah){
		blah[0] = 0;
		callback(blah);
	});
};

exports.getIncomingAddrs = function(data, callback) {
	getIncoming(data, 'src', function(blah){
		callback(blah);
	});
};

/*
	{
		'192.168.1.1': {
			'22': 1,
			'23': 5,
		}
	}
*/
exports.attackMapData = function(data, callback) {
	var ret = {};
	var rename = [];
	for (var i = 0; i < data.length; i++) {
		if (data[i]['direction'] == "IN") {
			var ipaddr = data[i]['src'];
			var dest_port = data[i]['dpt'];
			if (!ret.hasOwnProperty(ipaddr)) {
				ret[ipaddr] = {};
			}
			if (!ret[ipaddr][dest_port]) {
				ret[ipaddr][dest_port] = 0;
			}
			ret[ipaddr][dest_port]++;
		}
	};

	//format for nvd3
	for (x_ip in ret){
		if (ret.hasOwnProperty(x_ip)) {
			for (y_port in ret[x_ip]) {
				if (ret[x_ip].hasOwnProperty(y_port)) {
					var data_point = {'x': ip.toLong(x_ip), 'y': parseInt(y_port, 10), 'size': ret[x_ip][y_port], 'shape':'circle'};
					rename.push(data_point);
				}
			};
		}
	}
	callback(rename);
}

exports.toNVD3 = function(data, label) {
	
	var values = []
	for (var key in data) {
		if (data.hasOwnProperty(key)) {
			var tmp = {'x': parseInt(key, 10), 'y': data[key]};
			values.push(tmp);
		}
	}
	var ret = {'key': label, 'values': values};
	return ret;
};