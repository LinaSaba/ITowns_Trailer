let latText = document.getElementById("latText");
let lonText = document.getElementById("lonText");
let zText = document.getElementById("zText");
let penteText = document.getElementById("penteText");

// Retrieve the view container
const viewerDiv = document.getElementById('viewerDiv');

// Define the view geographic extent
itowns.proj4.defs(
    'EPSG:2975',
    '+proj=utm +zone=40 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
);
const viewExtent = new itowns.Extent(
    'EPSG:2975',
    300000.0, 400000.0,
    7630000.0, 7700000.0,
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
    url: "https://wxs.ign.fr/3ht7xcw6f7nciopo16etuqp2/geoportail/r/wms",
    name: "HR.ORTHOIMAGERY.ORTHOPHOTOS",
    format: "image/png",
    crs: 'EPSG:2975',
    extent: viewExtent,
});
// Create the ortho-images ColorLayer and add it to the view
const layerOrtho = new itowns.ColorLayer('Ortho', { source: sourceOrtho });
view.addLayer(layerOrtho);

// Define the source of the dem data
const sourceDEM = new itowns.WMSSource({
    url: "https://wxs.ign.fr/3ht7xcw6f7nciopo16etuqp2/geoportail/r/wms",
    name: "ELEVATION.ELEVATIONGRIDCOVERAGE.HIGHRES",
    format: "image/x-bil;bits=32",
    crs: 'EPSG:2975',
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

let vertices;
let index = 0;
let runner;
let group = new itowns.THREE.Group();
let waypoints = [];

var waypointGeometry = new itowns.THREE.BoxGeometry(1, 1, 80);
var waypointMaterial = new itowns.THREE.MeshBasicMaterial({ color: 0xffffff });
// Listen for globe full initialisation event
view.addEventListener(itowns.GLOBE_VIEW_EVENTS.GLOBE_INITIALIZED, function () {
    console.info('Globe initialized');
    itowns.Fetcher.xml('./assets/diag.gpx')
        .then((gpx) => {
            const data = gpx.getElementsByTagName("gpx")[0].children[0].children[1];
            const nombrePoints = data.childElementCount;
            //const nombrePoints = gpx.activeElement.children[0].children[1].childElementCount;

            for (let i = 0; i < 7133; i++) {
                waypoints.push(data.children[i])
                //waypoints.push(gpx.activeElement.children[0].children[1].children[i])
            }

            itowns.GpxParser.parse(gpx, {
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
                            color: 'black'
                        }
                    })
                }
            })
                .then(itowns.Feature2Mesh.convert())
                .then(function (mesh) {

                    if (mesh) {
                        mesh.updateMatrixWorld();
                        mesh.traverse((m) => {
                            if (m.type == 'Line') {
                                vertices = m.feature.vertices;
                                //console.log(m.feature);
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

                        let geometryS = new itowns.THREE.SphereGeometry(200, 320, 320);
                        let materialS = new itowns.THREE.MeshBasicMaterial({ color: 0xff00ff });
                        runner = new itowns.THREE.Mesh(geometryS, materialS);

                        runner.updateMatrix();

                        view.scene.add(runner);
                        runner.updateMatrixWorld();

                        document.getElementById("pauseBtn").addEventListener("click", mettrePause);

                        animate();
                    }
                });
        })

});

function calculerDistance(x1, y1, z1, x2, y2, z2) {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2);
}

function trouverCoordsP2(x1, y1, z1, x3, y3, z3, distance) {

    let directionX = null;
    let directionY = null;

    if (x3 == x1) {
        if (y3 > y1) {
            directionX = n / 2
        } else {
            directionX = -n / 2
        }
        if (z3 > z1) {
            directionY = n / 2;
        } else {
            directionY = -n / 2;
        }
    } else {
        directionX = Math.atan((y3 - y1) / (x3 - x1));
        directionY = Math.atan((z3 - z1) / (x3 - x1));
    }

    const x2 = x1 + distance * Math.cos(directionX) * Math.cos(directionY);
    const y2 = y1 + distance * Math.sin(directionX) * Math.cos(directionY);
    const z2 = z1 + distance * Math.sin(directionY);

    return { x: x2, y: y2, z: z2 };
}

function arrondirDecimal(nombre, decimal) {
    return Math.round(nombre * (10 ** decimal)) / (10 ** decimal);
}

function convertPenteToRgb(pente) {

    const penteMax = 24;

    let r = 0;
    let g = 0;
    let b = 0;

    let penteCopy = pente;

    if (pente > penteMax)
        penteCopy = penteMax;
    else if (pente < -penteMax)
        penteCopy = -penteMax;

    if (pente < 0) {
        b = Math.round(-penteCopy / penteMax * 255);
        g = Math.round((1 + penteCopy / penteMax) * 255);
    } else {
        r = Math.round(penteCopy / penteMax * 255);
        g = Math.round((1 - penteCopy / penteMax) * 255);
    }

    return "rgb("+r+","+g+","+b+")";
}

const seuilDistance = 100;
let play = true;

function animate() {

    requestAnimationFrame(animate)

    if (index < 7131 && play) {
        let distanceParcourue = 0;
        let distanceAParcourir = seuilDistance;

        let p1 = new itowns.Coordinates('EPSG:4326', parseFloat(waypoints[index].attributes.lon.value), parseFloat(waypoints[index].attributes.lat.value), parseFloat(waypoints[index].children[0].innerHTML)).as(view.referenceCrs);
        let p2 = new itowns.Coordinates('EPSG:4326', parseFloat(waypoints[index + 1].attributes.lon.value), parseFloat(waypoints[index + 1].attributes.lat.value), parseFloat(waypoints[index + 1].children[0].innerHTML)).as(view.referenceCrs);

        let distanceP1P2 = calculerDistance(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);

        let lastZ = p1.z;
        let lastDistanceP1P2 = distanceP1P2;

        while (distanceP1P2 < distanceAParcourir) {
            distanceParcourue += distanceP1P2;
            distanceAParcourir = seuilDistance - distanceParcourue;

            if (index < 7131)
                index++;
            else
                break;

            p1 = p2;
            p2 = new itowns.Coordinates('EPSG:4326', parseFloat(waypoints[index + 1].attributes.lon.value), parseFloat(waypoints[index + 1].attributes.lat.value), parseFloat(waypoints[index + 1].children[0].innerHTML)).as(view.referenceCrs);
            distanceP1P2 = calculerDistance(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
        }

        let point = trouverCoordsP2(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, distanceAParcourir);

        runner.updateMatrix();
        runner.position.set(point.x, point.y, point.z);
        runner.updateMatrixWorld();

        let pente = (point.z - lastZ) / lastDistanceP1P2 * 10;

        latText.innerHTML = arrondirDecimal(point.x, 2);
        lonText.innerHTML = arrondirDecimal(point.y, 2);
        zText.innerHTML = arrondirDecimal(point.z, 2);
        penteText.innerHTML = arrondirDecimal(pente, 2);

        penteText.style.color = convertPenteToRgb(pente);

        index++;
    }

    render();
}

function render() {
    view.mainLoop.gfxEngine.renderer.render(view.scene, view.camera.camera3D);
}

function mettrePause() {
    if (play) {
        play = false;
        document.getElementById("pauseBtn").innerHTML = "Resume";
    }
    else {
        play = true
        document.getElementById("pauseBtn").innerHTML = "Pause";
    }
}