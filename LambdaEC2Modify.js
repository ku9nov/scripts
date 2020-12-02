const AWS = require('aws-sdk');
exports.handler = (event, context, callback) => {    
  const { instanceId, instanceRegion, instanceType } = process.env;
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
    console.log(instanceTypeAttr)
      } else {
        var wait = ms => new Promise(resolve => setTimeout(resolve, ms));
        Promise.resolve()
          .then(() => ec2.stopInstances({ InstanceIds: [instanceId] }).promise())
          .then(() => ec2.waitFor('instanceStopped', { InstanceIds: [instanceId] }).promise())
          .then(() => ec2.modifyInstanceAttribute({ InstanceId : instanceId, InstanceType: { Value: instanceType } }).promise())
          .catch(error => console.log('My Catch Error', error))
          .then(() => {
              return wait(3000)
          })
          .then(() => ec2.startInstances({ InstanceIds: [instanceId] }).promise())
          .then(() => callback(null, `Successfully modified ${event.instanceId} to ${event.instanceType}`))
          .catch(err => callback(err));
        } 
    };
  });
};
