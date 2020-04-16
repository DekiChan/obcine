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
import { Overlay } from 'ol';

import obcineJson from '../data/obcine.geojson';

// COSTANTS
const POPUP_ID = "popup";
const MAP_CENTER = [1655360.12, 5793576.89];
const MESTNA = "D";

// LAYERS
const tileLayer = new TileLayer({
    source: new OSM(),
});

const obcineSrc = new VectorSource({
    format: new GeoJSON(),
    url: obcineJson,
});

const obcineDefaultStyle = new Style({
    stroke: new Stroke({
        color: 'blue',
        width: 2,
    }),
});

const obcineSelectedStyle = new Style({
    stroke: new Stroke({
        color: 'red',
        width: 2,
    }),
});

const obcineLayer = new VectorLayer({
    source: obcineSrc,
    style: obcineDefaultStyle,
});

const layers = [
    tileLayer,
    obcineLayer,
];

// CREATE MAP
const map = new Map({
    controls: defaultControls().extend([
        new ScaleLine({
            units: 'degrees',
        }),
    ]),
    layers: layers,
    target: 'map',
    view: new View({
        center: MAP_CENTER,
        zoom: 9,
    }),
});

// INFO POPUP
const popup = new Overlay({
    element: document.getElementById(POPUP_ID),
});

let counter = 1;
function mapClickHandler(evt) {
    let element = popup.getElement();
    let coordinate = evt.coordinate;
    let obcina = getObcinaFeature(coordinate);

    if (obcina == null) {
        popup.setPosition(undefined);
        return;
    }

    let name = obcina.get('OB_UIME');
    let area = obcina.get('POV_KM2');
    let mestna = obcina.get('OB_TIP') == MESTNA ? 'DA' : 'NE';

    element.innerHTML = `
        <h3>${name}</h3>
        <p>Površina: ${area} km2</p>
        <p>Mestna: ${mestna}</p>
    `;

    popup.setPosition(coordinate);
}


function getObcinaFeature(coordinate) {
    const features = obcineSrc.getFeaturesAtCoordinate(coordinate);

    if (features.length < 1) {
        return null;
    }

    return features[0];
}

map.addOverlay(popup);
map.on('click', mapClickHandler);
