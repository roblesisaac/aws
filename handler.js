service: plysheet

provider:
  name: aws
  runtime: nodejs6.10
  memorySize: 128 # set the maximum memory of the Lambdas in Megabytes
  timeout: 10 # the timeout is 10 seconds (default is 6 seconds)
  environment:
    AUTH0_CLIENT_ID: ${file(./variables.json):AUTH0_CLIENT_ID}
    AUTH0_CLIENT_SECRET: ${file(./variables.json):AUTH0_CLIENT_SECRET}
    DB: ${file(./variables.json):DB}
  
plugins:
  - serverless-domain-manager

custom:
  customDomain:
    domainName: www.blockometry.com
    basePath: ''
    stage: ${self:provider.stage}
    createRoute53Record: true

functions:
  sheet:
    handler: handler.sheet
    events:
      - http:
          path: /{sitename}/sheet/{sheet}/{prop}/{name}
          method: get
          cors: true
  post:
    handler: api.post
    events:
      - http:
          path: /{sitename}/api/{sheet}
          method: post
          cors: true
  get:
    handler: api.get
    events:
      - http:
          path: /{sitename}/api/{sheet}
          method: get
          cors: true
  put:
    handler: api.put
    events:
      - http:
        path: /{sitename}/api/{sheet}/{id}
        method: put
        cors: true
  landing:
    handler: handler.landingPage
    events:
      - http:
          method: get
          path: /
  siteLanding:
    handler: handler.landingPage
    events:
      - http:
          method: get
          path: /{sitename}
  auth:
    handler: auth.auth
    cors: true
  publicEndpoint:
    handler: auth.publicEndpoint
    events:
      - http:
          path: api/public
          method: post
          cors: true
  privateEndpoint:
    handler: auth.privateEndpoint
    events:
      - http:
          path: api/private
          method: post
          # See custom authorizer docs here: http://bit.ly/2gXw9pO
          authorizer: auth
          cors: true

resources:
  Resources:
    # This response is needed for custom authorizer failures cors support ¯\_(ツ)_/¯
    GatewayResponse:
      Type: 'AWS::ApiGateway::GatewayResponse'
      Properties:
        ResponseParameters:
          gatewayresponse.header.Access-Control-Allow-Origin: "'*'"
          gatewayresponse.header.Access-Control-Allow-Headers: "'*'"
        ResponseType: EXPIRED_TOKEN
        RestApiId:
          Ref: 'ApiGatewayRestApi'
        StatusCode: '401'
    AuthFailureGatewayResponse:
      Type: 'AWS::ApiGateway::GatewayResponse'
      Properties:
        ResponseParameters:
          gatewayresponse.header.Access-Control-Allow-Origin: "'*'"
          gatewayresponse.header.Access-Control-Allow-Headers: "'*'"
        ResponseType: UNAUTHORIZED
        RestApiId:
          Ref: 'ApiGatewayRestApi'
        StatusCode: '401'
