## Dataviews and Widgets

In this guide, you will learn how to use the dataviews to get information about your datasets and connect them with widgets to provide a visual interface with filtering capabilities. It is recommended to read first the Getting Started guide to understand the basic structure of a Web SDK application.

After completing this guide, you will know how to create applications with data-driven widgets!

<div class="example-map">
    <iframe
        id="dataviews-widgets-final-result"
        src="/developers/web-sdk/examples/maps/guides/dataviews-widgets/step-3.html"
        width="100%"
        height="500"
        frameBorder="0">
    </iframe>
</div>

### Dataviews




### Widgets




### All together



<div class="example-map">
    <iframe
        id="dataviews-widgets-step-3"
        src="/developers/web-sdk/examples/maps/guides/dataviews-widgets/step-X.html"
        width="100%"
        height="500"
        style="margin: 20px auto !important"
        frameBorder="0">
    </iframe>
</div>

> You can explore the final step [here](/developers/web-sdk/examples/maps/guides/dataviews-widgets/step-X.html)

```html
<!DOCTYPE html>
<html lang="en">
  <head>

    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Getting Started Guide - Step 3</title>

    <link href='https://api.tiles.mapbox.com/mapbox-gl-js/v1.10.0/mapbox-gl.css' rel='stylesheet' />
  
    <style>
      body {
        margin: 0;
        padding: 0;
      }

      #map {
        width: 100vw;
        height: 100vh;
      }
    </style>

  </head>

  <body>

    <div id="map"></div>

    <!-- Include deck.gl from unpkg CDN -->
    <script src="https://unpkg.com/deck.gl@8.2.0/dist.min.js"></script>

    <!-- Include Mapbox GL from the Mabpox CDN -->
    <script src='https://api.tiles.mapbox.com/mapbox-gl-js/v1.10.0/mapbox-gl.js'></script>

    <!-- Include Web SDK from the CARTO CDN -->
    <script src="https://libs.cartocdn.com/web-sdk/v1.0.0-alpha/index.min.js"></script>

    <script>
        carto.auth.setDefaultCredentials({ username: 'public' });
        const deckMap = carto.viz.createMap();
        const countriesLayer = new carto.viz.Layer('ne_50m_admin_0_countries',
                                                   carto.viz.style.colorCategories('continent'));
        countriesLayer.addTo(deckMap);
    </script>
  
  </body>

</html>
```
