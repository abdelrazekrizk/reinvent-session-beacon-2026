import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as kms from 'aws-cdk-lib/aws-kms';

export class FoundationStack extends cdk.Stack {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly kmsKey: kms.Key;
  public readonly sessionsTable: dynamodb.Table;

  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.kmsKey = new kms.Key(this, 'Session-BeaconKmsKey', {
      alias: 'Session-Beacon/key',
      description: 'KMS key for Session-Beacon data at rest',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'Session-Beacon-pool',
      signInAliases: { email: true },
      selfSignUpEnabled: true,
      standardAttributes: {
        email: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 12,
        requireDigits: true,
        requireSymbols: true,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.userPoolClient = this.userPool.addClient('WebClient', {
      userPoolClientName: 'Session-Beacon-web-client',
      authFlows: {
        userSrp: true,
        userPassword: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        callbackUrls: ['http://localhost:3000/auth/callback'],
        logoutUrls: ['http://localhost:3000/'],
      },
    });

    const tableProps = (name: string, pk: string, sk?: string): dynamodb.TableProps => ({
      tableName: `Session-Beacon-${name}`,
      partitionKey: { name: pk, type: dynamodb.AttributeType.STRING },
      sortKey: sk ? { name: sk, type: dynamodb.AttributeType.STRING } : undefined,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: this.kmsKey,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.sessionsTable = new dynamodb.Table(this, 'SessionsTable', {
      ...tableProps('sessions', 'id', 'source_session_id'),
      timeToLiveAttribute: 'expires_at',
    });

    new dynamodb.Table(this, 'AttendeeProfilesTable', tableProps('attendee-profiles', 'id'));
    new dynamodb.Table(this, 'TeamsTable', tableProps('teams', 'id'));
    new dynamodb.Table(this, 'TeamItineraryEntriesTable', tableProps('team-itinerary-entries', 'team_id', 'session_id'));
    new dynamodb.Table(this, 'WebsocketConnectionsTable', tableProps('websocket-connections', 'connection_id'));
    new dynamodb.Table(this, 'AiRecommendationsTable', tableProps('ai-recommendations', 'user_id', 'session_id'));
    new dynamodb.Table(this, 'AnalyticsEventsTable', tableProps('analytics-events', 'event_id'));

    new cdk.CfnOutput(this, 'UserPoolId', { value: this.userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: this.userPoolClient.userPoolClientId });
    new cdk.CfnOutput(this, 'SessionsTableName', { value: this.sessionsTable.tableName });
    new cdk.CfnOutput(this, 'KmsKeyArn', { value: this.kmsKey.keyArn });
  }
}
