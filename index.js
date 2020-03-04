module.exports = function(RED) {
    "use strict";
var http = require("follow-redirects").http;
var https = require("follow-redirects").https;
    
function EmaMoveCard(n) {
	RED.nodes.createNode(this,n);
	
	this.space = n.space;
	this.name = n.name;
	this.card = n.card;
	this.username = n.username;
	this.destination_list = n.destination_list;
	this.source_list = n.source_list;
	
	var node = this;
	
	node.on("input", function(msg) {
	    if(msg.card){
		node.card = msg.card;
	    }
	    if(msg.name){
		node.name = msg.name;
	    }
	    if(msg.destination_list){
		node.destination_list = msg.destination_list;
	    }
	    if(msg.source_list){
		node.source_list = msg.source_list;
	    }
	    	    
	    var data = { "destinationId":node.destination_list, "sourceId":node.source_list, "username": node.username };
	    
	    
	    node.log("Move card:  " + msg.card);
	    
	    //node.send(msg);
	    
	    var post_data = JSON.stringify(data);
	    
	    var host = RED.settings.exentriq.boardsApiHost;
	    
	    var post_options = {
	      "host": host,
	      "path": "/api/entity/"+msg.card+"/moveToList",
	      "method": "POST",
              "headers": {
	        "Content-Type": "application/json"
              }
	    };
	    
	    node.status({fill:"green",shape:"dot",text:"moving card..."});
	    var post_req = https.request(post_options, function (res) {
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
			        node.status({});
				msg.payload = chunk;
				node.send(msg);
			});
	    }).on('error', function (err) {
			node.status({fill:"red",shape:"dot",text:"move card error!"});
			msg.payload = err;
			node.send(msg);
	    });
		
	    post_req.write(post_data);
	    post_req.end();
	});
}
    
RED.nodes.registerType("move-card", EmaMoveCard);

}
