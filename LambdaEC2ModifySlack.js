// in order for this script to work, you need to export the layer 'phin' to your lambda function
const AWS = require('aws-sdk');
var url = require('url');
var https = require('https');
var util = require('util');
var title = 'EC2 server ' + process.env.instanceName
const p = require('phin');

const reqURL = `You_Slack_Token`;
async function notifySlack(results) {

  const message = {
    'channel': 'aws-lambda',
    'username': 'AWSUser',
    'text': 'Vertical-Auto-Scale',
    'icon_emoji': ':aws:',
    'attachments': [{
      'color': '#8697db',
      'fields': [
        {
          'title': title,
          'value': results,
          'short': false
        }
      ]
    }]
  };
  
  return p({
    url: reqURL,
    method: 'POST',
    data: message
    
  });
  
}
exports.handler = (event, context, callback) => {    
  const { instanceId, instanceRegion, instanceType, instanceName } = process.env;
  const ec2 = new AWS.EC2({ region: instanceRegion});
  const params = {
    Attribute: 'instanceType',
    InstanceId: 'changeme'
  };

  ec2.describeInstanceAttribute(params, (err, data) => {
    console.log(instanceType)

    if (err) {
      console.log(err, err.stack); 
    } else  {
      console.log(data); 
      const instanceTypeAttr = data.InstanceType.Value
      if (instanceType === instanceTypeAttr) {
        callback(null, 'Dont need to upgrade')
        notifySlack('Dont need to upgrade').then(req =>{
        
        })
    console.log(instanceTypeAttr)
      } else {
        let ec2Error = null
        Promise.resolve()
          .then(() => ec2.stopInstances({ InstanceIds: [instanceId] }).promise())
          .then(() => ec2.waitFor('instanceStopped', { InstanceIds: [instanceId] }).promise())
          .then(() => ec2.modifyInstanceAttribute({ InstanceId : instanceId, InstanceType: { Value: instanceType } }).promise())
          .catch(error => {
            ec2Error = error
            console.log('My Catch Error', error)
            notifySlack('Modified Instance failed: ' + 'Error = ' + error).then(req =>{
              
            })
          })
          .then(() => ec2.startInstances({ InstanceIds: [instanceId] }).promise())
          .then(() => {
            callback(null, `Successfully modified ${event.instanceId} to ${event.instanceType}`)
            if (!ec2Error) {
              notifySlack(`Successfully modified ${process.env.instanceName} to ${process.env.instanceType}`).then(req =>{
              })
            }
          })
          .catch(err => {
            callback(err);
            notifySlack('Modified Instance failed: ' + 'Error = ' + err).then(req =>{
            })
          })
      }
    };
  });
};
