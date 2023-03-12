const ITOWNS_GPX_PARSER_OPTIONS = { in: { crs: 'EPSG:4326' }, out: { crs: 'EPSG:4326', mergeFeatures: true } };

// Retrieve the view container
const viewerDiv = document.getElementById('viewerDiv');

// Define the view geographic extent
itowns.proj4.defs(
    'EPSG:4326',
    '+proj=longlat + ellps=WGS84 + datum=WGS84 + no_defs'
);
const viewExtent = new itowns.Extent(///////////regarder istowns.Extent prend quelles genre de coords
    'EPSG:4326',
    6140203.0, 6219351.0,
    -2373832.0, -2439479.0,
);

// Define the camera initial placement
const placement = {
    coord: viewExtent.center(),
    tilt: 12,
    heading: 40,
    range: 16000,
};

// Create the planar view
const view = new itowns.PlanarView(viewerDiv, viewExtent, {
    placement: placement,
});

// Define the source of the ortho-images
const sourceOrtho = new itowns.WMSSource({
    url: "https://wxs.ign.fr/ortho/geoportail/r/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities",
    name: "HR.ORTHOIMAGERY.ORTHOPHOTOS",
    format: "image/png",
    crs: 'EPSG:4326',
    extent: viewExtent,
});
// Create the ortho-images ColorLayer and add it to the view
const layerOrtho = new itowns.ColorLayer('Ortho', { source: sourceOrtho });
view.addLayer(layerOrtho);

// Define the source of the dem data
const sourceDEM = new itowns.WMSSource({
    url: "https://wxs.ign.fr/ortho/geoportail/r/wms?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities",
    name: "ELEVATION.ELEVATIONGRIDCOVERAGE.HIGHRES",
    format: "image/x-bil;bits=32",
    crs: 'EPSG:4326',
    extent: viewExtent,
});
// Create the dem ElevationLayer and add it to the view
const layerDEM = new itowns.ElevationLayer('DEM', { source: sourceDEM });
view.addLayer(layerDEM);

itowns.Fetcher.xml('./assets/GrandRaid.gpx')
    .then(gpx => itowns.GpxParser.parse(gpx, ITOWNS_GPX_PARSER_OPTIONS))
    .then(parsedGPX => {
        console.log(parsedGPX.features[0].vertices)
        const allGPXcoord = parsedGPX.features[0].vertices;
        displayPath(allGPXcoord)
    });

function displayPath(vertices) {
    let coordList = [];
    console.log(view.referenceCrs);
    for (let i = 0; i < vertices.length / 3; i++) {
        coordList.push(new itowns.Coordinates('EPSG:4326', vertices[i * 3], vertices[i * 3 + 1], vertices[i * 3 + 2]).as(view.referenceCrs).toVector3());
        //console.log(new itowns.Coordinates('EPSG:4326', vertices[i * 3], vertices[i * 3 + 1], vertices[i * 3 + 2] + 10).as(view.referenceCrs).toVector3());
    }

    const curve = new itowns.THREE.CatmullRomCurve3(coordList, false);

    let geometry = new itowns.THREE.TubeGeometry(curve, coordList.length * 10, 10, 8, false);
    /*
    geometry = new BufferGeometry().fromGeometry(geometry);
    
    const points = curve.getPoints(500);
    //console.log(points);
    //console.log(view.camera.camera3D);

    const geometry = new itowns.THREE.BufferGeometry().setFromPoints(points);*/
    const material = new itowns.THREE.LineBasicMaterial({ color: 0xff0000 });
/*
    // Create the final object to add to the scene
    const curveObject = new itowns.THREE.Line(geometry, material);
    console.log(curveObject);
*/
    //view.rende.setClearColor(0x00ff00, 0);
    const curveObject = new itowns.THREE.Mesh(geometry, material);
    console.log(curveObject);

    view.scene.add(curveObject);
    //view.camera.camera3D.position.set(-7274487.5, 10000000, 19.999799728393555);
};