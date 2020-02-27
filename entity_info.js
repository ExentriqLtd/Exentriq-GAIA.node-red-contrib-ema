module.exports = function(RED) {
    "use strict";
var http = require("follow-redirects").http;
var https = require("follow-redirects").https;
var rest = require('rest');
    
function EmaGetEntity(n) {
	RED.nodes.createNode(this,n);
	//console.log(n);
	this.space = n.space;
	this.name = n.name;
	this.entity = n.entity;
	this.username = n.username;
	this.robotUsername = n.rusername;
	this.robotPassword = n.rpassword;
	this.robotSessionToken = null;
	
	var exentriqServicePath = RED.settings.exentriq.rpc;;
	var node = this;
	
	
	function authMe(){
		 var entity=JSON.stringify({ id: '', method: 'auth.login', params: [node.robotUsername, node.robotPassword] });
		 rest({path:exentriqServicePath, method:"POST", entity:entity}).then(function(result) {
	       //console.log(result);
	       if(result && result.entity && JSON.parse(result.entity).result){
		       console.log(result.entity);
		   		node.robotSessionToken = JSON.parse(result.entity).result.sessionToken;
		   		console.log(node.robotSessionToken);
		   }
		   });
	}
	
	authMe();
	
	node.on("input", function(msg) {
	    if(msg.entity){
		node.entity = msg.entity;
	    }
	    if(msg.name){
		node.name = msg.name;
	    }
	    
		/*if(msg.token){
			node.robotSessionToken = msg.token;
	    }
	    if(msg.robotUsername){
			node.robotUsername = msg.username;
	    }*/
	    	    
	    node.log("Get card:  " + msg.entity + " robot " + node.robotUsername);
	    
	    
	    var host = RED.settings.exentriq.boardsApiHost;
	    
	    var post_options = {
	      "host": host,
	      "path": "/api/entity/"+msg.entity,
	      "method": "GET",
              "headers": {
			  	"Content-Type": "application/json",
			  	"x-user-name": node.robotUsername,
			  	"x-auth-token": node.robotSessionToken,//""
              }
	    };
	    
	    console.log(post_options);
	    
	    node.status({fill:"green",shape:"dot",text:"get info..."});
	    var post_req = https.request(post_options, function (res) {
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
			        node.status({});
				msg.payload = chunk;
				node.send(msg);
			});
	    }).on('error', function (err) {
			node.status({fill:"red",shape:"dot",text:"get error!"});
			msg.payload = err;
			node.send(msg);
	    });
		
	    post_req.end();
	});
}
    
RED.nodes.registerType("get-entity", EmaGetEntity);

}
