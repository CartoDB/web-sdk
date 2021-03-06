## Dataviews and Widgets

In this guide, you will learn how to use the dataviews to get information about your datasets and connect them with widgets to provide a visual interface with filtering capabilities. It is recommended to read first the Getting Started guide to understand the basic structure of a Web SDK application.

After completing this guide, you will know how to create applications with data-driven widgets!

<div class="example-map">
    <iframe
        id="dataviews-widgets-final-result"
        src="/developers/web-sdk/examples/maps/guides/dataviews-widgets/step-4.html"
        width="100%"
        height="500"
        frameBorder="0">
    </iframe>
</div>

### Dataviews

You can use dataviews for getting information from data sources. There are three main ways of specifying a data source:

* Using the CARTO dataset name. It includes all the features from the dataset.
* Specifying a SQL statement to retrieve information from one or more CARTO datasets. It can include a subset of features by using filters in the SQL statement or new features generated by joining two or more datasets.
* Using a GeoJSON object. It includes all the features from the dataset.

When we create the dataview, we can specify directly the data source or we can specify a layer and it will retrieve the information from the layer source.

We have three different types of dataviews:

* `carto.viz.dataview.Formula`
* `carto.viz.dataview.Category`
* `carto.viz.dataview.Histogram`

When we create the dataview, we specify the data source, the feature property/field used for calculations and some additional options. These are the options that are available for all dataviews:

* `mode`. When you are using a CARTO dataset as the data source, you can use the information from the vector tiles in the client to perform the dataview calculations or you can perform the calculations server-side. The tiles might not include all the existing features in the dataset because there are some aggregations that happen while creating the tiles to speed-up the visualization. This means that some operations (i.e. average) must not yield exact results. If exact results are needed, you must use server-side calculations. This option controls the calculation mode and the possible values are `'fast'` for using the tiles (this is the default) and `'precise'` for performing server-side calculations.  
* `filters`. You can use this option to specify column filters while creating your dataview so you can filter the data source specifying additional conditions.
* `spatialFilter`. You can specify a spatial filter to restrict the features that are used for dataview calculations. Currently the only possible value for this option is `viewport`, that will filter the data to include only the features in the current viewport.

The `carto.viz.dataview.Formula` and `carto.viz.dataview.Category` dataviews provide an option to specify the aggregation operation to execute on the features, through the option called `operation`. The possible values are:
  * `'count'`
  * `'avg'`
  * `'min'`
  * `'max'`
  * `'sum'`
  * `'percentile'` 

In addition to these options, there are other options specific to some dataviews. Please go to the reference to see the options available for each dataview.

If you are specifying the layer and not directly the data source, you must be sure that it has already been loaded before creating the dataview. In order to do that, we should use the `await` instruction when adding the layer to the map, as explained in the [Interactivity and Pop-Ups](../interactivity-popups/) guide.

We are going to start with the most simple dataview, `carto.viz.dataview.Formula`, that calculates a given formula, specified by the operation option. It works with numeric feature properties. In this case we are summing the GDP for all the countries.

```js
const dataviewFormula = new carto.viz.dataview.Formula(countriesLayer, 'gdp_md_est', { operation: 'sum' });
```

Now we are going to create a Category dataview, `carto.viz.dataview.Category`, that groups the features using the feature property passed as the second argument and then executes an operation on another column specified by the `operationColumn` option. The feature property must have a string data type and the `operationColumn` must be a numeric field. If the aggregation operation is `'count'`, you don't need to pass an `operationColumn`option. In this case, we are going to add a viewport `spatialFilter` so the operation only takes into account the features in the current viewport.

```js
const dataviewCategory = new carto.viz.dataview.Category(countriesLayer, 'continent', {
  operation: 'count'
  spatialFilter: 'viewport'
});
```

Finally we are going to create an Histogram dataview, `carto.viz.dataview.Histogram`, that groups the features on bins taking into account the values of the specified feature property. We are going to group the countries in 10 population bins and we are only going to take into account countries with population between 100K and 100M inhabitants.

```js
const dataviewHistogram = new carto.viz.dataview.Histogram(countriesLayer, 'pop_est', { 
  bins: 10,
  start: 100000,
  end: 100000000 
});
```

You use the dataviews for performing calculations on the data sources. Once you have defined the dataview, a logical next step is showing the result to the user. The Web SDK provides ready to use Airship widgets, described in the next section, that can be connected easily to your dataviews. In this case, we are going to add a simple user interface for showing the results from the category dataview defined above.

We are going to create a slightly more complex layout taking advantage of Airship components. We are going to create a left sidebar for containing our widgets. We will start just adding a section for holding some information from the dataview. This is the HTML structure for the layout.

```html
<body class="as-app-body as-app">

  <as-responsive-content>
  
    <!-- Left sidebar -->
    <aside class="as-sidebar as-sidebar--left">
        <div class="as-container">
            <section class="as-box as-p--16 as-body">
                <h1 class="as-title">Category dataview</h1>
                <h4 class="as-subheader as-mb--12">
                  Compute aggregation values per category with
                  <em>carto.viz.dataview.Category</em>
                </h4>
                <hr/>
                <div id="result"></div>
            </section>
        </div>
    </aside>

    <!-- Map area -->
    <main class="as-main">
        <div class="as-map-area">
            <div id="map"></div>
        </div>
    </main>

  <as-responsive-content>
  ...
</body>
```

Now we are going to add the information from the dataview to the HTML section. When the information on the dataview is refreshed, the `dataUpdate` event is emitted. We are going to add a handler to this event that calls the `getData` method from the dataview object to retrieve the dataview information.

```js
dataview.on('dataUpdate', async () => {
  const data = await dataview.getData();
  ...
});
```

The first thing we can add to our `div` is the number of categories.

```js
const numberOfCategories = data.count;
$result.append(`Total: ${numberOfCategories}`);
```

After that, we are going to loop through the categories and add the information to a list that will be finally added to the `div` in the HTML markup.

```js  
var list = document.createElement('ul');
for (let i = 0; i < numberOfCategories; i++) {
  const category = data.categories[i];
  var li = document.createElement('li');
  const { name, value } = category;
  li.textContent = `${name}: ${value}`;
  list.appendChild(li);
}
$result.append(list);
```

<div class="example-map">
    <iframe
        id="dataviews-widgets-step-1"
        src="/developers/web-sdk/examples/maps/guides/dataviews-widgets/step-1.html"
        width="100%"
        height="500"
        style="margin: 20px auto !important"
        frameBorder="0">
    </iframe>
</div>
> View this step [here](/developers/web-sdk/examples/maps/guides/dataviews-widgets/step-1.html)

### Widgets

In order to add widgets to your application, the first step is adding the Airship web components to your HTML markup. You can go to the Airship [reference](https://carto.com/developers/airship/reference/) to know more about this library. First we add the Airship formula widget.

```html
<as-formula-widget
    id="widgetFormula"
    class="as-p--16"
    heading="GDP"
    description="Sum of Countries GDP">
</as-formula-widget>
```
Now you can create the `carto.viz.widget.Formula` widget using the HTML DOM element and the dataview.  

```js
new carto.viz.widget.Formula("#widgetFormula", dataviewFormula);
```

<div class="example-map">
    <iframe
        id="dataviews-widgets-step-2"
        src="/developers/web-sdk/examples/maps/guides/dataviews-widgets/step-2.html"
        width="100%"
        height="500"
        style="margin: 20px auto !important"
        frameBorder="0">
    </iframe>
</div>
> View this step [here](/developers/web-sdk/examples/maps/guides/dataviews-widgets/step-2.html)

You can follow a similar approach for adding the Category dataview:

```html
<as-category-widget
  id="widgetCategory"
  heading="Countries by continent"
  description="Number of countries by continent (on screen)"
  show-clear-button>
</as-category-widget>
```

```js
new carto.viz.widget.Category("#widgetCategory", dataviewCategory);
```

<div class="example-map">
    <iframe
        id="dataviews-widgets-step-3"
        src="/developers/web-sdk/examples/maps/guides/dataviews-widgets/step-3.html"
        width="100%"
        height="500"
        style="margin: 20px auto !important"
        frameBorder="0">
    </iframe>
</div>
> View this step [here](/developers/web-sdk/examples/maps/guides/dataviews-widgets/step-3.html)

Finally, we are going to add an Histogram widget:

```html
<as-histogram-widget
  id="widgetHistogram"
  heading="Countries by population"
  description="Distribution of countries by population"
  show-clear-button>
</as-histogram-widget>
```

```js
new carto.viz.widget.Histogram("#widgetHistogram", dataviewHistogram);
```

<div class="example-map">
    <iframe
        id="dataviews-widgets-step-4"
        src="/developers/web-sdk/examples/maps/guides/dataviews-widgets/step-4.html"
        width="100%"
        height="500"
        style="margin: 20px auto !important"
        frameBorder="0">
    </iframe>
</div>
> View this step [here](/developers/web-sdk/examples/maps/guides/dataviews-widgets/step-4.html)

### All together

Below you can find the full code for the final example.

```html
<!DOCTYPE html>
<html lang="en">

  <head>

    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dataviews & Widgets - Step 4</title>

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

  <body class="as-app-body as-app">

    <as-responsive-content>

        <!-- Left sidebar -->
        <aside class="as-sidebar as-sidebar--left">
            <div class="as-container">
                <section class="as-box">
                    <as-formula-widget
                        id="widgetFormula"
                        class="as-p--16"
                        heading="GDP"
                        description="Sum of GDP">
                    </as-formula-widget>
                </section>
                <section class="as-box">
                  <as-category-widget
                    id="widgetCategory"
                    heading="Countries by continent"
                    description="Number of countries by continent (on screen)"
                    show-clear-button>
                  </as-category-widget>
                </section>
                <section class="as-box">
                    <as-histogram-widget
                      id="widgetHistogram"
                      heading="Countries by population"
                      description="Distribution of countries by population"
                      show-clear>
                    </as-histogram-widget>
                </section>
            </div>
        </aside>
      
        <!-- Map area -->
        <main class="as-main">
            <div class="as-map-area">
                <div id="map"></div>
            </div>
        </main>
  
    </as-responsive-content>

    <!-- Include deck.gl from unpkg CDN -->
    <script src="https://unpkg.com/deck.gl@8.2.0/dist.min.js"></script>

    <!-- Include Mapbox GL from the Mabpox CDN -->
    <script src='https://api.tiles.mapbox.com/mapbox-gl-js/v1.10.0/mapbox-gl.js'></script>

    <!-- Include Web SDK from the CARTO CDN -->
    <script src="https://libs.cartocdn.com/web-sdk/%VERSION%/index.min.js"></script>

    <!-- Include Airship from the CARTO CDN -->
    <script type="module" src="https://libs.cartocdn.com/airship-components/v2.4.0/airship/airship.esm.js"></script>
    <script nomodule="" src="https://libs.cartocdn.com/airship-components/v2.4.0/airship/airship.js"></script>
  
    <script>
      async function initialize()
      {
        carto.auth.setDefaultCredentials({ username: 'public' });
        const deckMap = carto.viz.createMap();
        const countriesLayer = new carto.viz.Layer('ne_50m_admin_0_countries');
        await countriesLayer.addTo(deckMap);

        // Formula Dataview & Widget
        const dataviewFormula = new carto.viz.dataview.Formula(countriesLayer, 'gdp_md_est', { operation: 'sum' });
        new carto.viz.widget.Formula("#widgetFormula", dataviewFormula);

        // Category Dataview & Widget
        const dataviewCategory = new carto.viz.dataview.Category(countriesLayer, 'continent', {
          operation: 'count',
          spatialFilter: 'viewport'
        });
        new carto.viz.widget.Category("#widgetCategory", dataviewCategory);

        // Histogram Dataview & Widget
        const dataviewHistogram = new carto.viz.dataview.Histogram(countriesLayer, 'pop_est', { 
          bins: 10,
          start: 100000,
          end: 100000000 
        });
        new carto.viz.widget.Histogram("#widgetHistogram", dataviewHistogram);
      }
      
      initialize();
    </script>
  
  </body>

</html>
```
