import * as cdk from 'aws-cdk-lib';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export interface ComputeStackProps extends cdk.StackProps {
  userPool: cognito.UserPool;
}

export class ComputeStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const healthHandler = new lambdaNodejs.NodejsFunction(this, 'HealthHandler', {
      entry: 'src/handlers/health.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        APP_NAME: 'Session-Beacon',
      },
    });

    const discoveryHandler = new lambdaNodejs.NodejsFunction(this, 'DiscoveryHandler', {
      entry: 'src/handlers/discovery.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      environment: {
        DYNAMODB_TABLE: 'Session-Beacon-sessions',
      },
    });

    const api = new apigateway.RestApi(this, 'API', {
      restApiName: 'Session-Beacon API',
      description: 'Session-Beacon HTTP API scaffold',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    api.root.addMethod('GET', new apigateway.LambdaIntegration(healthHandler));

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'Session-BeaconAuthorizer', {
      cognitoUserPools: [props.userPool],
      identitySource: 'method.request.header.Authorization',
    });

    const sessions = api.root.addResource('sessions');
    sessions.addMethod('GET', new apigateway.LambdaIntegration(discoveryHandler), {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer,
    });

    const insights = api.root.addResource('insights');
    insights.addMethod('POST', new apigateway.LambdaIntegration(discoveryHandler), {
      authorizationType: apigateway.AuthorizationType.COGNITO,
      authorizer,
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', { value: api.url });
  }
}
