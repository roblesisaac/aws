service: plysheet

provider:
  name: aws
  runtime: nodejs6.10
  memorySize: 128 # set the maximum memory of the Lambdas in Megabytes
  timeout: 10 # the timeout is 10 seconds (default is 6 seconds)
  environment:
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
  plyGet:
    handler: ply.port
    events:
      - http:
          method: get
          path: /ply/{sheet}/port
  plyPost:
    handler: ply.port
    events:
      - http:
          method: post
          path: /ply/{sheet}/port
  plyPut:
    handler: ply.port
    events:
      - http:
          method: put
          path: /ply/{sheet}/port
  plyDelete:
    handler: ply.port
    events:
      - http:
          method: delete
          path: /ply/{sheet}/port
#  setup:
#    handler: setup.init
#    events:
#      - http:
#          method: get
#          path: /plysheet/api/setup
#  landing:
#    handler: api.landingPage
#    events:
#      - http:
#          method: get
#          path: /
#  siteLanding:
#    handler: api.landingPage
#    events:
#      - http:
#          method: get
#          path: /{sitename}
#  login:
#    handler: auth.login
#    events:
#      - http:
#          path: /login
#          method: post
#  sheetProp:
#    handler: api.sheetProp
#    events:
#      - http:
#          path: /{sitename}/{sheet}/{prop}
#          method: get
#          cors: true
#  sheets:
#    handler: api.sheets
#    events:
#      - http:
#          path: /{sitename}/{sheet}/{prop}/sheets
#          method: get
#          cors: true
#  post:
#    handler: api.post
#    events:
#      - http:
#          path: /{sitename}/api/{sheet}
#          method: post
#          cors: true
#  get:
#    handler: api.get
#    events:
#      - http:
#          path: /{sitename}/api/{sheet}
#          method: get
#          cors: true
#  getOne:
#    handler: api.getOne
#    events:
#      - http:
#          path: /{sitename}/api/{sheet}/{id}
#          method: get
#          cors: true
#  put:
#    handler: api.put
#    events:
#      - http:
#          path: /{sitename}/api/{sheet}/{id}
#          method: put
#          cors: true
#  delete:
#    handler: api.delete
#    events:
#      - http:
#          path: /{sitename}/api/{sheet}/{id}
#          method: delete
#          cors: true

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
