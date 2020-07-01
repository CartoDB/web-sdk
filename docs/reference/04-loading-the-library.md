## Loading the Library
CARTO Web SDK is hosted on a CDN for easy loading. You can load the full source "web-sdk.js" file or the minified version "web-sdk.min.js". Once the script is loaded, you will have a global `carto` namespace.
CARTO Web SDK is hosted in NPM as well. You can require it as a dependency in your custom apps.

```html
<!-- CDN: load Web SDK-->
<script src="https://libs.cartocdn.com/carto-vl/%VERSION%/web-sdk.min.js"></script>
```

```javascript
// NPM: load the latest CARTO Web SDK version
npm install @carto/web-sdk
// or
yarn add @carto/web.sdk

var carto = require('@carto/web-sdk');
// or
import carto from '@carto/web-sdk';
```
