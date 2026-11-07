import * as cdk from 'aws-cdk-lib';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class RealtimeStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const connectHandler = new lambdaNodejs.NodejsFunction(this, 'ConnectHandler', {
      entry: 'src/handlers/connect.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
    });

    const disconnectHandler = new lambdaNodejs.NodejsFunction(this, 'DisconnectHandler', {
      entry: 'src/handlers/disconnect.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
    });

    const messageHandler = new lambdaNodejs.NodejsFunction(this, 'MessageHandler', {
      entry: 'src/handlers/message.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
    });

    const webSocketApi = new apigatewayv2.WebSocketApi(this, 'WebSocketAPI', {
      apiName: 'Session-Beacon WebSocket',
      routeSelectionExpression: '$request.body.action',
      connectRouteOptions: {
        integration: new integrations.WebSocketLambdaIntegration('ConnectIntegration', connectHandler),
      },
      disconnectRouteOptions: {
        integration: new integrations.WebSocketLambdaIntegration('DisconnectIntegration', disconnectHandler),
      },
      defaultRouteOptions: {
        integration: new integrations.WebSocketLambdaIntegration('MessageIntegration', messageHandler),
      },
    });

    const stage = new apigatewayv2.WebSocketStage(this, 'ProdStage', {
      webSocketApi,
      stageName: 'prod',
      autoDeploy: true,
    });

    new cdk.CfnOutput(this, 'WebSocketEndpoint', {
      value: `${stage.callbackUrl}`,
    });
  }
}
