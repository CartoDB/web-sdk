## Interactivity and Pop-ups

In this guide, you will learn how to add interactivity to your application using highlighting and pop-ups. It is recommended to read first the Getting Started guide to understand the basic structure of a Web SDK application.

After completing this guide, you will know how to make your geospatial applications more interactive!

<div class="example-map">
    <iframe
        id="interactivity-popups-final-result"
        src="/developers/web-sdk/examples/maps/guides/interactivity-popups/step-7.html"
        width="100%"
        height="500"
        frameBorder="0">
    </iframe>
</div>

### Highlighting

With the Web SDK it is very easy to highlight features. You can highlight a feature when the pointer moves over the feature and when the feature is clicked. You can specify one or both events and have a different style for each event.

We are going to start by highlighting the features when the pointer moves over them. In order to do that you must specify the `hoverStyle` parameter in the `options` object while creating the layer. You can specify different parameters like the color (fill), stroke color or stroke width. There is a `default` style that specifies light yellow as the stroke color, a slightly darker yellow as the stroke color and 5 as the stroke width. The `options` parameter is the third parameter to the `Layer` constructor so we need to specify also the `style` parameter. The highlighting is removed when we move the pointer out of the feature.

```js
const countriesLayer = new carto.viz.Layer('ne_50m_admin_0_countries', carto.viz.style.basic(), {
  hoverStyle: 'default'
});
```

<div class="example-map">
    <iframe
        id="interactivity-popups-step-1"
        src="/developers/web-sdk/examples/maps/guides/interactivity-popups/step-1.html"
        width="100%"
        height="500"
        style="margin: 20px auto !important"
        frameBorder="0">
    </iframe>
</div>
> View this step [here](/developers/web-sdk/examples/maps/guides/interactivity-popups/step-1.html)

You can specify custom highlighting properties directly usings the deck.gl properties like `getFillColor` or `getLineColor`. 

```js
const countriesLayer = new carto.viz.Layer('ne_50m_admin_0_countries', carto.viz.style.basic(), {
  hoverStyle: {
    getFillColor: [0, 255, 255, 255],
    getLineColor: [0, 220, 220, 255],
    getLineWidth: 4
  }
});
```

<div class="example-map">
    <iframe
        id="interactivity-popups-step-2"
        src="/developers/web-sdk/examples/maps/guides/interactivity-popups/step-2.html"
        width="100%"
        height="500"
        style="margin: 20px auto !important"
        frameBorder="0">
    </iframe>
</div>
> View this step [here](/developers/web-sdk/examples/maps/guides/interactivity-popups/step-2.html)

If you want to highlight the features when the user clicks on them, you must use the `clickStyle` parameter. The options are the same for this parameter and the `hoverStyle` parameter. The highlighting is removed when we click on another feature.

```js
const countriesLayer = new carto.viz.Layer('ne_50m_admin_0_countries', carto.viz.style.basic(), {
  clickStyle: {
    getFillColor: [0, 255, 255, 255],
    getLineColor: [0, 220, 220, 255],
    getLineWidth: 4
  }
});
```

<div class="example-map">
    <iframe
        id="interactivity-popups-step-3"
        src="/developers/web-sdk/examples/maps/guides/interactivity-popups/step-3.html"
        width="100%"
        height="500"
        style="margin: 20px auto !important"
        frameBorder="0">
    </iframe>
</div>
> View this step [here](/developers/web-sdk/examples/maps/guides/interactivity-popups/step-3.html)

You can apply both highlighting styles to the same layer. In this case we are going to use the `default` highlighting for the `hoverStyle` parameter and use a custom highlighting style for the `clickStyle` parameter.

```js
const countriesLayer = new carto.viz.Layer('ne_50m_admin_0_countries', carto.viz.style.basic(), {
  hoverStyle: 'default', 
  clickStyle: {
    getFillColor: [0, 255, 255, 255],
    getLineColor: [0, 220, 220, 255],
    getLineWidth: 4
  }
});
```

<div class="example-map">
    <iframe
        id="interactivity-popups-step-4"
        src="/developers/web-sdk/examples/maps/guides/interactivity-popups/step-4.html"
        width="100%"
        height="500"
        style="margin: 20px auto !important"
        frameBorder="0">
    </iframe>
</div>
> View this step [here](/developers/web-sdk/examples/maps/guides/interactivity-popups/step-4.html)

### Pop-Ups

The Web SDK allows you to add pop-ups both when the user moves the pointer over a feature and when the user clicks on a feature. You can add the pop-up by calling the `setPopupHover` or `setPopupClick` methods in the `Layer` object. You can call the methods before or after adding the layer to the map. You need to specify the attributes/feature properties that you want to show in the pop-up. For each attribute the Web SDK shows the attribute name (title) and the value. You can specify a different attribute name using the `title` property and you can apply a specific format for the `value` property.

Pop-ups use the Airship library, so you need to add the Airship CSS and JavaScript files to our page.

```html
    <!-- Include Airship from the CARTO CDN -->
    <link rel="stylesheet" href="https://libs.cartocdn.com/airship-style/v2.4.0/airship.css">
    <script type="module" src="https://libs.cartocdn.com/airship-components/v2.4.0/airship/airship.esm.js"></script>
    <script nomodule="" src="https://libs.cartocdn.com/airship-components/v2.4.0/airship/airship.js"></script>
```

The `addTo` method in the Layer object and the `setPopupHover`and `setPopupClick` are [async](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function) functions. To be sure that you get the desired results when calling these methods, it is safer to called them using the `await` statement, inside another function defined as `async`.

```js
async function initialize()
{
  layer = new carto.viz.Layer(...);
  await layer.addTo(...);
  await layer.setPopupHover(...);
};
```

We are going to start by adding a pop-up when the user moves the pointer over a feature. We will show the country name and the estimated population. In addition to that, we are going to hide the name attribute title and show a more meaningful title for the `pop_est` attribute. The pop-up is hidden when you move the pointer out of the feature.

```js
await countriesLayer.setPopupHover([
  {
    attr: 'name',
    title: null 
  },
  {
    attr: 'pop_est',
    title: 'Estimated Population'
  }
]);
```

<div class="example-map">
    <iframe
        id="interactivity-popups-step-5"
        src="/developers/web-sdk/examples/maps/guides/interactivity-popups/step-5.html"
        width="100%"
        height="500"
        style="margin: 20px auto !important"
        frameBorder="0">
    </iframe>
</div>
> View this step [here](/developers/web-sdk/examples/maps/guides/interactivity-popups/step-5.html)

Now we are going to add a pop-up when the user clicks on a feature. In this case we are going to add more attributes and apply some formatting for the numeric values. The pop-up is hidden when you click in another feature.

```js
await countriesLayer.setPopupClick([
  {
    attr: 'name',
    title: null 
  },
  {
    attr: 'pop_est',
    title: 'Estimated Population',
    format: value => Math.round((value / 1.0e+6) * 100) / 100 + 'M inhabitants'
  },
  {
    attr: 'economy',
    title: 'Economy Group'
  },
  {
    attr: 'income_grp',
    title: 'Income Group'
  }
]);
```

<div class="example-map">
    <iframe
        id="interactivity-popups-step-6"
        src="/developers/web-sdk/examples/maps/guides/interactivity-popups/step-6.html"
        width="100%"
        height="500"
        style="margin: 20px auto !important"
        frameBorder="0">
    </iframe>
</div>
> View this step [here](/developers/web-sdk/examples/maps/guides/interactivity-popups/step-6.html)

Once you have added a pop-up for a layer, you can easily disable it by calling the pop-up function with a null argument.

```js
await countriesLayer.setPopupHover(null);
await countriesLayer.setPopupClick(null);
```

### All together

This is the complete example with feature highlighting and pop-ups both for hover and click events on the features.

<div class="example-map">
    <iframe
        id="getting-started-step-7"
        src="/developers/web-sdk/examples/maps/guides/interactivity-popups/step-7.html"
        width="100%"
        height="500"
        style="margin: 20px auto !important"
        frameBorder="0">
    </iframe>
</div>

> You can explore the final step [here](/developers/web-sdk/examples/maps/guides/interactivity-popups/step-7.html)

```html
<!DOCTYPE html>
<html lang="en">
  <head>

    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Interactivity and Pop-ups Guide - Step 7</title>

    <link href='https://api.tiles.mapbox.com/mapbox-gl-js/v1.10.0/mapbox-gl.css' rel='stylesheet' />
  
    <link href="https://libs.cartocdn.com/airship-style/v2.4.0/airship.css" rel="stylesheet" >

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

    <!-- Include Airship from the CARTO CDN -->
    <script type="module" src="https://libs.cartocdn.com/airship-components/v2.4.0/airship/airship.esm.js"></script>
    <script nomodule="" src="https://libs.cartocdn.com/airship-components/v2.4.0/airship/airship.js"></script>

    <script>
      async function initialize()
      {
        carto.auth.setDefaultCredentials({ username: 'public' });
        const deckMap = carto.viz.createMap();

        const countriesLayer = new carto.viz.Layer('ne_50m_admin_0_countries', carto.viz.style.basic(), {
          hoverStyle: 'default',
          clickStyle: {
            getFillColor: [0, 255, 255, 255],
            getLineColor: [0, 220, 220, 255],
            getLineWidth: 4
          }
        });

        await countriesLayer.addTo(deckMap);

        await countriesLayer.setPopupHover([
          {
            attr: 'name',
            title: null 
          },
          {
            attr: 'pop_est',
            title: 'Estimated Population'
          }
        ]);

        await countriesLayer.setPopupClick([
          {
            attr: 'name',
            title: null 
          },
          {
            attr: 'pop_est',
            title: 'Estimated Population',
            format: value => Math.round((value / 1.0e+6) * 100) / 100 + 'M inhabitants'
          },
          {
            attr: 'economy',
            title: 'Economy Group'
          },
          {
            attr: 'income_grp',
            title: 'Income Group'
          }
        ]);
      }
      
      initialize();
    </script>
  
  </body>

</html>
```
