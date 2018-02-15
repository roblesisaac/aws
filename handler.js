service: plysheet

provider:
  name: aws
  runtime: nodejs6.10
  memorySize: 128 # set the maximum memory of the Lambdas in Megabytes
  timeout: 10 # the timeout is 10 seconds (default is 6 seconds)
  environment:
    AUTH0_CLIENT_ID: ${file(./secrets.json):AUTH0_CLIENT_ID}
    AUTH0_CLIENT_SECRET: ${file(./secrets.json):AUTH0_CLIENT_SECRET}
  
plugins:
  - serverless-domain-manager

custom:
  customDomain:
    domainName: www.blockometry.com
    basePath: ''
    stage: ${self:provider.stage}
    createRoute53Record: true

functions:
  post:
    handler: api.rest
    events:
      - http:
          path: /{sitename}/api/{sheet}
          method: get
          cors: true
  get:
    handler: api.rest
    events:
      - http:
          path: /{sitename}/api/{sheet}
          method: get
          cors: true
  put:
    handler: api.rest
    events:
      - http:
          path: /{sitename}/api/{sheet}
          method: get
          cors: true
  delete:
    handler: api.rest
    events:
      - http:
          path: /{sitename}/api/{sheet}
          method: get
          cors: true
  create:
    handler: handler.create # point to exported create function in handler.js
    events:
      - http:
          path: notes # path will be domain.name.com/dev/notes
          method: post
          cors: true
  getOne:
    handler: handler.getOne
    events:
      - http:
          path: notes/{id} # path will be domain.name.com/dev/notes/1
          method: get
          cors: true
  getAll:
    handler: handler.getAll # path will be domain.name.com/dev/notes
    events:
     - http:
         path: notes
         method: get
         cors: true
  update:
    handler: handler.update # path will be domain.name.com/dev/notes/1
    events:
     - http:
         path: notes/{id}
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
  siteApi:
    handler: handler.landingApi
    events:
      - http:
          method: get
          path: /{sitename}/api 
  auth:
    handler: auth.auth
    cors: true
  publicEndpoint:
    handler: handler.publicEndpoint
    events:
      - http:
          path: api/public
          method: post
          cors: true
  privateEndpoint:
    handler: handler.privateEndpoint
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
