//CORE VARIABLES
var canvas;
var context;
var imageBuffer;

var DEBUG = false; //whether to show debug messages
var EPSILON = 0.00001; //error margins

//scene to render
var scene;
var camera;
var surfaces;
var materials;
var lights;
var bounceDepth;
var shadowBias;
//etc...

//define our objects (may not need some of these...)
/*
  Camera class tracks location and facing of the camera, and may be responsible
  for generating viewing rays. It can store variables to quickly generate new rays
  without having to recompute appropriate vectors.
*/
var Camera = function (eye, up, at, fovy, aspect) {
    this.eye = eye;
    this.up = up;
    this.at = at;
    this.fovy = fovy;
    this.aspect = aspect;


    var h = 2 * Math.tan(rad(fovy / 2.0));
    this.h = h;
    var w = h * aspect;
    this.w = w;
};
Camera.prototype.castRay = function (x, y) {
    var u = (this.w * x / (canvas.width - 1)) - (this.w / 2.0);
    var v = (-this.h * y / (canvas.height - 1)) + (this.h / 2.0);
    //calculate direction

    //where is eye used??
    var direction = vec3.fromValues(u, v, -1);
    var origin = vec3.clone(this.eye);//vec3.clone(this.at);// vec3.fromValues(0, 0, 0);
    return new Ray(direction, origin, undefined, shadowBias);
    //return new ray with origin at (0,0,0) and direction
};



var Sphere = function (center, radius, material, transforms) {
    this.center = center;
    this.radius = radius;
    this.material = material;


    //if this sphere has any transforms, put them in the transform object
    var transformObject = undefined;
    if (transforms !== undefined) {
        transformObject = {};
        for (var i = 0; i < transforms.length; i++) {
            transformObject[transforms[i][0]] = transforms[i][1];
        }
    }



    this.transforms = transformObject;
};
Sphere.prototype.intersects = function (ray) {
    //first calculate the determinant to see how many real solutions there are

    if (DEBUG) {
        console.log("Ray's direction is " + ray.direction);

    }
    var a = vec3.dot(ray.direction, ray.direction);//d dot d
    var b = vec3.dot(ray.direction, vec3.subtract([0, 0, 0], ray.origin, this.center));//2d dot (e - c)
    var c = vec3.dot(vec3.subtract([0, 0, 0], ray.origin, this.center), vec3.subtract([0, 0, 0], ray.origin, this.center));
    var discriminant = Math.pow(b, 2) - a * (c - Math.pow(this.radius, 2));

    if (DEBUG) {
        console.log("discriminant is");
        console.log(discriminant);
    }

    //if the discriminant is negative, the line and the object don't intersect
    if (discriminant < 0 || isNaN(discriminant)) return null;
    var t1 = (-b - Math.sqrt(discriminant)) / a;
    var t2 = (-b + Math.sqrt(discriminant)) / a;

    if (DEBUG) {
        console.log("t1" + t1);
        console.log("t2" + t2);
        console.log("discriminant" + discriminant);
    }

    var t;

    if (t1 < 0 && t2 < 0 || isNaN(t1) && isNaN(t2)) return null;
    else if (t1 < 0 && t2 >= 0 || isNaN(t1) && t2 >= 0) t = t2;
    else if (t1 >= 0 && t2 < 0 || isNaN(t2) && t1 >= 0) t = t1;
    else {
        if (t1 > t2) t = t2;
        else t = t1;
    }

    //check whether the t value is within the bounds
    //if it isn't return null
    if (ray.tMin !== undefined) {
        if (t < ray.tMin) return null;
    }
    if (ray.tMax !== undefined) {
        if (t > ray.tMax) return null;
    }



    var point = vec3.scaleAndAdd([0, 0, 0], ray.origin, ray.direction, t);
    var normal = vec3.subtract([0, 0, 0], point, this.center);
    var unitNormal = vec3.scale([0, 0, 0], normal, 1 / this.radius);


    return new Intersection(t, point, unitNormal);
};
//Sphere.prototype.<method> = function(params){};
var Triangle = function (p1, p2, p3, material, transforms) {
    this.v1 = p1;
    this.v2 = p2;
    this.v3 = p3;
    this.material = material;

    var transformObject = undefined;
    if (transforms !== undefined) {
        transformObject = {};
        for (var i = 0; i < transforms.length; i++) {
            transformObject[transforms[i][0]] = transforms[i][1];
        }
    }


    this.transforms = transformObject;


};
Triangle.prototype.intersects = function (ray) {

    //this implements the Moller-Trumbore intersection algorithm
    //http://en.wikipedia.org/wiki/M%C3%B6ller%E2%80%93Trumbore_intersection_algorithm
    var edge1 = vec3.fromValues(0, 0, 0);
    var edge2 = vec3.fromValues(0, 0, 0);
    var P = vec3.fromValues(0, 0, 0);
    var Q = vec3.fromValues(0, 0, 0);
    var T = vec3.fromValues(0, 0, 0);
    var determinant, inverseDeterminant, u, v;
    var t;

    //find vectors for two edges sharing v1
    vec3.subtract(edge1, this.v2, this.v1);
    vec3.subtract(edge2, this.v3, this.v1);

    //begin calculating determinant
    vec3.cross(P, ray.direction, edge2);

    //if determinant is near zero, ray lies in plane of triangle
    determinant = vec3.dot(edge1, P);

    //NOT CULLING
    if (determinant > -EPSILON && determinant < EPSILON) return null;
    inverseDeterminant = 1 / determinant;

    //calculate distance from v1 to ray origin
    vec3.subtract(T, ray.origin, this.v1);

    //calculate u parameter and test bound
    u = vec3.dot(T, P) * inverseDeterminant;

    //return null if the intersection lies outside of the triangle
    if (u < 0 || u > 1) return null;

    //prepare to test v parameter
    vec3.cross(Q, T, edge1);
    //calculate V parameter and test bound
    v = vec3.dot(ray.direction, Q) * inverseDeterminant;
    //The intersection lies outside of the triangle
    if (v < 0 || u + v > 1) return null;

    t = vec3.dot(edge2, Q) * inverseDeterminant;

    //if we have an intersection
    if (t > EPSILON) {

        //check whether the t value is within the bounds
        //if it isn't return null
        if (ray.tMin !== undefined) {
            if (t < ray.tMin) return null;
        }
        if (ray.tMax !== undefined) {
            if (t > ray.tMax) return null;
        }


        var point = vec3.scaleAndAdd([0, 0, 0], ray.origin, ray.direction, t);


        //if angle between normal and ray direction is greater than 90 then flip
        var normal = vec3.cross([0, 0, 0], edge1, edge2);
        vec3.normalize(normal, normal);

        //make sure the normal is pointing the right way
        if (isGreaterThan90Degrees(normal, ray.direction)) {
            for (var i = 0; i < normal.length; i++) {
                normal[i] = -normal[i];
            }
        }

        return new Intersection(t, point, normal);
    }

    //no hit :(
    return null;

};
var Material = function (ka, kd, ks, shininess, kr) {
    this.ka = ka;
    this.kd = kd;
    this.ks = ks;
    this.shininess = shininess;
    this.kr = kr;
};
//ambient light only has color
var AmbientLight = function (color) {
    this.color = color;
};
var PointLight = function (position, color) {
    this.position = position;
    this.color = color;
};
var DirectionalLight = function (direction, color) {
    this.direction = direction;
    this.color = color;
};
var Ray = function (direction, origin, tMax, tMin) {
    this.direction = direction;
    this.origin = origin;
    this.tMax = tMax;
    this.tMin = tMin;
};//might not need
var Intersection = function (t, intersectionPoint, normal) {
    this.t = t;
    this.intersectionPoint = vec3.clone(intersectionPoint);
    this.normal = vec3.clone(normal);
};//might not need

//initializes the canvas and drawing buffers
function init() {
    canvas = $('#canvas')[0];
    context = canvas.getContext("2d");
    imageBuffer = context.createImageData(canvas.width, canvas.height); //buffer for pixels

    // loadSceneFile("assets/SphereTest.json");
    //loadSceneFile("assets/TriangleTest.json");
    //    loadSceneFile("assets/SphereShadingTest2.json");
    // loadSceneFile("assets/SphereShadingTest1.json");
    // loadSceneFile("assets/TriangleShadingTest.json");
     loadSceneFile("assets/TransformationTest.json");
    // loadSceneFile("assets/FullTest.json");
    //  loadSceneFile("assets/FullTest2.json");
    // loadSceneFile("assets/ShadowTest1.json");
    // loadSceneFile("assets/ShadowTest2.json");
    //  loadSceneFile("assets/RecursiveTest.json");
    //  loadSceneFile("assets/2RecursiveTest.json");
    // loadSceneFile("assets/CornellBox.json");
    // loadSceneFile("assets/3CornellBox.json");
   // loadSceneFile("assets/RecursiveBalls.json");
}


//loads and "parses" the scene file at the given path
function loadSceneFile(filepath) {
    scene = Utils.loadJSON(filepath); //load the scene
    console.log("We're loading " + filepath);


    camera = new Camera(scene.camera.eye, scene.camera.up, scene.camera.at, scene.camera.fovy, scene.camera.aspect);

    bounceDepth = scene.bounce_depth;
    shadowBias = scene.shadow_bias;
    //set up array to hold our surfaces
    surfaces = [];


    for (var i = 0; i < scene.surfaces.length; i++) {
        surfaces.push(getSurfaceShape(scene.surfaces[i]));
    }

    if (DEBUG) console.log(surfaces);

    //set up our materials
    materials = [];
    for (var i = 0; i < scene.materials.length; i++) {
        materials.push(new Material(
            scene.materials[i].ka,
            scene.materials[i].kd,
            scene.materials[i].ks,
            scene.materials[i].shininess,
            scene.materials[i].kr));
    }
    console.log("materials " + materials);

    //set up our lights
    lights = {};
    for (var i = 0; i < scene.lights.length; i++) {
        lights[scene.lights[i].source] = getLightType(scene.lights[i]);
    }

    render(); //render the scene
    console.log(lights);
}

/*
  Returns true if the angle between the two vectors is greater than 90 degrees.

  @param {vec3} The first vector
  @param {vec3} The second vector
  @return {boolean} Whether the angle between the two vectors is greater than 90.
*/
function isGreaterThan90Degrees(vec1, vec2) {

    var temp1 = vec3.clone(vec1);
    var temp2 = vec3.clone(vec2);
    if (DEBUG) {
        //	console.log("temp1 and temp2");
        //	console.log(temp1);
        //	console.log(temp2);
    }

    vec3.normalize(temp1, temp1);
    vec3.normalize(temp2, temp2);

    var dot = vec3.dot(temp1, temp2);
    if (DEBUG) {
        //	console.log("dot: ");
        //	console.log(dot);
    }
    if (dot > 0) return true;
    else return false;

}

/*
  Returns an appropriate shape given the surface object
  
*/
function getSurfaceShape(surface) {

    if (surface.shape === "Sphere") {
        return new Sphere(surface.center, surface.radius, surface.material, surface.transforms);
    }
    else {
        return new Triangle(surface.p1, surface.p2, surface.p3, surface.material, surface.transforms);
    }
}

/*
  Returns the appropriate light for the given light object.

  @param{Object} a light object with a source field
  @return{Object} an appropriate light object

*/
function getLightType(light) {

    if (light.source === "Ambient") {
        return new AmbientLight(light.color);
    }
    else if (light.source === "Point") {
        return new PointLight(light.position, light.color);
    }
    else {
        return new DirectionalLight(light.direction, light.color);
    }
}


/*
  Gets the appropriate color given the intersection point, the surface and the ray.

  @param {Intersection} The closest intersection to the viewer
  @param {Surface} The surface that was hit
  @param {Ray} The ray that was fired.
  @return {vec3} The color for that pixel
*/
function getColor(intersection, surface, ray) {
    var light;
    var lightPos;
    var lightDirection;
    var normal = intersection.normal;
    var maxT;
    vec3.normalize(normal, normal);


    //first, figure out the direction of the light based on whether its a directional
    //light or a point light
    if (lights.Point !== undefined) {
        light = lights.Point;
        lightPos = light.position;
        maxT = vec3.length(vec3.subtract([0, 0, 0], lightPos, intersection.intersectionPoint));
        lightDirection = vec3.subtract([0, 0, 0], intersection.intersectionPoint, lightPos);
    }
    else if (lights.Directional !== undefined) {

        light = lights.Directional;
        maxT = undefined;
        lightDirection = vec3.clone(light.direction);
    }
    else {
        //if the there isn't any directional or point lights
        return [0, 0, 0];
    }


    vec3.normalize(lightDirection, lightDirection);
    var negativeLightDirection = vec3.subtract([0, 0, 0], [0, 0, 0], lightDirection);


    var reflection = vec3.normalize([0, 0, 0], getReflection(lightDirection, normal));
    vec3.normalize(reflection, reflection);

    //get the ambient component of our light
    var ka = vec3.clone(materials[surface.material].ka);
    vec3.multiply(ka, ka, lights.Ambient.color);

    //get the diffuse component of our light
    var kd = vec3.clone(materials[surface.material].kd);
    vec3.multiply(kd, kd, light.color);


    var diffuse = Math.max(0, vec3.dot(normal, negativeLightDirection));
    vec3.scale(kd, kd, diffuse);

    //get the specular component of our light
    var ks = vec3.clone(materials[surface.material].ks);
    //get vector that points toward the camera
    var v = vec3.clone(ray.direction);
    for (var i = 0; i < v.length; i++) {
        v[i] = -v[i];
    }
    vec3.normalize(v, v);

    var coefficient = Math.max(0, vec3.dot(reflection, v));
    var shininess = materials[surface.material].shininess;
    //if the shininess coefficient is 0, don't use it to calculate the specular component
    if (shininess !== 0) {
        coefficient = Math.pow(coefficient, materials[surface.material].shininess);
    }

    vec3.scale(ks, ks, coefficient);

    var point = vec3.clone(intersection.intersectionPoint);

    //check if the current point is in a shadow
    var inShadow = isInShadow(new Ray(negativeLightDirection, point, maxT, shadowBias));

    //add ambient to the final color 
    var color = vec3.add([0, 0, 0], ka, [0, 0, 0]);

    //if the current point *isn't* in a shadow, also add diffuse and specular lighting
    if (!inShadow) {
        vec3.add(color, color, kd);
        //if the current point doesn't have any shininess, don't add any specular lighting
        if (shininess !== 0) {
            vec3.add(color, color, ks);
        }
    }

    return color;
}

/*
  Returns true if the surface point is in a shadow; false otherwise.

  @param {Ray} A Ray object whose origin is the point on the surface and whose direction is towards the light source.
  @return {boolean} True if the ray hits an object; false otherwise
*/
function isInShadow(ray) {

    for (var i = 0; i < surfaces.length; i++) {
        if (surfaces[i].intersects(ray) !== null) return true;
    }
    return false;
}

/*
  Returns a reflection vector given the light direction and 
  surface normal

  @param {vec3} The direction vector you want to find a reflection of.
  @param {vec3} The normal of the surface
  @return {vec3} The reflected vector
 */
function getReflection(direction, normal) {
    var dotProduct = vec3.dot(direction, normal);
    dotProduct = dotProduct * 2;
    var scaledNormal = vec3.scale([0, 0, 0], normal, dotProduct);
    return vec3.subtract([0, 0, 0], direction, scaledNormal);
}



/*
  This function returns the current matrix's transformation

  @return {mat4} The transformation matrix for the passed surface
*/
function getTransformationMatrix(surface) {
    var matrix = mat4.create();

    if (DEBUG) {
        console.log("This surface is");
        console.log(surface);
    }

    if (surface.transforms.Translate !== undefined) {
        mat4.translate(matrix, matrix, surface.transforms.Translate);
    }
    if (surface.transforms.Rotate !== undefined) {

        mat4.rotateX(matrix, matrix, rad(surface.transforms.Rotate[0]));
        mat4.rotateY(matrix, matrix, rad(surface.transforms.Rotate[1]));
        mat4.rotateZ(matrix, matrix, rad(surface.transforms.Rotate[2]));
    }
    if (surface.transforms.Scale !== undefined) {

        mat4.scale(matrix, matrix, surface.transforms.Scale);
    }

   // for (let i = 0; i < 4; i++) {
   //     console.log(matrix[i * 4] + " " + matrix[i * 4 + 1] + " " + matrix[i * 4 + 2] + " " + matrix[i * 4 + 3]);
   // }

    return matrix;
}

/*
  Get a single pixel's color.

  @param {Ray} The current ray that was fired
  @param {float} The current depth of the recursion
*/
function getSinglePixelColor(ray, recursionDepth) {
    if (DEBUG) {
        console.log("recursionDepth is ");
        console.log(recursionDepth);
        console.log("bounceDepth is ");
        console.log(bounceDepth);
        console.log("is recursionDepth greater than or equal to bounceDepth?");
        console.log(recursionDepth >= bounceDepth);
    }
    if (recursionDepth >= bounceDepth) return [0, 0, 0];

    var curRay;
    var curIntersection;
    var frontIntersection;
    // var curColor;
    var frontSurface;
    var frontTransformationMatrix;
    var transformationMatrix;
    var origin;
    var direction;


    frontIntersection = null;
    frontTransformationMatrix = null;
    transformationMatrix = null;
    frontSurface = null;


    for (var i = 0; i < surfaces.length; i++) { //INIZIO FOR
        //check if the current surface has any transforms

        //	transformationMatrix = undefined;

        if (surfaces[i].transforms !== undefined) {


            transformationMatrix = mat4.clone(getTransformationMatrix(surfaces[i]));

            var invertedTransformationMatrix = mat4.create();
            mat4.invert(invertedTransformationMatrix, transformationMatrix);


            origin = vec4.fromValues(ray.origin[0], ray.origin[1], ray.origin[2], 1);
            direction = vec4.fromValues(ray.direction[0], ray.direction[1], ray.direction[2], 0);

            vec4.transformMat4(origin, origin, invertedTransformationMatrix);
            vec4.transformMat4(direction, direction, invertedTransformationMatrix);

            var tempRay = new Ray(direction, origin, undefined, shadowBias);

            curIntersection = surfaces[i].intersects(tempRay);
        } else {
            curIntersection = surfaces[i].intersects(ray);
        }

        //if the current intersection is closer than the current king, replace it
        if (frontIntersection === null || curIntersection !== null && frontIntersection !== null && curIntersection.t < frontIntersection.t) {
            frontIntersection = curIntersection;
            frontSurface = surfaces[i];
            frontTransformationMatrix = transformationMatrix;

        }


    }// FINE FOR

    if (DEBUG) {
        console.log("The front surface is");
        console.log(frontSurface);
    }
    if (frontIntersection === null) {
        if (DEBUG) console.log("frontIntersection was null");
        return [0, 0, 0];// setPixel(x, y, [0,0,0]);
    }
    else {

        //if this object was transformed, need to translate back into world coordinates
        if (frontTransformationMatrix !== null) {
            //transform our intersection back into world coordinates
            var temp = vec3.clone(frontIntersection.intersectionPoint);
            frontIntersection.intersectionPoint = vec4.fromValues(temp[0], temp[1], temp[2], 1);
            vec4.transformMat4(frontIntersection.intersectionPoint, frontIntersection.intersectionPoint, frontTransformationMatrix);

            //transform our normal back into world coordinates
            temp = mat4.create();
            mat4.invert(temp, frontTransformationMatrix);
            mat4.transpose(temp, temp);

            var tempNormal = vec3.clone(frontIntersection.normal);
            frontIntersection.normal = vec4.fromValues(tempNormal[0], tempNormal[1], tempNormal[2], 0);

            vec4.transformMat4(frontIntersection.normal, frontIntersection.normal, temp);
        }

        //the color for this level of recursion
        var baseColor = getColor(frontIntersection, frontSurface, ray);

        //reflect a ray from the current intersection point
        var reflectedDirection = getReflection(ray.direction, frontIntersection.normal);
        var reflectedRay = new Ray(reflectedDirection, frontIntersection.intersectionPoint, undefined, shadowBias);

        //find the color in the reflected direction
        var reflectionColor = getSinglePixelColor(reflectedRay, recursionDepth + 1);

        //weight by surface's mirror reflectance and add it to final color
        vec3.multiply(reflectionColor, reflectionColor, materials[frontSurface.material].kr);
        vec3.add(baseColor, baseColor, reflectionColor);

        return baseColor;

    }

}

//renders the scene
function render() {
    var start = Date.now(); //for logging

    //color each pixel of the image
    for (var x = 0; x < canvas.width; x++) {
        for (var y = 0; y < canvas.height; y++) {
            curRay = camera.castRay(x, y);
            var color = getSinglePixelColor(curRay, -1);
            setPixel(x, y, color);
        }
    }

    //render the pixels that have been set
    context.putImageData(imageBuffer, 0, 0);

    var end = Date.now(); //for logging
    $('#log').html("rendered in: " + (end - start) + "ms");
    console.log("rendered in: " + (end - start) + "ms");

}

//sets the pixel at the given x,y to the given color
/**
 * Sets the pixel at the given screen coordinates to the given color
 * @param {int} x     The x-coordinate of the pixel
 * @param {int} y     The y-coordinate of the pixel
 * @param {float[3]} color A length-3 array (or a vec3) representing the color. Color values should floating point values between 0 and 1
 */
function setPixel(x, y, color) {
    var i = (y * imageBuffer.width + x) * 4;
    imageBuffer.data[i] = (color[0] * 255) | 0;
    imageBuffer.data[i + 1] = (color[1] * 255) | 0;
    imageBuffer.data[i + 2] = (color[2] * 255) | 0;
    imageBuffer.data[i + 3] = 255; //(color[3]*255) | 0; //switch to include transparency
}

//converts degrees to radians
function rad(degrees) {
    return degrees * Math.PI / 180;
}

//on load, run the application
$(document).ready(function () {
    init();
    render();

    //load and render new scene
    $('#load_scene_button').click(function () {
        var filepath = 'assets/' + $('#scene_file_input').val() + '.json';
        loadSceneFile(filepath);
    });

    //debugging - cast a ray through the clicked pixel with DEBUG messaging on
    $('#canvas').click(function (e) {
        var x = e.pageX - $('#canvas').offset().left;
        var y = e.pageY - $('#canvas').offset().top;
        DEBUG = true;
        var cRay = camera.castRay(x, y);
        getSinglePixelColor(cRay, -1);
        DEBUG = false;
    });

});
