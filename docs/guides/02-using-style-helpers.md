## Using style helpers

In this guide, you will learn how to create insightful visualizations with few lines of code using the Web SDK style helpers. It is recommended to have read the Getting Started guide to understand the basic structure of a Web SDK application.

After completing this guide, you will be able to use style helpers to create stunning visualizations in a very easy way!

### Introduction

The style helpers are methods inside the `carto.viz.style` namespace that allows you to visualize your layers using different properties like size or color. All the style helpers have predefined defaults for the style options that will be applied if they are not specified.

This is the list of currently available style helpers:

* `carto.viz.style.basic`
* Color style helpers
  * `carto.viz.style.colorBins`
  * `carto.viz.style.colorCategories`
  * `carto.viz.style.colorContinuous`  
* Size style helpers
  * `carto.viz.style.sizeBins` 
  * `carto.viz.style.sizeCategories`
  * `carto.viz.style.sizeContinuous`

In the following sections we will show how to use the different style helpers.

### Basic style

The basic style helper allows to specify these options through the `BasicOptionsStyle` object:

* color
* size (only for points and lines)
* opacity
* strokeColor (only for points and polygons)
* strokeWidth (only for points and polygons)

Each of these options have different defaults depending on the type of geometry. For instance, the default color for points is #EE4D5A, #4CC8A3 for lines and #826DBA for polygons. For a complete list of all the default values for the different properties, please go to the [reference](ToDo Add link).

If we use the basic style helper without specifying options, we will obtain the same result that if we were not using the helper.

```js
const countriesLayer = new carto.viz.Layer('ne_50m_admin_0_countries');
```

is equivalent to:

```js
const countriesBasicStyle = new carto.viz.style.basic();
const countriesLayer = new carto.viz.Layer('ne_50m_admin_0_countries', countriesBasicStyle);
```

<div class="example-map">
    <iframe
        id="using-style-helpers-step-1"
        src="/developers/web-sdk/examples/maps/guides/using-style-helpers/step-1.html"
        width="100%"
        height="500"
        style="margin: 20px auto !important"
        frameBorder="0">
    </iframe>
</div>
> View this step [here](/developers/web-sdk/examples/maps/guides/using-style-helpers/step-1.html)

Now we are going to change the color and stroke color properties:

```js
const countriesBasicStyle = new carto.viz.style.basic({
  color: '#8888FF',
  strokeColor: '#000000'
});
const countriesLayer = new carto.viz.Layer('ne_50m_admin_0_countries', countriesBasicStyle);
```

<div class="example-map">
    <iframe
        id="using-style-helpers-step-2"
        src="/developers/web-sdk/examples/maps/guides/using-style-helpers/step-2.html"
        width="100%"
        height="500"
        style="margin: 20px auto !important"
        frameBorder="0">
    </iframe>
</div>
> View this step [here](/developers/web-sdk/examples/maps/guides/using-style-helpers/step-2.html)

### Color style helpers

You can use these helpers to easily change the color of features depending on the values of a given feature property. If the property data type is numeric, you can group the features in bins using the `carto.viz.style.colorBins` helper. If the property data type is a string representing values from a data domain, you can group the features in categories using the `carto.viz.style.colorCategories` helper. There is an additional helper `carto.viz.style.colorContinuous` that you can use for creating a continuous color ramp for numeric feature properties.

Starting with the `carto.viz.style.colorBins` helper, we can specify different options like the number of bins, the palette to be used for colors or the classification method. If a parameter is not specified, it will use the default value (i.e. quantiles as the classification method). Please go to the [reference](ToDo Add link) to view the full list of options and default values for this helper.  

We are going to apply the helper to assign a different color to each country polygon using the estimated population (pop_est) property, 7 bins and the teal palette from [CARTOcolors](https://carto.com/carto-colors/).

```js
const countriesColorStyle = new carto.viz.style.colorBins('pop_est', {
  bins: 7,
  palette: 'teal'
});
const countriesLayer = new carto.viz.Layer('ne_50m_admin_0_countries', countriesColorStyle);
```

<div class="example-map">
    <iframe
        id="using-style-helpers-step-3"
        src="/developers/web-sdk/examples/maps/guides/using-style-helpers/step-3.html"
        width="100%"
        height="500"
        style="margin: 20px auto !important"
        frameBorder="0">
    </iframe>
</div>
> View this step [here](/developers/web-sdk/examples/maps/guides/using-style-helpers/step-3.html)

Now we are going to use the `carto.viz.style.colorCategories` helper to assign a different color to each country depending on the `continent` feature property. We can leave empty the `options` object or we can specify one or more parameters. Please go to the [reference](ToDo Add link) to view the full list of options and default values for this helper. In this example, we are only specifying the color palette. 

```js
const countriesColorStyle = new carto.viz.style.colorCategories('continent', { palette: 'teal' });
const countriesLayer = new carto.viz.Layer('ne_50m_admin_0_countries', countriesColorStyle);
```

<div class="example-map">
    <iframe
        id="using-style-helpers-step-4"
        src="/developers/web-sdk/examples/maps/guides/using-style-helpers/step-4.html"
        width="100%"
        height="500"
        style="margin: 20px auto !important"
        frameBorder="0">
    </iframe>
</div>
> View this step [here](/developers/web-sdk/examples/maps/guides/using-style-helpers/step-4.html)

Finally we are going to use the `carto.viz.style.colorContinuous` helper to create a continuous color ramp depending on the country GDP. This time we are not sending any parameter so we will use the default values. Please go to the [reference](ToDo Add link) to view the full list of options and default values for this helper.  

```js
const countriesColorStyle = new carto.viz.style.colorContinuous('gdp_md_est');
const countriesLayer = new carto.viz.Layer('ne_50m_admin_0_countries', countriesColorStyle);
```

<div class="example-map">
    <iframe
        id="using-style-helpers-step-5"
        src="/developers/web-sdk/examples/maps/guides/using-style-helpers/step-5.html"
        width="100%"
        height="500"
        style="margin: 20px auto !important"
        frameBorder="0">
    </iframe>
</div>
> View this step [here](/developers/web-sdk/examples/maps/guides/using-style-helpers/step-5.html)

### Size style helpers

Similar to the color style helpers, you can use the size style helpers to easily change the size ot the symbology representing the features depending on the values of a given feature property. If the property data type is numeric, you can group the features in bins using the `carto.viz.style.sizeBins` helper. If the property data type is a string representing values from a data domain, you can group the features in categories using the `carto.viz.style.sizeCategories` helper. There is an additional helper `carto.viz.style.sizeContinuous` that you can use for creating a continuous color ramp for numeric feature properties.

We are going to start with the `carto.viz.style.sizeBins` helper. As it is the case with all the helpers, we can specify different options or use the default values. For this helper we have different options available like the number of bins or the classification method. Please go to the [reference](ToDo Add link) to view the full list of options and default values for this helper. 

For the size style helpers example we are going to use the `listings_madrid` point dataset that contains information for Airbnb places in Madrid.

The feature dataset only includes data for Madrid, so we are going to specify the zoom level and the initial center coordinates while creating the map.

```js
const deckMap = carto.viz.createMap({
  view: {
    longitude: -3.70,
    latitude: 40.41,
    zoom: 14
  }
});
```

We are going to apply the helper to assign a different size to each Airbnb place using the availability (`availability_365`) property. This property contains the number of days the place is available in a year. The bigger the number of days, the bigger the symbol we will use for the point. We are going to use 7 bins and the peach palette from [CARTOcolors](https://carto.com/carto-colors/).


```js
const airbnbSizeStyle = new carto.viz.style.sizeBins('availability_365', {
  bins: 7,
  palette: 'peach'
});
const airbnbLayer = new carto.viz.Layer('listings_madrid', airbnbSizeStyle);
```

<div class="example-map">
    <iframe
        id="using-style-helpers-step-6"
        src="/developers/web-sdk/examples/maps/guides/using-style-helpers/step-6.html"
        width="100%"
        height="500"
        style="margin: 20px auto !important"
        frameBorder="0">
    </iframe>
</div>
> View this step [here](/developers/web-sdk/examples/maps/guides/using-style-helpers/step-6.html)

Now we are going to use the `carto.viz.style.sizeCategories` helper to assign a different size to each Airbnb place depending on the `property_type` feature property. Please go to the [reference](ToDo Add link) to view the full list of options and default values for this helper. In this example, we are going to specify manually the categories so they are ordered in size. 

```js
const airbnbSizeStyle = new carto.viz.style.sizeCategories('property_type', { 
  categories: ['Dorm', 'Bed & Breakfast', 'Apartment', 'Condominium', 'Loft', 'House', 'Chalet']
});
const airbnbLayer = new carto.viz.Layer('listings_madrid', airbnbSizeStyle);
```

<div class="example-map">
    <iframe
        id="using-style-helpers-step-7"
        src="/developers/web-sdk/examples/maps/guides/using-style-helpers/step-7.html"
        width="100%"
        height="500"
        style="margin: 20px auto !important"
        frameBorder="0">
    </iframe>
</div>
> View this step [here](/developers/web-sdk/examples/maps/guides/using-style-helpers/step-7.html)

Finally we are going to use the `carto.viz.style.sizeContinuous` helper to create a continuous size ramp depending on the `square_feet` feature property. This time we are not sending any parameter so we will use the default values. Please go to the [reference](ToDo Add link) to view the full list of options and default values for this helper.  

```js
const airbnbSizeStyle = new carto.viz.style.sizeContinuous('square_feet');
const airbnbLayer = new carto.viz.Layer('listings_madrid', airbnbSizeStyle);
```

<div class="example-map">
    <iframe
        id="using-style-helpers-step-8"
        src="/developers/web-sdk/examples/maps/guides/using-style-helpers/step-8.html"
        width="100%"
        height="500"
        style="margin: 20px auto !important"
        frameBorder="0">
    </iframe>
</div>
> View this step [here](/developers/web-sdk/examples/maps/guides/using-style-helpers/step-8.html)
