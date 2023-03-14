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

const ITOWNS_GPX_PARSER_OPTIONS = { in: { crs: 'EPSG:4326' }, out: { crs: 'EPSG:4326', mergeFeatures: true } };

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


// update the waypoint
var distance, scale, point = new itowns.THREE.Vector3();
var size = new itowns.THREE.Vector2();
function updatePointScale(renderer, scene, camera) {
    point.copy(this.geometry.boundingSphere.center).applyMatrix4(this.matrixWorld);;
    distance = camera.position.distanceTo(point);
    renderer.getSize(size);
    scale = Math.max(2, Math.min(100, distance / size.y));
    this.scale.set(scale, scale, scale);
    this.updateMatrixWorld();
}

var vertices;
let index = 0;
let runner;

var waypointGeometry = new itowns.THREE.BoxGeometry(1, 1, 80);
var waypointMaterial = new itowns.THREE.MeshBasicMaterial({ color: 0xffffff });
// Listen for globe full initialisation event
view.addEventListener(itowns.GLOBE_VIEW_EVENTS.GLOBE_INITIALIZED, function () {
    console.info('Globe initialized');
    itowns.Fetcher.xml('./assets/diag.gpx')
        .then((gpx) => itowns.GpxParser.parse(gpx, {
            in: {
                crs: 'EPSG:4326',
            },
            out: {
                crs: view.referenceCrs,
                structure: '3d',
                style: new itowns.Style({
                    stroke: {
                        color: 'red',
                        width: 2
                    },
                    point: {
                        color: 'white'
                    }
                })
            }
        }))
        .then(itowns.Feature2Mesh.convert())
        .then(function (mesh) {

            if (mesh) {
                mesh.updateMatrixWorld();
                mesh.traverse((m) => {
                    if (m.type == 'Line') {
                        vertices = m.feature.vertices;
                        console.log(m.feature);
                        for (var i = 0; i < vertices.length; i += 3) {
                            var waypoint = new itowns.THREE.Mesh(waypointGeometry, waypointMaterial);
                            waypoint.position.fromArray(vertices, i);
                            waypoint.lookAt(mesh.worldToLocal(new itowns.THREE.Vector3()));
                            waypoint.onBeforeRender = updatePointScale;
                            waypoint.updateMatrix();
                            mesh.add(waypoint);
                            waypoint.updateMatrixWorld();
                        }
                    }
                });
                view.scene.add(mesh);
                view.notifyChange();

                let geometryS = new itowns.THREE.SphereGeometry(2000, 320, 320);
                let materialS = new itowns.THREE.MeshBasicMaterial({ color: 0xff0000 });
                runner = new itowns.THREE.Mesh(geometryS, materialS);
                //runner.position.copy(new itowns.THREE.Vector3(349061.88680361793, 7666676.953710422, 2000));
                //runner.lookAt(mesh.worldToLocal(new itowns.THREE.Vector3()));
                //runner.onBeforeRender = updatePointScale;
                runner.updateMatrix();
                runner.position.set(3862.255004731298, 25093.030992013402, 2441);
                //runner.position.set(vertices[index * 3], vertices[index * 3 + 1], vertices[index * 3 + 2]);
                mesh.add(runner);
                runner.updateMatrixWorld();

                //view.camera.camera3D.position.set(3862.255004731298, 25093.030992013402, 2501);
                //view.camera.camera3D.lookAt(runner.position)

                animate();
            }
        });
});


function animate() {

    requestAnimationFrame(animate)

    index += 3;

    //runner.lookAt(runner.worldToLocal(new itowns.THREE.Vector3()));
    runner.updateMatrix();
    runner.position.fromArray(vertices, index);
    //runner.position.set(3862.255004731298, 2441, 25093.030992013402);
    //runner.position.set(vertices[index * 3], vertices[index * 3 + 1], vertices[index * 3 + 2]);
    runner.updateMatrixWorld();

    console.log(runner.position)

    render();
}

function render() {
    view.mainLoop.gfxEngine.renderer.render(view.scene, view.camera.camera3D);
}

