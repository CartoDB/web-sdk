## Authentication

CARTO Web SDK requires using an API Key. From your CARTO dashboard, click _[Your API keys](https://carto.com/login)_ from the avatar drop-down menu to view your uniquely generated API Key for managing data with CARTO Engine.

![Your API Keys](../img/avatar.gif)

Learn more about the [basics of authorization]({{site.fundamental_docs}}/authorization/), or dig into the details of [Auth API]({{site.authapi_docs}}/), if you want to know more about this part of CARTO platform.
_
The examples in this documentation might include if required a placeholder for the API Key named like *YOUR_API_KEY*. Ensure that you do modify any placeholder parameters with your own valid credentials. You will be able to supply easily a default API Key with [`carto.auth.setDefaultCredentials`].

```javascript
carto.auth.setDefaultCredentials({
    username: 'YOUR_USERNAME_HERE',
    apiKey: 'YOUR_API_KEY_HERE'
});
```
