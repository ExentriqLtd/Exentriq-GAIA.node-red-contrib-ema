module.exports = function(RED) {
    "use strict";
var http = require("follow-redirects").http;
var https = require("follow-redirects").https;
    
function EmaNotify(n) {
	RED.nodes.createNode(this,n);
	
	console.log(n);
	this.space = n.space;
	this.name = n.name;
	this.card = n.card;
	this.destinationUsername = n.destinationusername;
	this.robotUsername = n.rusername;
	this.robotPassword = n.rpassword;
	this.notifyMethod = ["talk"]
	this.message = "Hallo!";
	
	var node = this;
	
	node.on("input", function(msg) {
	    node.status({});
	    
	    if(msg.message){
			node.message = msg.message;
	    }
	    
	    if(msg.destinationUsername){
			node.destinationUsername = msg.destinationUsername;
	    }
	    
	    if(!node.robotUsername){
			    node.status({fill:"red",shape:"dot",text:"missing robot configuration"});
			    node.send(msg);
			    return;
		}
		
		if(!node.destinationUsername){
			    node.status({fill:"red",shape:"dot",text:"missing dest configuration"});
			    node.send(msg);
			    return;
		}
	    
	    if(node.notifyMethod.indexOf("talk") != -1){
		    var destinationUsernameArray = node.destinationUsername.split(",");
		    for(var i=0; i < destinationUsernameArray.length; i++){
			    var to = destinationUsernameArray[i];
			    var data = { "from":node.robotUsername, "to": to, "message": + node.message };
		    
		        node.log("Talk notify to: " + to);
			    
			    var post_data = JSON.stringify(data);
			    
			    var host = RED.settings.exentriq.talk;
			    
			    node.log("Talk host: " + host);
			    
			    if(!host){
				    node.status({fill:"red",shape:"dot",text:"missing api configuration"});
				    node.send(msg);
				    return;
			    }
			     
			    var post_options = {
			      "host": host,
			      "path": "/api/rooms/sendDirectMessage",
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
					node.status({fill:"red",shape:"dot",text:"notify error!"});
					msg.payload = err;
					node.send(msg);
			    });
				
			    post_req.write(post_data);
			    post_req.end();
		    }
	    }
	    	    
	    
	});
}
    
RED.nodes.registerType("ema-notifier", EmaNotify);

}
