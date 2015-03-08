var iperio = {

	current_pos: 0,

	loadHome: function(){
		var opts = {
			lines: 13, // The number of lines to draw
			length: 20, // The length of each line
			width: 10, // The line thickness
			radius: 44, // The radius of the inner circle
			corners: 1, // Corner roundness (0..1)
			rotate: 0, // The rotation offset
			direction: 1, // 1: clockwise, -1: counterclockwise
			color: '#000', // #rgb or #rrggbb or array of colors
			speed: 1, // Rounds per second
			trail: 60, // Afterglow percentage
			shadow: false, // Whether to render a shadow
			hwaccel: false, // Whether to use hardware acceleration
			className: 'spinner', // The CSS class to assign to the spinner
			zIndex: 2e9, // The z-index (defaults to 2000000000)
			top: '50%', // Top position relative to parent
			left: '50%' // Left position relative to parent
		};
		var rawdatatable = $('#rawdatatable');
		var spinner = new Spinner(opts).spin(rawdatatable[0]);
		$.ajax({
			url : "/incoming/ports",
			type: "GET",
			success: function(data, textStatus, jqXHR) {
				rawdatatable.empty();
				iperio.createGraph(data);
			}
		});
		// $.ajax({
		// 	url : "/incoming/addrs",
		// 	type: "GET",
		// 	success: function(data, textStatus, jqXHR) {
		// 		iperio.createTable(data);
		// 	}
		// });
		$.ajax({
			url : "/all/" + iperio.current_pos,
			type: "GET",
			success: function(data, textStatus, jqXHR) {
				iperio.createTable(data.results);
				iperio.current_pos = data.end_pos;
			}
		});
		$.ajax({
			url : "/attack_map",
			type: "GET",
			success: function(data, textStatus, jqXHR) {
				iperio.createAttackGraph(data);
			}
		});

		//for infinite scrolling
		$(window).scroll(function() {
			if($(window).scrollTop() + $(window).height() > $(document).height() - 30) {
				$.ajax({
					url : "/all/" + iperio.current_pos,
					type: "GET",
					success: function(data, textStatus, jqXHR) {
						iperio.createTable(data.results);
						iperio.current_pos = data.end_pos;
					}
				});
			}
		});
	},

	createTable: function(data){
		for (var i = 0; i < data.length; i++) {
			$('#live_table').append( '<tr><td>'+data[i]['date']+'</td><td>'+data[i]['src']+'</td><td>'+data[i]['src_reverse']+'</td><td><img class="flag" src="/img/flags/'+data[i]['country'].toLowerCase()+'.png">'+data[i]['country']+'</td><td>'+data[i]['dest']+'</td><td>'+data[i]['proto']+'</td><td>'+data[i]['spt']+'</td><td>'+data[i]['dpt']+'</td><td>'+data[i]['flags']+'</td></tr>' );
		};
	},

	createGraph: function(data) {
		/*These lines are all chart setup.  Pick and choose which chart features you want to utilize. */
		nv.addGraph(function() {
			var chart = nv.models.lineWithFocusChart()
							//.margin({left: 50, right: 50})  //Adjust chart margins to give the x-axis some breathing room.
							//.useInteractiveGuideline(true)  //We want nice looking tooltips and a guideline!
							//.transitionDuration(350)  //how fast do you want the lines to transition?
							//.showLegend(true)       //Show the legend, allowing users to turn on/off line series.
							//.showYAxis(true)        //Show the y-axis
							//.showXAxis(true)        //Show the x-axis
			;

			chart.xAxis     //Chart x-axis settings
			  .axisLabel('TCP Port')
			  .tickFormat(d3.format(',r'));
			;

			chart.yAxis     //Chart y-axis settings
			  .axisLabel('Number of attemped connections')
			  //.tickFormat(d3.format(',r'));
			;

			d3.select('#incoming_tcp_graph svg')    //Select the <svg> element you want to render the chart in.   
			  .datum(data)         //Populate the <svg> element with chart data...
			  .call(chart);          //Finally, render the chart!

			//Update the chart when window resizes.
			nv.utils.windowResize(function() { chart.update() });
			return chart;
		});
	},

	createAttackGraph: function(data) {
		/*These lines are all chart setup.  Pick and choose which chart features you want to utilize. */
		nv.addGraph(function() {
			var chart = nv.models.scatterChart();
							//.margin({left: 50, right: 50})  //Adjust chart margins to give the x-axis some breathing room.
							//.useInteractiveGuideline(true)  //We want nice looking tooltips and a guideline!
							//.transitionDuration(350)  //how fast do you want the lines to transition?
							//.showLegend(true)       //Show the legend, allowing users to turn on/off line series.
							//.showYAxis(true)        //Show the y-axis
							//.showXAxis(true)        //Show the x-axis
			;

			//Configure how the tooltip looks.
			chart.tooltipContent(function(key, x, y, e, graph) {
				var i = parseInt(x.replace(/,/g, ''), 10);
				return '<h3>' + iperio.intToIP(i) + '</h3><br><h3>'+ y +'</h3>';
			});

			chart.xAxis     //Chart x-axis settings
			  .axisLabel('IP')
			  .tickFormat(d3.format(',r'));
			;

			chart.yAxis     //Chart y-axis settings
			  .axisLabel('Port')
			  //.tickFormat(d3.format(',r'));
			;

			d3.select('#attack_map svg')    //Select the <svg> element you want to render the chart in.   
			  .datum(data)         //Populate the <svg> element with chart data...
			  .call(chart);          //Finally, render the chart!

			//Update the chart when window resizes.
			nv.utils.windowResize(function() { chart.update() });
			return chart;
		});
	},

	intToIP: function(ip){
  		return ( (ip>>>24) + '.' + (ip>>16 & 255) +'.' + (ip>>8 & 255) +'.' + (ip & 255) );
  	}
};

