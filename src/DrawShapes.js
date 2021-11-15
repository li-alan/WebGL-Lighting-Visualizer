// PointLightedCube_perFragment.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +
  'uniform mat4 u_ProjectionMatrix;\n' +
  'uniform mat4 u_ViewingMatrix;\n' +
  'uniform mat4 u_ModelMatrix;\n' +    // Model matrix
  'uniform mat4 u_NormalMatrix;\n' +   // Transformation matrix of the normal
  'varying vec4 v_Color;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'void main() {\n' +
  '  gl_Position = u_ProjectionMatrix * u_ViewingMatrix * u_ModelMatrix * a_Position;\n' +
     // Calculate the vertex position in the world coordinate
  '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  v_Color = a_Color;\n' +
  '}\n';


// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform vec3 u_LightColor;\n' +     // Light color
  'uniform vec3 u_LightPosition;\n' +  // Position of the light source
  'uniform vec3 u_AmbientLight;\n' +   // Ambient light color
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec4 v_Color;\n' +
  /////Button to visualize normals with color
  'uniform int u_visualizeNormals;\n' +
  'void main() {\n' +
     // Normalize the normal because it is interpolated and not 1.0 in length any more
  '  vec3 normal = normalize(v_Normal);\n' +
     // Calculate the light direction and make its length 1.
  '  vec3 lightDirection = normalize(u_LightPosition - v_Position);\n' +
     // The dot product of the light direction and the orientation of a surface (the normal)
  '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
     // Calculate the final color from diffuse reflection and ambient reflection
  '  vec3 diffuse = u_LightColor * v_Color.rgb * nDotL;\n' +
  '  vec3 ambient = u_AmbientLight * v_Color.rgb;\n' +
  '  int visualizeNormals = u_visualizeNormals;\n' +
  //visualize normals on
  '  if ( visualizeNormals == 1 )\n' +
  '  {\n'+
  '    gl_FragColor = vec4(v_Normal, 1);\n' +
  '  }\n'+
  '  else\n'+
  '  {\n'+
  '  gl_FragColor = vec4(diffuse + ambient, v_Color.a);\n' +
  '  }\n'+
  '}\n';
  //fror camera
let rotation = [-90,0];
let eyePos = [0,3,16];
let lookAt = [0, 0, -1];
let up = [0, 1, 0];
var x;
var z;
var radianX;
var radianY;
var canvas;
var gl;
var n;
var c = [0, 0, 0, 0, 0, 0, 0, 0];
var currentOrientationX;
var currentOrientationY;
var hold=false;
var projectionMatrix;
var viewingMatrix;
var currentAngle = 0;
var lightPosition = 0;
var angle;
var light = 0
var l = true;
var vNorm = 0;
function main() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Set the vertex coordinates, the color and the normal
  var m = initSphereVertexBuffers(gl,c);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Set the vertex information
  var n = initVertexBuffers(gl,1.0);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Set the clear color and enable the depth test
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Get the storage location of u_MvpMatrix
  var u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_MvpMatrix');
    return;
  }
  // Get the storage location of u_ViewingMatrix
  var u_ViewingMatrix = gl.getUniformLocation(gl.program, 'u_ViewingMatrix');
  if (!u_ViewingMatrix) {
    console.log('Failed to get the storage location of u_ViewingMatrix');
    return;
  }

  // Get the storage locations of uniform variables
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
  var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
  var u_visualizeNormals = gl.getUniformLocation(gl.program, 'u_visualizeNormals');
  if (!u_ModelMatrix|| !u_NormalMatrix || !u_LightColor || !u_LightPosition|| !u_AmbientLight|| !u_visualizeNormals ) {
    console.log('Failed to get the storage location');
    return;
  }


  // Set the light color (white)
  gl.uniform3f(u_LightColor, 0.8, 0.8, 0.8);
  // // Set the light direction (in the world coordinate)
  //gl.uniform3f(u_LightPosition, 5.0, 8.0, 7.0);
  // Set the ambient light
  gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);
  var vn = document.getElementById('vnButton');
  vn.onclick=function() {
    if(vNorm == 1){
      vNorm=0;
    }else{
      vNorm=1;
    }
		gl.uniform1i(u_visualizeNormals, vNorm);
  }

  var ln = document.getElementById('lButton');
  ln.onclick=function() {
    //////////////
    if(l==true){
      l=false;
    }else{
      l=true;
    }
  }
  //var viewProjMatrix = new Matrix4();
  viewingMatrix = new Matrix4();
  projectionMatrix = new Matrix4();

  // from asgn 1
  canvas.onmousedown = function(ev){
    var x = ev.clientX; //x coordinate of mouse pointer
    var y = ev.clientY; //y coordinate of mouse pointer
    var rect = ev.target.getBoundingClientRect();
    currentOrientationX = ((x - rect.left) - canvas.height/2)/(canvas.height/2);
    currentOrientationY = (canvas.width/2 - (y - rect.top))/(canvas.width/2);
    click(ev, gl, canvas, u_ProjectionMatrix, u_ViewingMatrix)
    hold=true;
  }
  canvas.onmousemove= function(ev) {
    if(hold==true){
      click(ev, gl, canvas, u_ProjectionMatrix, u_ViewingMatrix)
    }
  }
  canvas.onmouseup=function(ev) {
    hold=false;
  }


  document.onkeydown = function(ev){
    keydown(ev, gl, u_ProjectionMatrix, u_ViewingMatrix);
  };

  projectionMatrix.setPerspective(60, canvas.width / canvas.height, 1, 300);
  viewingMatrix.setLookAt(eyePos[0], eyePos[1], eyePos[2], eyePos[0]+lookAt[0], eyePos[1]+lookAt[1],eyePos[2]+ lookAt[2], up[0], up[1], up[2]);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projectionMatrix.elements);
  gl.uniformMatrix4fv(u_ViewingMatrix, false, viewingMatrix.elements);

  draw(gl, u_ProjectionMatrix, u_ViewingMatrix);
    var tick = function() {
    if(l==false){
        gl.uniform3f(u_LightColor, 0,0,0);
    }else{
        gl.uniform3f(u_LightColor, 1,1,1);
    }
    var p = lightRotation()
    gl.uniform3f(u_LightPosition, p[0],p[1],7.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    draw(gl, u_ProjectionMatrix, u_ViewingMatrix);
    requestAnimationFrame(tick, canvas);
  };
  tick();
 }

function draw(gl, u_ProjectionMatrix, u_ViewingMatrix){

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  projectionMatrix.setPerspective(60, canvas.width / canvas.height, 1, 300);
  viewingMatrix.setLookAt(eyePos[0], eyePos[1], eyePos[2], eyePos[0]+lookAt[0], eyePos[1]+lookAt[1],eyePos[2]+ lookAt[2], up[0], up[1], up[2]);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projectionMatrix.elements);
  gl.uniformMatrix4fv(u_ViewingMatrix, false, viewingMatrix.elements);
  //first cube
  var rotateMatrix = [0.0, 1.0, 0.0, 0.0];
  var translateMatrix = [0.0, 0.0, 0.0];
  var scaleMatrix = [2,2,2];
  var color = [0,1,0];
  var axis = [0,0,1];
  drawCube(gl,rotateMatrix,translateMatrix,scaleMatrix,color,currentAngle,axis);

  var translateMatrix = [8.0, 0.0, 0.0];
  var scaleMatrix = [2,2,2];
  var color = [0,1,0];
  drawSphere(gl,translateMatrix,scaleMatrix,color);

  var translateMatrix = [-8.0, 0.0, 0.0];
  var scaleMatrix = [2,2,2];
  var color = [0,1,0];
  drawSphere(gl,translateMatrix,scaleMatrix,color);



  //ANIMAL//
  var rotateMatrix = [0.0, 1.0, 0.0, 0.0];
  var translateMatrix = [0.0, 5.0, 0.0];
  var scaleMatrix = [0.5, 0.4, 0.63];
  var color = [1.0,0.52,0.87];
  var axis = [0,0,1];
  drawCube(gl,rotateMatrix,translateMatrix,scaleMatrix,color,currentAngle,axis);
  //head
  var rotateMatrix = [0.0, 1.0, 0.0, 0.0];
  var translateMatrix = [0.0, 5.3, 0.75];
  var scaleMatrix = [0.35, 0.35, 0.35];
  var color = [1.0,0.63,0.98];
  var axis = [1,0,0];
  drawCube(gl,rotateMatrix,translateMatrix,scaleMatrix,color,currentAngle,axis);
  //nose
  var rotateMatrix = [0.0, 1.0, 0.0, 0.0];
  var translateMatrix = [0.0, 5.26, 1.05];
  var scaleMatrix = [0.21, 0.16, 0.16];
  var color = [1.0,0.52,0.87];
  var axis = [1,0,0];
  drawCube(gl,rotateMatrix,translateMatrix,scaleMatrix,color,currentAngle,axis);
  var rotateMatrix = [0.0, 1.0, 0.0, 0.0];
  var translateMatrix = [0.13, 5.3, 1.06];
  var scaleMatrix = [0.05, 0.05, 0.16];
  var color = [0.52,0.2,0.36];
  var axis = [1,0,0];
  drawCube(gl,rotateMatrix,translateMatrix,scaleMatrix,color,currentAngle,axis);
  var rotateMatrix = [0.0, 1.0, 0.0, 0.0];
  var translateMatrix = [-0.13, 5.3, 1.06];
  var scaleMatrix = [0.05, 0.05, 0.16];
  var color = [0.52,0.2,0.36];
  var axis = [1,0,0];
  drawCube(gl,rotateMatrix,translateMatrix,scaleMatrix,color,currentAngle,axis);
  //left eye
  var rotateMatrix = [0.0, 1.0, 0.0, 0.0];
  var translateMatrix = [-0.25, 5.55, 0.95];
  var scaleMatrix = [0.05, 0.05, 0.16];
  var color = [0.0,0.0,0.0];
  var axis = [1,0,0];
  drawCube(gl,rotateMatrix,translateMatrix,scaleMatrix,color,currentAngle,axis);
  var rotateMatrix = [0.0, 1.0, 0.0, 0.0];
  var translateMatrix = [-0.15, 5.55, 0.95];
  var scaleMatrix = [0.05, 0.05, 0.16];
  var color = [1.0,1.0,1.0];
  var axis = [1,0,0];
  drawCube(gl,rotateMatrix,translateMatrix,scaleMatrix,color,currentAngle,axis);
  //right eye
  var rotateMatrix = [0.0, 1.0, 0.0, 0.0];
  var translateMatrix = [0.25, 5.55, 0.95];
  var scaleMatrix = [0.05, 0.05, 0.16];
  var color = [0.0,0.0,0.0];
  var axis = [1,0,0];
  drawCube(gl,rotateMatrix,translateMatrix,scaleMatrix,color,currentAngle,axis);
  var rotateMatrix = [0.0, 1.0, 0.0, 0.0];
  var translateMatrix = [0.15, 5.55, 0.95];
  var scaleMatrix = [0.05, 0.05, 0.16];
  var color = [1.0,1.0,1.0];
  var axis = [1,0,0];
  drawCube(gl,rotateMatrix,translateMatrix,scaleMatrix,color,currentAngle,axis);
  //right leg
  var rotateMatrix = [0.0, 1.0, 0.0, 0.0];
  var translateMatrix = [0.3, 4.5, 0.4];
  var scaleMatrix = [0.14, 0.3, 0.15];
  var color = [1.0,0.63,0.98];
  var axis = [1,0,0];
  drawCube(gl,rotateMatrix,translateMatrix,scaleMatrix,color,currentAngle,axis);
  //left leg
  var rotateMatrix = [0.0, 1.0, 0.0, 0.0];
  var translateMatrix = [-0.3, 4.5, 0.4];
  var scaleMatrix = [0.14, 0.3, 0.15];
  var color = [1.0,0.63,0.98];
  var axis = [1,0,0];
  drawCube(gl,rotateMatrix,translateMatrix,scaleMatrix,color,-1*currentAngle,axis);
  //back left leg
  var rotateMatrix = [0.0, 1.0, 0.0, 0.0];
  var translateMatrix = [-0.3, 4.5, -0.4];
  var scaleMatrix = [0.14, 0.3, 0.15];
  var color = [1.0,0.63,0.98];
  var axis = [1,0,0];
  drawCube(gl,rotateMatrix,translateMatrix,scaleMatrix,color,-1*currentAngle,axis);
  //back right leg
  var rotateMatrix = [0.0, 1.0, 0.0, 0.0];
  var translateMatrix = [0.3, 4.5, -0.4];
  var scaleMatrix = [0.14, 0.3, 0.15];
  var color = [1.0,0.63,0.98];
  var axis = [1,0,0];
  drawCube(gl,rotateMatrix,translateMatrix,scaleMatrix,color,currentAngle,axis);
  //tail
  var rotateMatrix = [10.0, 1.0, 0.0, 0.0];
  var translateMatrix = [0.0, 5.0, -0.75];
  var scaleMatrix = [0.05, 0.05, 0.18];
  var color = [1.0,0.63,0.98];
  var axis = [1,0,0];
  drawCube(gl,rotateMatrix,translateMatrix,scaleMatrix,color,-1*currentAngle,axis);
  //ears
  var rotateMatrix = [0.0, 1.0, 0.0, 0.0];
  var translateMatrix = [0.3, 5.7, 0.8];
  var scaleMatrix = [0.1, 0.1, 0.05];
  var color = [1.0,0.52,0.87];
  var axis = [1,0,0];
  drawCube(gl,rotateMatrix,translateMatrix,scaleMatrix,color,currentAngle,axis);
  var rotateMatrix = [0.0, 1.0, 0.0, 0.0];
  var translateMatrix = [-0.3, 5.7, 0.8];
  var scaleMatrix = [0.1, 0.1, 0.05];
  var color = [1.0,0.52,0.87];
  var axis = [1,0,0];
  drawCube(gl,rotateMatrix,translateMatrix,scaleMatrix,color,currentAngle,axis);

}

function drawCube(gl,rotateMatrix,translateMatrix,scaleMatrix,color,degree,axis){
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
	var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  // Set the vertex information
  var n = initVertexBuffers(gl,color);
  if (n < 0) {
   console.log('Failed to set the vertex information');
   return;
  }
  //will be used for all the alpine transformation
  var transformationMatrix = new Matrix4();
  //result matrix after transform
  var finalMatrix = new Matrix4();
  //////
  transformationMatrix.setRotate(degree, axis[0] , axis[1] , axis[2]);
  transformationMatrix.rotate(rotateMatrix[0],rotateMatrix[1],rotateMatrix[2],rotateMatrix[3]);
  transformationMatrix.translate(translateMatrix[0],translateMatrix[1],translateMatrix[2]);
  transformationMatrix.scale(scaleMatrix[0],scaleMatrix[1],scaleMatrix[2]);

  // PointLightedCube_perFragment.js (c) 2012 matsuda and kanda
  // Vertex shader program
  var normalMatrix = new Matrix4();
  normalMatrix.setInverseOf(transformationMatrix);
  normalMatrix.transpose();
  // finalMatrix.set(modelMatrix).multiply(transformationMatrix);
  // Pass the model view projection matrix to u_MvpMatrix
  gl.uniformMatrix4fv(u_ModelMatrix, false,transformationMatrix.elements);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  // Draw the cube
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}

function drawSphere(gl,translateMatrix,scaleMatrix,color){
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
	var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  // Set the vertex information
  var m = initSphereVertexBuffers(gl,color);
  if (m < 0) {
    console.log('Failed to set the vertex information');
    return;
  }
  //will be used for all the alpine transformation
  var transformationMatrix = new Matrix4();
  //result matrix after transform
  var finalMatrix = new Matrix4();
  //////
  // transformationMatrix.setRotate(degree, axis[0] , axis[1] , axis[2]);
  // transformationMatrix.rotate(rotateMatrix[0],rotateMatrix[1],rotateMatrix[2],rotateMatrix[3]);
  transformationMatrix.translate(translateMatrix[0],translateMatrix[1],translateMatrix[2]);
  transformationMatrix.scale(scaleMatrix[0],scaleMatrix[1],scaleMatrix[2]);

  // PointLightedCube_perFragment.js (c) 2012 matsuda and kanda
// Vertex shader program
  var normalMatrix = new Matrix4();
  normalMatrix.setInverseOf(transformationMatrix);
  normalMatrix.transpose();
  // finalMatrix.set(modelMatrix).multiply(transformationMatrix);
  // Pass the model view projection matrix to u_MvpMatrix
  gl.uniformMatrix4fv(u_ModelMatrix, false,transformationMatrix.elements);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);
  // Draw the cube
  gl.drawElements(gl.TRIANGLES, m, gl.UNSIGNED_SHORT, 0);
}



function initVertexBuffers(gl,c) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3

  var vertices = new Float32Array([   // Vertex coordinates
     1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,    // v0-v1-v2-v3 front
     1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,    // v0-v3-v4-v5 right
     1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,    // v0-v5-v6-v1 up
    -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,    // v1-v6-v7-v2 left
    -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,    // v7-v4-v3-v2 down
     1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0     // v4-v7-v6-v5 back
  ]);

  var colors = new Float32Array([     // Colors
    // 1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v0-v1-v2-v3 front(white)
    // 1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v0-v3-v4-v5 right(white)
    // 1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v0-v5-v6-v1 up(white)
    // 1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v1-v6-v7-v2 left(white)
    // 1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v7-v4-v3-v2 down(white)
    // 1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0   // v4-v7-v6-v5 back(white)

    c[0], c[1], c[2],  c[0], c[1], c[2],  c[0], c[1], c[2],  c[0], c[1], c[2],  // v0-v1-v2-v3 front(white)
    c[0], c[1], c[2],  c[0], c[1], c[2],  c[0], c[1], c[2],  c[0], c[1], c[2],  // v0-v3-v4-v5 right(white)
    c[0], c[1], c[2],  c[0], c[1], c[2],  c[0], c[1], c[2],  c[0], c[1], c[2],  // v0-v5-v6-v1 up(white)
    c[0], c[1], c[2],  c[0], c[1], c[2],  c[0], c[1], c[2],  c[0], c[1], c[2],  // v1-v6-v7-v2 left(white)
    c[0], c[1], c[2],  c[0], c[1], c[2],  c[0], c[1], c[2],  c[0], c[1], c[2],  // v7-v4-v3-v2 down(white)
    c[0], c[1], c[2],  c[0], c[1], c[2],  c[0], c[1], c[2],  c[0], c[1], c[2]   // v4-v7-v6-v5 back(white)
  ]);

  var indices = new Uint8Array([       // Indices of the vertices
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
  ]);

  // Create a buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer)
    return -1;

  // Write the vertex coordinates and color to the buffer object
  if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position'))
    return -1;

  if (!initArrayBuffer(gl, colors, 3, gl.FLOAT, 'a_Color'))
    return -1;

  // Write the indices to the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initArrayBuffer(gl, data, num, type, attribute) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
// Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return true;
}
//var g_last = Date.now()
var begin = 1;
//variable used to indicate beginning of animation

function animate(angle) {
  if (begin == 1){
    if(angle < -5 ){
      begin = 0;
    }
    return angle - 0.2;
  }else {
    if(angle > 5){
      begin = 1;
    }
    return angle+0.2;
  }
}


// PointLightedCube_perFragment.js (c) 2012 matsuda and kanda
// Vertex shader program
function initSphereVertexBuffers(gl, c) { // Create a sphere
  var SPHERE_DIV = 13;

  var i, ai, si, ci;
  var j, aj, sj, cj;
  var p1, p2;

  var positions = [];
  var indices = [];
  var colors = [];
  // var colors = new Float32Array([     // Colors
  // //   // 1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v0-v1-v2-v3 front(white)
  // //   // 1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v0-v3-v4-v5 right(white)
  // //   // 1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v0-v5-v6-v1 up(white)
  // //   // 1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v1-v6-v7-v2 left(white)
  // //   // 1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  // v7-v4-v3-v2 down(white)
  // //   // 1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0,  1.0, 1.0, 1.0   // v4-v7-v6-v5 back(white)
  //   c[0], c[1], c[2]   // v4-v7-v6-v5 back(white)
  // ]);
  // Generate coordinates
  for (j = 0; j <= SPHERE_DIV; j++) {
    aj = j * Math.PI / SPHERE_DIV;
    sj = Math.sin(aj);
    cj = Math.cos(aj);
    for (i = 0; i <= SPHERE_DIV; i++) {
      ai = i * 2 * Math.PI / SPHERE_DIV;
      si = Math.sin(ai);
      ci = Math.cos(ai);
      positions.push(si * sj);  // X
      positions.push(cj);       // Y
      positions.push(ci * sj);  // Z
      colors.push(c[0]);
      colors.push(c[1]);
      colors.push(c[2]);
    }
  }

  // Generate indices
  for (j = 0; j < SPHERE_DIV; j++) {
    for (i = 0; i < SPHERE_DIV; i++) {
      p1 = j * (SPHERE_DIV+1) + i;
      p2 = p1 + (SPHERE_DIV+1);

      indices.push(p1);
      indices.push(p2);
      indices.push(p1 + 1);

      indices.push(p1 + 1);
      indices.push(p2);
      indices.push(p2 + 1);
    }
  }

  // Write the vertex property to buffers (coordinates and normals)
  // Same data can be used for vertex and normal
  // In order to make it intelligible, another buffer is prepared separately
  if (!initSphereArrayBuffer(gl, 'a_Position', new Float32Array(positions), gl.FLOAT, 3)) return -1;
  if (!initSphereArrayBuffer(gl, 'a_Normal', new Float32Array(positions), gl.FLOAT, 3))  return -1;
  if (!initSphereArrayBuffer(gl, 'a_Color', new Float32Array(colors), gl.FLOAT, 3))  return -1;

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  return indices.length;
}

// PointLightedCube_perFragment.js (c) 2012 matsuda and kanda
// Vertex shader program
function initSphereArrayBuffer(gl, attribute, data, type, num) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return true;
}


function magnitude(vector){
  return Math.sqrt((vector[0] * vector[0]) + (vector[1] * vector[1]) + (vector[2] * vector[2]));
}

function normalize(vector){
  var mag = magnitude(vector);
  return [vector[0]/mag, vector[1]/mag, vector[2]/mag];
}

function crossProduct(vector1, vector2){
  var a = (vector1[1] *vector2[2]) - (vector1[2] * vector2[1]);
  var s = (vector1[2] *vector2[0]) - (vector1[0] * vector2[2]);
  var d = (vector1[0] *vector2[1]) - (vector1[1] * vector2[0]);
  return [a,s,d];
}



//from asgn1
//for drawing squares
function click(ev,gl,canvas,u_ProjectionMatrix, u_ViewingMatrix) {
  var x = ev.clientX; //x coordinate of mouse pointer
  var y = ev.clientY; //y coordinate of mouse pointer
  var rect = ev.target.getBoundingClientRect();
  x = ((x - rect.left) - canvas.height/2)/(canvas.height/2);
  y = (canvas.width/2 - (y - rect.top))/(canvas.width/2);
  //store coordinates to g_points array
  gl.clear(gl.COLOR_BUFFER_BIT);
  rotation[0]= (rotation[0]+(x - currentOrientationX)) %360;
  rotation[1]= (rotation[1]-(y - currentOrientationY)) %360;
  radianX = rotation[0] * Math.PI/180;
  radianY = -rotation[1] * Math.PI/180;
  lookAt[0] = Math.cos(radianX) * Math.cos(radianY);
  lookAt[1] = Math.sin(radianY);
  lookAt[2] = Math.sin(radianX) * Math.cos(radianY);
  draw(gl, u_ProjectionMatrix, u_ViewingMatrix);
}

//https://piazza.com/class/k56ziz1b6kwbd?cid=150
function keydown(ev, gl, u_ProjectionMatrix, u_ViewingMatrix) {
  if(ev.keyCode == 87) {
    eyePos[0] += lookAt[0];
    eyePos[1] += lookAt[1];
    eyePos[2] += lookAt[2];
  //down
  }else if(ev.keyCode == 83){
    eyePos[0] -= lookAt[0];
    eyePos[1] -= lookAt[1];
    eyePos[2] -= lookAt[2];
  //left
  }else if(ev.keyCode == 65){
    //must compute cross product than normalize to do left and right
    var o = normalize(crossProduct(lookAt,up));
    eyePos[0] -= o[0];
    eyePos[1] -= o[1];
    eyePos[2] -= o[2];
  //right
  }else if(ev.keyCode == 68){
    var o = normalize(crossProduct(lookAt,up));
    eyePos[0] += o[0];
    eyePos[1] += o[1];
    eyePos[2] += o[2];
  }
  draw(gl, u_ProjectionMatrix, u_ViewingMatrix);
}

function lightRotation(){
  light=lightPosition*(Math.PI/180);
  //console.log(lightPosition);
  if(lightPosition >=360){
    lightPosition=0;
  }else{
    lightPosition+=1;
  }
  return [7 * Math.cos(light),7 * Math.sin(light)];
}
