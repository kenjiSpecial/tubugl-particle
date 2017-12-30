import { Object3D } from './object3D';
import { Program, ArrayBuffer } from 'tubugl-core';
import { randomFloat } from 'tubugl-utils/src/mathUtils';
import { POINTS, BLEND, SRC_ALPHA, ONE_MINUS_SRC_ALPHA, FLOAT, DEPTH_TEST } from 'tubugl-constants';

const vertexShader = `// an attribute will receive data from a buffer
  attribute vec4 position;
  attribute vec3 color;
  attribute float size;
  attribute vec2 time;

  uniform mat4 projectionMatrix;
  uniform mat4 viewMatrix;
  uniform float uTime;

  varying vec3 vColor;
  varying float vInc;
  void main() {
	float rate = fract((uTime - time.y)/time.x);
	float rad = 150.;
	float phi = mix(position.x, position.z, rate);
	float theta = mix(position.y, position.w, rate);
	float xPos = rad * sin(phi) * cos(theta);
	float yPos = rad * cos(phi);
	float zPos = rad * sin(phi) * sin(theta);

	if(rate < 0.2) vInc = mix(10., 1.0,   rate * 5.);
	else		   vInc = 1.0;

	gl_Position = projectionMatrix * viewMatrix * vec4(xPos, yPos, zPos, 1.0);
	gl_PointSize = size;
	vColor = color;
  }`;

const fragmentShader = `
  precision mediump float;

  varying vec3 vColor;
  varying float vInc;
  void main() {
    float colorR = gl_FrontFacing ? 1.0 : 0.0;
    float colorG = gl_FrontFacing ? 0.0 : 1.0;
    
	float alpha = clamp( 4.0 * (1.0 - distance(gl_PointCoord, vec2(0.5))/0.5 ), 0.0, 1.0);
	if(alpha < 0.001 ) discard;
	
    gl_FragColor = vec4(vColor * vInc,alpha );
    
    
  }
`;

export class ParticlePoints extends Object3D {
	/**
	 *
	 * @param {webglcontext} gl
	 * @param {{ particleNum: number, isGl2: boolean, side: string, isDepthTest: boolean, isTransparent: boolean }} params
	 */
	constructor(
		gl,
		params = {
			particleNum: 20000
		}
	) {
		super(gl, params);

		this._time = 0;
		this._particlNum = params.particleNum;

		this._makeProgram();
		this._makeBuffer();
	}
	_makeProgram() {
		this._program = new Program(this._gl, vertexShader, fragmentShader);
	}
	_makeBuffer() {
		let particleNum = 100000;
		let vertices = [];
		let colors = [];
		let sizes = [];
		let times = [];

		for (let ii = 0; ii < particleNum; ii++) {
			let random2 = Math.random();
			let theta, phi, theta2, phi2;

			if (random2 < 0.2) {
				theta = randomFloat(0, 2 * Math.PI);
				phi = randomFloat(0, Math.PI);

				theta2 = randomFloat(0, 2 * Math.PI);
				phi2 = randomFloat(0, Math.PI);
			} else if (random2 < 0.55) {
				theta = randomFloat(0, 2 * Math.PI);
				phi = randomFloat(0, Math.PI);

				theta2 = theta;
				phi2 = randomFloat(0, Math.PI);
			} else if (random2 < 0.9) {
				theta = randomFloat(0, 2 * Math.PI);
				phi = randomFloat(0, Math.PI);

				theta2 = randomFloat(0, 2 * Math.PI);
				phi2 = phi;
			} else {
				theta = randomFloat(0, 2 * Math.PI);
				phi = randomFloat(0, Math.PI);

				theta2 = theta + randomFloat(-0.05, 0.05);
				phi2 = phi + randomFloat(-0.05, 0.05);
			}

			let random = randomFloat(0.05, 0.1);

			let color = [random, random, random];
			let size = random2 < 0.9 ? randomFloat(0.5, 3) : 2;

			let duration = random2 < 0.9 ? randomFloat(1, 5) : 0.4;
			let delay = randomFloat(0, 5);

			vertices.push(theta, phi, theta2, phi2);
			colors.push(color[0], color[1], color[2]);
			sizes.push(size);
			times.push(duration, delay);
		}

		vertices = new Float32Array(vertices);
		colors = new Float32Array(colors);
		sizes = new Float32Array(sizes);
		times = new Float32Array(times);

		let vertexBuffer = new ArrayBuffer(this._gl, vertices);
		vertexBuffer.setAttribs('position', 4, FLOAT, false, 0, 0);

		let colorBuffer = new ArrayBuffer(this._gl, colors);
		colorBuffer.setAttribs('color', 3, FLOAT, false, 0, 0);

		let sizeBuffer = new ArrayBuffer(this._gl, sizes);
		sizeBuffer.setAttribs('size', 1, FLOAT, false, 0, 0);

		let timeBuffer = new ArrayBuffer(this._gl, times);
		timeBuffer.setAttribs('time', 2, FLOAT, false, 0, 0);

		this._vertexBuffer = vertexBuffer;
		this._colorBuffer = colorBuffer;
		this._sizeBuffer = sizeBuffer;
		this._timeBuffer = timeBuffer;
	}
	_updateAttributes() {
		this._vertexBuffer.bind().attribPointer(this._program);
		this._colorBuffer.bind().attribPointer(this._program);
		this._sizeBuffer.bind().attribPointer(this._program);
		this._timeBuffer.bind().attribPointer(this._program);
	}
	render(camera) {
		this._time += 1 / 60;
		this.update(camera).draw();
	}
	update(camera) {
		this._program.bind();
		this._updateAttributes();

		this._gl.uniformMatrix4fv(
			this._program.getUniforms('viewMatrix').location,
			false,
			camera.viewMatrix
		);
		this._gl.uniformMatrix4fv(
			this._program.getUniforms('projectionMatrix').location,
			false,
			camera.projectionMatrix
		);
		this._gl.uniform1f(this._program.getUniforms('uTime').location, this._time);
		return this;
	}
	draw() {
		this._gl.enable(DEPTH_TEST);
		this._gl.enable(BLEND);
		this._gl.blendFunc(SRC_ALPHA, ONE_MINUS_SRC_ALPHA);
		this._gl.drawArrays(POINTS, 0, this._particlNum);
		return this;
	}
}
