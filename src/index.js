import 'ol/ol.css';
import GeoJSON from 'ol/format/GeoJSON';
import Map from 'ol/Map';
import View from 'ol/View';
import {defaults as defaultControls, ScaleLine} from 'ol/control';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';

import obcineJson from '../data/obcine.geojson';

const maxResolution = 1200;

function getText(feature) {
    return feature.get('OB_UIME');
  };


const tileLayer = new TileLayer({
    source: new OSM(),
});

const obcineSrc = new VectorSource({
    format: new GeoJSON(),
    url: obcineJson,
});

const obcineStyle = new Style({
    stroke: new Stroke({
        color: 'blue',
        width: 2,
    }),
});

const obcineLayer = new VectorLayer({
    source: obcineSrc,
    style: obcineStyle,
});

const layers = [
    tileLayer,
    obcineLayer,
];

const map = new Map({
    controls: defaultControls().extend([
        new ScaleLine({
            units: 'degrees',
        }),
    ]),
    layers: layers,
    target: 'map',
    view: new View({
        center: [1655360.12, 5793576.89],
        zoom: 9,
    }),
});
