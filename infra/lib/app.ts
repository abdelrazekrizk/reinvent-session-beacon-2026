import * as cdk from 'aws-cdk-lib';
import { FoundationStack } from './stacks/foundation.stack';
import { ComputeStack } from './stacks/compute.stack';
import { RealtimeStack } from './stacks/realtime.stack';

const app = new cdk.App();

const foundation = new FoundationStack(app, 'Session-BeaconFoundationStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT ?? '123456789012',
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
});

new ComputeStack(app, 'Session-BeaconComputeStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT ?? '123456789012',
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
  userPool: foundation.userPool,
});

new RealtimeStack(app, 'Session-BeaconRealtimeStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT ?? '123456789012',
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
});
