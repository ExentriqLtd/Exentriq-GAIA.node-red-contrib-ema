module.exports = function(RED) {
    "use strict";
var http = require("follow-redirects").http;
var https = require("follow-redirects").https;
var rest = require('rest');

function ExentriqAuth(n) {
	RED.nodes.createNode(this,n);
	//console.log(n);
	this.space = n.space;
	this.name = n.name;
	this.entity = n.entity;
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
		       //console.log(result.entity);
		   		node.robotSessionToken = JSON.parse(result.entity).result.sessionToken;
		   		//console.log(node.robotSessionToken);
		   		node.status({fill:"green",shape:"dot",text: node.robotUsername});
		   }else{
			   node.status({fill:"red",shape:"dot",text:"Not logged"});
		   }
		 });
		 
	}
	
	authMe();
	
	function processResponse(msg){
		
		if(msg.api){
			
			var entity=JSON.stringify({ id: '', method: msg.api, params: msg.payload });
			console.log("processResponse " + entity);
			rest({path:exentriqServicePath +"?sid=" + node.robotSessionToken, method:"POST", entity:entity}).then(function(result) {
			console.log(result);
		       if(result && result.entity && JSON.parse(result.entity).result){
			       msg.payload = JSON.parse(result.entity).result;
			       node.send(msg)
			   }
			})
		}else{
			msg.payload = node.robotSessionToken;
			node.send(msg);
		}
		
	}
	
	node.on("input", function(msg) {
		console.log("input " + msg.payload);
		var entity=JSON.stringify({ id: '', method: 'auth.getSessionOwnerBySid', params: [node.robotSessionToken] });
		 rest({path:exentriqServicePath, method:"POST", entity:entity}).then(function(result) {
	       console.log(result);
	       if(result && result.entity && JSON.parse(result.entity).result){
		        processResponse(msg)
		   }else{
			   node.status({fill:"orange",shape:"dot",text:"Session expired, logging in"});
			   
			   var entity=JSON.stringify({ id: '', method: 'auth.login', params: [node.robotUsername, node.robotPassword] });
			   rest({path:exentriqServicePath, method:"POST", entity:entity}).then(function(result) {
			       console.log(result);
			       if(result && result.entity && JSON.parse(result.entity).result){
				       console.log(result.entity);
				   		node.robotSessionToken = JSON.parse(result.entity).result.sessionToken;
				   		console.log(node.robotSessionToken);
				   		node.status({fill:"green",shape:"dot",text:"I am " + node.robotUsername});
				   		processResponse(msg)
				   }else{
					   node.status({fill:"red",shape:"dot",text:"Not logged"});
					    node.send(null);
				   }
				 });
			   	
		   }
		 });
		
		
	    
	});
}
    
RED.nodes.registerType("exentriq-robot-auth", ExentriqAuth);

}
