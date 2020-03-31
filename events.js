module.exports = function(RED) {
    "use strict";
    
    function ExentriqEventNode(config) {
        RED.nodes.createNode(this,config);

        var node = this;
		this.rules = config.rules || [];

        var kafka = require('kafka-node');
        var HighLevelConsumer = kafka.HighLevelConsumer;
        var Client = kafka.Client;
        var topics = "NewObjectEvent";
        var clusterZookeeper = RED.settings.exentriq.clusterZookeeper;
        var groupId = config.group;// || ;
        var type = config.event;
        var space = config.owner.split("-")[0]; //this avoid the multiple flow problem ì, i.e: space 3-14
        var client; 
        var consumer;
		
		var that = this;
		
        topics = [{topic:topics}];      

        var options = {
            groupId: groupId,
            autoCommit: true,
            autoCommitMsgCount: 10
        };
        
        var createConsumer = function(retry, node, client){
          try {
              client = new Client(clusterZookeeper);
              consumer = new HighLevelConsumer(client, topics, options);
              node.log("EMA Consumer created on space " + space + ", groupId " + groupId);
              node.status({fill:"green",shape:"dot",text:"connected to "+clusterZookeeper});
			  var eventType = null;
			  var activityType = null
			  var msg = null;
              consumer.on('message', function (message) {
        	  try {
        	      //node.log("EMA Consumer msg: " + message);
        	      var event = JSON.parse(message.value);
        	      //node.log("Consumer event: " + event.type + " node.rules " + node.rules.length);
        	      eventType = event.type;
        	      if(event.data && event.data.activityType){
	        	      activityType = event.data.activityType;
        	      }
        	      // node.log("EMA Consumer activityType: " + activityType);
        	       var spaceId = event.data.spaceId;
        	       //some events miss spaceId and add it in a data.exentriqContext obj
        	       if(!spaceId && event.data.exentriqContext){
	        	       for(var i=0; i < event.data.exentriqContext.length; i++){
		        	       if(event.data.exentriqContext[i].type == "space"){
			        	       spaceId = event.data.exentriqContext[i].id;
		        	       }
	        	       }
	        	       
        	       }
        	       //some events miss spaceId and add it in a data.context[0] obj
        	       if(!spaceId && event.data.context && event.data.context.length > 0 && event.data.context[0].items){
	        	       for(var i=0; i < event.data.context[0].items.length; i++){
		        	       if(event.data.context[0].items[i].type == "space"){
			        	       spaceId = event.data.context[0].items[i].id;
		        	       }
	        	       }
	        	       
        	       }
        	       //node.log("EMA Consumer eventType: " + eventType + " on space " + spaceId);
        	      if(space == spaceId){//non è più legato solo a un evento && type == event.type){
	        	     msg =  {payload: event};// {payload: event.entities[0].value};
                     //node.send(msg);
                     
        	      }else{
	        	      node.send(null);
	        	      return;
        	      }
        	     
				} catch (e) {
					//msg = {payload: message}
				    node.error(message);
				}
				
				if(eventType != null){
				
					var onward = [];
		            try {
		                var prop = eventType;
		                var elseflag = true;
		                for (var i=0; i<node.rules.length; i+=1) {
		                    var rule = node.rules[i];
		                    var test = prop;
		                    
		                    if(rule.t == "eq"){
			                    if(test == rule.v){
				                    //if defined activityType rule, it must be equal, otherwise pass all the incoming activity types
				                    
				                    if(rule.v2 && rule.v2 === activityType){
					                    onward.push(msg);
				                    }else if(!rule.v2){
					                    onward.push(msg);
				                    }else
				                    	onward.push(null);
				                    
				                }else
				                	onward.push(null);
				                    
		                    }else if(rule.t == test)
		                    {
			                    if(rule.v2 && rule.v2 === activityType){
				                    onward.push(msg);
			                    }else if(!rule.v2){
				                    onward.push(msg);
			                    }else
			                    	onward.push(null);
		                    }else{
			                    onward.push(null);
		                    }
		                }
		                node.previousValue = prop;
		                //node.log("Send " + onward);
		                node.send(onward);
		            } catch(err) {
		                node.warn(err);
		            }
	            
	            }
				
				
                  
              });


              consumer.on('error', function (err) {
                 node.status({fill:"red",shape:"dot",text:"NOT connected to "+clusterZookeeper});
                 consumer.close();
                 if(retry){
                   console.error("Retry to connect after 15s");
                   setTimeout(function() {console.error("Retrying...");createConsumer(false, node, client);}, 15000);
                 }
              });
          }
          catch(e){
              node.error(e);
              return;
          }
        }

        createConsumer(true, this, client);
        
        node.on('close', function() {
            consumer.close();
        });

    }
    
    RED.nodes.registerType("bus-events", ExentriqEventNode);
}