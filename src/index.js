import 'ol/ol.css';

import Circle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import GeoJSON from 'ol/format/GeoJSON';
import Map from 'ol/Map';
import View from 'ol/View';
import {defaults as defaultControls, ScaleLine} from 'ol/control';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import Point from 'ol/geom/Point';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import { Overlay, Collection, Feature, Geolocation } from 'ol';
import {transform} from 'ol/proj';

import obcineJson from './data/obcine.geojson';

// COSTANTS
const POPUP_ID = "popup";
const MAP_CENTER = [1655360.12, 5793576.89];
const MESTNA = "D";

const elObcinaAvailable = document.querySelector('#position > .available');
const elObcinaOutside = document.querySelector('#position > .outside');
const elObcinaUnavailable = document.querySelector('#position > .unavailable');
const elObcinaName = document.getElementById('obcina-name');
const elObcinaLat = document.getElementById('loc-lat');
const elObcinaLon = document.getElementById('loc-lon');

const selectedCollection = new Collection([], {
    unique: true,
});

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
        width: 1,
        lineDash: [2, 5],
    }),
    fill: new Fill({
        color: 'rgba(255, 255, 255, 0.1)',
    }),
});

const obcineLayer = new VectorLayer({
    source: obcineSrc,
    style: obcineDefaultStyle,
});

const selectedSrc = new VectorSource({
    features: selectedCollection,
});

const selectedStyle = new Style({
    stroke: new Stroke({
        color: 'red',
        width: 2,
    }),
});

const selectedLayer = new VectorLayer({
    source: selectedSrc,
    style: selectedStyle,
});

const locationSrc = new VectorSource();

const locationStyles = generateLocationStyles();
let locationStyleIdx = 0;

const locationLayer = new VectorLayer({
    source: locationSrc,
    style: locationStyles[0],
});

const layers = [
    tileLayer,
    obcineLayer,
    selectedLayer,
    locationLayer,
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

function mapClickHandler(evt) {
    selectedSrc.clear();

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
    selectedSrc.addFeature(obcina);
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

// SHOW LOCATION
const userLocation = new Feature();
locationSrc.addFeature(userLocation);

const geolocation = new Geolocation({
    tracking: true,
    trackingOptions: { enableHighAccuracy: true },
    projection: map.getView().getProjection(),
});

geolocation.on('change:position', (evt) => {
    const coordinate = geolocation.getPosition();
    const point = coordinate ? new Point(coordinate) : null;
    userLocation.setGeometry(point);

    updateObcinaInfo(coordinate);
});

geolocation.on('error', err => {
    locationSrc.clear();
    setLocationMessageErr();
});

function updateObcinaInfo(coordinate) {
    let obcina = getObcinaFeature(coordinate);

    if (obcina == null) {
        setLocationMessageOut();
        return;
    }

    let name = obcina.get('OB_UIME');
    let wgsCoord = transform(coordinate, 'EPSG:3857', 'EPSG:4326');

    setLocationMessageOk(name, wgsCoord);
}

// ANIMATE LOCATION MARKER
function generateLocationStyles() {
    const styles = [];

    for (let idx = 12; idx > 2; idx--) {
        styles.push(new Style({
            image: new Circle({
                radius: idx,
                fill: new Fill({color: 'white'}),
                stroke: new Stroke({
                    color: 'red',
                    width: 1,
                }),
            }),
        }));
    }

    return styles;
}

function locationStyleAnimationStep() {
    const nextIdx = locationStyleIdx++ % (locationStyles.length - 1);
    const nextStyle = locationStyles[nextIdx];
    locationLayer.setStyle(nextStyle);
}

function locationStyleAnimate() {
    locationStyleAnimationStep();
    setTimeout(locationStyleAnimate, 250);
}

locationStyleAnimate();

// DOM MANIPULATION
function setLocationMessageOk(obcinaName, coordinate) {
    elObcinaName.textContent = obcinaName;
    elObcinaLat.textContent = `${coordinate[1]}N`;
    elObcinaLon.textContent = `${coordinate[0]}E`;

    display(elObcinaAvailable);
    hide(elObcinaOutside);
    hide(elObcinaUnavailable);
}

function setLocationMessageOut() {
    hide(elObcinaAvailable);
    display(elObcinaOutside);
    hide(elObcinaUnavailable);
}

function setLocationMessageErr() {
    hide(elObcinaAvailable);
    hide(elObcinaOutside);
    display(elObcinaUnavailable);
}

function display(el) {
    el.classList.remove("hide");
}

function hide(el) {
    el.classList.add("hide");
}
