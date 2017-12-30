const EventEmitter = require('wolfy87-eventemitter');
import { Vector3 } from 'tubugl-math/src/vector3';
import { Euler } from 'tubugl-math/src/euler';
import { mat4 } from 'gl-matrix';

/**
 * Object3d
 */
export class Object3D extends EventEmitter {
	/**
	 *
	 * @param {{ isGl2: boolean, side: string, isWire: boolean, isDepthTest: boolean, isTransparent: boolean }} params
	 */
	constructor(gl, params = {}) {
		super();
		this._gl = gl;

		this.position = new Vector3();
		this.rotation = new Euler();
		this.scale = new Vector3(1, 1, 1);

		this.modelMatrix = mat4.create();

		this._isGl2 = params.isGl2;
		this._side = params.side ? params.side : 'double'; // 'front', 'back', 'double'
		this._isNeedUpdate = true;
		this._isDepthTest = !!params.isDepthTest;
		this._isTransparent = !!params.isTransparent;
		this._params = params;
	}

	setPosition(x, y, z) {
		this._isNeedUpdate = true;

		if (x !== undefined) this.position.x = x;
		if (y !== undefined) this.position.y = y;
		if (z !== undefined) this.position.z = z;

		return this;
	}

	setRotation(x, y, z) {
		this._isNeedUpdate = true;

		if (x !== undefined) this.rotation.x = x;
		if (y !== undefined) this.rotation.y = y;
		if (z !== undefined) this.rotation.z = z;

		return this;
	}
	_updateModelMatrix() {
		if (
			!this._isNeedUpdate &&
			!this.position.needsUpdate &&
			!this.rotation.needsMatrixUpdate &&
			!this.scale.needsUpdate
		)
			return;

		mat4.fromTranslation(this.modelMatrix, this.position.array);
		mat4.scale(this.modelMatrix, this.modelMatrix, this.scale.array);

		this.rotation.updateMatrix();
		mat4.multiply(this.modelMatrix, this.modelMatrix, this.rotation.matrix);

		this._isNeedUpdate = false;
		this.position.needsUpdate = false;
		this.scale.needsUpdate = false;

		return this;
	}
}
