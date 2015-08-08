var base = '/api/';

var api = [
  {
    endpoint: 'twilio',
    post: handleTwilio
  }
];

// Build the API
api.forEach(function(endpoint){
  var route = Router.route(base + endpoint.endpoint, {where: 'server'});
  if (endpoint.get) {
    route.get(endpoint.get);
  }
  if (endpoint.post) {
    route.post(endpoint.post);
  }
});
