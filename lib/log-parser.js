var async = require('async');
var dns = require('dns');
var geoip = require('geoip-lite');

exports.parse = function(data, callback) {
	parsed = [];
	parsed_failed = [];

	async.each(data.split("\n"), function(line, cb){
		var obj = {};
		//Feb 21 23:26:51 192.168.1.1 kernel: DROP IN=br0 OUT=vlan2 SRC=192.168.1.100 DST=96.16.112.121 LEN=52 TOS=0x00 PREC=0x00 TTL=63 ID=34770 DF PROTO=TCP SPT=62411 DPT=443 SEQ=2976286457 ACK=411474190 WINDOW=4096 RES=0x00 ACK FIN URGP=0 OPT (0101080A388AEEC53512DAE5)
		var parsed_line = line.trim().match(/^(.+\s+.+\s+.+)\s+(.+)\s+kernel:\s+(\w+)\s+IN=(\w+)\s+OUT=(\w*)\s+MAC=(.+)\s+SRC=(.+)\s+DST=(.+)\s+LEN=(\d+)\s+TOS=(\w+)\s+PREC=(\w+)\s+TTL=(\d+)\s+ID=(\d+).*PROTO=(\w+)\s+SPT=(\d+)\s+DPT=(\d+)\s+SEQ=(\d+)\s+ACK=(\d+)\s+WINDOW=(\d+)\s+RES=(\w+)\s+(.*)\s+URGP=(\d+)\s+OPT\s+\((.*)\)$/);

		if (parsed_line) {
			obj['date'] = parsed_line[1];
			obj['device_ip'] = parsed_line[2];
			obj['rule'] = parsed_line[3];
			obj['iface_in'] = parsed_line[4];
			obj['iface_out'] = parsed_line[5];
			obj['mac'] = parsed_line[6];
			obj['src'] = parsed_line[7];
			obj['dest'] = parsed_line[8];
			obj['length'] = parsed_line[9];
			obj['tos'] = parsed_line[10];
			obj['prec'] = parsed_line[11];
			obj['ttl'] = parsed_line[12];
			obj['id'] = parsed_line[13];
			obj['proto'] = parsed_line[14];
			obj['spt'] = parseInt(parsed_line[15], 10);
			obj['dpt'] = parseInt(parsed_line[16], 10);
			obj['seq'] = parsed_line[17];
			obj['ack'] = parsed_line[18];
			obj['window'] = parsed_line[19];
			obj['res'] = parsed_line[20];
			obj['flags'] = parsed_line[21];
			obj['urgp'] = parsed_line[22];
			obj['opt'] = parsed_line[23];

			if (obj['iface_out'] == "") {
				obj['direction'] = "IN";
				var ip = obj['src'];
				var geo = geoip.lookup(ip);
				if (geo) {
					obj['country'] = geo['country'];
				} else {
					obj['country'] = "Unknown";
				}
				dns.reverse(ip, function(err, hostnames){
					if (hostnames) {
						obj['src_reverse'] = hostnames[0];
					} else {
						obj['src_reverse'] = "Unknown";
					}
					parsed.push(obj);
					cb();
				});
			} else {
				parsed.push(obj);
				cb();
			}

			
		} else {
			parsed_failed.push(line);
			cb();
		}

	}, function(err){
		parsed.sort(function(a, b){
			return (new Date(b.date) - new Date(a.date));
		});
		//console.log(JSON.stringify(parsed, undefined, 2));
		callback(parsed, parsed_failed);
	});
}