import { Object3D } from '../../../index';
import { Program, ArrayBuffer } from 'tubugl-core';
import { randomFloat } from 'tubugl-utils/src/mathUtils';
import {
	POINTS,
	BLEND,
	SRC_ALPHA,
	ONE_MINUS_SRC_ALPHA,
	FLOAT,
	DEPTH_TEST,
	ONE
} from 'tubugl-constants';

const vertexShader = `// an attribute will receive data from a buffer
  attribute vec4 position;
  attribute vec4 position2;
  attribute vec3 color;
  attribute float size;
  attribute vec2 time;

  uniform mat4 projectionMatrix;
  uniform mat4 viewMatrix;
  uniform float uTime;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vInc;
  void main() {
	float rate = fract((uTime - time.y)/time.x);
	vec4 pos = mix(position, position2, rate);

	vInc = 1.0;
	float ptSize = 1.0;
	if(length( vec3(pos.x, pos.y, pos.z) ) < 149.){ 
		if(length(pos) < 40.) {
			vAlpha = 1.0;
			vInc = 1.0;
			ptSize = 0.7;
		}else {
			vInc = 10.;
			vAlpha = 0.2;
			ptSize = 0.5;
		}

	}else if(length(pos) > 150.){
		vAlpha = .02;
	}else{
		vInc = 10.;
		vAlpha = 0.2;
	}

	gl_Position = projectionMatrix * viewMatrix * pos;
	gl_PointSize = size  * ptSize;
	vColor = color;
  }`;

const fragmentShader = `
  precision mediump float;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vInc;
  void main() {
	float alpha = clamp( 4.0 * (1.0 - distance(gl_PointCoord, vec2(0.5))/0.5 ), 0.0, 1.0)* vAlpha;
	if(alpha < 0.001 ) discard;
	
    gl_FragColor = vec4(vColor * vInc ,alpha  );
  }
`;

export class CustomParticle extends Object3D {
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
		this._particlNum = 100000;

		this._makeProgram();
		this._makeBuffer();
	}
	_makeProgram() {
		this._program = new Program(this._gl, vertexShader, fragmentShader);
	}
	_makeBuffer() {
		let particleNum = this._particlNum;
		let points = [];
		let point2s = [];
		let colors = [];
		let sizes = [];
		let times = [];

		for (let ii = 0; ii < particleNum; ii++) {
			let randomR =
				(Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) / 5; // randomFloat(0.1, 0.1);
			let randomG =
				(Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) / 5; ///randomFloat(0.1, 0.1);
			let randomB =
				(Math.random() + Math.random() + Math.random() + Math.random() + Math.random()) / 5; //randomFloat(0.1, 0, 0.1);
			let color = [randomR * 1.5, randomG * 0.9, randomB * 0.6];
			let size = randomFloat(1, 4);

			let random = Math.random();
			let duration = random < 0.9 ? randomFloat(1, 5) : randomFloat(10, 20);
			let delay = random < 0.9 ? randomFloat(0, 5) : randomFloat(10, 20);

			let randX = randomFloat(-150, 150);
			points.push(randX, randomFloat(-150, 150), randomFloat(-150, 150));
			point2s.push(randomFloat(-150, 150), randomFloat(-150, 150), randomFloat(-150, 150));
			colors.push(color[0], color[1], color[2]);
			sizes.push(size);
			times.push(duration, delay);
		}

		points = new Float32Array(points);
		point2s = new Float32Array(point2s);
		colors = new Float32Array(colors);
		sizes = new Float32Array(sizes);
		times = new Float32Array(times);

		let vertexBuffer = new ArrayBuffer(this._gl, points);
		vertexBuffer.setAttribs('position', 3, FLOAT, false, 0, 0);

		let vertex2Buffer = new ArrayBuffer(this._gl, point2s);
		vertex2Buffer.setAttribs('position2', 3, FLOAT, false, 0, 0);

		let colorBuffer = new ArrayBuffer(this._gl, colors);
		colorBuffer.setAttribs('color', 3, FLOAT, false, 0, 0);

		let sizeBuffer = new ArrayBuffer(this._gl, sizes);
		sizeBuffer.setAttribs('size', 1, FLOAT, false, 0, 0);

		let timeBuffer = new ArrayBuffer(this._gl, times);
		timeBuffer.setAttribs('time', 2, FLOAT, false, 0, 0);

		this._vertexBuffer = vertexBuffer;
		this._vertex2Buffer = vertex2Buffer;
		this._colorBuffer = colorBuffer;
		this._sizeBuffer = sizeBuffer;
		this._timeBuffer = timeBuffer;
	}
	_updateAttributes() {
		this._vertexBuffer.bind().attribPointer(this._program);
		this._vertex2Buffer.bind().attribPointer(this._program);
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
		this._gl.disable(DEPTH_TEST);
		this._gl.enable(BLEND);
		this._gl.blendFunc(SRC_ALPHA, ONE);
		this._gl.drawArrays(POINTS, 0, this._particlNum);
		return this;
	}
}
